# 📊 Analytics API Routes
# Endpoints for analytics and dashboard data

from typing import Optional

from app.api import deps
from app.db.enums import UserRole
from app.db.models.user import User
from app.schemas.analytics import DashboardKPIResponse
from app.services.analytics_service import analytics_service
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

router = APIRouter()


async def get_current_mlgoo_dilg_user(
    current_user: User = Depends(deps.get_current_active_user),
) -> User:
    """
    Get the current authenticated MLGOO-DILG user.

    Restricts access to users with MLGOO_DILG role.

    Args:
        current_user: Current active user from get_current_active_user dependency

    Returns:
        User: Current MLGOO-DILG user

    Raises:
        HTTPException: If user doesn't have MLGOO-DILG privileges
    """
    if current_user.role != UserRole.MLGOO_DILG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. MLGOO-DILG access required.",
        )
    return current_user


@router.get(
    "/dashboard",
    response_model=DashboardKPIResponse,
    tags=["analytics"],
    summary="Get Dashboard KPIs",
    description=(
        "Retrieve all dashboard Key Performance Indicators (KPIs) for the MLGOO-DILG dashboard.\n\n"
        "**KPIs included:**\n"
        "- Overall compliance rate (pass/fail statistics)\n"
        "- Completion status (validated vs in-progress assessments)\n"
        "- Area breakdown (compliance by governance area)\n"
        "- Top 5 failed indicators\n"
        "- Barangay rankings by compliance score\n"
        "- Historical trends across cycles\n\n"
        "**Access:** Requires MLGOO_DILG role."
    ),
    responses={
        200: {
            "description": "Dashboard KPIs retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "overall_compliance_rate": {
                            "total_barangays": 50,
                            "passed": 35,
                            "failed": 15,
                            "pass_percentage": 70.0,
                        },
                        "completion_status": {
                            "total_barangays": 50,
                            "passed": 40,
                            "failed": 10,
                            "pass_percentage": 80.0,
                        },
                        "area_breakdown": [
                            {
                                "area_code": "GA-1",
                                "area_name": "Financial Administration",
                                "passed": 30,
                                "failed": 20,
                                "percentage": 60.0,
                            }
                        ],
                        "top_failed_indicators": [
                            {
                                "indicator_id": 5,
                                "indicator_name": "Budget Transparency",
                                "failure_count": 25,
                                "percentage": 50.0,
                            }
                        ],
                        "barangay_rankings": [
                            {
                                "barangay_id": 1,
                                "barangay_name": "Barangay 1",
                                "score": 95.5,
                                "rank": 1,
                            }
                        ],
                        "trends": [
                            {
                                "cycle_id": 1,
                                "cycle_name": "2024 Q1",
                                "pass_rate": 65.0,
                                "date": "2024-01-01T00:00:00",
                            }
                        ],
                    }
                }
            },
        },
        401: {"description": "Not authenticated"},
        403: {"description": "Not enough permissions (MLGOO_DILG role required)"},
    },
)
async def get_dashboard(
    cycle_id: Optional[int] = Query(
        None,
        description="Assessment cycle ID (defaults to latest cycle if not provided)",
    ),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_mlgoo_dilg_user),
) -> DashboardKPIResponse:
    """
    Get dashboard KPIs for MLGOO-DILG dashboard.

    Retrieves comprehensive analytics including compliance rates, area breakdowns,
    failed indicators, barangay rankings, and historical trends.

    Args:
        cycle_id: Optional assessment cycle ID (defaults to latest)
        db: Database session
        current_user: Current authenticated MLGOO-DILG user

    Returns:
        DashboardKPIResponse: Complete dashboard KPI data

    Raises:
        HTTPException: 401 if not authenticated, 403 if insufficient permissions
    """
    try:
        dashboard_kpis = analytics_service.get_dashboard_kpis(db, cycle_id)
        return dashboard_kpis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve dashboard KPIs: {str(e)}",
        )
