"""
🏛️ BBI Service
Comprehensive BBI (Barangay-based Institutions) management service.

This service handles:
- Full CRUD operations for BBIs
- BBI status calculation based on mapping rules
- Integration with assessment finalization workflow
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from app.db.enums import BBIStatus, ValidationStatus
from app.db.models.assessment import Assessment, AssessmentResponse
from app.db.models.bbi import BBI, BBIResult
from app.db.models.governance_area import GovernanceArea, Indicator


class BBIService:
    """
    Service for managing BBI data and calculating BBI statuses.

    Follows the Fat Service pattern - all business logic lives here,
    routers are thin and just handle HTTP.
    """

    # ========================================================================
    # CRUD Operations
    # ========================================================================

    def create_bbi(
        self, db: Session, data: Dict[str, Any]
    ) -> BBI:
        """
        Create a new BBI.

        Args:
            db: Database session
            data: BBI data (name, abbreviation, description, governance_area_id)

        Returns:
            Created BBI instance

        Raises:
            HTTPException: If governance area doesn't exist or name/abbreviation already exists
        """
        # Validate governance_area_id exists
        governance_area = (
            db.query(GovernanceArea)
            .filter(GovernanceArea.id == data.get("governance_area_id"))
            .first()
        )
        if not governance_area:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Governance area with ID {data.get('governance_area_id')} not found",
            )

        # Check for duplicate name
        existing_bbi = (
            db.query(BBI)
            .filter(
                and_(
                    BBI.name == data.get("name"),
                    BBI.governance_area_id == data.get("governance_area_id"),
                )
            )
            .first()
        )
        if existing_bbi:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"BBI with name '{data.get('name')}' already exists in this governance area",
            )

        # Check for duplicate abbreviation
        existing_bbi_abbr = (
            db.query(BBI)
            .filter(
                and_(
                    BBI.abbreviation == data.get("abbreviation"),
                    BBI.governance_area_id == data.get("governance_area_id"),
                )
            )
            .first()
        )
        if existing_bbi_abbr:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"BBI with abbreviation '{data.get('abbreviation')}' already exists in this governance area",
            )

        # Create BBI
        bbi = BBI(
            name=data.get("name"),
            abbreviation=data.get("abbreviation"),
            description=data.get("description"),
            governance_area_id=data.get("governance_area_id"),
            mapping_rules=data.get("mapping_rules"),
            is_active=True,
        )

        db.add(bbi)
        db.commit()
        db.refresh(bbi)

        logger.info(f"Created BBI: {bbi.name} (ID: {bbi.id})")
        return bbi

    def get_bbi(self, db: Session, bbi_id: int) -> Optional[BBI]:
        """
        Get a BBI by ID.

        Args:
            db: Database session
            bbi_id: BBI ID

        Returns:
            BBI instance or None if not found
        """
        return (
            db.query(BBI)
            .options(joinedload(BBI.governance_area))
            .filter(BBI.id == bbi_id)
            .first()
        )

    def list_bbis(
        self,
        db: Session,
        governance_area_id: Optional[int] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[BBI]:
        """
        List BBIs with optional filters.

        Args:
            db: Database session
            governance_area_id: Filter by governance area
            is_active: Filter by active status
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return

        Returns:
            List of BBI instances
        """
        query = db.query(BBI).options(joinedload(BBI.governance_area))

        # Apply filters
        if governance_area_id is not None:
            query = query.filter(BBI.governance_area_id == governance_area_id)
        if is_active is not None:
            query = query.filter(BBI.is_active == is_active)

        # Apply pagination and return
        return query.offset(skip).limit(limit).all()

    def update_bbi(
        self, db: Session, bbi_id: int, data: Dict[str, Any]
    ) -> BBI:
        """
        Update a BBI.

        Args:
            db: Database session
            bbi_id: BBI ID
            data: Updated BBI data

        Returns:
            Updated BBI instance

        Raises:
            HTTPException: If BBI not found or validation fails
        """
        bbi = self.get_bbi(db, bbi_id)
        if not bbi:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"BBI with ID {bbi_id} not found",
            )

        # Check for duplicate name if name is being updated
        if "name" in data and data["name"] != bbi.name:
            existing_bbi = (
                db.query(BBI)
                .filter(
                    and_(
                        BBI.name == data["name"],
                        BBI.governance_area_id == bbi.governance_area_id,
                        BBI.id != bbi_id,
                    )
                )
                .first()
            )
            if existing_bbi:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"BBI with name '{data['name']}' already exists in this governance area",
                )

        # Check for duplicate abbreviation if abbreviation is being updated
        if "abbreviation" in data and data["abbreviation"] != bbi.abbreviation:
            existing_bbi_abbr = (
                db.query(BBI)
                .filter(
                    and_(
                        BBI.abbreviation == data["abbreviation"],
                        BBI.governance_area_id == bbi.governance_area_id,
                        BBI.id != bbi_id,
                    )
                )
                .first()
            )
            if existing_bbi_abbr:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"BBI with abbreviation '{data['abbreviation']}' already exists in this governance area",
                )

        # Validate mapping_rules if provided
        if "mapping_rules" in data and data["mapping_rules"] is not None:
            if not isinstance(data["mapping_rules"], dict):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="mapping_rules must be a valid JSON object",
                )

        # Update fields
        for key, value in data.items():
            if hasattr(bbi, key):
                setattr(bbi, key, value)

        db.commit()
        db.refresh(bbi)

        logger.info(f"Updated BBI: {bbi.name} (ID: {bbi.id})")
        return bbi

    def deactivate_bbi(self, db: Session, bbi_id: int) -> BBI:
        """
        Deactivate a BBI (soft delete).

        Args:
            db: Database session
            bbi_id: BBI ID

        Returns:
            Deactivated BBI instance

        Raises:
            HTTPException: If BBI not found
        """
        bbi = self.get_bbi(db, bbi_id)
        if not bbi:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"BBI with ID {bbi_id} not found",
            )

        bbi.is_active = False
        db.commit()
        db.refresh(bbi)

        logger.info(f"Deactivated BBI: {bbi.name} (ID: {bbi.id})")
        return bbi

    # ========================================================================
    # BBI Status Calculation
    # ========================================================================

    def calculate_bbi_status(
        self,
        db: Session,
        bbi_id: int,
        assessment_id: int,
    ) -> BBIStatus:
        """
        Calculate the BBI status (Functional/Non-Functional) for an assessment.

        This method evaluates the BBI's mapping_rules against the indicator
        statuses in the assessment to determine if the BBI is functional.

        Args:
            db: Database session
            bbi_id: BBI ID
            assessment_id: Assessment ID

        Returns:
            BBIStatus (FUNCTIONAL or NON_FUNCTIONAL)

        Raises:
            HTTPException: If BBI or assessment not found
        """
        # Get BBI with mapping rules
        bbi = self.get_bbi(db, bbi_id)
        if not bbi:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"BBI with ID {bbi_id} not found",
            )

        if not bbi.mapping_rules:
            logger.warning(f"BBI {bbi_id} has no mapping_rules, defaulting to NON_FUNCTIONAL")
            return BBIStatus.NON_FUNCTIONAL

        # Get assessment
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assessment with ID {assessment_id} not found",
            )

        # Get all indicator statuses for this assessment
        indicator_statuses = self._get_indicator_statuses(db, assessment_id)

        # Evaluate mapping rules
        try:
            is_functional = self._evaluate_mapping_rules(
                bbi.mapping_rules, indicator_statuses
            )
            return BBIStatus.FUNCTIONAL if is_functional else BBIStatus.NON_FUNCTIONAL
        except Exception as e:
            logger.error(f"Error evaluating BBI mapping rules: {str(e)}")
            return BBIStatus.NON_FUNCTIONAL

    def _get_indicator_statuses(
        self, db: Session, assessment_id: int
    ) -> Dict[int, str]:
        """
        Get all indicator validation statuses for an assessment.

        Args:
            db: Database session
            assessment_id: Assessment ID

        Returns:
            Dictionary mapping indicator_id to validation status (Pass/Fail)
        """
        responses = (
            db.query(AssessmentResponse)
            .filter(AssessmentResponse.assessment_id == assessment_id)
            .all()
        )

        indicator_statuses = {}
        for response in responses:
            if response.validation_status:
                indicator_statuses[response.indicator_id] = response.validation_status.value

        return indicator_statuses

    def _evaluate_mapping_rules(
        self, mapping_rules: Dict[str, Any], indicator_statuses: Dict[int, str]
    ) -> bool:
        """
        Evaluate mapping rules to determine if BBI is functional.

        Expected mapping_rules structure:
        {
            "operator": "AND" or "OR",
            "conditions": [
                {"indicator_id": 1, "required_status": "Pass"},
                {"indicator_id": 2, "required_status": "Pass"},
                ...
            ]
        }

        Args:
            mapping_rules: BBI mapping rules (JSON)
            indicator_statuses: Dictionary of indicator_id -> status

        Returns:
            True if BBI is functional, False otherwise
        """
        operator = mapping_rules.get("operator", "AND")
        conditions = mapping_rules.get("conditions", [])

        if not conditions:
            return False

        results = []
        for condition in conditions:
            indicator_id = condition.get("indicator_id")
            required_status = condition.get("required_status")

            # Get actual status from assessment
            actual_status = indicator_statuses.get(indicator_id)

            # Check if status matches
            if actual_status == required_status:
                results.append(True)
            else:
                results.append(False)

        # Apply operator logic
        if operator == "AND":
            return all(results)
        elif operator == "OR":
            return any(results)
        else:
            logger.warning(f"Unknown operator '{operator}', defaulting to AND logic")
            return all(results)

    def calculate_all_bbi_statuses(
        self, db: Session, assessment_id: int
    ) -> List[BBIResult]:
        """
        Calculate all BBI statuses for a finalized assessment.

        This method should be called when an assessment is finalized.
        It calculates the status of all active BBIs and stores the results.

        Args:
            db: Database session
            assessment_id: Assessment ID

        Returns:
            List of created BBIResult instances
        """
        # Get assessment
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assessment with ID {assessment_id} not found",
            )

        # Get all active BBIs (we can calculate for all areas, or filter by assessment's relevant areas)
        bbis = db.query(BBI).filter(BBI.is_active == True).all()

        # Calculate status for each BBI
        bbi_results = []
        for bbi in bbis:
            try:
                # Calculate BBI status
                bbi_status = self.calculate_bbi_status(db, bbi.id, assessment_id)

                # Store result
                bbi_result = BBIResult(
                    bbi_id=bbi.id,
                    assessment_id=assessment_id,
                    status=bbi_status,
                    calculation_details={
                        "mapping_rules": bbi.mapping_rules,
                        "calculated_at": datetime.utcnow().isoformat(),
                    },
                )
                db.add(bbi_result)
                bbi_results.append(bbi_result)

                logger.info(
                    f"Calculated BBI status for BBI {bbi.id} ({bbi.name}): {bbi_status.value}"
                )
            except Exception as e:
                logger.error(f"Error calculating BBI status for BBI {bbi.id}: {str(e)}")
                # Continue with other BBIs even if one fails

        db.commit()
        return bbi_results

    # ========================================================================
    # BBI Results
    # ========================================================================

    def get_bbi_results(
        self, db: Session, assessment_id: int
    ) -> List[BBIResult]:
        """
        Get all BBI results for an assessment.

        Args:
            db: Database session
            assessment_id: Assessment ID

        Returns:
            List of BBIResult instances
        """
        return (
            db.query(BBIResult)
            .options(joinedload(BBIResult.bbi))
            .filter(BBIResult.assessment_id == assessment_id)
            .all()
        )


# Singleton instance
bbi_service = BBIService()
