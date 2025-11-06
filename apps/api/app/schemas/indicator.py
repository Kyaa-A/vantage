# 📊 Indicator Schemas
# Pydantic models for indicator-related API requests and responses

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


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

    form_schema: Optional[Dict[str, Any]] = Field(None, description="Form schema (JSON)")
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
    form_schema: Optional[Dict[str, Any]] = None
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
    form_schema: Optional[Dict[str, Any]] = None
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
    form_schema: Optional[Dict[str, Any]] = None
    calculation_schema: Optional[Dict[str, Any]] = None
    remark_schema: Optional[Dict[str, Any]] = None
    technical_notes_text: Optional[str] = None
    governance_area_id: int
    parent_id: Optional[int] = None
    archived_at: datetime
    archived_by: Optional[int] = None

    # Nested relationships
    archived_by_user: Optional[UserNested] = None
