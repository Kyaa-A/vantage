# 📊 Analytics Service
# Business logic for analytics and dashboard KPI calculations

from typing import List, Optional

from app.db.enums import ComplianceStatus
from app.db.models import Assessment, AssessmentResponse, Barangay, GovernanceArea, Indicator, User
from app.schemas.analytics import (
    AreaBreakdown,
    BarangayRanking,
    ComplianceRate,
    DashboardKPIResponse,
    FailedIndicator,
    TrendData,
)
from sqlalchemy import case, desc, func
from sqlalchemy.orm import Session, joinedload


class AnalyticsService:
    """Service class for analytics and dashboard KPI calculations."""

    def get_dashboard_kpis(
        self, db: Session, cycle_id: Optional[int] = None
    ) -> DashboardKPIResponse:
        """
        Get all dashboard KPIs for the MLGOO-DILG dashboard.

        Args:
            db: Database session
            cycle_id: Optional assessment cycle ID (defaults to latest cycle if None)

        Returns:
            DashboardKPIResponse containing all KPI data
        """
        # TODO: When cycle_id is None, fetch the latest cycle from the database
        # For now, we'll use None as a valid filter (all assessments)

        # Calculate all KPIs
        overall_compliance = self._calculate_overall_compliance(db, cycle_id)
        completion_status = self._calculate_completion_status(db, cycle_id)
        area_breakdown = self._calculate_area_breakdown(db, cycle_id)
        top_failed = self._calculate_top_failed_indicators(db, cycle_id)
        rankings = self._calculate_barangay_rankings(db, cycle_id)
        trends = self._calculate_trends(db)

        return DashboardKPIResponse(
            overall_compliance_rate=overall_compliance,
            completion_status=completion_status,
            area_breakdown=area_breakdown,
            top_failed_indicators=top_failed,
            barangay_rankings=rankings,
            trends=trends,
        )

    def _calculate_overall_compliance(
        self, db: Session, cycle_id: Optional[int] = None
    ) -> ComplianceRate:
        """
        Calculate overall compliance rate (pass/fail statistics).

        Args:
            db: Database session
            cycle_id: Optional assessment cycle ID

        Returns:
            ComplianceRate schema with total, passed, failed counts and percentage
        """
        # Build base query for validated assessments
        query = db.query(Assessment).filter(
            Assessment.final_compliance_status.isnot(None)
        )

        # TODO: Add cycle_id filter when cycle field is added to Assessment model
        # if cycle_id is not None:
        #     query = query.filter(Assessment.cycle_id == cycle_id)

        # Get all assessments with final compliance status
        assessments = query.all()

        total_barangays = len(assessments)

        # Handle edge case: no assessments
        if total_barangays == 0:
            return ComplianceRate(
                total_barangays=0,
                passed=0,
                failed=0,
                pass_percentage=0.0,
            )

        # Count passed and failed
        passed = sum(
            1 for a in assessments if a.final_compliance_status == ComplianceStatus.PASSED
        )
        failed = sum(
            1 for a in assessments if a.final_compliance_status == ComplianceStatus.FAILED
        )

        # Calculate percentage (handle division by zero)
        pass_percentage = (passed / total_barangays * 100) if total_barangays > 0 else 0.0

        return ComplianceRate(
            total_barangays=total_barangays,
            passed=passed,
            failed=failed,
            pass_percentage=round(pass_percentage, 2),
        )

    def _calculate_completion_status(
        self, db: Session, cycle_id: Optional[int] = None
    ) -> ComplianceRate:
        """
        Calculate completion status (validated vs in-progress assessments).

        Args:
            db: Database session
            cycle_id: Optional assessment cycle ID

        Returns:
            ComplianceRate schema representing completion statistics
        """
        # For completion status, we consider all assessments
        query = db.query(Assessment)

        # TODO: Add cycle_id filter when cycle field is added
        # if cycle_id is not None:
        #     query = query.filter(Assessment.cycle_id == cycle_id)

        assessments = query.all()
        total = len(assessments)

        # "Passed" = validated (has final_compliance_status)
        # "Failed" = in progress (no final_compliance_status yet)
        validated = sum(1 for a in assessments if a.final_compliance_status is not None)
        in_progress = total - validated

        completion_percentage = (validated / total * 100) if total > 0 else 0.0

        return ComplianceRate(
            total_barangays=total,
            passed=validated,
            failed=in_progress,
            pass_percentage=round(completion_percentage, 2),
        )

    def _calculate_area_breakdown(
        self, db: Session, cycle_id: Optional[int] = None
    ) -> List[AreaBreakdown]:
        """
        Calculate compliance breakdown by governance area.

        Args:
            db: Database session
            cycle_id: Optional assessment cycle ID

        Returns:
            List of AreaBreakdown schemas, one per governance area
        """
        # Get all governance areas
        governance_areas = db.query(GovernanceArea).all()

        if not governance_areas:
            return []

        # Get validated assessments
        assessment_query = db.query(Assessment).filter(
            Assessment.final_compliance_status.isnot(None)
        )

        # TODO: Add cycle_id filter
        # if cycle_id is not None:
        #     assessment_query = assessment_query.filter(Assessment.cycle_id == cycle_id)

        validated_assessments = assessment_query.all()

        if not validated_assessments:
            # Return areas with zero counts
            return [
                AreaBreakdown(
                    area_code=f"GA-{area.id}",
                    area_name=area.name,
                    passed=0,
                    failed=0,
                    percentage=0.0,
                )
                for area in governance_areas
            ]

        area_breakdown = []

        for area in governance_areas:
            # Get all indicators for this governance area
            indicator_ids = [ind.id for ind in area.indicators]

            if not indicator_ids:
                area_breakdown.append(
                    AreaBreakdown(
                        area_code=f"GA-{area.id}",
                        area_name=area.name,
                        passed=0,
                        failed=0,
                        percentage=0.0,
                    )
                )
                continue

            # For each assessment, check if all indicators in this area are completed
            passed_count = 0
            failed_count = 0

            for assessment in validated_assessments:
                # Get responses for this area's indicators
                area_responses = [
                    r for r in assessment.responses
                    if r.indicator_id in indicator_ids
                ]

                if not area_responses:
                    continue

                # Check if all indicators in this area are completed
                all_completed = all(r.is_completed for r in area_responses)

                if all_completed:
                    passed_count += 1
                else:
                    failed_count += 1

            total = passed_count + failed_count
            percentage = (passed_count / total * 100) if total > 0 else 0.0

            area_breakdown.append(
                AreaBreakdown(
                    area_code=f"GA-{area.id}",
                    area_name=area.name,
                    passed=passed_count,
                    failed=failed_count,
                    percentage=round(percentage, 2),
                )
            )

        return area_breakdown

    def _calculate_top_failed_indicators(
        self, db: Session, cycle_id: Optional[int] = None
    ) -> List[FailedIndicator]:
        """
        Calculate top 5 most frequently failed indicators.

        Args:
            db: Database session
            cycle_id: Optional assessment cycle ID

        Returns:
            List of FailedIndicator schemas (max 5)
        """
        # Build query for incomplete responses
        query = (
            db.query(
                Indicator.id,
                Indicator.name,
                func.count(AssessmentResponse.id).label("failure_count"),
            )
            .join(AssessmentResponse, AssessmentResponse.indicator_id == Indicator.id)
            .filter(AssessmentResponse.is_completed == False)
        )

        # TODO: Add cycle_id filter via Assessment join
        # if cycle_id is not None:
        #     query = query.join(Assessment).filter(Assessment.cycle_id == cycle_id)

        # Group by indicator, order by count descending, limit to 5
        results = (
            query.group_by(Indicator.id, Indicator.name)
            .order_by(desc("failure_count"))
            .limit(5)
            .all()
        )

        if not results:
            return []

        # Calculate total failures for percentage calculation
        total_failures = sum(r.failure_count for r in results)

        failed_indicators = []
        for result in results:
            percentage = (
                (result.failure_count / total_failures * 100) if total_failures > 0 else 0.0
            )
            failed_indicators.append(
                FailedIndicator(
                    indicator_id=result.id,
                    indicator_name=result.name,
                    failure_count=result.failure_count,
                    percentage=round(percentage, 2),
                )
            )

        return failed_indicators

    def _calculate_barangay_rankings(
        self, db: Session, cycle_id: Optional[int] = None
    ) -> List[BarangayRanking]:
        """
        Calculate barangay rankings based on compliance scores.

        Args:
            db: Database session
            cycle_id: Optional assessment cycle ID

        Returns:
            List of BarangayRanking schemas, ordered by score (descending)
        """
        # Get all assessments with their associated barangays
        query = (
            db.query(
                Barangay.id,
                Barangay.name,
                Assessment.id.label("assessment_id"),
            )
            .join(User, User.barangay_id == Barangay.id)
            .join(Assessment, Assessment.blgu_user_id == User.id)
            .filter(Assessment.final_compliance_status.isnot(None))
        )

        # TODO: Add cycle_id filter
        # if cycle_id is not None:
        #     query = query.filter(Assessment.cycle_id == cycle_id)

        results = query.all()

        if not results:
            return []

        # Calculate score for each barangay
        barangay_scores = {}

        for result in results:
            barangay_id = result.id
            barangay_name = result.name
            assessment_id = result.assessment_id

            # Get all responses for this assessment
            responses = (
                db.query(AssessmentResponse)
                .filter(AssessmentResponse.assessment_id == assessment_id)
                .all()
            )

            if not responses:
                continue

            # Calculate completion percentage as score
            completed = sum(1 for r in responses if r.is_completed)
            total = len(responses)
            score = (completed / total * 100) if total > 0 else 0.0

            barangay_scores[barangay_id] = {
                "name": barangay_name,
                "score": round(score, 2),
            }

        # Convert to list and sort by score
        rankings = [
            {"id": barangay_id, **data}
            for barangay_id, data in barangay_scores.items()
        ]
        rankings.sort(key=lambda x: x["score"], reverse=True)

        # Assign ranks
        barangay_rankings = []
        for rank, item in enumerate(rankings, start=1):
            barangay_rankings.append(
                BarangayRanking(
                    barangay_id=item["id"],
                    barangay_name=item["name"],
                    score=item["score"],
                    rank=rank,
                )
            )

        return barangay_rankings

    def _calculate_trends(self, db: Session) -> List[TrendData]:
        """
        Calculate historical trend data across last 3 cycles.

        Args:
            db: Database session

        Returns:
            List of TrendData schemas (max 3, chronologically ordered)
        """
        # TODO: Implement when cycle table and relationship are added
        # For now, return empty list as cycles are not yet in the schema

        # Placeholder implementation:
        # 1. Query last 3 cycles ordered by date DESC
        # 2. For each cycle, calculate pass rate
        # 3. Return chronologically ordered (oldest to newest)

        return []


# Export singleton instance
analytics_service = AnalyticsService()
