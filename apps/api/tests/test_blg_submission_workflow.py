# 🧪 Tests for BLGU Submission Workflow (Epic 4.1, 4.2.4)
# Covers POST /api/v1/assessments/{id}/submit and resubmission after rework

from typing import Any

import pytest
from app.api import deps
from app.db.enums import AreaType, AssessmentStatus, UserRole
from app.db.models import Assessment, AssessmentResponse, Barangay, GovernanceArea, Indicator, MOV, User
from fastapi.testclient import TestClient
from main import app
from sqlalchemy.orm import Session

client = TestClient(app)

# Type annotation to help the type checker understand dependency_overrides
app_instance: Any = client.app


def _create_base_graph(db_session: Session, *, with_mov: bool) -> dict:
    """Create base data for submission tests with optional MOV attachment."""
    import time

    ts = int(time.time() * 1000)

    barangay = Barangay(name=f"Test Barangay Submit {ts}")
    db_session.add(barangay)
    db_session.commit()
    db_session.refresh(barangay)

    ga = GovernanceArea(name=f"Gov Area Submit {ts}", area_type=AreaType.CORE)
    db_session.add(ga)
    db_session.commit()
    db_session.refresh(ga)

    indicator = Indicator(
        name=f"Indicator Submit {ts}",
        description="Submission test indicator",
        form_schema={
            "type": "object",
            "properties": {
                "answer": {"type": "string", "enum": ["YES", "NO", "N/A"]}
            },
            "required": ["answer"],
        },
        governance_area_id=ga.id,
    )
    db_session.add(indicator)
    db_session.commit()
    db_session.refresh(indicator)

    blgu = User(
        email=f"blgu_submit_{ts}@test.com",
        name="BLGU User",
        role=UserRole.BLGU_USER,
        barangay_id=barangay.id,
        hashed_password="hashed_password",
        is_active=True,
    )
    db_session.add(blgu)
    db_session.commit()
    db_session.refresh(blgu)

    assessment = Assessment(
        status=AssessmentStatus.DRAFT,
        blgu_user_id=blgu.id,
        rework_count=0,
    )
    db_session.add(assessment)
    db_session.commit()
    db_session.refresh(assessment)

    response = AssessmentResponse(
        assessment_id=assessment.id,
        indicator_id=indicator.id,
        response_data={"answer": "YES"},
        is_completed=True,
    )
    db_session.add(response)
    db_session.commit()
    db_session.refresh(response)

    if with_mov:
        mov = MOV(
            filename=f"file_{ts}.pdf",
            original_filename=f"orig_{ts}.pdf",
            file_size=1024,
            content_type="application/pdf",
            storage_path=f"/test/{ts}.pdf",
            response_id=response.id,
        )
        db_session.add(mov)
        db_session.commit()
        db_session.refresh(mov)

    return {
        "barangay": barangay,
        "governance_area": ga,
        "indicator": indicator,
        "blgu_user": blgu,
        "assessment": assessment,
        "response": response,
    }


@pytest.fixture
def blgu_context_with_mov(db_session: Session):
    return _create_base_graph(db_session, with_mov=True)


@pytest.fixture
def blgu_context_without_mov(db_session: Session):
    return _create_base_graph(db_session, with_mov=False)


def _override_user_and_db(blgu_user: User, db_session: Session):
    def _override_current_active_user():
        return blgu_user

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app_instance.dependency_overrides[deps.get_current_active_user] = (
        _override_current_active_user
    )
    app_instance.dependency_overrides[deps.get_db] = _override_get_db


def test_submit_assessment_success(db_session: Session, blgu_context_with_mov):
    """Submission succeeds when all YES answers have MOVs."""
    assessment = blgu_context_with_mov["assessment"]
    blgu_user = blgu_context_with_mov["blgu_user"]

    _override_user_and_db(blgu_user, db_session)

    response = client.post("/api/v1/assessments/submit")

    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True

    db_session.refresh(assessment)
    assert assessment.status == AssessmentStatus.SUBMITTED_FOR_REVIEW

    app_instance.dependency_overrides.clear()


def test_submit_assessment_fails_without_mov(db_session: Session, blgu_context_without_mov):
    """Submission fails when a YES answer lacks MOVs."""
    assessment = blgu_context_without_mov["assessment"]
    blgu_user = blgu_context_without_mov["blgu_user"]

    _override_user_and_db(blgu_user, db_session)

    response = client.post("/api/v1/assessments/submit")

    # Expect a 400 error with details about failed indicators
    assert response.status_code == 400
    data = response.json()
    assert "without mov" in data.get("detail", "").lower()

    db_session.refresh(assessment)
    assert assessment.status == AssessmentStatus.DRAFT

    app_instance.dependency_overrides.clear()


def test_resubmission_after_rework(db_session: Session, blgu_context_with_mov):
    """Allows resubmission when status is Needs Rework and issues fixed."""
    assessment = blgu_context_with_mov["assessment"]
    blgu_user = blgu_context_with_mov["blgu_user"]

    # Simulate rework phase
    assessment.status = AssessmentStatus.NEEDS_REWORK
    db_session.commit()

    _override_user_and_db(blgu_user, db_session)

    response = client.post("/api/v1/assessments/submit")

    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True

    db_session.refresh(assessment)
    assert assessment.status == AssessmentStatus.SUBMITTED_FOR_REVIEW

    app_instance.dependency_overrides.clear()


