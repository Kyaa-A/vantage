"""
🧪 Integration Test Fixtures
Comprehensive fixtures for backend API integration testing (Epic 6.0 - Story 6.3)
"""

import pytest
import uuid
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from passlib.context import CryptContext

from app.db.models.governance_area import GovernanceArea
from app.db.models.user import User
from app.db.models.barangay import Barangay
from app.db.models.assessment import Assessment, AssessmentResponse
from app.db.models.system import Indicator
from app.db.enums import (
    AreaType,
    UserRole,
    AssessmentStatus,
    ComplianceStatus,
    ValidationStatus,
)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============================================================================
# User Fixtures with Authentication
# ============================================================================


@pytest.fixture
def test_blgu_user(db_session: Session, mock_barangay: Barangay) -> User:
    """
    Create a BLGU user for integration tests.
    Returns user with plaintext password for authentication testing.
    """
    unique_email = f"blgu_integration_{uuid.uuid4().hex[:8]}@example.com"

    user = User(
        email=unique_email,
        name="Integration Test BLGU User",
        hashed_password=pwd_context.hash("testpassword123"),
        role=UserRole.BLGU_USER,
        barangay_id=mock_barangay.id,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Store plaintext password for authentication
    user.plain_password = "testpassword123"
    return user


@pytest.fixture
def test_assessor_user(db_session: Session) -> User:
    """
    Create an ASSESSOR user for integration tests.
    Returns user with plaintext password for authentication testing.
    """
    unique_email = f"assessor_integration_{uuid.uuid4().hex[:8]}@dilg.gov.ph"

    user = User(
        email=unique_email,
        name="Integration Test Assessor",
        hashed_password=pwd_context.hash("testpassword123"),
        role=UserRole.ASSESSOR,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Store plaintext password for authentication
    user.plain_password = "testpassword123"
    return user


@pytest.fixture
def test_validator_user(db_session: Session, governance_area: GovernanceArea) -> User:
    """
    Create a VALIDATOR user for integration tests.
    Returns user with plaintext password for authentication testing.
    """
    unique_email = f"validator_integration_{uuid.uuid4().hex[:8]}@dilg.gov.ph"

    user = User(
        email=unique_email,
        name="Integration Test Validator",
        hashed_password=pwd_context.hash("testpassword123"),
        role=UserRole.VALIDATOR,
        validator_area_id=governance_area.id,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Store plaintext password for authentication
    user.plain_password = "testpassword123"
    return user


@pytest.fixture
def test_mlgoo_user(db_session: Session) -> User:
    """
    Create an MLGOO_DILG admin user for integration tests.
    Returns user with plaintext password for authentication testing.
    """
    unique_email = f"mlgoo_integration_{uuid.uuid4().hex[:8]}@dilg.gov.ph"

    user = User(
        email=unique_email,
        name="Integration Test MLGOO Admin",
        hashed_password=pwd_context.hash("testpassword123"),
        role=UserRole.MLGOO_DILG,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Store plaintext password for authentication
    user.plain_password = "testpassword123"
    return user


# ============================================================================
# Authentication Helper Fixtures
# ============================================================================


@pytest.fixture
def auth_headers_blgu(client: TestClient, test_blgu_user: User) -> Dict[str, str]:
    """Get authentication headers for BLGU user."""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_blgu_user.email,
            "password": test_blgu_user.plain_password,
        },
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_assessor(client: TestClient, test_assessor_user: User) -> Dict[str, str]:
    """Get authentication headers for ASSESSOR user."""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_assessor_user.email,
            "password": test_assessor_user.plain_password,
        },
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_validator(client: TestClient, test_validator_user: User) -> Dict[str, str]:
    """Get authentication headers for VALIDATOR user."""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_validator_user.email,
            "password": test_validator_user.plain_password,
        },
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_mlgoo(client: TestClient, test_mlgoo_user: User) -> Dict[str, str]:
    """Get authentication headers for MLGOO admin user."""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_mlgoo_user.email,
            "password": test_mlgoo_user.plain_password,
        },
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# Test Data Fixtures
# ============================================================================


@pytest.fixture
def governance_area(db_session: Session) -> GovernanceArea:
    """Create a governance area for integration tests."""
    unique_name = f"Test Governance Area {uuid.uuid4().hex[:8]}"

    area = GovernanceArea(
        name=unique_name,
        abbreviation="TGA",
        area_type=AreaType.CORE,
    )
    db_session.add(area)
    db_session.commit()
    db_session.refresh(area)
    return area


@pytest.fixture
def test_indicator(db_session: Session, governance_area: GovernanceArea) -> Indicator:
    """
    Create a test indicator with form_schema for integration tests.
    """
    indicator = Indicator(
        code=f"TEST-IND-{uuid.uuid4().hex[:8]}",
        name="Test Indicator for Integration",
        description="Integration test indicator",
        governance_area_id=governance_area.id,
        form_schema={
            "fields": [
                {
                    "id": "test_text_field",
                    "label": "Test Text Field",
                    "type": "text",
                    "required": True,
                },
                {
                    "id": "test_number_field",
                    "label": "Test Number Field",
                    "type": "number",
                    "required": True,
                    "min": 0,
                    "max": 100,
                },
                {
                    "id": "test_select_field",
                    "label": "Test Select Field",
                    "type": "select",
                    "required": True,
                    "options": ["Option A", "Option B", "Option C"],
                },
            ]
        },
        calculation_schema={
            "rule_type": "AND_ALL",
            "conditions": [
                {
                    "field": "test_number_field",
                    "operator": ">=",
                    "value": 50,
                }
            ],
        },
        remark_schema={
            "PASS": "Test indicator passed",
            "FAIL": "Test indicator failed",
        },
        is_active=True,
    )
    db_session.add(indicator)
    db_session.commit()
    db_session.refresh(indicator)
    return indicator


@pytest.fixture
def test_assessment_data() -> Dict[str, Any]:
    """
    Provide sample assessment response data for testing.
    """
    return {
        "test_text_field": "Sample text response",
        "test_number_field": 75,
        "test_select_field": "Option B",
    }


@pytest.fixture
def test_draft_assessment(
    db_session: Session, test_blgu_user: User
) -> Assessment:
    """
    Create a DRAFT assessment for integration tests.
    """
    assessment = Assessment(
        blgu_user_id=test_blgu_user.id,
        status=AssessmentStatus.DRAFT,
        rework_count=0,
    )
    db_session.add(assessment)
    db_session.commit()
    db_session.refresh(assessment)
    return assessment


@pytest.fixture
def test_submitted_assessment(
    db_session: Session, test_blgu_user: User
) -> Assessment:
    """
    Create a SUBMITTED assessment for integration tests.
    """
    assessment = Assessment(
        blgu_user_id=test_blgu_user.id,
        status=AssessmentStatus.SUBMITTED,
        rework_count=0,
        submitted_at=datetime.utcnow(),
    )
    db_session.add(assessment)
    db_session.commit()
    db_session.refresh(assessment)
    return assessment


@pytest.fixture
def test_rework_assessment(
    db_session: Session, test_blgu_user: User, test_assessor_user: User
) -> Assessment:
    """
    Create a REWORK assessment for integration tests.
    """
    assessment = Assessment(
        blgu_user_id=test_blgu_user.id,
        status=AssessmentStatus.REWORK,
        rework_count=1,
        rework_requested_at=datetime.utcnow(),
        rework_requested_by=test_assessor_user.id,
        rework_comments="Please update the following items:\n- Item 1\n- Item 2",
    )
    db_session.add(assessment)
    db_session.commit()
    db_session.refresh(assessment)
    return assessment


@pytest.fixture
def test_assessment_with_responses(
    db_session: Session,
    test_draft_assessment: Assessment,
    test_indicator: Indicator,
    test_assessment_data: Dict[str, Any],
) -> Assessment:
    """
    Create an assessment with saved responses for integration tests.
    """
    response = AssessmentResponse(
        assessment_id=test_draft_assessment.id,
        indicator_id=test_indicator.id,
        response_data=test_assessment_data,
        calculated_status=ValidationStatus.PASS,
        calculated_remark="Test indicator passed",
    )
    db_session.add(response)
    db_session.commit()
    db_session.refresh(test_draft_assessment)
    return test_draft_assessment
