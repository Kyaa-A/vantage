# 📊 Indicator API Endpoints
# CRUD operations for indicator management with versioning support

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models.user import User
from app.schemas.indicator import (
    IndicatorCreate,
    IndicatorHistoryResponse,
    IndicatorResponse,
    IndicatorUpdate,
)
from app.services.indicator_service import indicator_service

router = APIRouter(tags=["indicators"])


@router.post(
    "/",
    response_model=IndicatorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new indicator",
)
def create_indicator(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_mlgoo_dilg),
    indicator_in: IndicatorCreate,
) -> IndicatorResponse:
    """
    Create a new indicator with version 1.

    **Permissions**: MLGOO_DILG only

    **Request Body**:
    - name: Indicator name (min 3 characters)
    - description: Optional description
    - governance_area_id: ID of governance area
    - parent_id: Optional parent indicator ID (for hierarchical structure)
    - is_active: Active status (default: True)
    - is_profiling_only: Profiling-only flag (default: False)
    - is_auto_calculable: Auto-calculable Pass/Fail flag (default: False)
    - form_schema: Optional form schema (JSON)
    - calculation_schema: Optional calculation schema (JSON)
    - remark_schema: Optional remark schema (JSON)
    - technical_notes_text: Optional technical notes

    **Returns**: Created indicator with version 1
    """
    indicator = indicator_service.create_indicator(
        db=db,
        data=indicator_in.model_dump(),
        user_id=current_user.id,
    )
    return indicator


@router.get(
    "/",
    response_model=List[IndicatorResponse],
    summary="List all indicators",
)
def list_indicators(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    governance_area_id: Optional[int] = Query(None, description="Filter by governance area"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Max records to return"),
) -> List[IndicatorResponse]:
    """
    List indicators with optional filtering.

    **Permissions**: All authenticated users

    **Query Parameters**:
    - governance_area_id: Filter by governance area (optional)
    - is_active: Filter by active status (optional)
    - skip: Pagination offset (default: 0)
    - limit: Max records (default: 100, max: 1000)

    **Returns**: List of indicators matching filters
    """
    indicators = indicator_service.list_indicators(
        db=db,
        governance_area_id=governance_area_id,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )
    return indicators


@router.get(
    "/{indicator_id}",
    response_model=IndicatorResponse,
    summary="Get indicator by ID",
)
def get_indicator(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    indicator_id: int,
) -> IndicatorResponse:
    """
    Get a specific indicator by ID.

    **Permissions**: All authenticated users

    **Path Parameters**:
    - indicator_id: ID of the indicator

    **Returns**: Indicator details including current version

    **Raises**:
    - 404: Indicator not found
    """
    indicator = indicator_service.get_indicator(db=db, indicator_id=indicator_id)
    if not indicator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Indicator with ID {indicator_id} not found",
        )
    return indicator


@router.put(
    "/{indicator_id}",
    response_model=IndicatorResponse,
    summary="Update an indicator",
)
def update_indicator(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_mlgoo_dilg),
    indicator_id: int,
    indicator_in: IndicatorUpdate,
) -> IndicatorResponse:
    """
    Update an indicator.

    **Permissions**: MLGOO_DILG only

    **Path Parameters**:
    - indicator_id: ID of the indicator to update

    **Request Body**: All fields optional for partial updates
    - name: Indicator name (min 3 characters)
    - description: Description
    - governance_area_id: ID of governance area
    - parent_id: Parent indicator ID
    - is_active: Active status
    - is_profiling_only: Profiling-only flag
    - is_auto_calculable: Auto-calculable Pass/Fail flag
    - form_schema: Form schema (JSON)
    - calculation_schema: Calculation schema (JSON)
    - remark_schema: Remark schema (JSON)
    - technical_notes_text: Technical notes

    **Versioning Logic**:
    - If any schema field (form_schema, calculation_schema, remark_schema) changes,
      the current version is archived to indicators_history and version is incremented
    - Metadata changes (name, description, etc.) do not trigger versioning

    **Returns**: Updated indicator

    **Raises**:
    - 404: Indicator not found
    - 400: Circular parent reference detected
    - 400: Invalid governance_area_id
    """
    # Filter out None values for partial updates
    update_data = indicator_in.model_dump(exclude_unset=True)

    indicator = indicator_service.update_indicator(
        db=db,
        indicator_id=indicator_id,
        data=update_data,
        user_id=current_user.id,
    )
    return indicator


@router.delete(
    "/{indicator_id}",
    response_model=IndicatorResponse,
    summary="Deactivate an indicator",
)
def deactivate_indicator(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_mlgoo_dilg),
    indicator_id: int,
) -> IndicatorResponse:
    """
    Deactivate an indicator (soft delete).

    **Permissions**: MLGOO_DILG only

    **Path Parameters**:
    - indicator_id: ID of the indicator to deactivate

    **Returns**: Deactivated indicator (is_active=False)

    **Raises**:
    - 404: Indicator not found
    - 400: Cannot deactivate indicator with active child indicators
    """
    indicator = indicator_service.deactivate_indicator(
        db=db,
        indicator_id=indicator_id,
        user_id=current_user.id,
    )
    return indicator


@router.get(
    "/{indicator_id}/history",
    response_model=List[IndicatorHistoryResponse],
    summary="Get indicator version history",
)
def get_indicator_history(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    indicator_id: int,
) -> List[IndicatorHistoryResponse]:
    """
    Get version history for an indicator.

    **Permissions**: All authenticated users

    **Path Parameters**:
    - indicator_id: ID of the indicator

    **Returns**: List of archived versions ordered by version DESC (newest first)

    **Raises**:
    - 404: Indicator not found
    """
    history = indicator_service.get_indicator_history(
        db=db,
        indicator_id=indicator_id,
    )
    return history
