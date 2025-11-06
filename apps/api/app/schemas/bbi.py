# 🏛️ BBI Schemas
# Pydantic models for BBI-related API requests and responses

from datetime import datetime
from typing import Any, Dict, List, Optional

from app.db.enums import BBIStatus
from pydantic import BaseModel, ConfigDict, Field


# ============================================================================
# BBI Schemas
# ============================================================================


class BBIBase(BaseModel):
    """Base BBI schema with common fields."""

    name: str = Field(..., description="BBI name")
    abbreviation: str = Field(..., description="BBI abbreviation")
    description: Optional[str] = Field(None, description="BBI description")
    governance_area_id: int = Field(..., description="ID of the governance area")


class BBICreate(BBIBase):
    """Schema for creating a new BBI."""

    mapping_rules: Optional[Dict[str, Any]] = Field(
        None,
        description="JSON mapping rules for BBI functionality calculation",
    )


class BBIUpdate(BaseModel):
    """Schema for updating BBI information."""

    name: Optional[str] = Field(None, description="BBI name")
    abbreviation: Optional[str] = Field(None, description="BBI abbreviation")
    description: Optional[str] = Field(None, description="BBI description")
    mapping_rules: Optional[Dict[str, Any]] = Field(
        None,
        description="JSON mapping rules for BBI functionality calculation",
    )


class BBIResponse(BBIBase):
    """BBI response model for API endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    mapping_rules: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class BBIWithGovernanceArea(BBIResponse):
    """BBI response with nested governance area information."""

    governance_area: "GovernanceAreaSummary"


# ============================================================================
# BBI Result Schemas
# ============================================================================


class BBIResultBase(BaseModel):
    """Base BBI result schema with common fields."""

    bbi_id: int = Field(..., description="BBI ID")
    assessment_id: int = Field(..., description="Assessment ID")
    status: BBIStatus = Field(..., description="BBI status (Functional/Non-Functional)")


class BBIResultResponse(BBIResultBase):
    """BBI result response model for API endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    calculation_details: Optional[Dict[str, Any]] = None
    calculation_date: datetime


class BBIResultWithBBI(BBIResultResponse):
    """BBI result with nested BBI information."""

    bbi: BBIResponse


# ============================================================================
# Supporting Schemas
# ============================================================================


class GovernanceAreaSummary(BaseModel):
    """Summary of governance area for nested relationships."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


# ============================================================================
# Test Calculation Schemas
# ============================================================================


class TestBBICalculationRequest(BaseModel):
    """Request schema for testing BBI calculation logic."""

    mapping_rules: Dict[str, Any] = Field(
        ...,
        description="Mapping rules to test",
    )
    indicator_statuses: Dict[int, str] = Field(
        ...,
        description="Sample indicator statuses (indicator_id -> Pass/Fail)",
    )


class TestBBICalculationResponse(BaseModel):
    """Response schema for BBI calculation test."""

    predicted_status: BBIStatus = Field(
        ...,
        description="Predicted BBI status based on test inputs",
    )
    evaluation_details: Dict[str, Any] = Field(
        ...,
        description="Details of how the calculation was performed",
    )
