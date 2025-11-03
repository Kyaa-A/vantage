from datetime import datetime

from fastapi.testclient import TestClient  # type: ignore[reportMissingImports]

from app.main import app
from app.api import deps
from app.db.base import SessionLocal
from app.db.models import Assessment, AssessmentResponse, FeedbackComment, Indicator, User
from app.db.enums import AssessmentStatus, Role


def override_get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[deps.get_db] = override_get_db


def create_user_and_assessment(db):
    blgu = User(
        email="blgu@example.com",
        name="BLGU User",
        role=Role.BLGU,
        is_active=True,
    )
    db.add(blgu)
    db.flush()

    ind = Indicator(
        name="Test Indicator",
        description="Desc",
        form_schema={"type": "object", "properties": {}},
        governance_area_id=1,
    )
    db.add(ind)
    db.flush()

    assessment = Assessment(
        blgu_user_id=blgu.id,
        status=AssessmentStatus.NEEDS_REWORK,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(assessment)
    db.flush()

    response = AssessmentResponse(
        assessment_id=assessment.id,
        indicator_id=ind.id,
        response_data={},
        is_completed=False,
        requires_rework=True,
    )
    db.add(response)
    db.flush()

    assessor = User(
        email="assessor@example.com",
        name="Assessor",
        role=Role.ASSESSOR,
        is_active=True,
    )
    db.add(assessor)
    db.flush()

    public_c = FeedbackComment(
        comment="Public feedback",
        comment_type="validation",
        response_id=response.id,
        assessor_id=assessor.id,
        is_internal_note=False,
    )
    internal_c = FeedbackComment(
        comment="Internal note",
        comment_type="internal_note",
        response_id=response.id,
        assessor_id=assessor.id,
        is_internal_note=True,
    )
    db.add(public_c)
    db.add(internal_c)
    db.commit()
    return blgu


def auth_headers_for(user_id: int):
    # Tests in this repo often bypass full auth; if auth middleware requires token,
    # adapt accordingly. For now assume dependency uses current user from session.
    return {"X-Debug-UserId": str(user_id), "X-Debug-Role": "BLGU"}


def test_blgu_does_not_receive_internal_notes():
    client = TestClient(app)
    with next(override_get_db()) as db:
        blgu = create_user_and_assessment(db)

    # my-assessment should include only public feedback in nested payload
    r1 = client.get("/api/v1/assessments/my-assessment", headers=auth_headers_for(blgu.id))
    assert r1.status_code == 200
    data = r1.json()
    # Walk to first indicator's feedback if present
    areas = data.get("governance_areas", [])
    all_feedback = []
    for area in areas:
        for ind in area.get("indicators", []):
            all_feedback.extend(ind.get("feedback_comments", []))
    assert any(fc["comment"] == "Public feedback" for fc in all_feedback)
    assert not any(fc.get("is_internal_note") for fc in all_feedback)

    # dashboard feedback list should exclude internal notes
    r2 = client.get("/api/v1/assessments/dashboard", headers=auth_headers_for(blgu.id))
    assert r2.status_code == 200
    dash = r2.json()
    feedback = dash.get("feedback", [])
    comments = [f.get("comment") for f in feedback]
    assert "Public feedback" in comments
    assert "Internal note" not in comments


