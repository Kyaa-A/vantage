from datetime import datetime

from fastapi.testclient import TestClient  # type: ignore[reportMissingImports]

from app.main import app
from app.api import deps
from app.db.base import SessionLocal
from app.db.models import Assessment, AssessmentResponse, Indicator, User
from app.db.enums import AssessmentStatus, Role, ValidationStatus


def override_get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[deps.get_db] = override_get_db


def seed_assessment(db, status=AssessmentStatus.SUBMITTED_FOR_REVIEW, rework_count=0, reviewed=True, has_fail=False):
    assessor = User(email="assessor2@example.com", name="Assessor2", role=Role.ASSESSOR, is_active=True)
    blgu = User(email="blgu2@example.com", name="BLGU2", role=Role.BLGU, is_active=True)
    db.add_all([assessor, blgu])
    db.flush()

    ind = Indicator(
        name="Ind A",
        description="",
        form_schema={"type": "object", "properties": {}},
        governance_area_id=1,
    )
    db.add(ind)
    db.flush()

    a = Assessment(
        blgu_user_id=blgu.id,
        status=status,
        rework_count=rework_count,
        submitted_at=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(a)
    db.flush()

    r = AssessmentResponse(
        assessment_id=a.id,
        indicator_id=ind.id,
        response_data={},
        is_completed=False,
        requires_rework=False,
        validation_status=(ValidationStatus.FAIL if has_fail else (ValidationStatus.PASS if reviewed else None)),
    )
    db.add(r)
    db.commit()
    return assessor, a


def auth_headers_assessor(user_id: int):
    return {"X-Debug-UserId": str(user_id), "X-Debug-Role": "ASSESSOR"}


def test_rework_only_allowed_once_and_requires_fail_and_reviewed():
    client = TestClient(app)
    with next(override_get_db()) as db:
        assessor, a = seed_assessment(db, status=AssessmentStatus.SUBMITTED_FOR_REVIEW, rework_count=0, reviewed=True, has_fail=True)

    # First rework allowed
    r1 = client.post(f"/api/v1/assessor/assessments/{a.id}/rework", headers=auth_headers_assessor(assessor.id))
    assert r1.status_code in (200, 201)

    # Second rework blocked
    r2 = client.post(f"/api/v1/assessor/assessments/{a.id}/rework", headers=auth_headers_assessor(assessor.id))
    assert r2.status_code == 400

    # Fresh assessment with no Fail should block rework
    with next(override_get_db()) as db:
        assessor2, a2 = seed_assessment(db, status=AssessmentStatus.SUBMITTED_FOR_REVIEW, rework_count=0, reviewed=True, has_fail=False)
    r3 = client.post(f"/api/v1/assessor/assessments/{a2.id}/rework", headers=auth_headers_assessor(assessor2.id))
    assert r3.status_code == 400

    # Fresh assessment with unreviewed indicators should block rework
    with next(override_get_db()) as db:
        assessor3, a3 = seed_assessment(db, status=AssessmentStatus.SUBMITTED_FOR_REVIEW, rework_count=0, reviewed=False, has_fail=True)
    r4 = client.post(f"/api/v1/assessor/assessments/{a3.id}/rework", headers=auth_headers_assessor(assessor3.id))
    assert r4.status_code == 400


def test_finalize_rules_first_submission_vs_rework():
    client = TestClient(app)

    # First submission with Fail should block finalize
    with next(override_get_db()) as db:
        assessor, a = seed_assessment(db, status=AssessmentStatus.SUBMITTED_FOR_REVIEW, rework_count=0, reviewed=True, has_fail=True)
    r1 = client.post(f"/api/v1/assessor/assessments/{a.id}/finalize", headers=auth_headers_assessor(assessor.id))
    assert r1.status_code == 400

    # Needs Rework (after rework) should allow finalize even if Fail
    with next(override_get_db()) as db:
        assessor2, a2 = seed_assessment(db, status=AssessmentStatus.NEEDS_REWORK, rework_count=1, reviewed=True, has_fail=True)
    r2 = client.post(f"/api/v1/assessor/assessments/{a2.id}/finalize", headers=auth_headers_assessor(assessor2.id))
    assert r2.status_code in (200, 201)


