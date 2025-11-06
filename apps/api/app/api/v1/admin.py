# 🔒 Admin API Routes
# Administrative endpoints for MLGOO-DILG users (audit logs, system configuration)

from datetime import datetime
from typing import Optional

from app.api.deps import get_client_ip, get_db, require_mlgoo_dilg
from app.db.models.user import User
from app.schemas.admin import (
    AdminSuccessResponse,
    AuditLogListResponse,
    AuditLogResponse,
)
from app.services.audit_service import audit_service
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

router = APIRouter()


# ============================================================================
# Audit Log Endpoints
# ============================================================================


@router.get(
    "/audit-logs",
    response_model=AuditLogListResponse,
    tags=["admin"],
    summary="Get audit logs with filtering",
    description="Retrieve audit logs with optional filtering by user, entity type, action, and date range. Requires MLGOO_DILG role.",
)
async def get_audit_logs(
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    limit: int = Query(
        100, ge=1, le=500, description="Maximum number of records to return"
    ),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    entity_type: Optional[str] = Query(
        None, description="Filter by entity type (e.g., 'indicator', 'bbi')"
    ),
    entity_id: Optional[int] = Query(None, description="Filter by entity ID"),
    action: Optional[str] = Query(
        None, description="Filter by action (e.g., 'create', 'update', 'delete')"
    ),
    start_date: Optional[datetime] = Query(None, description="Filter from date (inclusive)"),
    end_date: Optional[datetime] = Query(None, description="Filter to date (inclusive)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_mlgoo_dilg),
):
    """
    Get audit logs with optional filtering and pagination.

    **Authentication:** Requires MLGOO_DILG role.

    **Filters:**
    - `user_id`: Filter by the user who performed the action
    - `entity_type`: Filter by type of entity (indicator, bbi, deadline_override, etc.)
    - `entity_id`: Filter by specific entity ID
    - `action`: Filter by action type (create, update, delete, deactivate)
    - `start_date`: Filter from this date (inclusive)
    - `end_date`: Filter to this date (inclusive)

    **Returns:**
    - Paginated list of audit logs with user details
    - Total count of matching records
    """
    audit_logs, total = audit_service.get_audit_logs(
        db=db,
        skip=skip,
        limit=limit,
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        start_date=start_date,
        end_date=end_date,
    )

    # Enrich audit logs with user information
    enriched_logs = []
    for log in audit_logs:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "action": log.action,
            "changes": log.changes,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
            "user_email": log.user.email if log.user else None,
            "user_name": log.user.name if log.user else None,
        }
        enriched_logs.append(AuditLogResponse(**log_dict))

    return AuditLogListResponse(
        items=enriched_logs, total=total, skip=skip, limit=limit
    )


@router.get(
    "/audit-logs/{log_id}",
    response_model=AuditLogResponse,
    tags=["admin"],
    summary="Get a single audit log by ID",
    description="Retrieve details of a specific audit log entry. Requires MLGOO_DILG role.",
)
async def get_audit_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_mlgoo_dilg),
):
    """
    Get a single audit log entry by ID.

    **Authentication:** Requires MLGOO_DILG role.

    **Returns:**
    - Audit log details with user information
    """
    from fastapi import HTTPException, status

    log = audit_service.get_audit_log_by_id(db, log_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit log with ID {log_id} not found",
        )

    return AuditLogResponse(
        id=log.id,
        user_id=log.user_id,
        entity_type=log.entity_type,
        entity_id=log.entity_id,
        action=log.action,
        changes=log.changes,
        ip_address=log.ip_address,
        created_at=log.created_at,
        user_email=log.user.email if log.user else None,
        user_name=log.user.name if log.user else None,
    )


@router.get(
    "/audit-logs/entity/{entity_type}/{entity_id}",
    response_model=list[AuditLogResponse],
    tags=["admin"],
    summary="Get audit history for a specific entity",
    description="Retrieve complete audit history for a specific entity (e.g., all changes to a particular indicator). Requires MLGOO_DILG role.",
)
async def get_entity_audit_history(
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_mlgoo_dilg),
):
    """
    Get the complete audit history for a specific entity.

    **Authentication:** Requires MLGOO_DILG role.

    **Parameters:**
    - `entity_type`: Type of entity (e.g., "indicator", "bbi", "deadline_override")
    - `entity_id`: ID of the entity

    **Returns:**
    - List of all audit log entries for the entity, ordered by most recent first
    """
    logs = audit_service.get_entity_history(db, entity_type, entity_id)

    enriched_logs = []
    for log in logs:
        enriched_logs.append(
            AuditLogResponse(
                id=log.id,
                user_id=log.user_id,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                action=log.action,
                changes=log.changes,
                ip_address=log.ip_address,
                created_at=log.created_at,
                user_email=log.user.email if log.user else None,
                user_name=log.user.name if log.user else None,
            )
        )

    return enriched_logs


@router.get(
    "/audit-logs/export",
    tags=["admin"],
    summary="Export audit logs to CSV",
    description="Export filtered audit logs to CSV format. Requires MLGOO_DILG role.",
)
async def export_audit_logs_csv(
    user_id: Optional[int] = Query(None),
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_mlgoo_dilg),
):
    """
    Export audit logs to CSV with optional filtering.

    **Authentication:** Requires MLGOO_DILG role.

    **Returns:**
    - CSV file with audit log data
    """
    import csv
    import io

    from fastapi.responses import StreamingResponse

    # Get all matching audit logs (no pagination limit for export)
    audit_logs, _ = audit_service.get_audit_logs(
        db=db,
        skip=0,
        limit=10000,  # High limit for export
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        start_date=start_date,
        end_date=end_date,
    )

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow(
        [
            "ID",
            "Timestamp",
            "User ID",
            "User Email",
            "User Name",
            "Entity Type",
            "Entity ID",
            "Action",
            "IP Address",
            "Changes",
        ]
    )

    # Write data rows
    for log in audit_logs:
        writer.writerow(
            [
                log.id,
                log.created_at.isoformat(),
                log.user_id,
                log.user.email if log.user else "",
                log.user.name if log.user else "",
                log.entity_type,
                log.entity_id or "",
                log.action,
                log.ip_address or "",
                str(log.changes) if log.changes else "",
            ]
        )

    # Create response with CSV data
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        },
    )


# ============================================================================
# System Configuration Endpoints (Placeholder for future expansion)
# ============================================================================


@router.get(
    "/system/status",
    response_model=AdminSuccessResponse,
    tags=["admin"],
    summary="Get admin system status",
    description="Get system status and configuration information for admin users. Requires MLGOO_DILG role.",
)
async def get_admin_system_status(
    current_user: User = Depends(require_mlgoo_dilg),
):
    """
    Get system status and configuration information for admin users.

    **Authentication:** Requires MLGOO_DILG role.

    **Returns:**
    - System status and basic configuration info
    """
    return AdminSuccessResponse(
        success=True,
        message="Admin system status retrieved successfully",
        data={
            "admin_user": current_user.email,
            "role": current_user.role.value,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )
