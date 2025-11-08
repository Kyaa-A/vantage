"""
Tests for BLGU Dashboard API endpoints (app/api/v1/blgu_dashboard.py)

Epic 2.0 Story 2.13: Testing & Validation
Tests the two main dashboard endpoints:
- GET /api/v1/blgu-dashboard/{assessment_id}
- GET /api/v1/blgu-dashboard/{assessment_id}/indicators/navigation
"""

import pytest
import uuid
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.db.models.user import User
from app.db.models.assessment import Assessment, AssessmentResponse
from app.db.models.barangay import Barangay
from app.db.models.governance_area import GovernanceArea, Indicator
from app.db.enums import UserRole, AssessmentStatus
from app.api import deps


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture(autouse=True)
def clear_user_overrides(client):
    """Clear user-related dependency overrides after each test"""
    yield
    if deps.get_current_active_user in client.app.dependency_overrides:
        del client.app.dependency_overrides[deps.get_current_active_user]


@pytest.fixture
def barangay(db_session: Session):
    """Create a test barangay"""
    barangay = Barangay(
        name=f"Test Barangay {uuid.uuid4().hex[:8]}",
    )
    db_session.add(barangay)
    db_session.commit()
    db_session.refresh(barangay)
    return barangay


@pytest.fixture
def blgu_user(db_session: Session, barangay):
    """Create a BLGU test user"""
    unique_email = f"blgu_test_{uuid.uuid4().hex[:8]}@example.com"

    user = User(
        email=unique_email,
        name="BLGU Test User",
        hashed_password=pwd_context.hash("testpassword123"),
        role=UserRole.BLGU_USER,
        barangay_id=barangay.id,
        is_active=True,
        must_change_password=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def other_blgu_user(db_session: Session):
    """Create another BLGU user (different barangay) for permission testing"""
    # Create another barangay
    other_barangay = Barangay(
        name=f"Other Barangay {uuid.uuid4().hex[:8]}",
    )
    db_session.add(other_barangay)
    db_session.commit()
    db_session.refresh(other_barangay)

    unique_email = f"other_blgu_{uuid.uuid4().hex[:8]}@example.com"

    user = User(
        email=unique_email,
        name="Other BLGU User",
        hashed_password=pwd_context.hash("testpassword123"),
        role=UserRole.BLGU_USER,
        barangay_id=other_barangay.id,
        is_active=True,
        must_change_password=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def assessment(db_session: Session, blgu_user):
    """Create a test assessment"""
    assessment = Assessment(
        blgu_user_id=blgu_user.id,
        status=AssessmentStatus.DRAFT,
        rework_count=0,
    )
    db_session.add(assessment)
    db_session.commit()
    db_session.refresh(assessment)
    return assessment


@pytest.fixture
def assessment_in_rework(db_session: Session, blgu_user):
    """Create an assessment in REWORK status with comments"""
    assessment = Assessment(
        blgu_user_id=blgu_user.id,
        status=AssessmentStatus.REWORK,
        rework_count=1,
        rework_comments="Please update indicators 1 and 2 with more details.",
        rework_requested_at=datetime.now(timezone.utc),
    )
    db_session.add(assessment)
    db_session.commit()
    db_session.refresh(assessment)
    return assessment


def authenticate_user(client: TestClient, user: User):
    """Helper to override authentication dependency"""
    def override_get_current_user():
        return user

    client.app.dependency_overrides[deps.get_current_active_user] = override_get_current_user


class TestBLGUDashboardEndpoint:
    """Tests for GET /api/v1/blgu-dashboard/{assessment_id}"""

    def test_get_dashboard_success(self, client: TestClient, blgu_user, assessment):
        """Test successful dashboard retrieval"""
        authenticate_user(client, blgu_user)

        response = client.get(f"/api/v1/blgu-dashboard/{assessment.id}")

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "assessment_id" in data
        assert "total_indicators" in data
        assert "completed_indicators" in data
        assert "incomplete_indicators" in data
        assert "completion_percentage" in data
        assert "governance_areas" in data

        # Verify data types
        assert isinstance(data["total_indicators"], int)
        assert isinstance(data["completed_indicators"], int)
        assert isinstance(data["incomplete_indicators"], int)
        assert isinstance(data["completion_percentage"], (int, float))
        assert 0 <= data["completion_percentage"] <= 100

    def test_get_dashboard_not_found(self, client: TestClient, blgu_user):
        """Test dashboard with non-existent assessment ID"""
        authenticate_user(client, blgu_user)

        response = client.get("/api/v1/blgu-dashboard/99999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_dashboard_forbidden_other_user(self, client: TestClient, other_blgu_user, assessment):
        """Test that BLGU user cannot access another barangay's assessment"""
        authenticate_user(client, other_blgu_user)

        response = client.get(f"/api/v1/blgu-dashboard/{assessment.id}")

        assert response.status_code == 403

    def test_get_dashboard_unauthenticated(self, client: TestClient, assessment):
        """Test dashboard access without authentication"""
        response = client.get(f"/api/v1/blgu-dashboard/{assessment.id}")

        # Auth middleware returns 403 for unauthenticated requests
        assert response.status_code == 403

    def test_get_dashboard_rework_includes_comments(self, client: TestClient, blgu_user, assessment_in_rework):
        """Test that dashboard includes rework comments when status is REWORK"""
        authenticate_user(client, blgu_user)

        response = client.get(f"/api/v1/blgu-dashboard/{assessment_in_rework.id}")

        assert response.status_code == 200
        data = response.json()

        # Dashboard should include rework comments for REWORK status
        assert "rework_comments" in data
        if assessment_in_rework.status == AssessmentStatus.REWORK:
            assert data["rework_comments"] is not None

    def test_get_dashboard_completion_percentage_calculation(self, client: TestClient, blgu_user, assessment):
        """Test that completion percentage is calculated correctly"""
        authenticate_user(client, blgu_user)

        response = client.get(f"/api/v1/blgu-dashboard/{assessment.id}")

        assert response.status_code == 200
        data = response.json()

        # Verify percentage calculation
        if data["total_indicators"] > 0:
            expected_percentage = (data["completed_indicators"] / data["total_indicators"]) * 100
            assert abs(data["completion_percentage"] - expected_percentage) < 0.01
        else:
            # If no indicators, percentage should be 0
            assert data["completion_percentage"] == 0.0


class TestIndicatorNavigationEndpoint:
    """Tests for GET /api/v1/blgu-dashboard/{assessment_id}/indicators/navigation"""

    def test_get_navigation_success(self, client: TestClient, blgu_user, assessment):
        """Test successful navigation data retrieval"""
        authenticate_user(client, blgu_user)

        response = client.get(f"/api/v1/blgu-dashboard/{assessment.id}/indicators/navigation")

        assert response.status_code == 200
        data = response.json()

        # Verify response is a list
        assert isinstance(data, list)

    def test_get_navigation_not_found(self, client: TestClient, blgu_user):
        """Test navigation with non-existent assessment ID"""
        authenticate_user(client, blgu_user)

        response = client.get("/api/v1/blgu-dashboard/99999/indicators/navigation")

        assert response.status_code == 404

    def test_get_navigation_forbidden(self, client: TestClient, other_blgu_user, assessment):
        """Test that BLGU user cannot access another barangay's navigation"""
        authenticate_user(client, other_blgu_user)

        response = client.get(f"/api/v1/blgu-dashboard/{assessment.id}/indicators/navigation")

        assert response.status_code == 403


class TestDashboardIntegration:
    """Integration tests for dashboard endpoints"""

    def test_full_dashboard_workflow(self, client: TestClient, blgu_user, assessment):
        """Test complete dashboard workflow: dashboard -> navigation"""
        authenticate_user(client, blgu_user)

        # 1. Get dashboard overview
        dashboard_response = client.get(f"/api/v1/blgu-dashboard/{assessment.id}")
        assert dashboard_response.status_code == 200
        dashboard_data = dashboard_response.json()

        # 2. Get navigation list
        navigation_response = client.get(f"/api/v1/blgu-dashboard/{assessment.id}/indicators/navigation")
        assert navigation_response.status_code == 200
        navigation_data = navigation_response.json()

        # Verify consistency between endpoints
        assert dashboard_data["assessment_id"] == assessment.id
        assert isinstance(navigation_data, list)

    def test_dashboard_data_consistency(self, client: TestClient, blgu_user, assessment):
        """Test that dashboard data is consistent across multiple requests"""
        authenticate_user(client, blgu_user)

        # Make two requests
        response1 = client.get(f"/api/v1/blgu-dashboard/{assessment.id}")
        response2 = client.get(f"/api/v1/blgu-dashboard/{assessment.id}")

        assert response1.status_code == 200
        assert response2.status_code == 200

        data1 = response1.json()
        data2 = response2.json()

        # Data should be identical
        assert data1["total_indicators"] == data2["total_indicators"]
        assert data1["completed_indicators"] == data2["completed_indicators"]
        assert data1["completion_percentage"] == data2["completion_percentage"]
