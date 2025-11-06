# 🏛️ BBI API Routes
# Endpoints for BBI (Barangay-based Institutions) management

import math
from typing import Any, Dict, List, Optional

from app.api import deps
from app.db.models.user import User
from app.schemas.bbi import (
    BBICreate,
    BBIResponse,
    BBIResultResponse,
    BBIUpdate,
    BBIWithGovernanceArea,
    TestBBICalculationRequest,
    TestBBICalculationResponse,
)
from app.services.bbi_service import bbi_service
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter()


# ============================================================================
# Response Models
# ============================================================================


class BBIListResponse(BaseModel):
    """Response model for paginated BBI list."""

    bbis: List[BBIWithGovernanceArea]
    total: int
    page: int
    size: int
    total_pages: int


# ============================================================================
# BBI CRUD Endpoints
# ============================================================================


@router.post("/", response_model=BBIResponse, status_code=status.HTTP_201_CREATED, tags=["bbis"])
async def create_bbi(
    bbi_create: BBICreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    """
    Create a new BBI.

    Requires admin privileges (MLGOO_DILG role).

    The BBI will be created with the provided name, abbreviation, description,
    and governance area. Optionally, mapping_rules can be provided to define
    how indicator statuses map to BBI functionality status.
    """
    bbi = bbi_service.create_bbi(
        db,
        {
            "name": bbi_create.name,
            "abbreviation": bbi_create.abbreviation,
            "description": bbi_create.description,
            "governance_area_id": bbi_create.governance_area_id,
            "mapping_rules": bbi_create.mapping_rules,
        },
    )
    return bbi


@router.get("/", response_model=BBIListResponse, tags=["bbis"])
async def list_bbis(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    governance_area_id: Optional[int] = Query(
        None, description="Filter by governance area ID"
    ),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
):
    """
    Get paginated list of BBIs with optional filtering.

    Accessible by all authenticated users.

    Filters:
    - governance_area_id: Filter BBIs by governance area
    - is_active: Filter by active/inactive status
    """
    skip = (page - 1) * size

    # Get total count for pagination
    all_bbis = bbi_service.list_bbis(
        db,
        governance_area_id=governance_area_id,
        is_active=is_active,
        skip=0,
        limit=10000,  # Get all for counting
    )
    total = len(all_bbis)

    # Get paginated results
    bbis = bbi_service.list_bbis(
        db,
        governance_area_id=governance_area_id,
        is_active=is_active,
        skip=skip,
        limit=size,
    )

    total_pages = math.ceil(total / size) if total > 0 else 0

    return BBIListResponse(
        bbis=bbis, total=total, page=page, size=size, total_pages=total_pages
    )


@router.get("/{bbi_id}", response_model=BBIWithGovernanceArea, tags=["bbis"])
async def get_bbi(
    bbi_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get BBI details by ID.

    Accessible by all authenticated users.

    Returns the BBI with its full configuration including mapping_rules
    and associated governance area information.
    """
    bbi = bbi_service.get_bbi(db, bbi_id)
    if not bbi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BBI with ID {bbi_id} not found",
        )
    return bbi


@router.put("/{bbi_id}", response_model=BBIResponse, tags=["bbis"])
async def update_bbi(
    bbi_id: int,
    bbi_update: BBIUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    """
    Update a BBI.

    Requires admin privileges (MLGOO_DILG role).

    Allows updating BBI metadata (name, abbreviation, description)
    and mapping_rules configuration.
    """
    # Convert Pydantic model to dict, excluding None values
    update_data = bbi_update.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    bbi = bbi_service.update_bbi(db, bbi_id, update_data)
    return bbi


@router.delete("/{bbi_id}", response_model=BBIResponse, tags=["bbis"])
async def deactivate_bbi(
    bbi_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    """
    Deactivate a BBI (soft delete).

    Requires admin privileges (MLGOO_DILG role).

    Sets the BBI's is_active flag to False. The BBI will no longer
    be included in active BBI calculations but its data is preserved.
    """
    bbi = bbi_service.deactivate_bbi(db, bbi_id)
    return bbi


# ============================================================================
# BBI Testing & Calculation Endpoints
# ============================================================================


@router.post("/test-calculation", response_model=TestBBICalculationResponse, tags=["bbis"])
async def test_bbi_calculation(
    request: TestBBICalculationRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    """
    Test BBI calculation logic without saving to database.

    Requires admin privileges (MLGOO_DILG role).

    This endpoint allows testing mapping_rules against sample indicator
    statuses to preview the resulting BBI status (Functional/Non-Functional)
    before saving the configuration.

    Request body:
    - mapping_rules: The mapping rules configuration to test
    - indicator_statuses: Sample indicator statuses (indicator_id -> "Pass"/"Fail")

    Returns:
    - predicted_status: The calculated BBI status
    - evaluation_details: Details of how the calculation was performed
    """
    try:
        # Use the service's evaluation method
        is_functional = bbi_service._evaluate_mapping_rules(
            request.mapping_rules, request.indicator_statuses
        )

        from app.db.enums import BBIStatus

        predicted_status = (
            BBIStatus.FUNCTIONAL if is_functional else BBIStatus.NON_FUNCTIONAL
        )

        # Build evaluation details
        operator = request.mapping_rules.get("operator", "AND")
        conditions = request.mapping_rules.get("conditions", [])

        condition_results = []
        for condition in conditions:
            indicator_id = condition.get("indicator_id")
            required_status = condition.get("required_status")
            actual_status = request.indicator_statuses.get(indicator_id, "Unknown")

            condition_results.append(
                {
                    "indicator_id": indicator_id,
                    "required_status": required_status,
                    "actual_status": actual_status,
                    "matches": actual_status == required_status,
                }
            )

        evaluation_details = {
            "operator": operator,
            "conditions_evaluated": len(conditions),
            "condition_results": condition_results,
            "logic": f"Using {operator} logic: "
            + (
                "all conditions must match"
                if operator == "AND"
                else "at least one condition must match"
            ),
        }

        return TestBBICalculationResponse(
            predicted_status=predicted_status, evaluation_details=evaluation_details
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error evaluating mapping rules: {str(e)}",
        )


# ============================================================================
# BBI Results Endpoints
# ============================================================================


@router.get(
    "/results/assessment/{assessment_id}",
    response_model=List[BBIResultResponse],
    tags=["bbis"],
)
async def get_assessment_bbi_results(
    assessment_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get all BBI results for a specific assessment.

    Accessible by all authenticated users.

    Returns the calculated BBI statuses (Functional/Non-Functional)
    for all BBIs in the context of a completed assessment.
    """
    bbi_results = bbi_service.get_bbi_results(db, assessment_id)
    return bbi_results
