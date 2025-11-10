# 📊 Indicator Schemas
# Pydantic models for indicator-related API requests and responses

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.form_schema import FormSchema


class GovernanceAreaNested(BaseModel):
    """Nested governance area for indicator responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    area_type: str


class IndicatorBase(BaseModel):
    """Base indicator schema with common fields."""

    name: str = Field(..., min_length=3, description="Indicator name (min 3 characters)")
    description: Optional[str] = Field(None, description="Indicator description")
    governance_area_id: int = Field(..., description="ID of governance area")
    parent_id: Optional[int] = Field(None, description="Parent indicator ID for hierarchical structure")
    is_active: bool = Field(True, description="Active status")
    is_profiling_only: bool = Field(False, description="Profiling-only flag")
    is_auto_calculable: bool = Field(False, description="Auto-calculable Pass/Fail flag")
    technical_notes_text: Optional[str] = Field(None, description="Technical notes (plain text)")


class IndicatorCreate(IndicatorBase):
    """Schema for creating a new indicator."""

    form_schema: Optional[FormSchema] = Field(None, description="Form schema with validated field types")
    calculation_schema: Optional[Dict[str, Any]] = Field(None, description="Calculation schema (JSON)")
    remark_schema: Optional[Dict[str, Any]] = Field(None, description="Remark schema (JSON)")


class IndicatorUpdate(BaseModel):
    """Schema for updating an indicator (all fields optional)."""

    name: Optional[str] = Field(None, min_length=3)
    description: Optional[str] = None
    governance_area_id: Optional[int] = None
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_profiling_only: Optional[bool] = None
    is_auto_calculable: Optional[bool] = None
    form_schema: Optional[FormSchema] = Field(None, description="Form schema with validated field types")
    calculation_schema: Optional[Dict[str, Any]] = None
    remark_schema: Optional[Dict[str, Any]] = None
    technical_notes_text: Optional[str] = None


class IndicatorNestedParent(BaseModel):
    """Nested parent indicator (minimal to avoid circular references)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    version: int


class IndicatorResponse(BaseModel):
    """Response schema for indicator endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    version: int
    is_active: bool
    is_profiling_only: bool
    is_auto_calculable: bool
    form_schema: Optional[Dict[str, Any]] = Field(None, description="Form schema (JSON)")
    calculation_schema: Optional[Dict[str, Any]] = None
    remark_schema: Optional[Dict[str, Any]] = None
    technical_notes_text: Optional[str] = None
    governance_area_id: int
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    # Nested relationships
    governance_area: Optional[GovernanceAreaNested] = None
    parent: Optional[IndicatorNestedParent] = None


class UserNested(BaseModel):
    """Nested user for history responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str


class IndicatorHistoryResponse(BaseModel):
    """Response schema for indicator version history."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    indicator_id: int
    version: int
    name: str
    description: Optional[str] = None
    is_active: bool
    is_auto_calculable: bool
    is_profiling_only: bool
    form_schema: Optional[Dict[str, Any]] = Field(None, description="Form schema (JSON)")
    calculation_schema: Optional[Dict[str, Any]] = None
    remark_schema: Optional[Dict[str, Any]] = None
    technical_notes_text: Optional[str] = None
    governance_area_id: int
    parent_id: Optional[int] = None
    archived_at: datetime
    archived_by: Optional[int] = None

    # Nested relationships
    archived_by_user: Optional[UserNested] = None


# =============================================================================
# Bulk Creation Schemas (Phase 6: Hierarchical Indicator Creation)
# =============================================================================


class IndicatorCreateWithOrder(IndicatorCreate):
    """Schema for creating an indicator with ordering information for bulk operations."""

    temp_id: str = Field(..., description="Temporary client-side UUID for this indicator")
    parent_temp_id: Optional[str] = Field(
        None, description="Temporary ID of parent indicator (for hierarchy)"
    )
    order: int = Field(..., description="Display order within parent")


class BulkIndicatorCreate(BaseModel):
    """Schema for bulk creating multiple indicators in a hierarchy."""

    governance_area_id: int = Field(..., description="Governance area for all indicators")
    indicators: List[IndicatorCreateWithOrder] = Field(
        ..., description="List of indicators to create"
    )


class BulkCreateError(BaseModel):
    """Schema for bulk creation errors."""

    temp_id: str = Field(..., description="Temporary ID of the failed indicator")
    error: str = Field(..., description="Error message")


class BulkIndicatorResponse(BaseModel):
    """Response schema for bulk indicator creation."""

    created: List[IndicatorResponse] = Field(..., description="Successfully created indicators")
    temp_id_mapping: Dict[str, int] = Field(
        ..., description="Map of temp_id to real database ID"
    )
    errors: List[BulkCreateError] = Field(
        default_factory=list, description="List of errors encountered"
    )


class ReorderRequest(BaseModel):
    """Schema for reordering indicators."""

    indicators: List[Dict[str, Any]] = Field(
        ..., description="List of indicator updates with id, code, parent_id"
    )


# =============================================================================
# Indicator Draft Schemas (Phase 6: Draft Auto-Save)
# =============================================================================


class IndicatorDraftCreate(BaseModel):
    """Schema for creating a new indicator draft."""

    governance_area_id: int = Field(..., description="Governance area ID")
    creation_mode: str = Field(..., description="Creation mode (e.g., 'incremental', 'bulk_import')")
    title: Optional[str] = Field(None, max_length=200, description="Optional draft title")
    data: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list, description="Draft indicator data"
    )


class IndicatorDraftUpdate(BaseModel):
    """Schema for updating an existing indicator draft."""

    current_step: Optional[int] = Field(None, description="Current wizard step")
    status: Optional[str] = Field(None, description="Draft status")
    data: Optional[List[Dict[str, Any]]] = Field(None, description="Draft indicator data")
    title: Optional[str] = Field(None, max_length=200, description="Draft title")
    version: int = Field(..., description="Version number for optimistic locking")


class IndicatorDraftResponse(BaseModel):
    """Response schema for indicator draft endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: int
    governance_area_id: int
    creation_mode: str
    current_step: int
    status: str
    data: List[Dict[str, Any]]
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_accessed_at: datetime
    version: int
    lock_token: Optional[UUID] = None
    locked_by_user_id: Optional[int] = None
    locked_at: Optional[datetime] = None

    # Nested relationships
    governance_area: Optional[GovernanceAreaNested] = None


class IndicatorDraftSummary(BaseModel):
    """Summary schema for listing indicator drafts."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    governance_area_id: int
    creation_mode: str
    current_step: int
    status: str
    title: Optional[str] = None
    updated_at: datetime
    last_accessed_at: datetime

    # Nested relationships
    governance_area: Optional[GovernanceAreaNested] = None


class IndicatorDraftDeltaUpdate(BaseModel):
    """Schema for delta-based draft update (only changed indicators)."""

    changed_indicators: List[Dict[str, Any]] = Field(
        ..., description="List of changed indicator dictionaries"
    )
    changed_ids: List[str] = Field(..., description="List of temp_ids for changed indicators")
    version: int = Field(..., description="Version number for optimistic locking")
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional metadata (current_step, status, title, etc.)",
    )
