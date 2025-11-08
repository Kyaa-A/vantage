"""
MOV File Management API Endpoints (Epic 4.0)

Provides endpoints for uploading, listing, and deleting MOV (Means of Verification) files.
"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models.user import User
from app.schemas.assessment import MOVFileResponse
from app.services.file_validation_service import file_validation_service
from app.services.storage_service import storage_service

router = APIRouter()


@router.post(
    "/assessments/{assessment_id}/indicators/{indicator_id}/upload",
    response_model=MOVFileResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["movs"],
    summary="Upload MOV file for an indicator",
    description="""
    Upload a MOV (Means of Verification) file for a specific indicator in an assessment.

    - **Validates** file type (PDF, DOCX, XLSX, JPG, PNG, MP4)
    - **Validates** file size (max 50MB)
    - **Validates** file content security
    - **Uploads** file to Supabase Storage
    - **Creates** database record with metadata

    Returns the uploaded file metadata including URL, size, and upload timestamp.
    """,
)
def upload_mov_file(
    assessment_id: int,
    indicator_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> MOVFileResponse:
    """
    Upload a MOV file for an indicator.

    Args:
        assessment_id: ID of the assessment
        indicator_id: ID of the indicator
        file: The file to upload (multipart/form-data)
        db: Database session
        current_user: Currently authenticated user

    Returns:
        MOVFileResponse with file metadata

    Raises:
        HTTPException 400: File validation failed
        HTTPException 500: Upload or database operation failed
    """
    # Validate the file
    validation_result = file_validation_service.validate_file(file)

    if not validation_result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": validation_result.error_message,
                "error_code": validation_result.error_code,
            },
        )

    # Upload file to storage and create database record
    try:
        mov_file = storage_service.upload_mov_file(
            db=db,
            file=file,
            assessment_id=assessment_id,
            indicator_id=indicator_id,
            user_id=current_user.id,
        )

        return MOVFileResponse.model_validate(mov_file)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}",
        )
