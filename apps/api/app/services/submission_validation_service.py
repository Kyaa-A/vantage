"""
Submission Validation Service (Epic 5.0)

This service validates that an assessment is complete and ready for submission.
It performs comprehensive checks before allowing a BLGU user to submit their assessment.

The service checks:
1. Completeness: All required indicator fields are filled (uses CompletenessValidationService)
2. MOVs: All required file uploads (MOVFiles) are present

Usage:
    from app.services.submission_validation_service import submission_validation_service

    result = submission_validation_service.validate_submission(
        assessment_id=1,
        db=db_session
    )

    if not result.is_valid:
        print(f"Incomplete indicators: {result.incomplete_indicators}")
        print(f"Missing MOVs: {result.missing_movs}")
"""

from typing import List
from sqlalchemy.orm import Session
import logging

from app.db.models.assessment import Assessment, AssessmentResponse, MOVFile
from app.db.models.governance_area import Indicator
from app.services.completeness_validation_service import completeness_validation_service
from app.schemas.assessment import SubmissionValidationResult

logger = logging.getLogger(__name__)


class SubmissionValidationError(Exception):
    """Custom exception for submission validation errors"""
    pass


class SubmissionValidationService:
    """
    Service for validating assessment submission readiness (Epic 5.0).

    This service ensures that an assessment meets all requirements before
    being submitted for assessor review.
    """

    def __init__(self):
        """Initialize the submission validation service"""
        self.logger = logging.getLogger(__name__)

    def validate_submission(
        self,
        assessment_id: int,
        db: Session
    ) -> SubmissionValidationResult:
        """
        Validate that an assessment is complete and ready for submission.

        This is the main entry point for Epic 5.0 submission validation.

        Args:
            assessment_id: The ID of the assessment to validate
            db: SQLAlchemy database session

        Returns:
            SubmissionValidationResult with validation status and details

        Raises:
            SubmissionValidationError: If the assessment cannot be validated
        """
        try:
            # Get the assessment
            assessment = db.query(Assessment).filter_by(id=assessment_id).first()
            if not assessment:
                raise SubmissionValidationError(f"Assessment {assessment_id} not found")

            # Validate completeness of all indicators
            incomplete_indicators = self.validate_completeness(assessment_id, db)

            # Validate that all required MOVs are uploaded
            missing_movs = self.validate_movs(assessment_id, db)

            # Determine overall validity
            is_valid = len(incomplete_indicators) == 0 and len(missing_movs) == 0

            # Build error message if invalid
            error_message = None
            if not is_valid:
                error_parts = []
                if incomplete_indicators:
                    error_parts.append(
                        f"{len(incomplete_indicators)} indicator(s) are incomplete"
                    )
                if missing_movs:
                    error_parts.append(
                        f"{len(missing_movs)} indicator(s) are missing required file uploads"
                    )
                error_message = ". ".join(error_parts)

            return SubmissionValidationResult(
                is_valid=is_valid,
                incomplete_indicators=incomplete_indicators,
                missing_movs=missing_movs,
                error_message=error_message
            )

        except Exception as e:
            self.logger.error(
                f"Error validating submission for assessment {assessment_id}: {str(e)}",
                exc_info=True
            )
            raise SubmissionValidationError(
                f"Failed to validate submission: {str(e)}"
            )

    def validate_completeness(
        self,
        assessment_id: int,
        db: Session
    ) -> List[str]:
        """
        Validate that all indicators in the assessment are complete.

        Uses the CompletenessValidationService to check each indicator's response.

        Args:
            assessment_id: The ID of the assessment to validate
            db: SQLAlchemy database session

        Returns:
            List of indicator names/IDs that are incomplete (empty list if all complete)
        """
        incomplete_indicators = []

        # Get all active indicators in the system
        all_indicators = db.query(Indicator).filter_by(is_active=True).all()
        self.logger.debug(f"Found {len(all_indicators)} active indicators in system")

        # Get all assessment responses for this assessment
        responses = db.query(AssessmentResponse).filter_by(
            assessment_id=assessment_id
        ).all()
        self.logger.debug(f"Found {len(responses)} responses for assessment {assessment_id}")

        # Create a map of indicator_id -> response for quick lookup
        response_map = {r.indicator_id: r for r in responses}

        # Check each indicator
        for indicator in all_indicators:
            response = response_map.get(indicator.id)

            # If no response exists for this indicator, it's incomplete
            if not response:
                incomplete_indicators.append(indicator.name)
                continue

            # Validate completeness using CompletenessValidationService
            # Note: The old MOV model is used here for compatibility
            # with CompletenessValidationService
            validation_result = completeness_validation_service.validate_completeness(
                form_schema=indicator.form_schema,
                response_data=response.response_data,
                uploaded_movs=response.movs if hasattr(response, 'movs') else []
            )

            # If incomplete, add to list
            if not validation_result["is_complete"]:
                incomplete_indicators.append(indicator.name)

        return incomplete_indicators

    def validate_movs(
        self,
        assessment_id: int,
        db: Session
    ) -> List[str]:
        """
        Validate that all required MOV files (Epic 4.0) are uploaded.

        Checks the MOVFile table to ensure that indicators requiring file uploads
        have at least one file uploaded.

        Args:
            assessment_id: The ID of the assessment to validate
            db: SQLAlchemy database session

        Returns:
            List of indicator names/IDs missing required MOV files (empty list if all present)
        """
        missing_movs = []

        # Get all indicators that have file upload fields
        # We need to check the form_schema for each indicator to determine
        # if it requires file uploads
        responses = db.query(AssessmentResponse).filter_by(
            assessment_id=assessment_id
        ).all()

        for response in responses:
            # Get the indicator
            indicator = db.query(Indicator).filter_by(id=response.indicator_id).first()
            if not indicator:
                continue

            # Check if this indicator's form schema has file upload fields
            if self._has_file_upload_fields(indicator.form_schema):
                # Check if there are MOVFiles for this indicator
                mov_count = db.query(MOVFile).filter(
                    MOVFile.assessment_id == assessment_id,
                    MOVFile.indicator_id == indicator.id,
                    MOVFile.deleted_at.is_(None)  # Only count non-deleted files
                ).count()

                if mov_count == 0:
                    missing_movs.append(indicator.name)

        return missing_movs

    def _has_file_upload_fields(self, form_schema: dict) -> bool:
        """
        Check if a form schema has any file upload fields.

        Args:
            form_schema: The form schema dictionary

        Returns:
            True if the schema has file upload fields, False otherwise
        """
        if not form_schema or "fields" not in form_schema:
            return False

        for field in form_schema.get("fields", []):
            field_type = field.get("field_type") or field.get("type")
            if field_type == "file_upload":
                return True

        return False


# Singleton instance for use across the application
submission_validation_service = SubmissionValidationService()
