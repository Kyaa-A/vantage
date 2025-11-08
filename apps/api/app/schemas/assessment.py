# 📋 Assessment Schemas
# Pydantic models for assessment-related API requests and responses

from datetime import datetime
from typing import Any, Dict, List, Optional

from app.db.enums import AssessmentStatus, ComplianceStatus, MOVStatus
from pydantic import BaseModel, ConfigDict

# ============================================================================
# Indicator Schemas
# ============================================================================


class Indicator(BaseModel):
    """Indicator response model for API endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    form_schema: Dict[str, Any]
    governance_area_id: int


class IndicatorRead(BaseModel):
    """Recursive indicator schema including nested children."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    form_schema: Dict[str, Any]
    governance_area_id: int
    children: List["IndicatorRead"] = []


# ============================================================================
# Assessment Schemas
# ============================================================================


class Assessment(BaseModel):
    """Assessment response model for API endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    status: AssessmentStatus
    blgu_user_id: int
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None
    validated_at: Optional[datetime] = None
    final_compliance_status: Optional[ComplianceStatus] = None
    area_results: Optional[Dict[str, Any]] = None
    ai_recommendations: Optional[Dict[str, Any]] = None


class AssessmentCreate(BaseModel):
    """Schema for creating a new assessment."""

    blgu_user_id: int


class AssessmentUpdate(BaseModel):
    """Schema for updating assessment information."""

    status: Optional[AssessmentStatus] = None


class AssessmentWithResponses(Assessment):
    """Assessment model including all responses."""

    responses: List["AssessmentResponse"] = []


# ============================================================================
# Assessment Response Schemas
# ============================================================================


class AssessmentResponse(BaseModel):
    """AssessmentResponse response model for API endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    response_data: Optional[Dict[str, Any]] = None
    is_completed: bool
    requires_rework: bool
    assessment_id: int
    indicator_id: int
    created_at: datetime
    updated_at: datetime


class AssessmentResponseCreate(BaseModel):
    """Schema for creating a new assessment response."""

    response_data: Optional[Dict[str, Any]] = None
    assessment_id: int
    indicator_id: int


class AssessmentResponseUpdate(BaseModel):
    """Schema for updating assessment response data."""

    response_data: Optional[Dict[str, Any]] = None
    is_completed: Optional[bool] = None
    requires_rework: Optional[bool] = None


class AssessmentResponseWithDetails(AssessmentResponse):
    """AssessmentResponse model including related data."""

    indicator: Optional[Indicator] = None
    movs: List["MOV"] = []
    feedback_comments: List["FeedbackComment"] = []


# ============================================================================
# MOV Schemas
# ============================================================================


class MOV(BaseModel):
    """MOV (Means of Verification) response model for API endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    original_filename: str
    file_size: int
    content_type: str
    storage_path: str
    status: MOVStatus
    response_id: int
    uploaded_at: datetime


class MOVCreate(BaseModel):
    """Schema for creating a new MOV."""

    filename: str
    original_filename: str
    file_size: int
    content_type: str
    storage_path: str
    response_id: int


class MOVUpdate(BaseModel):
    """Schema for updating MOV information."""

    status: Optional[MOVStatus] = None


# ============================================================================
# Feedback Comment Schemas
# ============================================================================


class FeedbackComment(BaseModel):
    """FeedbackComment response model for API endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    comment: str
    comment_type: str
    response_id: int
    assessor_id: int
    created_at: datetime


class FeedbackCommentCreate(BaseModel):
    """Schema for creating a new feedback comment."""

    comment: str
    comment_type: str = "general"
    response_id: int
    assessor_id: int


class FeedbackCommentUpdate(BaseModel):
    """Schema for updating feedback comment."""

    comment: Optional[str] = None
    comment_type: Optional[str] = None


# ============================================================================
# Comprehensive Assessment Schemas
# ============================================================================


class AssessmentWithIndicators(BaseModel):
    """Complete assessment data including all governance areas and indicators."""

    model_config = ConfigDict(from_attributes=True)

    assessment: Assessment
    governance_areas: List[Dict[str, Any]]  # Will include indicators and responses


class IndicatorWithResponse(BaseModel):
    """Indicator with its corresponding response data."""

    model_config = ConfigDict(from_attributes=True)

    indicator: Indicator
    response: Optional[AssessmentResponse] = None
    movs: List[MOV] = []
    feedback_comments: List[FeedbackComment] = []


class GovernanceAreaWithIndicators(BaseModel):
    """Governance area with all its indicators and responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    area_type: str
    indicators: List[IndicatorWithResponse] = []


# ============================================================================
# API Response Schemas
# ============================================================================


class AssessmentListResponse(BaseModel):
    """Schema for paginated assessment list response."""

    model_config = ConfigDict(from_attributes=True)

    assessments: List[Assessment]
    total: int
    page: int
    size: int
    total_pages: int


class AssessmentResponseListResponse(BaseModel):
    """Schema for paginated assessment response list response."""

    model_config = ConfigDict(from_attributes=True)

    responses: List[AssessmentResponseWithDetails]
    total: int
    page: int
    size: int
    total_pages: int


class MOVListResponse(BaseModel):
    """Schema for paginated MOV list response."""

    model_config = ConfigDict(from_attributes=True)

    movs: List[MOV]
    total: int
    page: int
    size: int
    total_pages: int


class FeedbackCommentListResponse(BaseModel):
    """Schema for paginated feedback comment list response."""

    model_config = ConfigDict(from_attributes=True)

    comments: List[FeedbackComment]
    total: int
    page: int
    size: int
    total_pages: int


# ============================================================================
# Validation Schemas
# ============================================================================


class AssessmentSubmissionValidation(BaseModel):
    """Schema for assessment submission validation response."""

    is_valid: bool
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []


class FormSchemaValidation(BaseModel):
    """Schema for form schema validation."""

    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []


# ============================================================================
# Dashboard Schemas
# ============================================================================


class GovernanceAreaProgress(BaseModel):
    """Progress summary for a governance area."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    area_type: str
    total_indicators: int
    completed_indicators: int
    completion_percentage: float
    requires_rework_count: int


class ProgressSummary(BaseModel):
    """Progress summary with current, total, and percentage."""

    model_config = ConfigDict(from_attributes=True)

    current: int
    total: int
    percentage: float


class AssessmentDashboardStats(BaseModel):
    """Dashboard statistics for assessment progress."""

    model_config = ConfigDict(from_attributes=True)

    # Overall progress
    total_indicators: int
    completed_indicators: int
    completion_percentage: float

    # Progress object
    progress: ProgressSummary

    # Status breakdown
    responses_requiring_rework: int
    responses_with_feedback: int
    responses_with_movs: int

    # Governance area progress
    governance_areas: List[GovernanceAreaProgress]

    # Assessment metadata
    assessment_status: AssessmentStatus
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None


class AssessmentDashboardResponse(BaseModel):
    """Complete dashboard response for assessment overview."""

    model_config = ConfigDict(from_attributes=True)

    assessment_id: int
    blgu_user_id: int
    barangay_name: str
    performance_year: int
    assessment_year: int
    stats: AssessmentDashboardStats
    feedback: List[
        Dict[str, Any]
    ] = []  # Enhanced feedback array with assessor comments
    upcoming_deadlines: List[Dict[str, Any]] = []  # Any upcoming deadlines


# ============================================================================
# Dynamic Form Response Schemas (Epic 3.0)
# ============================================================================


class FieldAnswerInput(BaseModel):
    """Input schema for a single field answer."""

    field_id: str
    value: Any  # Can be str, int, bool, list, etc.


class SaveAnswersRequest(BaseModel):
    """Request schema for saving form answers."""

    responses: List[FieldAnswerInput]


class SaveAnswersResponse(BaseModel):
    """Response schema for save answers endpoint."""

    message: str
    assessment_id: int
    indicator_id: int
    saved_count: int


class AnswerResponse(BaseModel):
    """Response schema for a single field answer."""

    field_id: str
    value: Any


class GetAnswersResponse(BaseModel):
    """Response schema for retrieving saved answers."""

    assessment_id: int
    indicator_id: int
    responses: List[AnswerResponse]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class IncompleteIndicatorDetail(BaseModel):
    """Nested schema for incomplete indicator details."""

    indicator_id: int
    indicator_title: str
    missing_required_fields: List[str]


class CompletenessValidationResponse(BaseModel):
    """Response schema for completeness validation endpoint."""

    is_complete: bool
    total_indicators: int
    complete_indicators: int
    incomplete_indicators: int
    incomplete_details: List[IncompleteIndicatorDetail]


# ============================================================================
# Update forward references for nested models
# ============================================================================

AssessmentWithResponses.model_rebuild()
AssessmentResponseWithDetails.model_rebuild()
IndicatorWithResponse.model_rebuild()
IndicatorRead.model_rebuild()
