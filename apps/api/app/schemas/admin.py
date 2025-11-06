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


# ============================================================================
# Assessment Cycle Schemas
# ============================================================================


class AssessmentCycleBase(BaseModel):
    """Base assessment cycle schema with common fields."""

    name: str = Field(..., description="Cycle name (e.g., 'SGLGB 2025')")
    year: int = Field(..., description="Assessment year")
    phase1_deadline: datetime = Field(..., description="Initial submission deadline")
    rework_deadline: datetime = Field(..., description="Rework submission deadline")
    phase2_deadline: datetime = Field(..., description="Final submission deadline")
    calibration_deadline: datetime = Field(..., description="Calibration/validation deadline")


class AssessmentCycleCreate(AssessmentCycleBase):
    """Schema for creating a new assessment cycle."""
    pass


class AssessmentCycleUpdate(BaseModel):
    """Schema for updating an assessment cycle (all fields optional)."""

    name: Optional[str] = Field(None, description="Cycle name")
    year: Optional[int] = Field(None, description="Assessment year")
    phase1_deadline: Optional[datetime] = Field(None, description="Initial submission deadline")
    rework_deadline: Optional[datetime] = Field(None, description="Rework submission deadline")
    phase2_deadline: Optional[datetime] = Field(None, description="Final submission deadline")
    calibration_deadline: Optional[datetime] = Field(None, description="Calibration/validation deadline")


class AssessmentCycleResponse(AssessmentCycleBase):
    """Schema for assessment cycle API responses."""

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssessmentCycleListResponse(BaseModel):
    """Schema for list of assessment cycles."""

    items: list[AssessmentCycleResponse]
    total: int


# ============================================================================
# Deadline Override Schemas
# ============================================================================


class DeadlineOverrideBase(BaseModel):
    """Base deadline override schema with common fields."""

    new_deadline: datetime = Field(..., description="Extended deadline (must be in future)")
    reason: str = Field(..., min_length=10, description="Justification for extension (minimum 10 characters)")


class DeadlineOverrideCreate(DeadlineOverrideBase):
    """Schema for creating a deadline override."""

    cycle_id: int = Field(..., description="ID of the assessment cycle")
    barangay_id: int = Field(..., description="ID of the barangay")
    indicator_id: int = Field(..., description="ID of the indicator")


class DeadlineOverrideResponse(DeadlineOverrideBase):
    """Schema for deadline override API responses."""

    id: int
    cycle_id: int
    barangay_id: int
    indicator_id: int
    created_by: int
    original_deadline: datetime
    created_at: datetime

    # Related entity details (will be joined)
    cycle_name: Optional[str] = None
    barangay_name: Optional[str] = None
    indicator_name: Optional[str] = None
    creator_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DeadlineOverrideListResponse(BaseModel):
    """Schema for list of deadline overrides."""

    items: list[DeadlineOverrideResponse]
    total: int


class DeadlineOverrideFilters(BaseModel):
    """Schema for deadline override filtering parameters."""

    cycle_id: Optional[int] = None
    barangay_id: Optional[int] = None
    indicator_id: Optional[int] = None


# ============================================================================
# Deadline Status Schemas
# ============================================================================


class PhaseStatusResponse(BaseModel):
    """Schema for a single phase's deadline status."""

    status: str = Field(..., description="Status: submitted_on_time, submitted_late, pending, or overdue")
    deadline: str = Field(..., description="Deadline in ISO format")
    submitted_at: Optional[str] = Field(None, description="Submission timestamp in ISO format (if submitted)")


class BarangayDeadlineStatusResponse(BaseModel):
    """Schema for a barangay's deadline status across all phases."""

    barangay_id: int
    barangay_name: str
    cycle_id: int
    cycle_name: str
    phase1: PhaseStatusResponse
    rework: PhaseStatusResponse
    phase2: PhaseStatusResponse
    calibration: PhaseStatusResponse


class DeadlineStatusListResponse(BaseModel):
    """Schema for list of barangay deadline statuses."""

    items: list[BarangayDeadlineStatusResponse]
    total: int
