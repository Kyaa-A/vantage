# 📧 Notification Worker
# Background tasks for handling notifications

import logging
from typing import Any, Dict, List
from datetime import datetime

from app.core.celery_app import celery_app
from app.db.base import SessionLocal
from app.db.models import Assessment, User
from app.db.models.admin import DeadlineOverride
from app.db.models.barangay import Barangay
from app.db.models.governance_area import Indicator
from sqlalchemy.orm import Session

# Configure logging
logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="notifications.send_rework_notification")
def send_rework_notification(self: Any, assessment_id: int) -> Dict[str, Any]:
    """
    Send notification to BLGU user when assessment needs rework.

    This is a Celery task that runs in the background to handle
    rework notifications without blocking the main API thread.

    Args:
        assessment_id: ID of the assessment that needs rework

    Returns:
        dict: Result of the notification process
    """
    db: Session = SessionLocal()

    try:
        # Get the assessment with BLGU user details
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()

        if not assessment:
            logger.error("Assessment %s not found", assessment_id)
            return {"success": False, "error": "Assessment not found"}

        # Get BLGU user details
        blgu_user = db.query(User).filter(User.id == assessment.blgu_user_id).first()

        if not blgu_user:
            logger.error(
                "BLGU user %s not found for assessment %s",
                assessment.blgu_user_id,
                assessment_id,
            )
            return {"success": False, "error": "BLGU user not found"}

        # Log the notification (for now, email integration will come later)
        logger.info(
            "REWORK NOTIFICATION: Assessment %s needs rework. BLGU User: %s (%s)",
            assessment_id,
            blgu_user.name,
            blgu_user.email,
        )

        # TODO: In the future, this is where we would:
        # 1. Send email notification to BLGU user
        # 2. Send SMS notification if configured
        # 3. Create in-app notification
        # 4. Send webhook notification to external systems

        # For now, we'll just log the notification details
        notification_details = {
            "assessment_id": assessment_id,
            "blgu_user_name": blgu_user.name,
            "blgu_user_email": blgu_user.email,
            "barangay": blgu_user.barangay.name if blgu_user.barangay else "Unknown",
            "assessment_status": assessment.status,
            "rework_count": assessment.rework_count,
            "message": f"Your assessment for {blgu_user.barangay.name if blgu_user.barangay else 'your barangay'} needs rework. Please review the assessor feedback and resubmit.",
        }

        logger.info("Notification details: %s", notification_details)

        return {
            "success": True,
            "message": "Rework notification sent successfully",
            "notification_details": notification_details,
        }

    except Exception as e:
        logger.error(
            "Error sending rework notification for assessment %s: %s",
            assessment_id,
            str(e),
        )
        return {"success": False, "error": str(e)}

    finally:
        db.close()


@celery_app.task(bind=True, name="notifications.send_validation_complete_notification")
def send_validation_complete_notification(
    self: Any, assessment_id: int
) -> Dict[str, Any]:
    """
    Send notification to BLGU user when assessment validation is complete.

    This is a Celery task that runs in the background to handle
    validation complete notifications without blocking the main API thread.

    Args:
        assessment_id: ID of the validated assessment

    Returns:
        dict: Result of the notification process
    """
    db: Session = SessionLocal()

    try:
        # Get the assessment with BLGU user details
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()

        if not assessment:
            logger.error("Assessment %s not found", assessment_id)
            return {"success": False, "error": "Assessment not found"}

        # Get BLGU user details
        blgu_user = db.query(User).filter(User.id == assessment.blgu_user_id).first()

        if not blgu_user:
            logger.error(
                "BLGU user %s not found for assessment %s",
                assessment.blgu_user_id,
                assessment_id,
            )
            return {"success": False, "error": "BLGU user not found"}

        # Log the notification
        logger.info(
            "VALIDATION COMPLETE NOTIFICATION: Assessment %s has been validated. BLGU User: %s (%s)",
            assessment_id,
            blgu_user.name,
            blgu_user.email,
        )

        # TODO: In the future, this is where we would send actual notifications

        notification_details = {
            "assessment_id": assessment_id,
            "blgu_user_name": blgu_user.name,
            "blgu_user_email": blgu_user.email,
            "barangay": blgu_user.barangay.name if blgu_user.barangay else "Unknown",
            "assessment_status": assessment.status,
            "message": f"Congratulations! Your assessment for {blgu_user.barangay.name if blgu_user.barangay else 'your barangay'} has been validated and is now complete.",
        }

        logger.info(
            "Validation complete notification details: %s", notification_details
        )

        return {
            "success": True,
            "message": "Validation complete notification sent successfully",
            "notification_details": notification_details,
        }

    except Exception as e:
        logger.error(
            "Error sending validation complete notification for assessment %s: %s",
            assessment_id,
            str(e),
        )
        return {"success": False, "error": str(e)}

    finally:
        db.close()


@celery_app.task(bind=True, name="notifications.send_deadline_extension_notification")
def send_deadline_extension_notification(
    self: Any,
    barangay_id: int,
    indicator_ids: List[int],
    new_deadline: str,
    reason: str,
    created_by_user_id: int,
    db: Session | None = None,
) -> Dict[str, Any]:
    """
    Send notification to BLGU users when deadline is extended.

    This is a Celery task that runs in the background to handle
    deadline extension notifications without blocking the main API thread.

    Args:
        barangay_id: ID of the barangay receiving the extension
        indicator_ids: List of indicator IDs with extended deadlines
        new_deadline: New deadline datetime (ISO format string)
        reason: Reason for the deadline extension
        created_by_user_id: ID of the admin who created the extension
        db: Optional database session (primarily for testing)

    Returns:
        dict: Result of the notification process
    """
    # Use provided session or create new one
    db_provided = db is not None
    if not db_provided:
        db = SessionLocal()

    try:
        # Get the barangay
        barangay = db.query(Barangay).filter(Barangay.id == barangay_id).first()

        if not barangay:
            logger.error("Barangay %s not found", barangay_id)
            return {"success": False, "error": "Barangay not found"}

        # Get the indicators
        indicators = db.query(Indicator).filter(Indicator.id.in_(indicator_ids)).all()

        if not indicators:
            logger.error("No indicators found for IDs: %s", indicator_ids)
            return {"success": False, "error": "Indicators not found"}

        # Get BLGU users for this barangay
        blgu_users = db.query(User).filter(
            User.barangay_id == barangay_id, User.role == "BLGU_USER", User.is_active == True
        ).all()

        if not blgu_users:
            logger.warning(
                "No BLGU users found for barangay %s. No notifications sent.",
                barangay_id,
            )
            return {
                "success": True,
                "message": "No BLGU users to notify",
                "barangay": barangay.name,
            }

        # Get the admin user who created the extension
        admin_user = db.query(User).filter(User.id == created_by_user_id).first()
        admin_name = admin_user.name if admin_user else "System Administrator"

        # Format the deadline for display
        deadline_dt = datetime.fromisoformat(new_deadline.replace("Z", "+00:00"))
        formatted_deadline = deadline_dt.strftime("%B %d, %Y at %I:%M %p")

        # Get indicator names
        indicator_names = [ind.name for ind in indicators]

        # Log the notification
        logger.info(
            "DEADLINE EXTENSION NOTIFICATION: Barangay %s (%s) - %d indicators extended to %s",
            barangay.name,
            barangay_id,
            len(indicators),
            formatted_deadline,
        )

        # TODO: In the future, this is where we would:
        # 1. Send email notification to BLGU users
        # 2. Send SMS notification if configured
        # 3. Create in-app notification
        # 4. Send webhook notification to external systems

        # For now, we'll just log the notification details
        notification_details = {
            "barangay_id": barangay_id,
            "barangay_name": barangay.name,
            "indicator_count": len(indicators),
            "indicator_names": indicator_names,
            "new_deadline": formatted_deadline,
            "reason": reason,
            "granted_by": admin_name,
            "blgu_users_notified": [
                {"name": user.name, "email": user.email} for user in blgu_users
            ],
            "message": f"Good news! The deadline for {len(indicators)} indicator(s) in {barangay.name} has been extended to {formatted_deadline}. Reason: {reason}",
        }

        logger.info("Deadline extension notification details: %s", notification_details)

        return {
            "success": True,
            "message": f"Deadline extension notification sent successfully to {len(blgu_users)} BLGU user(s)",
            "notification_details": notification_details,
        }

    except Exception as e:
        logger.error(
            "Error sending deadline extension notification for barangay %s: %s",
            barangay_id,
            str(e),
        )
        return {"success": False, "error": str(e)}

    finally:
        # Only close the session if we created it (not provided for testing)
        if not db_provided:
            db.close()
