# 🔒 Administrative Features Schemas
# Pydantic models for admin-specific API requests and responses

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


# ============================================================================
# Audit Log Schemas
# ============================================================================


class AuditLogBase(BaseModel):
    """Base audit log schema with common fields."""

    entity_type: str = Field(..., description="Type of entity (indicator, bbi, deadline_override, etc.)")
    entity_id: Optional[int] = Field(None, description="ID of the entity (null for bulk operations)")
    action: str = Field(..., description="Action performed (create, update, delete, deactivate)")
    changes: Optional[Dict[str, Any]] = Field(None, description="JSON diff of changes")


class AuditLogCreate(AuditLogBase):
    """Schema for creating an audit log entry (internal use)."""

    user_id: int
    ip_address: Optional[str] = None


class AuditLogResponse(AuditLogBase):
    """Schema for audit log API responses."""

    id: int
    user_id: int
    ip_address: Optional[str]
    created_at: datetime

    # User details (will be joined from User table)
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    """Schema for paginated audit log list."""

    items: list[AuditLogResponse]
    total: int
    skip: int
    limit: int


class AuditLogFilters(BaseModel):
    """Schema for audit log filtering parameters."""

    user_id: Optional[int] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    action: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    skip: int = 0
    limit: int = 100


# ============================================================================
# JSON Diff Schemas
# ============================================================================


class JsonDiffItem(BaseModel):
    """Schema for a single field change in JSON diff."""

    before: Optional[Any] = None
    after: Optional[Any] = None


class JsonDiff(BaseModel):
    """Schema for JSON diff (field-level changes)."""

    changes: Dict[str, JsonDiffItem]


# ============================================================================
# Generic Admin Response Schemas
# ============================================================================


class AdminSuccessResponse(BaseModel):
    """Success response for admin operations."""

    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None


class AdminErrorResponse(BaseModel):
    """Error response for admin operations."""

    success: bool = False
    error: str
    detail: Optional[str] = None
