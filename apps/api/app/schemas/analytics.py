# 📊 Analytics Schemas
# Pydantic models for analytics and dashboard-related API requests and responses

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

# ============================================================================
# Dashboard KPI Schemas
# ============================================================================


class ComplianceRate(BaseModel):
    """Overall compliance rate statistics."""

    model_config = ConfigDict(from_attributes=True)

    total_barangays: int = Field(..., description="Total number of barangays assessed")
    passed: int = Field(..., description="Number of barangays that passed")
    failed: int = Field(..., description="Number of barangays that failed")
    pass_percentage: float = Field(..., description="Percentage of barangays that passed", ge=0, le=100)


class AreaBreakdown(BaseModel):
    """Compliance breakdown by governance area."""

    model_config = ConfigDict(from_attributes=True)

    area_code: str = Field(..., description="Governance area code")
    area_name: str = Field(..., description="Governance area name")
    passed: int = Field(..., description="Number of barangays that passed this area")
    failed: int = Field(..., description="Number of barangays that failed this area")
    percentage: float = Field(..., description="Pass percentage for this area", ge=0, le=100)


class FailedIndicator(BaseModel):
    """Indicator with high failure rate."""

    model_config = ConfigDict(from_attributes=True)

    indicator_id: int = Field(..., description="Unique identifier for the indicator")
    indicator_name: str = Field(..., description="Name of the indicator")
    failure_count: int = Field(..., description="Number of times this indicator failed")
    percentage: float = Field(..., description="Failure rate as percentage", ge=0, le=100)


class BarangayRanking(BaseModel):
    """Barangay ranking based on compliance score."""

    model_config = ConfigDict(from_attributes=True)

    barangay_id: int = Field(..., description="Unique identifier for the barangay")
    barangay_name: str = Field(..., description="Name of the barangay")
    score: float = Field(..., description="Compliance score (0-100)", ge=0, le=100)
    rank: int = Field(..., description="Ranking position", ge=1)


class TrendData(BaseModel):
    """Historical trend data for a cycle."""

    model_config = ConfigDict(from_attributes=True)

    cycle_id: int = Field(..., description="Assessment cycle identifier")
    cycle_name: str = Field(..., description="Name of the assessment cycle")
    pass_rate: float = Field(..., description="Pass rate for this cycle", ge=0, le=100)
    date: datetime = Field(..., description="Date of the cycle")


class DashboardKPIResponse(BaseModel):
    """Complete dashboard KPI response containing all metrics."""

    model_config = ConfigDict(from_attributes=True)

    overall_compliance_rate: ComplianceRate = Field(..., description="Overall pass/fail statistics")
    completion_status: ComplianceRate = Field(..., description="Completion status of assessments")
    area_breakdown: List[AreaBreakdown] = Field(
        default_factory=list,
        description="Compliance breakdown by governance area"
    )
    top_failed_indicators: List[FailedIndicator] = Field(
        default_factory=list,
        description="Top 5 most frequently failed indicators",
        max_length=5
    )
    barangay_rankings: List[BarangayRanking] = Field(
        default_factory=list,
        description="Barangays ranked by compliance score"
    )
    trends: List[TrendData] = Field(
        default_factory=list,
        description="Historical trend data across cycles",
        max_length=3
    )
