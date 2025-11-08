# 📦 Storage Service
# Handles file uploads to Supabase Storage for MOV files

import logging
import re
import time
from datetime import datetime
from typing import Dict, Optional
from uuid import uuid4

from app.core.config import settings
from app.db.models.assessment import AssessmentResponse, MOVFile
from fastapi import UploadFile
from supabase import Client, create_client
from sqlalchemy.orm import Session

# Setup logging
logger = logging.getLogger(__name__)

# Initialize Supabase admin client with service-role key for server-side operations
_supabase_client: Optional[Client] = None


def _get_supabase_client() -> Client:
    """
    Get or initialize the Supabase admin client.

    Uses service-role key for server-side operations with full access.
    """
    global _supabase_client

    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError(
                "Supabase storage not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
            )

        try:
            _supabase_client = create_client(
                settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
            )
            logger.info("Supabase storage client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase storage client: {str(e)}")
            raise

    return _supabase_client


class StorageService:
    """
    Service for handling file uploads to Supabase Storage.

    This service handles MOV (Means of Verification) file uploads
    to Supabase Storage using the service-role key for secure server-side operations.
    """

    # Bucket name for MOV files (Epic 4.0)
    MOV_FILES_BUCKET = "mov-files"

    def upload_mov(
        self, file: UploadFile, *, response_id: int, db: Session
    ) -> Dict[str, str | int]:
        """
        Upload a MOV file to Supabase Storage.

        Files are stored in the 'movs' bucket under the path:
        assessment-{assessment_id}/response-{response_id}/{filename}

        Args:
            file: The file to upload (FastAPI UploadFile)
            response_id: The ID of the assessment response this MOV belongs to
            db: Database session to query for assessment_id

        Returns:
            dict containing:
                - storage_path: The full storage path in Supabase
                - file_size: Size of the uploaded file in bytes
                - content_type: MIME type of the file
                - filename: The stored filename

        Raises:
            ValueError: If Supabase is not configured or response not found
            Exception: If upload fails
        """
        # Get the assessment response to determine assessment_id
        response = (
            db.query(AssessmentResponse)
            .filter(AssessmentResponse.id == response_id)
            .first()
        )

        if not response:
            raise ValueError(f"Assessment response {response_id} not found")

        assessment_id = response.assessment_id

        # Get Supabase client
        supabase = _get_supabase_client()

        # Sanitize filename to prevent path traversal and special characters
        sanitized_filename = (
            (file.filename or "uploaded_file")
            .replace("/", "_")
            .replace("\\", "_")
            .replace("..", "_")
        )
        # Add timestamp to ensure uniqueness
        timestamp = int(time.time() * 1000)  # milliseconds
        stored_filename = f"{timestamp}-{sanitized_filename}"

        # Construct storage path
        # Format: assessment-{assessment_id}/response-{response_id}/{filename}
        storage_path = f"assessment-{assessment_id}/response-{response_id}/{stored_filename}"

        # Read file contents
        file_contents = file.file.read()
        file_size = len(file_contents)

        # Upload to Supabase Storage
        try:
            result = supabase.storage.from_("movs").upload(
                path=storage_path,
                file=file_contents,
                file_options={"content-type": file.content_type or "application/octet-stream"},
            )

            # Check for errors (following pattern from assessment_service.py)
            # The supabase-py client raises on HTTP/storage network error, but check for errors in resp too
            if isinstance(result, dict) and result.get("error"):
                raise Exception(f"Supabase upload error: {result['error']}")

            logger.info(
                f"Successfully uploaded MOV file {stored_filename} for response {response_id} "
                f"to path {storage_path}"
            )

            return {
                "storage_path": storage_path,
                "file_size": file_size,
                "content_type": file.content_type or "application/octet-stream",
                "filename": stored_filename,
                "original_filename": file.filename or stored_filename,
            }

        except Exception as e:
            logger.error(
                f"Failed to upload MOV file {file.filename or 'unknown'} for response {response_id}: {str(e)}"
            )
            raise

    # ============================================================================
    # Story 4.5: Backend File Upload Service (Epic 4.0)
    # New methods for indicator-level MOV file uploads
    # ============================================================================

    def _generate_unique_filename(self, original_filename: str) -> str:
        """
        Generate a unique filename using UUID prefix.

        Sanitizes the original filename to remove unsafe characters and
        prepends a UUID to ensure uniqueness.

        Args:
            original_filename: The original file name from the upload

        Returns:
            str: Unique filename in format: {uuid}_{sanitized_filename}
        """
        # Sanitize filename: remove path separators and special characters
        # Keep only alphanumeric, dots, hyphens, and underscores
        sanitized = re.sub(r'[^\w\s.-]', '_', original_filename)
        sanitized = sanitized.replace('..', '_').replace('/', '_').replace('\\', '_')

        # Remove leading/trailing whitespace and dots
        sanitized = sanitized.strip().strip('.')

        # If sanitization resulted in empty string, use a default
        if not sanitized:
            sanitized = "file"

        # Generate unique filename with UUID prefix
        unique_filename = f"{uuid4()}_{sanitized}"

        return unique_filename

    def _get_storage_path(
        self, assessment_id: int, indicator_id: int, filename: str
    ) -> str:
        """
        Generate the storage path for a file in Supabase Storage.

        Path structure: {assessment_id}/{indicator_id}/{filename}

        Args:
            assessment_id: ID of the assessment
            indicator_id: ID of the indicator
            filename: The file name (should be unique)

        Returns:
            str: Storage path for the file
        """
        return f"{assessment_id}/{indicator_id}/{filename}"

    def upload_mov_file(
        self,
        db: Session,
        file: UploadFile,
        assessment_id: int,
        indicator_id: int,
        user_id: int,
    ) -> MOVFile:
        """
        Upload a MOV file to Supabase Storage and create database record.

        This method handles the complete file upload workflow:
        1. Generate unique filename
        2. Construct storage path
        3. Upload file to Supabase Storage
        4. Create MOVFile database record
        5. Handle errors and rollback on failure

        Args:
            db: Database session
            file: FastAPI UploadFile object
            assessment_id: ID of the assessment
            indicator_id: ID of the indicator
            user_id: ID of the user uploading the file

        Returns:
            MOVFile: The created MOVFile database record

        Raises:
            ValueError: If Supabase is not configured
            Exception: If upload fails or database operation fails
        """
        # Get Supabase client
        supabase = _get_supabase_client()

        # Generate unique filename
        unique_filename = self._generate_unique_filename(file.filename or "file")

        # Get storage path
        storage_path = self._get_storage_path(assessment_id, indicator_id, unique_filename)

        # Read file contents
        file_contents = file.file.read()
        file_size = len(file_contents)
        content_type = file.content_type or "application/octet-stream"

        # Upload to Supabase Storage
        try:
            result = supabase.storage.from_(self.MOV_FILES_BUCKET).upload(
                path=storage_path,
                file=file_contents,
                file_options={"content-type": content_type},
            )

            # Check for errors in response
            if isinstance(result, dict) and result.get("error"):
                raise Exception(f"Supabase upload error: {result['error']}")

            logger.info(
                f"Successfully uploaded MOV file {unique_filename} for "
                f"assessment {assessment_id}, indicator {indicator_id} to path {storage_path}"
            )

        except Exception as e:
            logger.error(
                f"Failed to upload MOV file {file.filename or 'unknown'} "
                f"for assessment {assessment_id}, indicator {indicator_id}: {str(e)}"
            )
            raise Exception(f"File upload to storage failed: {str(e)}")

        # Get file URL from Supabase
        try:
            # Get public URL for the file
            file_url_result = supabase.storage.from_(self.MOV_FILES_BUCKET).get_public_url(
                storage_path
            )
            file_url = file_url_result
        except Exception as e:
            logger.error(f"Failed to get public URL for {storage_path}: {str(e)}")
            # If we can't get the URL, try to delete the uploaded file
            try:
                supabase.storage.from_(self.MOV_FILES_BUCKET).remove([storage_path])
            except Exception:
                pass  # Ignore cleanup errors
            raise Exception(f"Failed to get file URL: {str(e)}")

        # Create database record
        try:
            mov_file = self._save_mov_file_record(
                db=db,
                file_url=file_url,
                file_name=unique_filename,
                file_type=content_type,
                file_size=file_size,
                assessment_id=assessment_id,
                indicator_id=indicator_id,
                user_id=user_id,
            )

            logger.info(
                f"Created MOVFile database record (ID: {mov_file.id}) for file {unique_filename}"
            )

            return mov_file

        except Exception as e:
            logger.error(
                f"Failed to create MOVFile database record for {unique_filename}: {str(e)}"
            )
            # Rollback: try to delete the uploaded file from Supabase
            try:
                supabase.storage.from_(self.MOV_FILES_BUCKET).remove([storage_path])
                logger.info(f"Rolled back: deleted file {storage_path} from storage")
            except Exception as cleanup_error:
                logger.error(
                    f"Failed to cleanup file {storage_path} after database error: {str(cleanup_error)}"
                )

            raise Exception(f"Database operation failed: {str(e)}")

    def _save_mov_file_record(
        self,
        db: Session,
        file_url: str,
        file_name: str,
        file_type: str,
        file_size: int,
        assessment_id: int,
        indicator_id: int,
        user_id: int,
    ) -> MOVFile:
        """
        Create and save a MOVFile database record.

        Args:
            db: Database session
            file_url: URL of the uploaded file in Supabase Storage
            file_name: Unique file name
            file_type: MIME type of the file
            file_size: Size of the file in bytes
            assessment_id: ID of the assessment
            indicator_id: ID of the indicator
            user_id: ID of the user who uploaded the file

        Returns:
            MOVFile: The created and saved MOVFile instance

        Raises:
            Exception: If database operation fails
        """
        mov_file = MOVFile(
            assessment_id=assessment_id,
            indicator_id=indicator_id,
            uploaded_by=user_id,
            file_name=file_name,
            file_url=file_url,
            file_type=file_type,
            file_size=file_size,
            uploaded_at=datetime.utcnow(),
        )

        db.add(mov_file)
        db.commit()
        db.refresh(mov_file)

        return mov_file


# Create a singleton instance
storage_service = StorageService()

