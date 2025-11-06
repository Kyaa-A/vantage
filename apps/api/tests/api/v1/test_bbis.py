"""
Tests for BBI API endpoints (app/api/v1/bbis.py)
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.db.models.user import User
from app.db.models.governance_area import GovernanceArea, Indicator
from app.db.models.bbi import BBI, BBIResult
from app.db.models.assessment import Assessment, AssessmentResponse
from app.db.enums import UserRole, AreaType, BBIStatus, ValidationStatus, AssessmentStatus
from app.api import deps


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture(autouse=True)
def clear_user_overrides(client):
    """Clear user-related dependency overrides after each test"""
    yield
    if deps.get_current_active_user in client.app.dependency_overrides:
        del client.app.dependency_overrides[deps.get_current_active_user]
    if deps.get_current_admin_user in client.app.dependency_overrides:
        del client.app.dependency_overrides[deps.get_current_admin_user]


@pytest.fixture
def admin_user(db_session: Session):
    """Create an admin user for testing"""
    unique_email = f"admin_{uuid.uuid4().hex[:8]}@example.com"

    user = User(
        email=unique_email,
        name="Admin User",
        hashed_password=pwd_context.hash("adminpass123"),
        role=UserRole.MLGOO_DILG,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def governance_area(db_session: Session):
    """Create a governance area for testing"""
    area = GovernanceArea(
        name=f"Test Governance Area {uuid.uuid4().hex[:8]}",
        area_type=AreaType.CORE,
    )
    db_session.add(area)
    db_session.commit()
    db_session.refresh(area)
    return area


@pytest.fixture
def indicators(db_session: Session, governance_area: GovernanceArea):
    """Create test indicators"""
    indicators = []
    for i in range(1, 4):
        indicator = Indicator(
            name=f"Test Indicator {i}",
            description=f"Description {i}",
            governance_area_id=governance_area.id,
        )
        db_session.add(indicator)
        indicators.append(indicator)
    db_session.commit()
    for indicator in indicators:
        db_session.refresh(indicator)
    return indicators


@pytest.fixture
def sample_bbi(db_session: Session, governance_area: GovernanceArea):
    """Create a sample BBI for testing"""
    bbi = BBI(
        name="Test BBI",
        abbreviation="TBBI",
        description="Test BBI description",
        governance_area_id=governance_area.id,
        mapping_rules={
            "operator": "AND",
            "conditions": [
                {"indicator_id": 1, "required_status": "Pass"},
                {"indicator_id": 2, "required_status": "Pass"},
            ],
        },
        is_active=True,
    )
    db_session.add(bbi)
    db_session.commit()
    db_session.refresh(bbi)
    return bbi


def _override_admin(client, user: User, db_session: Session):
    """Override authentication and database dependencies for admin users"""
    def _override_current_active_user():
        return user

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    client.app.dependency_overrides[deps.get_current_active_user] = _override_current_active_user
    client.app.dependency_overrides[deps.get_current_admin_user] = _override_current_active_user
    client.app.dependency_overrides[deps.get_db] = _override_get_db


# ====================================================================
# POST /api/v1/bbis - Create BBI
# ====================================================================


def test_create_bbi_success(client: TestClient, db_session: Session, admin_user: User, governance_area: GovernanceArea):
    """Test successful BBI creation"""
    _override_admin(client, admin_user, db_session)

    response = client.post(
        "/api/v1/bbis",
        json={
            "name": "New BBI",
            "abbreviation": "NBBI",
            "description": "A new BBI",
            "governance_area_id": governance_area.id,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New BBI"
    assert data["abbreviation"] == "NBBI"
    assert data["governance_area_id"] == governance_area.id
    assert data["is_active"] is True


def test_create_bbi_unauthorized(client: TestClient):
    """Test BBI creation without authentication"""
    response = client.post(
        "/api/v1/bbis/",
        json={
            "name": "New BBI",
            "abbreviation": "NBBI",
            "governance_area_id": 1,
        },
    )

    assert response.status_code == 403


def test_create_bbi_duplicate_name(
    client: TestClient, db_session: Session, admin_user: User, sample_bbi: BBI, governance_area: GovernanceArea
):
    """Test BBI creation with duplicate name"""
    _override_admin(client, admin_user, db_session)

    response = client.post(
        "/api/v1/bbis",
        json={
            "name": sample_bbi.name,  # Duplicate
            "abbreviation": "DIFFERENT",
            "governance_area_id": governance_area.id,
        },
    )

    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()


def test_create_bbi_invalid_governance_area(client: TestClient, db_session: Session, admin_user: User):
    """Test BBI creation with invalid governance area"""
    _override_admin(client, admin_user, db_session)

    response = client.post(
        "/api/v1/bbis",
        json={
            "name": "New BBI",
            "abbreviation": "NBBI",
            "governance_area_id": 99999,  # Non-existent
        },
    )

    assert response.status_code == 404


# ====================================================================
# GET /api/v1/bbis - List BBIs
# ====================================================================


def test_list_bbis_success(client: TestClient, db_session: Session, admin_user: User, sample_bbi: BBI):
    """Test listing all BBIs"""
    _override_admin(client, admin_user, db_session)

    response = client.get("/api/v1/bbis/")

    assert response.status_code == 200
    data = response.json()
    assert "bbis" in data
    assert "total" in data
    assert data["total"] >= 1
    assert any(item["id"] == sample_bbi.id for item in data["bbis"])


def test_list_bbis_filter_by_governance_area(
    client: TestClient, db_session: Session, admin_user: User, sample_bbi: BBI, governance_area: GovernanceArea
):
    """Test listing BBIs filtered by governance area"""
    _override_admin(client, admin_user, db_session)

    response = client.get(f"/api/v1/bbis/?governance_area_id={governance_area.id}")

    assert response.status_code == 200
    data = response.json()
    assert all(item["governance_area_id"] == governance_area.id for item in data["bbis"])


def test_list_bbis_filter_by_active_status(
    client: TestClient, db_session: Session, admin_user: User, sample_bbi: BBI
):
    """Test listing BBIs filtered by active status"""
    _override_admin(client, admin_user, db_session)

    response = client.get("/api/v1/bbis/?is_active=true")

    assert response.status_code == 200
    data = response.json()
    assert all(item["is_active"] is True for item in data["bbis"])


def test_list_bbis_pagination(
    client: TestClient, db_session: Session, admin_user: User, governance_area: GovernanceArea
):
    """Test BBI list pagination"""
    _override_admin(client, admin_user, db_session)

    # Create multiple BBIs
    for i in range(5):
        bbi = BBI(
            name=f"BBI {i} {uuid.uuid4().hex[:8]}",
            abbreviation=f"B{i}",
            governance_area_id=governance_area.id,
        )
        db_session.add(bbi)
    db_session.commit()

    # Get first page
    response = client.get("/api/v1/bbis/?page=1&size=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["bbis"]) == 2

    # Get second page
    response = client.get("/api/v1/bbis/?page=2&size=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["bbis"]) == 2


# ====================================================================
# GET /api/v1/bbis/{bbi_id} - Get BBI Details
# ====================================================================


def test_get_bbi_success(client: TestClient, db_session: Session, admin_user: User, sample_bbi: BBI):
    """Test getting BBI details"""
    _override_admin(client, admin_user, db_session)

    response = client.get(f"/api/v1/bbis/{sample_bbi.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_bbi.id
    assert data["name"] == sample_bbi.name
    assert "governance_area" in data


def test_get_bbi_not_found(client: TestClient, db_session: Session, admin_user: User):
    """Test getting non-existent BBI"""
    _override_admin(client, admin_user, db_session)

    response = client.get("/api/v1/bbis/99999")

    assert response.status_code == 404


# ====================================================================
# PUT /api/v1/bbis/{bbi_id} - Update BBI
# ====================================================================


def test_update_bbi_success(client: TestClient, db_session: Session, admin_user: User, sample_bbi: BBI):
    """Test successful BBI update"""
    _override_admin(client, admin_user, db_session)

    response = client.put(
        f"/api/v1/bbis/{sample_bbi.id}",
        json={
            "name": "Updated BBI Name",
            "description": "Updated description",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated BBI Name"
    assert data["description"] == "Updated description"


def test_update_bbi_unauthorized(client: TestClient, sample_bbi: BBI):
    """Test BBI update without authentication"""
    response = client.put(
        f"/api/v1/bbis/{sample_bbi.id}",
        json={"name": "Updated Name"},
    )

    assert response.status_code == 403


def test_update_bbi_not_found(client: TestClient, db_session: Session, admin_user: User):
    """Test updating non-existent BBI"""
    _override_admin(client, admin_user, db_session)

    response = client.put(
        "/api/v1/bbis/99999",
        json={"name": "Updated Name"},
    )

    assert response.status_code == 404


def test_update_bbi_mapping_rules(
    client: TestClient, db_session: Session, admin_user: User, sample_bbi: BBI
):
    """Test updating BBI mapping rules"""
    _override_admin(client, admin_user, db_session)

    new_mapping_rules = {
        "operator": "OR",
        "conditions": [
            {"indicator_id": 1, "required_status": "Pass"},
            {"indicator_id": 3, "required_status": "Fail"},
        ],
    }

    response = client.put(
        f"/api/v1/bbis/{sample_bbi.id}",
        json={"mapping_rules": new_mapping_rules},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["mapping_rules"]["operator"] == "OR"
    assert len(data["mapping_rules"]["conditions"]) == 2


# ====================================================================
# DELETE /api/v1/bbis/{bbi_id} - Deactivate BBI
# ====================================================================


def test_deactivate_bbi_success(client: TestClient, db_session: Session, admin_user: User, sample_bbi: BBI):
    """Test successful BBI deactivation"""
    _override_admin(client, admin_user, db_session)

    assert sample_bbi.is_active is True

    response = client.delete(f"/api/v1/bbis/{sample_bbi.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] is False


def test_deactivate_bbi_unauthorized(client: TestClient, sample_bbi: BBI):
    """Test BBI deactivation without authentication"""
    response = client.delete(f"/api/v1/bbis/{sample_bbi.id}")

    assert response.status_code == 403


def test_deactivate_bbi_not_found(client: TestClient, db_session: Session, admin_user: User):
    """Test deactivating non-existent BBI"""
    _override_admin(client, admin_user, db_session)

    response = client.delete("/api/v1/bbis/99999")

    assert response.status_code == 404


# ====================================================================
# POST /api/v1/bbis/test-calculation - Test BBI Calculation
# ====================================================================


def test_test_calculation_functional(client: TestClient, db_session: Session, admin_user: User):
    """Test BBI calculation endpoint"""
    _override_admin(client, admin_user, db_session)

    response = client.post(
        "/api/v1/bbis/test-calculation",
        json={
            "mapping_rules": {
                "operator": "AND",
                "conditions": [
                    {"indicator_id": 1, "required_status": "Pass"},
                    {"indicator_id": 2, "required_status": "Pass"},
                ],
            },
            "indicator_statuses": {
                "1": "Pass",
                "2": "Pass",
            },
        },
    )

    assert response.status_code == 200
    data = response.json()
    # Verify response structure
    assert "predicted_status" in data
    assert data["predicted_status"] == "FUNCTIONAL"


def test_test_calculation_non_functional(client: TestClient, db_session: Session, admin_user: User):
    """Test BBI calculation endpoint with non-functional result"""
    _override_admin(client, admin_user, db_session)

    response = client.post(
        "/api/v1/bbis/test-calculation",
        json={
            "mapping_rules": {
                "operator": "AND",
                "conditions": [
                    {"indicator_id": 1, "required_status": "Pass"},
                    {"indicator_id": 2, "required_status": "Pass"},
                ],
            },
            "indicator_statuses": {
                "1": "Pass",
                "2": "Fail",  # One fails
            },
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "predicted_status" in data
    assert data["predicted_status"] == "NON_FUNCTIONAL"


def test_test_calculation_or_operator(client: TestClient, db_session: Session, admin_user: User):
    """Test BBI calculation endpoint with OR operator"""
    _override_admin(client, admin_user, db_session)

    response = client.post(
        "/api/v1/bbis/test-calculation",
        json={
            "mapping_rules": {
                "operator": "OR",
                "conditions": [
                    {"indicator_id": 1, "required_status": "Pass"},
                    {"indicator_id": 2, "required_status": "Pass"},
                ],
            },
            "indicator_statuses": {
                "1": "Pass",
                "2": "Fail",  # One passes, OR logic
            },
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "predicted_status" in data
    assert data["predicted_status"] == "FUNCTIONAL"


# ====================================================================
# GET /api/v1/bbis/results/assessment/{assessment_id} - Get BBI Results
# ====================================================================


def test_get_bbi_results_success(
    client: TestClient,
    db_session: Session,
    admin_user: User,
    sample_bbi: BBI,
    mock_blgu_user,
):
    """Test getting BBI results for an assessment"""
    _override_admin(client, admin_user, db_session)

    # Create assessment
    assessment = Assessment(
        blgu_user_id=mock_blgu_user.id,
        status=AssessmentStatus.VALIDATED,
    )
    db_session.add(assessment)
    db_session.commit()
    db_session.refresh(assessment)

    # Create BBI result
    bbi_result = BBIResult(
        bbi_id=sample_bbi.id,
        assessment_id=assessment.id,
        status=BBIStatus.FUNCTIONAL,
        calculation_details={"test": "data"},
    )
    db_session.add(bbi_result)
    db_session.commit()

    response = client.get(f"/api/v1/bbis/results/assessment/{assessment.id}")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["bbi_id"] == sample_bbi.id
    assert data[0]["status"] == "FUNCTIONAL"


def test_get_bbi_results_no_results(client: TestClient, db_session: Session, admin_user: User, mock_blgu_user):
    """Test getting BBI results for assessment with no results"""
    _override_admin(client, admin_user, db_session)

    # Create assessment without BBI results
    assessment = Assessment(
        blgu_user_id=mock_blgu_user.id,
        status=AssessmentStatus.VALIDATED,
    )
    db_session.add(assessment)
    db_session.commit()
    db_session.refresh(assessment)

    response = client.get(f"/api/v1/bbis/results/assessment/{assessment.id}")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0
