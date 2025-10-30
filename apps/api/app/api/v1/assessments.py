# 📋 Assessments API Routes
# Endpoints for assessment management and assessment data

from typing import Any, Dict, List

from app.api import deps
from app.db.enums import AssessmentStatus, UserRole
from app.db.models.user import User
from app.schemas.assessment import (
    MOV,
    AssessmentDashboardResponse,
    AssessmentResponse,
    AssessmentResponseCreate,
    AssessmentResponseUpdate,
    AssessmentSubmissionValidation,
    MOVCreate,
)
from app.db.models.assessment import MOV as MOVModel
from app.services.assessment_service import assessment_service
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

router = APIRouter()


async def get_current_blgu_user(
    current_user: User = Depends(deps.get_current_active_user),
) -> User:
    """
    Get the current authenticated BLGU user.

    Restricts access to users with BLGU_USER role.

    Args:
        current_user: Current active user from get_current_active_user dependency

    Returns:
        User: Current BLGU user

    Raises:
        HTTPException: If user doesn't have BLGU privileges
    """
    if current_user.role.value != UserRole.BLGU_USER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. BLGU user access required.",
        )
    return current_user


@router.get(
    "/dashboard", response_model=AssessmentDashboardResponse, tags=["assessments"]
)
async def get_assessment_dashboard(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_blgu_user),
):
    """
    Get dashboard data for the logged-in BLGU user's assessment.

    Returns dashboard-specific data optimized for overview and progress tracking:
    - Progress statistics (completed/total indicators)
    - Governance area progress summaries
    - Performance metrics (responses requiring rework, with feedback, with MOVs)
    - Recent feedback summaries
    - Assessment status and metadata

    This endpoint automatically creates an assessment if one doesn't exist
    for the BLGU user.
    """
    try:
        dashboard_data = assessment_service.get_assessment_dashboard_data(
            db, getattr(current_user, "id")
        )

        if not dashboard_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve dashboard data",
            )

        return dashboard_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving dashboard data: {str(e)}",
        ) from e


@router.get("/my-assessment", response_model=Dict[str, Any], tags=["assessments"])
async def get_my_assessment(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_blgu_user),
):
    """
    Get the complete assessment data for the logged-in BLGU user.

    Returns the full assessment data including:
    - Assessment status and metadata
    - All governance areas with their indicators
    - Form schemas for each indicator
    - Existing response data for each indicator
    - MOVs (Means of Verification) for each response
    - Feedback comments from assessors

    This endpoint automatically creates an assessment if one doesn't exist
    for the BLGU user.
    """
    try:
        assessment_data = assessment_service.get_assessment_for_blgu_with_full_data(
            db, getattr(current_user, "id")
        )

        if not assessment_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve assessment data",
            )

        return assessment_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving assessment data: {str(e)}",
        ) from e


@router.get(
    "/responses/{response_id}", response_model=AssessmentResponse, tags=["assessments"]
)
async def get_assessment_response(
    response_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_blgu_user),
):
    """
    Get a specific assessment response by ID.

    Returns the assessment response with all related data including:
    - Response data (JSON)
    - Completion status
    - MOVs (Means of Verification)
    - Feedback comments
    """
    response = assessment_service.get_assessment_response(db, response_id)

    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment response not found",
        )

    # Verify that the response belongs to the current user's assessment
    assessment = assessment_service.get_assessment_for_blgu(
        db, getattr(current_user, "id")
    )
    if assessment is None or response.assessment_id != assessment.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Response does not belong to your assessment",
        )

    return response


@router.put(
    "/responses/{response_id}", response_model=AssessmentResponse, tags=["assessments"]
)
async def update_assessment_response(
    response_id: int,
    response_update: AssessmentResponseUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_blgu_user),
):
    """
    Update an assessment response with validation.

    Updates the response data and validates it against the indicator's form schema.
    The response data must conform to the JSON schema defined in the indicator's
    form_schema field.

    Business Rules:
    - Only responses belonging to the current user's assessment can be updated
    - Response data is validated against the indicator's form schema
    - Completion status is automatically updated based on response data
    """
    # First verify the response belongs to the current user
    response = assessment_service.get_assessment_response(db, response_id)
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment response not found",
        )

    # Verify ownership
    assessment = assessment_service.get_assessment_for_blgu(
        db, getattr(current_user, "id")
    )
    if assessment is None or response.assessment_id != assessment.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Response does not belong to your assessment",
        )

    # Check if assessment is in a state that allows updates
    if assessment.status not in [
        assessment.status.DRAFT,
        assessment.status.NEEDS_REWORK,
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update response. Assessment status is {assessment.status.value}",
        )

    try:
        updated_response = assessment_service.update_assessment_response(
            db, response_id, response_update
        )

        if not updated_response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment response not found",
            )

        return updated_response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating response: {str(e)}",
        ) from e


@router.post("/responses", response_model=AssessmentResponse, tags=["assessments"])
async def create_assessment_response(
    response_create: AssessmentResponseCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_blgu_user),
):
    """
    Create a new assessment response.

    Creates a new response for a specific indicator in the user's assessment.
    The response data is validated against the indicator's form schema.
    """
    # Verify the assessment belongs to the current user
    assessment = assessment_service.get_assessment_for_blgu(
        db, getattr(current_user, "id")
    )
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found for current user",
        )

    # Verify the response is for the user's assessment
    if response_create.assessment_id != assessment.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create response for different assessment",
        )

    try:
        return assessment_service.create_assessment_response(db, response_create)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating response: {str(e)}",
        ) from e


@router.post(
    "/submit", response_model=AssessmentSubmissionValidation, tags=["assessments"]
)
async def submit_assessment(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_blgu_user),
):
    """
    Submit the assessment for review.

    Runs a preliminary compliance check before submission:
    - Ensures no "YES" answers exist without corresponding MOVs (Means of Verification)
    - Updates assessment status to "Submitted for Review"
    - Sets submission timestamp

    Returns validation results with any errors or warnings.
    """
    assessment = assessment_service.get_assessment_for_blgu(
        db, getattr(current_user, "id")
    )
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found for current user",
        )

    try:
        validation_result = assessment_service.submit_assessment(db, assessment.id)
        if not getattr(validation_result, "is_valid", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Submission failed: YES answers without MOV detected."
                ),
            )
        return validation_result

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting assessment: {str(e)}",
        ) from e


@router.post(
    "/{assessment_id}/submit",
    response_model=AssessmentSubmissionValidation,
    tags=["assessments"],
)
async def submit_assessment_by_id(
    assessment_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_blgu_user),
):
    """
    Submit a specific assessment for review by ID.

    Validates that the assessment belongs to the current BLGU user, runs the
    preliminary compliance check (no "YES" answers without MOVs), and updates
    the status to "Submitted for Review" if valid.
    """
    assessment = assessment_service.get_assessment_for_blgu(
        db, getattr(current_user, "id")
    )
    if not assessment or assessment.id != assessment_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found for current user",
        )

    try:
        validation_result = assessment_service.submit_assessment(db, assessment_id)
        if not getattr(validation_result, "is_valid", False):
            # Return 400 with a concise detail message for failed indicators per PRD
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Submission failed: YES answers without MOV detected."
                ),
            )
        return validation_result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting assessment: {str(e)}",
        ) from e

@router.post("/responses/{response_id}/movs", response_model=MOV, tags=["assessments"])
async def upload_mov(
    response_id: int,
    mov_create: MOVCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_blgu_user),
):
    """
    Upload a MOV (Means of Verification) file for an assessment response.

    Creates a record of the uploaded file in the database. The actual file
    upload to Supabase Storage should be handled by the frontend before
    calling this endpoint.
    """
    # Verify the response belongs to the current user
    response = assessment_service.get_assessment_response(db, response_id)
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment response not found",
        )

    assessment = assessment_service.get_assessment_for_blgu(
        db, getattr(current_user, "id")
    )
    if assessment is None or response.assessment_id != assessment.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Response does not belong to your assessment",
        )

    # Verify the MOV is for the correct response
    if mov_create.response_id != response_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MOV response_id does not match URL parameter",
        )

    try:
        return assessment_service.create_mov(db, mov_create)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating MOV: {str(e)}",
        ) from e


@router.delete("/movs/{mov_id}", response_model=Dict[str, str], tags=["assessments"])
async def delete_mov(
    mov_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_blgu_user),
):
    """
    Delete a MOV (Means of Verification) file.

    Removes the MOV record from the database. The actual file deletion
    from Supabase Storage should be handled separately.
    """
    # First get the MOV to verify ownership
    mov = db.query(MOVModel).filter(MOVModel.id == mov_id).first()
    if mov is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="MOV not found"
        )

    # Verify the MOV belongs to the current user's assessment
    response = assessment_service.get_assessment_response(db, mov.response_id)
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment response not found",
        )

    assessment = assessment_service.get_assessment_for_blgu(
        db, getattr(current_user, "id")
    )
    if assessment is None or response.assessment_id != assessment.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. MOV does not belong to your assessment",
        )

    try:
        success = assessment_service.delete_mov(db, mov_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="MOV not found"
            )

        return {"message": "MOV deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting MOV: {str(e)}",
        ) from e


async def get_current_admin_user(
    current_user: User = Depends(deps.get_current_active_user),
) -> User:
    """
    Get the current authenticated admin/MLGOO user.

    Restricts access to users with SUPERADMIN or MLGOO_DILG role.

    Args:
        current_user: Current active user from get_current_active_user dependency

    Returns:
        User: Current admin/MLGOO user

    Raises:
        HTTPException: If user doesn't have admin privileges
    """
    if current_user.role.value not in [
        UserRole.SUPERADMIN.value,
        UserRole.MLGOO_DILG.value,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin/MLGOO access required.",
        )
    return current_user


@router.get("/list", response_model=List[Dict[str, Any]], tags=["assessments"])
async def get_all_validated_assessments(
    status: AssessmentStatus = Query(
        AssessmentStatus.VALIDATED, description="Filter by assessment status"
    ),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Get all validated assessments with compliance status.

    Returns a list of all validated assessments with their compliance status,
    area results, and barangay information. Used for MLGOO reports dashboard.

    Args:
        status: Filter by assessment status (defaults to VALIDATED)
        db: Database session
        current_user: Current admin/MLGOO user

    Returns:
        List of assessment dictionaries with compliance data
    """
    try:
        assessments = assessment_service.get_all_validated_assessments(
            db, status=status
        )
        return assessments
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving assessments: {str(e)}",
        ) from e


@router.post(
    "/{id}/generate-insights",
    response_model=Dict[str, Any],
    status_code=status.HTTP_202_ACCEPTED,
    tags=["assessments"],
)
async def generate_insights(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Generate AI-powered insights for a validated assessment.

    This endpoint dispatches a background Celery task to generate AI insights
    using the Gemini API. The task runs asynchronously and results are stored
    in the ai_recommendations field.

    **Business Rules:**
    - Only works for assessments with VALIDATED status
    - Returns 202 Accepted immediately (asynchronous processing)
    - Task includes automatic retry logic (max 3 attempts with exponential backoff)
    - Results are cached to avoid duplicate API calls

    **Response:**
    - Immediately returns 202 Accepted with task information
    - Frontend should poll assessment endpoint to check for ai_recommendations field

    Args:
        id: Assessment ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        dict: Task dispatch confirmation
    """
    from app.db.models import Assessment
    from app.workers.intelligence_worker import generate_insights_task

    # Verify assessment exists
    assessment = db.query(Assessment).filter(Assessment.id == id).first()

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found"
        )

    # Verify assessment is validated (required for insights)
    if assessment.status != AssessmentStatus.VALIDATED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Assessment must be validated to generate insights. Current status: {assessment.status.value}",
        )

    # Check if insights already exist (cached)
    if assessment.ai_recommendations:
        return {
            "message": "AI insights already generated",
            "assessment_id": id,
            "insights_cached": True,
            "status": "completed",
        }

    # Dispatch Celery task for background processing
    task = generate_insights_task.delay(id)

    return {
        "message": "AI insight generation started",
        "assessment_id": id,
        "task_id": task.id,
        "status": "processing",
    }
