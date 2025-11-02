# 📦 Storage Service
# Handles file uploads to Supabase Storage for MOV files

import logging
import time
from typing import Dict, Optional

from app.core.config import settings
from app.db.models.assessment import AssessmentResponse
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


# Create a singleton instance
storage_service = StorageService()

