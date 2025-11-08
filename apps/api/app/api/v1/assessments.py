# 📋 Assessments API Routes
# Endpoints for assessment management and assessment data

from datetime import datetime
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
    SaveAnswersRequest,
    SaveAnswersResponse,
    GetAnswersResponse,
    AnswerResponse,
    CompletenessValidationResponse,
    IncompleteIndicatorDetail,
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


@router.post(
    "/{assessment_id}/answers",
    response_model=SaveAnswersResponse,
    status_code=status.HTTP_200_OK,
    tags=["assessments"],
)
async def save_assessment_answers(
    assessment_id: int,
    request_body: SaveAnswersRequest,
    indicator_id: int = Query(..., description="ID of the indicator"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> SaveAnswersResponse:
    """
    Save form responses for an assessment.

    **Permissions**:
    - BLGU users can save answers for their own assessments
    - Assessors can save answers (for table validation)

    **Path Parameters**:
    - assessment_id: ID of the assessment

    **Query Parameters**:
    - indicator_id: ID of the indicator

    **Request Body**:
    ```json
    {
      "responses": [
        {"field_id": "field1", "value": "text response"},
        {"field_id": "field2", "value": 42},
        {"field_id": "field3", "value": ["option1", "option2"]}
      ]
    }
    ```

    **Field Type Validation**:
    - text/textarea: value must be string
    - number: value must be numeric (int or float)
    - date: value must be ISO date string
    - select/radio: value must be string matching one of the field's option IDs
    - checkbox: value must be array of strings matching the field's option IDs

    **Returns**: Confirmation with count of saved fields

    **Raises**:
    - 400: Assessment is locked for editing
    - 403: User not authorized to modify this assessment
    - 404: Assessment or indicator not found
    - 422: Field validation errors (field not found, type mismatch, invalid option)
    """
    from app.db.models import Assessment
    from app.db.models.governance_area import Indicator

    # Retrieve assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment with ID {assessment_id} not found"
        )

    # Permission check: BLGU users can only save their own assessments
    # Assessors can save for any assessment (for table validation)
    if current_user.role == UserRole.BLGU_USER:
        if assessment.blgu_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to modify this assessment"
            )
    # Assessors and other roles are allowed

    # Status check: Only DRAFT or NEEDS_REWORK assessments can be edited
    locked_statuses = [AssessmentStatus.SUBMITTED_FOR_REVIEW, AssessmentStatus.VALIDATED]
    if assessment.status in locked_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Assessment is locked for editing. Current status: {assessment.status.value}"
        )

    # Retrieve indicator and form_schema for validation
    indicator = db.query(Indicator).filter(Indicator.id == indicator_id).first()

    if not indicator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Indicator with ID {indicator_id} not found"
        )

    # Parse form_schema to extract field definitions
    form_schema = indicator.form_schema or {}

    # Extract field definitions from form_schema
    fields = form_schema.get("fields", [])
    field_map = {field.get("field_id", field.get("id")): field for field in fields}

    # Extract field responses from request body
    field_responses = request_body.responses

    # Validate each field response
    validation_errors = []

    for response in field_responses:
        field_id = response.get("field_id")
        value = response.get("value")

        # Check if field_id exists in form_schema
        if field_id not in field_map:
            validation_errors.append({
                "field_id": field_id,
                "error": f"Field '{field_id}' not found in form schema"
            })
            continue

        field_definition = field_map[field_id]
        field_type = field_definition.get("type")

        # Validate value type matches field type
        if field_type == "text" or field_type == "textarea":
            if not isinstance(value, str):
                validation_errors.append({
                    "field_id": field_id,
                    "error": f"Field '{field_id}' expects string value, got {type(value).__name__}"
                })

        elif field_type == "number":
            if not isinstance(value, (int, float)):
                validation_errors.append({
                    "field_id": field_id,
                    "error": f"Field '{field_id}' expects numeric value, got {type(value).__name__}"
                })

        elif field_type == "date":
            if not isinstance(value, str):
                validation_errors.append({
                    "field_id": field_id,
                    "error": f"Field '{field_id}' expects date string (ISO format), got {type(value).__name__}"
                })
            # Note: Additional date format validation can be added here

        elif field_type == "select" or field_type == "radio":
            # For select/radio, value should be a string matching one of the options
            if not isinstance(value, str):
                validation_errors.append({
                    "field_id": field_id,
                    "error": f"Field '{field_id}' expects string value (option ID), got {type(value).__name__}"
                })
            else:
                # Validate that selected option exists
                options = field_definition.get("options", [])
                option_ids = [opt.get("id") for opt in options]
                if value not in option_ids:
                    validation_errors.append({
                        "field_id": field_id,
                        "error": f"Field '{field_id}' has invalid option '{value}'. Valid options: {option_ids}"
                    })

        elif field_type == "checkbox":
            # For checkbox, value should be an array of option IDs
            if not isinstance(value, list):
                validation_errors.append({
                    "field_id": field_id,
                    "error": f"Field '{field_id}' expects array of option IDs, got {type(value).__name__}"
                })
            else:
                # Validate that all selected options exist
                options = field_definition.get("options", [])
                option_ids = [opt.get("id") for opt in options]
                for selected_option in value:
                    if selected_option not in option_ids:
                        validation_errors.append({
                            "field_id": field_id,
                            "error": f"Field '{field_id}' has invalid option '{selected_option}'. Valid options: {option_ids}"
                        })

    # If validation errors found, raise 422
    if validation_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Field validation failed",
                "errors": validation_errors
            }
        )

    # Upsert assessment_response record
    from app.db.models.assessment import AssessmentResponse

    # Check if assessment_response already exists for this assessment + indicator
    existing_response = db.query(AssessmentResponse).filter(
        AssessmentResponse.assessment_id == assessment_id,
        AssessmentResponse.indicator_id == indicator_id
    ).first()

    # Build response_data dictionary from field responses
    response_data = {response["field_id"]: response["value"] for response in field_responses}

    if existing_response:
        # Update existing record
        existing_response.response_data = response_data
        existing_response.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_response)
    else:
        # Create new record
        new_response = AssessmentResponse(
            assessment_id=assessment_id,
            indicator_id=indicator_id,
            response_data=response_data,
            is_completed=False,  # Will be set to True when all required fields are filled
            requires_rework=False,
        )
        db.add(new_response)
        db.commit()
        db.refresh(new_response)

    return SaveAnswersResponse(
        message="Responses saved successfully",
        assessment_id=assessment_id,
        indicator_id=indicator_id,
        saved_count=len(field_responses)
    )


@router.get(
    "/{assessment_id}/answers",
    response_model=GetAnswersResponse,
    status_code=status.HTTP_200_OK,
    tags=["assessments"],
)
async def get_assessment_answers(
    assessment_id: int,
    indicator_id: int = Query(..., description="ID of the indicator"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> GetAnswersResponse:
    """
    Retrieve saved form responses for a specific indicator in an assessment.

    **Permissions**:
    - BLGU users can retrieve answers for their own assessments
    - Assessors can retrieve answers for any assessment

    **Path Parameters**:
    - assessment_id: ID of the assessment

    **Query Parameters**:
    - indicator_id: ID of the indicator

    **Returns**:
    ```json
    {
      "assessment_id": 1,
      "indicator_id": 5,
      "responses": [
        {"field_id": "field1", "value": "text response"},
        {"field_id": "field2", "value": 42}
      ],
      "created_at": "2025-01-08T12:00:00",
      "updated_at": "2025-01-08T12:30:00"
    }
    ```

    Returns empty array if no responses saved yet.

    **Raises**:
    - 403: User not authorized to view this assessment
    - 404: Assessment not found
    """
    from app.db.models import Assessment

    # Retrieve assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment with ID {assessment_id} not found"
        )

    # Permission check: BLGU users can only view their own assessments
    # Assessors can view any assessment
    if current_user.role == UserRole.BLGU_USER:
        if assessment.blgu_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this assessment"
            )
    # Assessors and other roles are allowed

    # Query assessment_response for this assessment + indicator
    from app.db.models.assessment import AssessmentResponse

    assessment_response = db.query(AssessmentResponse).filter(
        AssessmentResponse.assessment_id == assessment_id,
        AssessmentResponse.indicator_id == indicator_id
    ).first()

    # If no response exists yet, return empty array
    if not assessment_response or not assessment_response.response_data:
        return GetAnswersResponse(
            assessment_id=assessment_id,
            indicator_id=indicator_id,
            responses=[]
        )

    # Extract field responses from response_data (stored as dict)
    # Format: {"field_id": value, ...} -> [{"field_id": ..., "value": ...}, ...]
    field_responses = [
        AnswerResponse(
            field_id=field_id,
            value=value
        )
        for field_id, value in assessment_response.response_data.items()
    ]

    return GetAnswersResponse(
        assessment_id=assessment_id,
        indicator_id=indicator_id,
        responses=field_responses,
        created_at=assessment_response.created_at.isoformat(),
        updated_at=assessment_response.updated_at.isoformat()
    )


@router.post(
    "/{assessment_id}/validate-completeness",
    response_model=CompletenessValidationResponse,
    status_code=status.HTTP_200_OK,
    tags=["assessments"],
)
async def validate_assessment_completeness(
    assessment_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> CompletenessValidationResponse:
    """
    Validate completeness of all indicators in an assessment.

    Checks if all required fields are filled for all indicators.
    Does NOT expose compliance status (Pass/Fail) - only completeness.

    **Permissions**: All authenticated users

    **Path Parameters**:
    - assessment_id: ID of the assessment

    **Returns**:
    ```json
    {
      "is_complete": false,
      "total_indicators": 10,
      "complete_indicators": 7,
      "incomplete_indicators": 3,
      "incomplete_details": [
        {
          "indicator_id": 5,
          "indicator_title": "Financial Management",
          "missing_required_fields": ["field1", "field2"]
        }
      ]
    }
    ```

    **Raises**:
    - 404: Assessment not found
    """
    from app.db.models import Assessment
    from app.db.models.assessment import AssessmentResponse
    from app.db.models.governance_area import Indicator
    from sqlalchemy.orm import joinedload

    # Retrieve assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment with ID {assessment_id} not found"
        )

    # Retrieve all active indicators
    indicators = db.query(Indicator).filter(
        Indicator.is_active == True
    ).options(
        joinedload(Indicator.governance_area)
    ).all()

    # Retrieve all assessment_responses for this assessment
    assessment_responses = db.query(AssessmentResponse).filter(
        AssessmentResponse.assessment_id == assessment_id
    ).all()

    # Create a map of indicator_id -> assessment_response for easy lookup
    response_map = {resp.indicator_id: resp for resp in assessment_responses}

    # Validate completeness for each indicator using the service
    from app.services.completeness_validation_service import CompletenessValidationService

    completeness_service = CompletenessValidationService()

    # Collect validation results for each indicator
    indicator_results = []

    for indicator in indicators:
        # Get the assessment response for this indicator (if it exists)
        assessment_response = response_map.get(indicator.id)

        # Get response_data and movs
        response_data = assessment_response.response_data if assessment_response else None
        uploaded_movs = assessment_response.movs if assessment_response else []

        # Validate completeness
        validation_result = completeness_service.validate_completeness(
            form_schema=indicator.form_schema,
            response_data=response_data,
            uploaded_movs=uploaded_movs
        )

        indicator_results.append({
            "indicator": indicator,
            "is_complete": validation_result["is_complete"],
            "missing_fields": validation_result["missing_fields"]
        })

    # Aggregate completeness results across all indicators
    complete_count = sum(1 for r in indicator_results if r["is_complete"])
    incomplete_count = sum(1 for r in indicator_results if not r["is_complete"])

    # Build list of incomplete indicators with missing field details
    incomplete_details = []
    for result in indicator_results:
        if not result["is_complete"]:
            incomplete_details.append(
                IncompleteIndicatorDetail(
                    indicator_id=result["indicator"].id,
                    indicator_title=result["indicator"].name,
                    missing_required_fields=[
                        field["field_id"]
                        for field in result["missing_fields"]
                    ]
                )
            )

    # Determine overall completeness
    is_complete = incomplete_count == 0

    # Return CompletenessValidationResponse
    return CompletenessValidationResponse(
        is_complete=is_complete,
        total_indicators=len(indicators),
        complete_indicators=complete_count,
        incomplete_indicators=incomplete_count,
        incomplete_details=incomplete_details
    )
