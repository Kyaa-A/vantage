"""
🧪 Analytics API Endpoint Tests
Tests for analytics API endpoints - authentication, RBAC, and response structure
"""

import pytest
from app.api import deps
from app.db.enums import AssessmentStatus, ComplianceStatus, UserRole, AreaType
from app.db.models import Assessment, AssessmentResponse, GovernanceArea, Indicator, User, Barangay
from sqlalchemy.orm import Session


@pytest.fixture
def mlgoo_dilg_user(db_session: Session):
    """Create a MLGOO-DILG user for testing"""
    import uuid
    from passlib.context import CryptContext

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    unique_email = f"mlgoo{uuid.uuid4().hex[:8]}@test.com"

    user = User(
        email=unique_email,
        name="MLGOO-DILG Test User",
        hashed_password=pwd_context.hash("password123"),
        role=UserRole.MLGOO_DILG,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def blgu_user(db_session: Session):
    """Create a BLGU user for testing"""
    import uuid
    from passlib.context import CryptContext

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    unique_email = f"blgu{uuid.uuid4().hex[:8]}@test.com"

    # Create barangay first
    barangay = Barangay(name=f"Test Barangay {uuid.uuid4().hex[:8]}")
    db_session.add(barangay)
    db_session.commit()
    db_session.refresh(barangay)

    user = User(
        email=unique_email,
        name="BLGU Test User",
        hashed_password=pwd_context.hash("password123"),
        role=UserRole.BLGU_USER,
        barangay_id=barangay.id,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def assessor_user(db_session: Session):
    """Create an Area Assessor user for testing"""
    import uuid
    from passlib.context import CryptContext

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    unique_email = f"assessor{uuid.uuid4().hex[:8]}@test.com"

    user = User(
        email=unique_email,
        name="Area Assessor Test User",
        hashed_password=pwd_context.hash("password123"),
        role=UserRole.AREA_ASSESSOR,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_data(db_session: Session):
    """Create test data for analytics tests"""
    # Create governance areas
    areas = [
        GovernanceArea(id=1, name="Financial Administration", area_type=AreaType.CORE),
        GovernanceArea(id=2, name="Disaster Preparedness", area_type=AreaType.CORE),
    ]
    for area in areas:
        db_session.add(area)
    db_session.commit()
    for area in areas:
        db_session.refresh(area)

    # Create indicators
    indicators = []
    for i, area in enumerate(areas):
        for j in range(2):  # 2 indicators per area
            ind = Indicator(
                id=(i * 2) + j + 1,
                name=f"{area.name} Indicator {j+1}",
                description=f"Test indicator for {area.name}",
                form_schema={"type": "object", "properties": {}},
                governance_area_id=area.id,
            )
            db_session.add(ind)
            indicators.append(ind)
    db_session.commit()
    for ind in indicators:
        db_session.refresh(ind)

    # Create barangays with assessments
    from datetime import datetime

    for i in range(3):
        # Create barangay
        barangay = Barangay(name=f"Test Barangay {i+1}")
        db_session.add(barangay)
        db_session.commit()
        db_session.refresh(barangay)

        # Create user for barangay
        user = User(
            email=f"testblgu{i+1}@test.com",
            name=f"Test BLGU User {i+1}",
            hashed_password="hashed",
            role=UserRole.BLGU_USER,
            barangay_id=barangay.id,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        # Create assessment (2 passed, 1 failed)
        compliance_status = ComplianceStatus.PASSED if i < 2 else ComplianceStatus.FAILED

        assessment = Assessment(
            blgu_user_id=user.id,
            final_compliance_status=compliance_status,
            validated_at=datetime(2024, 1, 1),
        )
        db_session.add(assessment)
        db_session.commit()
        db_session.refresh(assessment)

        # Create assessment responses
        for indicator in indicators:
            response = AssessmentResponse(
                assessment_id=assessment.id,
                indicator_id=indicator.id,
                is_completed=True if compliance_status == ComplianceStatus.PASSED else False,
                response_data={},
            )
            db_session.add(response)

        db_session.commit()

    return {"areas": areas, "indicators": indicators}


def _override_user_and_db(client, user: User, db_session: Session):
    """Override authentication and database dependencies for testing"""

    def _override_current_active_user():
        return user

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    client.app.dependency_overrides[deps.get_current_active_user] = (
        _override_current_active_user
    )
    client.app.dependency_overrides[deps.get_db] = _override_get_db


def test_get_dashboard_success_with_mlgoo_dilg(client, db_session: Session, mlgoo_dilg_user, test_data):
    """Test GET /api/v1/analytics/dashboard returns 200 with MLGOO-DILG user"""
    _override_user_and_db(client, mlgoo_dilg_user, db_session)

    response = client.get("/api/v1/analytics/dashboard")

    assert response.status_code == 200
    data = response.json()

    # Verify response structure matches DashboardKPIResponse schema
    assert "overall_compliance_rate" in data
    assert "completion_status" in data
    assert "area_breakdown" in data
    assert "top_failed_indicators" in data
    assert "barangay_rankings" in data
    assert "trends" in data

    # Verify overall compliance rate structure
    assert "total_barangays" in data["overall_compliance_rate"]
    assert "passed" in data["overall_compliance_rate"]
    assert "failed" in data["overall_compliance_rate"]
    assert "pass_percentage" in data["overall_compliance_rate"]

    # Verify data correctness
    assert data["overall_compliance_rate"]["total_barangays"] == 3
    assert data["overall_compliance_rate"]["passed"] == 2
    assert data["overall_compliance_rate"]["failed"] == 1

    client.app.dependency_overrides.clear()


def test_get_dashboard_unauthorized_without_token(client, db_session: Session, test_data):
    """Test GET /api/v1/analytics/dashboard returns 401 without authentication"""
    # Don't override authentication - simulate no token
    response = client.get("/api/v1/analytics/dashboard")

    # Expect 401 or 403 depending on how the auth is set up
    # Based on FastAPI defaults, it should be 401
    assert response.status_code in [401, 403]


def test_get_dashboard_forbidden_with_blgu_user(client, db_session: Session, blgu_user, test_data):
    """Test GET /api/v1/analytics/dashboard returns 403 with BLGU user"""
    _override_user_and_db(client, blgu_user, db_session)

    response = client.get("/api/v1/analytics/dashboard")

    assert response.status_code == 403
    data = response.json()
    assert "detail" in data
    assert "permission" in data["detail"].lower() or "mlgoo" in data["detail"].lower()

    client.app.dependency_overrides.clear()


def test_get_dashboard_forbidden_with_assessor_user(client, db_session: Session, assessor_user, test_data):
    """Test GET /api/v1/analytics/dashboard returns 403 with Assessor user"""
    _override_user_and_db(client, assessor_user, db_session)

    response = client.get("/api/v1/analytics/dashboard")

    assert response.status_code == 403
    data = response.json()
    assert "detail" in data
    assert "permission" in data["detail"].lower() or "mlgoo" in data["detail"].lower()

    client.app.dependency_overrides.clear()


def test_get_dashboard_with_cycle_id_parameter(client, db_session: Session, mlgoo_dilg_user, test_data):
    """Test GET /api/v1/analytics/dashboard accepts cycle_id query parameter"""
    _override_user_and_db(client, mlgoo_dilg_user, db_session)

    # Test with cycle_id parameter
    response = client.get("/api/v1/analytics/dashboard?cycle_id=1")

    assert response.status_code == 200
    data = response.json()

    # Should still return valid structure (even though cycle filtering not implemented yet)
    assert "overall_compliance_rate" in data
    assert "completion_status" in data

    client.app.dependency_overrides.clear()


def test_get_dashboard_response_structure_matches_schema(client, db_session: Session, mlgoo_dilg_user, test_data):
    """Test response structure matches DashboardKPIResponse schema completely"""
    _override_user_and_db(client, mlgoo_dilg_user, db_session)

    response = client.get("/api/v1/analytics/dashboard")

    assert response.status_code == 200
    data = response.json()

    # Verify all required top-level fields
    required_fields = [
        "overall_compliance_rate",
        "completion_status",
        "area_breakdown",
        "top_failed_indicators",
        "barangay_rankings",
        "trends",
    ]
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"

    # Verify ComplianceRate structure (overall_compliance_rate)
    compliance_rate_fields = ["total_barangays", "passed", "failed", "pass_percentage"]
    for field in compliance_rate_fields:
        assert field in data["overall_compliance_rate"], f"Missing field in overall_compliance_rate: {field}"
        assert isinstance(data["overall_compliance_rate"][field], (int, float))

    # Verify ComplianceRate structure (completion_status)
    for field in compliance_rate_fields:
        assert field in data["completion_status"], f"Missing field in completion_status: {field}"
        assert isinstance(data["completion_status"][field], (int, float))

    # Verify area_breakdown is a list
    assert isinstance(data["area_breakdown"], list)
    if len(data["area_breakdown"]) > 0:
        area_fields = ["area_code", "area_name", "passed", "failed", "percentage"]
        for field in area_fields:
            assert field in data["area_breakdown"][0], f"Missing field in area_breakdown item: {field}"

    # Verify top_failed_indicators is a list
    assert isinstance(data["top_failed_indicators"], list)
    if len(data["top_failed_indicators"]) > 0:
        indicator_fields = ["indicator_id", "indicator_name", "failure_count", "percentage"]
        for field in indicator_fields:
            assert field in data["top_failed_indicators"][0], f"Missing field in top_failed_indicators item: {field}"

    # Verify barangay_rankings is a list
    assert isinstance(data["barangay_rankings"], list)
    if len(data["barangay_rankings"]) > 0:
        ranking_fields = ["barangay_id", "barangay_name", "score", "rank"]
        for field in ranking_fields:
            assert field in data["barangay_rankings"][0], f"Missing field in barangay_rankings item: {field}"

    # Verify trends is a list
    assert isinstance(data["trends"], list)
    if len(data["trends"]) > 0:
        trend_fields = ["cycle_id", "cycle_name", "pass_rate", "date"]
        for field in trend_fields:
            assert field in data["trends"][0], f"Missing field in trends item: {field}"

    client.app.dependency_overrides.clear()


def test_get_dashboard_with_no_data(client, db_session: Session, mlgoo_dilg_user):
    """Test GET /api/v1/analytics/dashboard handles empty database gracefully"""
    _override_user_and_db(client, mlgoo_dilg_user, db_session)

    # Clean database (no test_data fixture)
    response = client.get("/api/v1/analytics/dashboard")

    assert response.status_code == 200
    data = response.json()

    # Should return zeros for empty data, not crash
    assert data["overall_compliance_rate"]["total_barangays"] == 0
    assert data["overall_compliance_rate"]["passed"] == 0
    assert data["overall_compliance_rate"]["failed"] == 0
    assert data["area_breakdown"] == []
    assert data["top_failed_indicators"] == []
    assert data["barangay_rankings"] == []

    client.app.dependency_overrides.clear()
