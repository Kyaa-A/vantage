# 📋 Assessment Service
# Business logic for assessment management operations

from datetime import datetime
from typing import Any, Dict, List, Optional

from app.db.enums import AssessmentStatus, MOVStatus
from app.db.models import (
    MOV,
    Assessment,
    AssessmentResponse,
    FeedbackComment,
    GovernanceArea,
    Indicator,
)
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentDashboardResponse,
    AssessmentDashboardStats,
    AssessmentResponseCreate,
    AssessmentResponseUpdate,
    AssessmentSubmissionValidation,
    FeedbackCommentCreate,
    FormSchemaValidation,
    GovernanceAreaProgress,
    MOVCreate,
    ProgressSummary,
)
from fastapi import HTTPException, status  # type: ignore[reportMissingImports]
from sqlalchemy import and_, func  # type: ignore[reportMissingImports]
from sqlalchemy.orm import Session, joinedload  # type: ignore[reportMissingImports]


class AssessmentService:
    """Service class for assessment management operations."""

    # ----- Serialization helpers -----
    def _serialize_response_obj(self, response: Optional[AssessmentResponse]) -> Optional[Dict[str, Any]]:
        if response is None:
            return None
        return {
            "id": response.id,
            "response_data": response.response_data,
            "is_completed": response.is_completed,
            "requires_rework": response.requires_rework,
            "assessment_id": response.assessment_id,
            "indicator_id": response.indicator_id,
            "created_at": response.created_at.isoformat() if response.created_at else None,
            "updated_at": response.updated_at.isoformat() if response.updated_at else None,
        }

    def _serialize_mov_list(self, movs: Optional[List[MOV]]) -> List[Dict[str, Any]]:
        if not movs:
            return []
        return [
            {
                "id": mov.id,
                "filename": mov.filename,
                "original_filename": mov.original_filename,
                "file_size": mov.file_size,
                "content_type": mov.content_type,
                "storage_path": mov.storage_path,
                "status": mov.status.value if hasattr(mov.status, "value") else mov.status,
                "response_id": mov.response_id,
                "uploaded_at": mov.uploaded_at.isoformat() if mov.uploaded_at else None,
            }
            for mov in movs
        ]

    def get_assessment_for_blgu(
        self, db: Session, blgu_user_id: int
    ) -> Optional[Assessment]:
        """
        Get the assessment for a specific BLGU user.

        Args:
            db: Database session
            blgu_user_id: ID of the BLGU user

        Returns:
            Assessment object or None if not found
        """
        return (
            db.query(Assessment).filter(Assessment.blgu_user_id == blgu_user_id).first()
        )

    def get_assessment_with_responses(
        self, db: Session, assessment_id: int
    ) -> Optional[Assessment]:
        """
        Get assessment with all its responses and related data.

        Args:
            db: Database session
            assessment_id: ID of the assessment

        Returns:
            Assessment with responses or None if not found
        """
        return (
            db.query(Assessment)
            .options(
                joinedload(Assessment.responses).joinedload(
                    AssessmentResponse.indicator
                ),
                joinedload(Assessment.responses).joinedload(AssessmentResponse.movs),
                joinedload(Assessment.responses).joinedload(
                    AssessmentResponse.feedback_comments
                ),
            )
            .filter(Assessment.id == assessment_id)
            .first()
        )

    def get_assessment_for_blgu_with_full_data(
        self, db: Session, blgu_user_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get complete assessment data for BLGU user including all governance areas,
        indicators, and responses.

        Args:
            db: Database session
            blgu_user_id: ID of the BLGU user

        Returns:
            Dictionary with assessment and governance areas data
        """
        try:
            # Get assessment
            assessment = (
                db.query(Assessment)
                .filter(Assessment.blgu_user_id == blgu_user_id)
                .first()
            )

            # Create if not exists
            if assessment is None:
                assessment = Assessment(
                    blgu_user_id=blgu_user_id,
                    status=AssessmentStatus.DRAFT,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                db.add(assessment)
                db.commit()
                db.refresh(assessment)

            # Ensure governance areas exist (dev safeguard)
            self._ensure_governance_areas_exist(db)

            # Get all governance areas
            governance_areas = db.query(GovernanceArea).all()

            # If no indicators exist, create some sample indicators for development
            areas_with_no_indicators = (
                db.query(GovernanceArea).outerjoin(Indicator).group_by(GovernanceArea.id).having(func.count(Indicator.id) == 0).all()
            )
            if areas_with_no_indicators:
                self._create_sample_indicators(db)

        except Exception as e:
            print(f"Error in get_assessment_for_blgu_with_full_data: {e}")
            raise

        # Get all responses for this assessment
        responses = (
            db.query(AssessmentResponse)
            .options(
                joinedload(AssessmentResponse.indicator),
                joinedload(AssessmentResponse.movs),
                joinedload(AssessmentResponse.feedback_comments),
            )
            .filter(AssessmentResponse.assessment_id == assessment.id)
            .all()
        )

        # Create response lookup
        response_lookup = {r.indicator_id: r for r in responses}

        # Fetch all indicators once to avoid N+1 and build a tree by area
        all_indicators = db.query(Indicator).all()
        indicators_by_area: Dict[int, list[Indicator]] = {}
        for ind in all_indicators:
            indicators_by_area.setdefault(ind.governance_area_id, []).append(ind)

        # Pre-build adjacency lists for indicators for O(n) tree assembly
        children_by_parent: Dict[int | None, list[Indicator]] = {}
        for ind in all_indicators:
            children_by_parent.setdefault(getattr(ind, "parent_id", None), []).append(ind)

        def serialize_indicator_node(ind: Indicator) -> Dict[str, Any]:
            """Serialize an indicator and attach nested children without triggering lazy loads."""
            response = response_lookup.get(ind.id)
            node = {
                "id": ind.id,
                "name": ind.name,
                "description": ind.description,
                "form_schema": ind.form_schema,
                "response": self._serialize_response_obj(response),
                "movs": self._serialize_mov_list(response.movs) if response else [],
                "feedback_comments": [
                    {
                        "id": c.id,
                        "comment": c.comment,
                        "comment_type": c.comment_type,
                        "is_internal_note": c.is_internal_note,
                        "response_id": c.response_id,
                        "assessor_id": c.assessor_id,
                        "created_at": c.created_at.isoformat() if c.created_at else None,
                    }
                    for c in (response.feedback_comments if response else [])
                ],
                "children": [],
            }
            # Recurse over children using pre-built adjacency lists
            for child in children_by_parent.get(ind.id, []):
                node["children"].append(serialize_indicator_node(child))
            return node

        # Build governance areas with top-level indicators and nested children
        governance_areas_data = []
        for area in governance_areas:
            area_data = {
                "id": area.id,
                "name": area.name,
                "area_type": area.area_type.value,
                "indicators": [],
            }

            # Add only top-level indicators for this area, with nested children
            top_level_nodes: list[Dict[str, Any]] = []
            top_level_inds = [
                ind for ind in indicators_by_area.get(area.id, []) if getattr(ind, "parent_id", None) is None
            ]
            
            # For area 1, only use the first indicator as the parent for synthetic children
            if area.id == 1:
                # Only take the first indicator for area 1 to use as parent
                top_level_inds = top_level_inds[:1]
            
            for ind in top_level_inds:
                top_level_nodes.append(serialize_indicator_node(ind))

            # Option B (dev/demo): inject synthetic children for Area 1 using existing helper
            # This enables nested rendering even without DB hierarchy
            if area.id == 1 and len(top_level_inds) >= 1 and len(top_level_nodes) >= 1:
                base_ind = top_level_inds[0]
                base_resp = response_lookup.get(base_ind.id)
                try:
                    fi_subs = self._build_fi_mock_subindicators(base_ind, base_resp)
                    # Override parent display title to match spec (1.1 Compliance ...)
                    top_level_nodes[0]["name"] = (
                        "BFDP Board Compliance"
                    )
                    # Provide explicit code so frontend doesn't derive from DB id (e.g., 1.119)
                    top_level_nodes[0]["code"] = "1.1"
                    # Override the description to match the parent role
                    top_level_nodes[0]["description"] = (
                        "Compliance with the Barangay Full Disclosure Policy (BFDP) Board requirements"
                    )
                    # Clear MOVs from parent since children will show them
                    top_level_nodes[0]["movs"] = []
                    # Clear existing children and add synthetic ones
                    top_level_nodes[0]["children"] = fi_subs
                except Exception:
                    # Fail-safe: ignore mock injection errors in prod paths
                    pass

            area_data["indicators"].extend(top_level_nodes)

            governance_areas_data.append(area_data)

        # Convert SQLAlchemy models to dictionaries for JSON serialization
        assessment_dict = {
            "id": assessment.id,
            "status": assessment.status.value,
            "blgu_user_id": assessment.blgu_user_id,
            "created_at": assessment.created_at.isoformat(),
            "updated_at": assessment.updated_at.isoformat(),
            "submitted_at": assessment.submitted_at.isoformat()
            if assessment.submitted_at
            else None,
            "validated_at": assessment.validated_at.isoformat()
            if assessment.validated_at
            else None,
        }

        return {
            "assessment": assessment_dict,
            "governance_areas": governance_areas_data,
        }

    def _ensure_governance_areas_exist(self, db: Session) -> None:
        """Ensure the 6 governance areas exist. Creates them if missing (dev use)."""
        from app.db.models.governance_area import GovernanceArea
        from app.db.enums import AreaType

        existing = {ga.name for ga in db.query(GovernanceArea).all()}
        required = [
            ("Financial Administration and Sustainability", AreaType.CORE),
            ("Disaster Preparedness", AreaType.CORE),
            ("Safety, Peace and Order", AreaType.CORE),
            ("Social Protection and Sensitivity", AreaType.ESSENTIAL),
            ("Business-Friendliness and Competitiveness", AreaType.ESSENTIAL),
            ("Environmental Management", AreaType.ESSENTIAL),
        ]

        created_any = False
        for name, area_type in required:
            if name not in existing:
                db.add(GovernanceArea(name=name, area_type=area_type))
                created_any = True

        if created_any:
            db.commit()

        # Cleanup any non-required areas accidentally created in dev (e.g., Tourism)
        allowed = {name for name, _ in required}
        extras = (
            db.query(GovernanceArea)
            .filter(~GovernanceArea.name.in_(list(allowed)))
            .all()
        )
        if extras:
            for ga in extras:
                db.delete(ga)
            db.commit()

    def _build_fi_mock_subindicators(self, base_indicator, base_response) -> List[Dict[str, Any]]:
        """
        Build 4 mock sub-indicators for Area 1 (for frontend testing only).
        These reuse the REAL assessment response (if any) of the base indicator
        so the frontend can POST MOVs using a valid response_id.
        """
        subs: List[Dict[str, Any]] = []

        # Determine an id that the frontend can use for MOV upload. Prefer the
        # real response id; if none exists yet, fall back to the base indicator id
        # (upload will 404 until a real response is created by the client elsewhere).
        safe_id = base_response.id if base_response else base_indicator.id
        safe_movs = base_response.movs if base_response else []
        serialized_response = self._serialize_response_obj(base_response)
        serialized_movs = self._serialize_mov_list(safe_movs)

        # 1.1.1 – Posted documents (child indicator under 1.1 Compliance)
        subs.append(
            {
                "id": str(safe_id + 1000),  # Use unique ID for child
                # Backend indicator to use when creating/updating responses (existing DB row)
                "responseIndicatorId": base_indicator.id,
                "code": "1.1.1",
                "name": "Posted CY 2023 financial documents in the BFDP board",
                "description": "Posted the following CY 2023 financial documents in the BFDP board, pursuant to DILG MC No. 2014-81 and DILG MC No. 2022-027:",
                "technicalNotes": "See form schema for requirements",
                "governanceAreaId": "1",
                "status": "completed" if serialized_response and serialized_response.get("is_completed") else "not_started",
                "complianceAnswer": "yes" if serialized_response and serialized_response.get("response_data", {}).get("compliance") == "yes" else "no",
                "assessorComment": None,
                "responseData": serialized_response.get("response_data", {}) if serialized_response else {},
                "requiresRework": serialized_response.get("requires_rework", False) if serialized_response else False,
                "responseId": serialized_response.get("id") if serialized_response else None,
                "response": serialized_response,
                "movs": serialized_movs,
                "feedback_comments": [],
                "children": [],  # Add children field for consistency
                "form_schema": {
                    "type": "object",
                    "title": "1.1.1 - Posted CY 2023 financial documents in the BFDP board",
                    "description": "Requirements for posting financial documents in the BFDP board",
                    "properties": {
                        "bfdp_monitoring_forms_compliance": {
                    "type": "string",
                            "title": "Three (3) BFDP Monitoring Form A of the DILG Advisory covering the 1st to 3rd quarter monitoring data signed by the City Director/C/MLGOO, Punong Barangay and Barangay Secretary",
                            "description": "Check this box if you have uploaded the required 3 BFDP Monitoring Forms",
                    "mov_upload_section": "bfdp_monitoring_forms",
                    "enum": ["yes", "no", "na"]
                        },
                        "photo_documentation_compliance": {
                    "type": "string",
                            "title": "Two (2) Photo Documentation of the BFDP board showing the name of the barangay",
                            "description": "Check this box if you have uploaded the required 2 photos of the BFDP board",
                    "mov_upload_section": "photo_documentation",
                    "enum": ["yes", "no", "na"]
                        }
                    },
            "required": ["bfdp_monitoring_forms_compliance", "photo_documentation_compliance"]
                },
            }
        )

        # The additional sub-indicators (1.1.2, 1.2.1, 1.3.1) are disabled for now
        # to focus on a single assessment indicator in the UI.
        # Uncomment blocks below when ready to enable them again.
        #
        # subs.append({ ... 1.1.2 ... })
        # subs.append({ ... 1.2.1 ... })
        # subs.append({ ... 1.3.1 ... })

        return subs

    def _create_sample_indicators(self, db: Session) -> None:
        """Create sample indicators for development/testing purposes."""
        from app.db.models import Indicator

        # Sample indicators for each governance area
        sample_indicators = [
            # Financial Administration and Sustainability
            {
                "name": "Budget Planning and Execution",
                "description": "The barangay has a comprehensive budget plan that is properly executed and monitored.",
                "form_schema": {
                    "type": "object",
                    "properties": {
                        "has_budget_plan": {
                            "type": "boolean",
                            "title": "Has Budget Plan",
                        },
                        "budget_amount": {"type": "number", "title": "Budget Amount"},
                        "notes": {"type": "string", "title": "Additional Notes"},
                    },
                    "required": ["has_budget_plan"],
                },
                "governance_area_id": 1,
            },
            # Disaster Preparedness
            {
                "name": "Disaster Risk Reduction Plan",
                "description": "The barangay has a comprehensive disaster risk reduction and management plan.",
                "form_schema": {
                    "type": "object",
                    "properties": {
                        "has_drr_plan": {"type": "boolean", "title": "Has DRR Plan"},
                        "plan_year": {"type": "string", "title": "Plan Year"},
                        "evacuation_centers": {
                            "type": "number",
                            "title": "Number of Evacuation Centers",
                        },
                    },
                    "required": ["has_drr_plan"],
                },
                "governance_area_id": 2,
            },
            # Safety, Peace and Order
            {
                "name": "Peace and Order Committee",
                "description": "The barangay has an active peace and order committee with regular activities.",
                "form_schema": {
                    "type": "object",
                    "properties": {
                        "has_committee": {
                            "type": "boolean",
                            "title": "Has Peace and Order Committee",
                        },
                        "meetings_per_year": {
                            "type": "number",
                            "title": "Meetings per Year",
                        },
                        "activities": {"type": "string", "title": "Key Activities"},
                    },
                    "required": ["has_committee"],
                },
                "governance_area_id": 3,
            },
            # Social Protection and Sensitivity
            {
                "name": "Social Welfare Programs",
                "description": "The barangay implements social welfare programs for vulnerable sectors.",
                "form_schema": {
                    "type": "object",
                    "properties": {
                        "has_programs": {
                            "type": "boolean",
                            "title": "Has Social Welfare Programs",
                        },
                        "program_count": {
                            "type": "number",
                            "title": "Number of Programs",
                        },
                        "beneficiaries": {
                            "type": "number",
                            "title": "Number of Beneficiaries",
                        },
                    },
                    "required": ["has_programs"],
                },
                "governance_area_id": 4,
            },
            # Business-Friendliness and Competitiveness
            {
                "name": "Business Support Services",
                "description": "The barangay provides support services for local businesses and entrepreneurs.",
                "form_schema": {
                    "type": "object",
                    "properties": {
                        "has_services": {
                            "type": "boolean",
                            "title": "Has Business Support Services",
                        },
                        "service_types": {
                            "type": "string",
                            "title": "Types of Services",
                        },
                        "businesses_served": {
                            "type": "number",
                            "title": "Number of Businesses Served",
                        },
                    },
                    "required": ["has_services"],
                },
                "governance_area_id": 5,
            },
            # Environmental Management
            {
                "name": "Environmental Programs",
                "description": "The barangay implements environmental protection and sustainability programs.",
                "form_schema": {
                    "type": "object",
                    "properties": {
                        "has_programs": {
                            "type": "boolean",
                            "title": "Has Environmental Programs",
                        },
                        "program_types": {
                            "type": "string",
                            "title": "Types of Programs",
                        },
                        "trees_planted": {
                            "type": "number",
                            "title": "Trees Planted This Year",
                        },
                    },
                    "required": ["has_programs"],
                },
                "governance_area_id": 6,
            },
        ]

        for indicator_data in sample_indicators:
            indicator = Indicator(**indicator_data)
            db.add(indicator)

        db.commit()
        print(f"Created {len(sample_indicators)} sample indicators")

    def create_assessment(
        self, db: Session, assessment_create: AssessmentCreate
    ) -> Assessment:
        """
        Create a new assessment for a BLGU user.

        Args:
            db: Database session
            assessment_create: Assessment creation data

        Returns:
            Created Assessment object
        """
        # Check if assessment already exists
        existing = self.get_assessment_for_blgu(db, assessment_create.blgu_user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assessment already exists for this BLGU user",
            )

        db_assessment = Assessment(
            blgu_user_id=assessment_create.blgu_user_id,
            status=AssessmentStatus.DRAFT,
        )

        db.add(db_assessment)
        db.commit()
        db.refresh(db_assessment)
        return db_assessment

    def get_assessment_response(
        self, db: Session, response_id: int
    ) -> Optional[AssessmentResponse]:
        """
        Get an assessment response by ID.

        Args:
            db: Database session
            response_id: ID of the response

        Returns:
            AssessmentResponse object or None if not found
        """
        return (
            db.query(AssessmentResponse)
            .options(
                joinedload(AssessmentResponse.indicator),
                joinedload(AssessmentResponse.movs),
                joinedload(AssessmentResponse.feedback_comments),
            )
            .filter(AssessmentResponse.id == response_id)
            .first()
        )

    def create_assessment_response(
        self, db: Session, response_create: AssessmentResponseCreate
    ) -> AssessmentResponse:
        """
        Create a new assessment response.

        Args:
            db: Database session
            response_create: Response creation data

        Returns:
            Created AssessmentResponse object
        """
        # Check if response already exists for this assessment and indicator
        existing = (
            db.query(AssessmentResponse)
            .filter(
                and_(
                    AssessmentResponse.assessment_id == response_create.assessment_id,
                    AssessmentResponse.indicator_id == response_create.indicator_id,
                )
            )
            .first()
        )

        if existing:
            # Idempotent behavior: return the existing response instead of erroring
            return existing

        initial_data = response_create.response_data or {}
        db_response = AssessmentResponse(
            response_data=initial_data,
            assessment_id=response_create.assessment_id,
            indicator_id=response_create.indicator_id,
        )

        # Initialize completion based on current schema if available
        try:
            if db_response.indicator and db_response.indicator.form_schema:
                db_response.is_completed = self._check_response_completion(
                    db_response.indicator.form_schema, initial_data, []
                )
            else:
                db_response.is_completed = bool(initial_data)
        except Exception:
            db_response.is_completed = False

        db.add(db_response)
        db.commit()
        db.refresh(db_response)
        return db_response

    def update_assessment_response(
        self, db: Session, response_id: int, response_update: AssessmentResponseUpdate
    ) -> Optional[AssessmentResponse]:
        """
        Update an assessment response with validation against form schema.

        Args:
            db: Database session
            response_id: ID of the response to update
            response_update: Response update data

        Returns:
            Updated AssessmentResponse object or None if not found
        """
        db_response = self.get_assessment_response(db, response_id)
        if not db_response:
            return None

        # Validate response_data against indicator's form_schema if provided
        if response_update.response_data is not None:
            validation_result = self.validate_response_data(
                db_response.indicator.form_schema, response_update.response_data
            )
            if not validation_result.is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Response data validation failed: {', '.join(validation_result.errors)}",
                )

        # Update fields that are provided
        update_data = response_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_response, field, value)

        # Auto-set completion status based on response_data
        if response_update.response_data is not None:
            db_response.is_completed = self._check_response_completion(
                db_response.indicator.form_schema, response_update.response_data, db_response.movs
            )

        db.commit()
        db.refresh(db_response)
        return db_response

    def validate_response_data(
        self, form_schema: Dict[str, Any], response_data: Dict[str, Any]
    ) -> FormSchemaValidation:
        """
        Validate response data against the indicator's form schema.

        Args:
            form_schema: JSON schema defining the expected form structure
            response_data: User's response data to validate

        Returns:
            FormSchemaValidation with validation results
        """
        errors = []
        warnings: list[Dict[str, Any]] = []

        try:
            # Basic validation - check if response_data matches schema structure
            if not isinstance(response_data, dict):
                errors.append("Response data must be a JSON object")
                return FormSchemaValidation(is_valid=False, errors=errors)

            # Check required fields from schema
            required_fields = form_schema.get("required", [])
            for field in required_fields:
                if field not in response_data:
                    errors.append(f"Required field '{field}' is missing")

            # Check field types and values
            properties = form_schema.get("properties", {})
            for field, value in response_data.items():
                if field in properties:
                    field_schema = properties[field]
                    field_errors = self._validate_field(field, value, field_schema)
                    errors.extend(field_errors)

            # Additional business logic validations
            self._validate_business_rules(response_data, form_schema, warnings)

        except (ValueError, TypeError, KeyError) as e:
            errors.append(f"Validation error: {str(e)}")

        return FormSchemaValidation(
            is_valid=len(errors) == 0, errors=errors, warnings=[]
        )

    def _check_response_completion(
        self, form_schema: Dict[str, Any], response_data: Dict[str, Any], movs: Optional[List[MOV]] = None
    ) -> bool:
        """
        Check if a response is completed based on form schema requirements.
        
        For indicators with multiple requirements (like 1.1.1), all required fields
        must have valid compliance values (yes/no/na) for the response to be considered complete.
        
        Args:
            form_schema: JSON schema defining the expected form structure
            response_data: User's response data to check
            
        Returns:
            True if response is completed, False otherwise
        """
        if not response_data or not isinstance(response_data, dict):
            return False
            
        # Get required fields from schema
        required_fields = form_schema.get("required", [])
        
        # If no explicit required fields, check all fields in response_data for "yes" answers with MOVs
        if not required_fields:
            # Check if ANY field has "yes" value (for schemas without explicit "required" array)
            valid_compliance_values = {"yes", "no", "na"}
            has_any_yes = any(
                str(v).lower() == "yes" 
                for v in response_data.values() 
                if isinstance(v, str) and str(v).lower() in valid_compliance_values
            )
            mov_count = len(movs or [])
            if has_any_yes and mov_count <= 0:
                return False
            return bool(response_data)
            
        # Check that all required fields have valid compliance values
        valid_compliance_values = {"yes", "no", "na"}
        
        for field in required_fields:
            value = response_data.get(field)
            if not value or value not in valid_compliance_values:
                return False
        
        # If any required field is answered 'yes', require at least one MOV
        has_any_yes = any(response_data.get(field) == "yes" for field in required_fields)
        if has_any_yes:
            required_sections: List[str] = []
            props = form_schema.get("properties", {}) or {}
            for v in props.values():
                section = (v or {}).get("mov_upload_section")
                if isinstance(section, str):
                    required_sections.append(section)
            # If schema lists specific sections, enforce at least one MOV per section
            if required_sections:
                section_set = set(required_sections)
                mov_section_hits = {s: False for s in section_set}
                for m in (movs or []):
                    spath = getattr(m, "storage_path", "") or ""
                    for s in section_set:
                        if s in spath:
                            mov_section_hits[s] = True
                if not all(mov_section_hits.values()):
                    return False
            else:
                # Otherwise at least one MOV overall
                if len(movs or []) <= 0:
                    return False

        return True

    def recompute_response_completion(self, response: AssessmentResponse) -> bool:
        """
        Recomputes and sets the is_completed status of an AssessmentResponse in-place based on
        current response_data and number of valid MOVs attached (for atomic operations).
        Args:
            response: AssessmentResponse ORM object (with .indicator and .movs eager-loaded)
        Returns:
            new completion status (bool)
        """
        if not response or not response.indicator:
            response.is_completed = False
            return False
        form_schema = getattr(response.indicator, "form_schema", {}) or {}
        mov_count = len(getattr(response, "movs", []) or [])
        completion = self._check_response_completion(form_schema, response.response_data, response.movs)
        # Debug: trace recompute inputs/outputs
        try:
            print(
                f"[DEBUG] recompute_response_completion: response_id={getattr(response, 'id', None)}, "
                f"indicator_id={getattr(response, 'indicator_id', None)}, mov_count={mov_count}, "
                f"new_is_completed={completion}"
            )
        except Exception:
            pass
        response.is_completed = completion
        return completion

    def _validate_field(
        self, field_name: str, value: Any, field_schema: Dict[str, Any]
    ) -> List[str]:
        """Validate a single field against its schema."""
        errors = []

        # Check field type
        expected_type = field_schema.get("type")
        if expected_type:
            if expected_type == "string" and not isinstance(value, str):
                errors.append(f"Field '{field_name}' must be a string")
            elif expected_type == "number" and not isinstance(value, (int, float)):
                errors.append(f"Field '{field_name}' must be a number")
            elif expected_type == "boolean" and not isinstance(value, bool):
                errors.append(f"Field '{field_name}' must be a boolean")
            elif expected_type == "array" and not isinstance(value, list):
                errors.append(f"Field '{field_name}' must be an array")

        # Check enum values
        enum_values = field_schema.get("enum")
        if enum_values and value not in enum_values:
            errors.append(
                f"Field '{field_name}' must be one of: {', '.join(map(str, enum_values))}"
            )

        return errors

    def _validate_business_rules(
        self,
        response_data: Dict[str, Any],
        form_schema: Dict[str, Any],
        warnings: List[Dict[str, Any]],
    ) -> None:
        """Apply business-specific validation rules."""
        # Example: Check if "YES" answers have corresponding MOVs
        # This would be implemented based on specific business requirements

    def submit_assessment(
        self, db: Session, assessment_id: int
    ) -> AssessmentSubmissionValidation:
        """
        Submit an assessment for review with preliminary compliance check.

        Args:
            db: Database session
            assessment_id: ID of the assessment to submit

        Returns:
            AssessmentSubmissionValidation with submission results
        """
        assessment = self.get_assessment_with_responses(db, assessment_id)
        if not assessment:
            return AssessmentSubmissionValidation(
                is_valid=False, errors=[{"error": "Assessment not found"}]
            )

        # Check if assessment is in correct status for submission (Draft or Needs Rework)
        if assessment.status not in (AssessmentStatus.DRAFT, AssessmentStatus.NEEDS_REWORK):
            return AssessmentSubmissionValidation(
                is_valid=False,
                errors=[
                    {
                        "error": f"Assessment must be in DRAFT or NEEDS_REWORK status to submit. Current status: {assessment.status.value}"
                    }
                ],
            )

        # Run preliminary compliance check
        validation_result = self._run_preliminary_compliance_check(assessment)

        if validation_result.is_valid:
            # Update assessment status
            assessment.status = AssessmentStatus.SUBMITTED_FOR_REVIEW
            assessment.submitted_at = datetime.utcnow()
            db.commit()
            db.refresh(assessment)

        return validation_result

    def _run_preliminary_compliance_check(
        self, assessment: Assessment
    ) -> AssessmentSubmissionValidation:
        """
        Run preliminary compliance check on assessment.

        Business Rule: No "YES" answers without MOVs (Means of Verification).

        Args:
            db: Database session
            assessment: Assessment to validate

        Returns:
            AssessmentSubmissionValidation with validation results
        """
        errors = []
        warnings: list[Dict[str, Any]] = []

        for response in assessment.responses:
            if not response.response_data:
                continue

            # Check for "YES" answers without MOVs
            has_yes_answer = self._has_yes_answer(response.response_data)
            has_movs = len(response.movs) > 0

            if has_yes_answer and not has_movs:
                errors.append(
                    {
                        "indicator_id": response.indicator_id,
                        "indicator_name": response.indicator.name,
                        "error": "YES answer requires Means of Verification (MOV)",
                    }
                )

        return AssessmentSubmissionValidation(
            is_valid=len(errors) == 0, errors=errors, warnings=warnings
        )

    def _has_yes_answer(self, response_data: Dict[str, Any]) -> bool:
        """Check if response data contains any "YES" answers."""
        for value in response_data.values():
            if isinstance(value, str) and value.upper() == "YES":
                return True
            elif isinstance(value, bool) and value:
                return True
        return False

    def create_mov(self, db: Session, mov_create: MOVCreate) -> MOV:
        """
        Create a new MOV (Means of Verification) record.
        Also recalculates parent AssessmentResponse's completion status.

        Args:
            db: Database session
            mov_create: MOV creation data

        Returns:
            Created MOV object
        """
        from sqlalchemy.orm import joinedload
        
        db_mov = MOV(
            filename=mov_create.filename,
            original_filename=mov_create.original_filename,
            file_size=mov_create.file_size,
            content_type=mov_create.content_type,
            storage_path=mov_create.storage_path,
            response_id=mov_create.response_id,
            status=MOVStatus.UPLOADED,
        )

        try:
            db.add(db_mov)
            db.flush()  # Flush to get the MOV ID before recalculating
            print(f"[DEBUG] MOV created with ID: {db_mov.id}, filename: {db_mov.filename}")
        except Exception as e:
            print(f"[ERROR] Failed to add/flush MOV: {str(e)}")
            db.rollback()
            raise
        
        # Recalculate parent response completion status
        if mov_create.response_id:
            db_response = (
                db.query(AssessmentResponse)
                .options(
                    joinedload(AssessmentResponse.movs),
                    joinedload(AssessmentResponse.indicator)
                )
                .filter(AssessmentResponse.id == mov_create.response_id)
                .first()
            )
            if db_response:
                prev = bool(db_response.is_completed)
                new = self.recompute_response_completion(db_response)
                print(f"[DEBUG] After MOV create: response_id={db_response.id} prev={prev} new={new} movs={len(db_response.movs)}")
                db.add(db_response)
                
                # Touch the parent assessment's updated_at to bust frontend cache
                if db_response.assessment_id:
                    from datetime import datetime, timezone
                    db_assessment = db.query(Assessment).filter(Assessment.id == db_response.assessment_id).first()
                    if db_assessment:
                        db_assessment.updated_at = datetime.now(timezone.utc)
                        db.add(db_assessment)
        
        try:
            db.commit()
            print(f"[DEBUG] MOV commit successful. ID={db_mov.id}")
        except Exception as e:
            print(f"[ERROR] MOV commit failed: {str(e)}")
            db.rollback()
            raise
            
        db.refresh(db_mov)
        return db_mov

    def delete_mov(self, db: Session, mov_id: int) -> bool:
        """
        Atomically delete a MOV record and its corresponding storage file.
        Also recalculates parent AssessmentResponse's completion status.
        """
        from app.db.base import supabase_admin

        db_mov = db.query(MOV).filter(MOV.id == mov_id).first()
        if not db_mov:
            return False
        # Always load parent response + movs eagerly.
        db_response = (
            db.query(AssessmentResponse)
            .options(joinedload(AssessmentResponse.movs), joinedload(AssessmentResponse.indicator))
            .filter(AssessmentResponse.id == db_mov.response_id)
            .first()
        )
        if not db_response:
            # Possible data corruption, but MOV is useless, so delete just the file and MOV.
            db_response = None
        storage_path = db_mov.storage_path
        # Step 1: Synchronously delete storage file. Fail if deletion fails.
        if not supabase_admin:
            raise RuntimeError("Supabase admin client not configured")
        try:
            storage_res = supabase_admin.storage.from_('movs').remove([storage_path])
            # The supabase-py client raises on HTTP/storage network error, but check for errors in resp too
            if isinstance(storage_res, dict) and storage_res.get('error'):
                raise Exception(f"Supabase file delete error: {storage_res['error']}")
        except Exception as e:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                f"Failed to delete MOV file from storage: {str(e)}",
            )
        # Step 2: Delete MOV and update parent completion inside transaction
        try:
            db.delete(db_mov)
            if db_response is not None:
                # Remove the NOW deleted MOV from in-memory .movs list before recompute
                db_response.movs = [m for m in db_response.movs if m.id != db_mov.id]
                prev = bool(db_response.is_completed)
                new = self.recompute_response_completion(db_response)
                print(f"[DEBUG] After MOV delete: response_id={db_response.id} prev={prev} new={new} movs={len(db_response.movs)}")
                db.add(db_response)
                
                # Touch the parent assessment's updated_at to bust frontend cache
                if db_response.assessment_id:
                    from datetime import datetime, timezone
                    db_assessment = db.query(Assessment).filter(Assessment.id == db_response.assessment_id).first()
                    if db_assessment:
                        db_assessment.updated_at = datetime.now(timezone.utc)
                        db.add(db_assessment)
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                f"Error deleting MOV and updating completion: {str(e)}",
            )
        return True

    def create_feedback_comment(
        self, db: Session, comment_create: FeedbackCommentCreate
    ) -> FeedbackComment:
        """
        Create a new feedback comment.

        Args:
            db: Database session
            comment_create: Comment creation data

        Returns:
            Created FeedbackComment object
        """
        db_comment = FeedbackComment(
            comment=comment_create.comment,
            comment_type=comment_create.comment_type,
            response_id=comment_create.response_id,
            assessor_id=comment_create.assessor_id,
        )

        db.add(db_comment)
        db.commit()
        db.refresh(db_comment)
        return db_comment

    def get_dashboard_data(self, db: Session, blgu_user_id: int) -> Dict[str, Any]:
        """
        Get dashboard-specific data with progress calculations.

        Args:
            db: Database session
            blgu_user_id: ID of the BLGU user

        Returns:
            Dictionary with dashboard-specific data
        """
        # Get user information with barangay details
        from app.db.models.user import User

        user = (
            db.query(User)
            .options(joinedload(User.barangay))
            .filter(User.id == blgu_user_id)
            .first()
        )

        if not user:
            return {"error": "User not found"}

        # Get assessment
        assessment = self.get_assessment_for_blgu(db, blgu_user_id)
        if not assessment:
            assessment = self.create_assessment(
                db, AssessmentCreate(blgu_user_id=blgu_user_id)
            )

        # Calculate progress metrics
        progress_metrics = self.calculate_progress_metrics(assessment.id, db)

        # Get governance area progress
        governance_area_progress = self.get_governance_area_progress(db, assessment.id)

        # Get barangay information
        barangay_name = (
            getattr(user.barangay, "name", "Unknown") if user.barangay else "Unknown"
        )

        # Get current year settings
        year_config = self.get_year_configuration()
        current_year = year_config["current_year"]
        performance_year = year_config["performance_year"]
        assessment_year = year_config["assessment_year"]

        return {
            "user": {
                "id": getattr(user, "id"),
                "name": getattr(user, "name", "Unknown"),
                "barangay_name": barangay_name,
                "role": user.role.value
                if hasattr(user.role, "value")
                else str(user.role),
            },
            "assessment": {
                "id": assessment.id,
                "status": assessment.status.value
                if hasattr(assessment.status, "value")
                else str(assessment.status),
                "created_at": assessment.created_at.isoformat(),
                "updated_at": assessment.updated_at.isoformat(),
                "submitted_at": assessment.submitted_at.isoformat()
                if assessment.submitted_at
                else None,
            },
            "years": {
                "current_year": current_year,
                "performance_year": performance_year,
                "assessment_year": assessment_year,
            },
            "year_configuration": year_config,
            "progress_metrics": progress_metrics,
            "governance_area_progress": governance_area_progress,
        }

    def calculate_progress_metrics(
        self, assessment_id: int, db: Session
    ) -> Dict[str, Any]:
        """
        Calculate progress statistics for dashboard.

        Args:
            assessment_id: ID of the assessment
            db: Database session

        Returns:
            Dictionary with progress metrics
        """
        # Get assessment with responses
        assessment = self.get_assessment_with_responses(db, assessment_id)
        if not assessment:
            return {
                "total_indicators": 0,
                "completed_indicators": 0,
                "completion_percentage": 0.0,
                "responses_requiring_rework": 0,
                "responses_with_feedback": 0,
                "responses_with_movs": 0,
                "progress": {
                    "current": 0,
                    "total": 0,
                    "percentage": 0.0,
                },
            }

        # Get all governance areas to count total indicators
        governance_areas = (
            db.query(GovernanceArea)
            .options(joinedload(GovernanceArea.indicators))
            .all()
        )

        # Calculate total indicators
        total_indicators = sum(len(area.indicators) for area in governance_areas)

        # Calculate completed indicators
        completed_indicators = sum(
            1 for response in assessment.responses if response.is_completed
        )

        # Calculate completion percentage
        completion_percentage = (
            (completed_indicators / total_indicators * 100)
            if total_indicators > 0
            else 0
        )

        # Count responses requiring rework
        responses_requiring_rework = sum(
            1 for response in assessment.responses if response.requires_rework
        )

        # Count responses with feedback
        responses_with_feedback = sum(
            1
            for response in assessment.responses
            if len(response.feedback_comments) > 0
        )

        # Count responses with MOVs
        responses_with_movs = sum(
            1 for response in assessment.responses if len(response.movs) > 0
        )

        return {
            "total_indicators": total_indicators,
            "completed_indicators": completed_indicators,
            "completion_percentage": completion_percentage,
            "responses_requiring_rework": responses_requiring_rework,
            "responses_with_feedback": responses_with_feedback,
            "responses_with_movs": responses_with_movs,
            "progress": {
                "current": completed_indicators,
                "total": total_indicators,
                "percentage": completion_percentage,
            },
        }

    def get_governance_area_progress(
        self, db: Session, assessment_id: int
    ) -> List[Dict]:
        """
        Get progress data for each governance area.

        Args:
            db: Database session
            assessment_id: ID of the assessment

        Returns:
            List of dictionaries with governance area progress data
        """
        # Get assessment with responses
        assessment = self.get_assessment_with_responses(db, assessment_id)
        if not assessment:
            return []

        # Get all governance areas with indicators
        governance_areas = (
            db.query(GovernanceArea)
            .options(joinedload(GovernanceArea.indicators))
            .all()
        )

        # Create response lookup
        response_lookup = {r.indicator_id: r for r in assessment.responses}

        # Build governance area progress
        governance_area_progress = []
        for area in governance_areas:
            # Filter out areas that are just containers (parent areas with no direct indicators)
            # Only include areas that have actual indicators or are leaf-level areas
            if not area.indicators:
                continue
                
            # Check if this area is just a container by looking for indicators with parent_id
            # If all indicators have parent_id, this area is just a container
            has_direct_indicators = any(indicator.parent_id is None for indicator in area.indicators)
            if not has_direct_indicators:
                continue
                
            area_responses = [
                response_lookup.get(indicator.id)
                for indicator in area.indicators
                if response_lookup.get(indicator.id)
            ]

            completed_in_area = sum(
                1 for response in area_responses if response and response.is_completed
            )
            rework_in_area = sum(
                1
                for response in area_responses
                if response and response.requires_rework
            )

            area_completion_percentage = (
                (completed_in_area / len(area.indicators) * 100)
                if len(area.indicators) > 0
                else 0
            )

            governance_area_progress.append(
                {
                    "id": getattr(area, "id"),
                    "name": getattr(area, "name"),
                    "area_type": area.area_type.value,
                    "total_indicators": len(area.indicators),
                    "completed_indicators": completed_in_area,
                    "completion_percentage": area_completion_percentage,
                    "requires_rework_count": rework_in_area,
                    "indicators": [
                        {
                            "id": getattr(indicator, "id"),
                            "name": indicator.name,
                            "description": indicator.description,
                            "has_response": indicator.id in response_lookup,
                            "is_completed": response_lookup.get(
                                indicator.id, {}
                            ).is_completed
                            if indicator.id in response_lookup
                            else False,
                            "requires_rework": response_lookup.get(
                                indicator.id, {}
                            ).requires_rework
                            if indicator.id in response_lookup
                            else False,
                        }
                        for indicator in area.indicators
                    ],
                }
            )

        return governance_area_progress

    def get_user_barangay_info(self, db: Session, user_id: int) -> Dict[str, Any]:
        """
        Get user barangay information with performance and assessment year configuration.

        Args:
            db: Database session
            user_id: ID of the user

        Returns:
            Dictionary with user barangay information and year settings
        """
        from app.db.models.user import User

        user = (
            db.query(User)
            .options(joinedload(User.barangay))
            .filter(User.id == user_id)
            .first()
        )

        if not user:
            return {"error": "User not found"}

        # Get barangay information
        barangay_name = (
            getattr(user.barangay, "name", "Unknown") if user.barangay else "Unknown"
        )
        barangay_id = getattr(user.barangay, "id", None) if user.barangay else None

        # Get current year for configuration
        current_year = datetime.now().year

        # TODO: In the future, these could be configurable settings from a system settings table
        # For now, we'll use the current year
        performance_year = current_year
        assessment_year = current_year

        return {
            "user": {
                "id": getattr(user, "id"),
                "name": getattr(user, "name", "Unknown"),
                "email": getattr(user, "email", "Unknown"),
                "role": user.role.value
                if hasattr(user.role, "value")
                else str(user.role),
                "is_active": getattr(user, "is_active", True),
            },
            "barangay": {
                "id": barangay_id,
                "name": barangay_name,
            },
            "years": {
                "current_year": current_year,
                "performance_year": performance_year,
                "assessment_year": assessment_year,
            },
            "configuration": {
                "auto_create_assessment": True,  # TODO: Make configurable
                "allow_multiple_assessments": False,  # TODO: Make configurable
                "assessment_deadline": None,  # TODO: Implement deadline system
            },
        }

    def get_user_profile_with_barangay(
        self, db: Session, user_id: int
    ) -> Dict[str, Any]:
        """
        Get comprehensive user profile with barangay information and settings.

        Args:
            db: Database session
            user_id: ID of the user

        Returns:
            Dictionary with complete user profile and barangay information
        """
        from app.db.models.user import User

        user = (
            db.query(User)
            .options(joinedload(User.barangay))
            .filter(User.id == user_id)
            .first()
        )

        if not user:
            return {"error": "User not found"}

        # Get barangay information
        barangay_info = {}
        if user.barangay:
            barangay_info = {
                "id": getattr(user.barangay, "id"),
                "name": getattr(user.barangay, "name", "Unknown"),
            }
        else:
            barangay_info = {
                "id": None,
                "name": "No Barangay Assigned",
            }

        # Get year configuration
        year_config = self.get_year_configuration()

        # Get user's assessment information
        assessment = self.get_assessment_for_blgu(db, user_id)
        assessment_info = {}
        if assessment:
            assessment_info = {
                "id": assessment.id,
                "status": assessment.status.value
                if hasattr(assessment.status, "value")
                else str(assessment.status),
                "created_at": assessment.created_at.isoformat(),
                "updated_at": assessment.updated_at.isoformat(),
                "submitted_at": assessment.submitted_at.isoformat()
                if assessment.submitted_at
                else None,
            }

        return {
            "user_profile": {
                "id": getattr(user, "id"),
                "name": getattr(user, "name", "Unknown"),
                "email": getattr(user, "email", "Unknown"),
                "role": user.role.value
                if hasattr(user.role, "value")
                else str(user.role),
                "is_active": getattr(user, "is_active", True),
                "is_superuser": getattr(user, "is_superuser", False),
                "must_change_password": getattr(user, "must_change_password", True),
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat(),
            },
            "barangay": barangay_info,
            "assessment": assessment_info,
            "year_settings": {
                "performance_year": year_config["performance_year"],
                "assessment_year": year_config["assessment_year"],
                "current_year": year_config["current_year"],
            },
            "configuration": {
                "auto_create_assessment": True,
                "allow_multiple_assessments": False,
                "assessment_deadline": None,
            },
        }

    def get_year_configuration(self) -> Dict[str, Any]:
        """
        Get performance year and assessment year configuration from system settings.

        Returns:
            Dictionary with year configuration
        """
        # TODO: In the future, this could query a system_settings table
        # For now, we'll return default configuration based on current year
        current_year = datetime.now().year

        return {
            "current_year": current_year,
            "performance_year": current_year,
            "assessment_year": current_year,
            "fiscal_year_start": 1,  # January
            "fiscal_year_end": 12,  # December
            "assessment_period_start": datetime(current_year, 1, 1).isoformat(),
            "assessment_period_end": datetime(current_year, 12, 31).isoformat(),
            "deadline_extensions": [],  # TODO: Implement deadline extension system
            "configuration_source": "default",  # Could be "database" or "config_file"
        }

    def get_all_assessor_feedback(
        self, db: Session, assessment_id: int
    ) -> List[Dict[str, Any]]:
        """
        Collect and format all assessor feedback comments for an assessment.

        Args:
            db: Database session
            assessment_id: ID of the assessment

        Returns:
            List of dictionaries with formatted feedback comments
        """
        # Get all feedback comments for the assessment
        feedback_comments = (
            db.query(FeedbackComment)
            .join(AssessmentResponse)
            .options(
                joinedload(FeedbackComment.assessor),
                joinedload(FeedbackComment.response).joinedload(
                    AssessmentResponse.indicator
                ),
            )
            .filter(AssessmentResponse.assessment_id == assessment_id)
            .order_by(FeedbackComment.created_at.desc())
            .all()
        )

        # Format feedback comments
        formatted_feedback = []
        for comment in feedback_comments:
            formatted_feedback.append(
                {
                    "id": comment.id,
                    "comment": comment.comment,
                    "comment_type": comment.comment_type,
                    "created_at": comment.created_at.isoformat(),
                    "updated_at": comment.created_at.isoformat(),  # Using created_at as updated_at for now
                    "assessor": {
                        "id": getattr(comment.assessor, "id"),
                        "name": f"{getattr(comment.assessor, 'first_name', '')} {getattr(comment.assessor, 'last_name', '')}".strip(),
                        "role": comment.assessor.role.value
                        if hasattr(comment.assessor.role, "value")
                        else str(comment.assessor.role),
                        "email": getattr(comment.assessor, "email", "Unknown"),
                    },
                    "indicator": {
                        "id": getattr(comment.response.indicator, "id"),
                        "name": comment.response.indicator.name,
                        "description": comment.response.indicator.description,
                        "governance_area": comment.response.indicator.governance_area.name,
                    },
                    "response": {
                        "id": comment.response.id,
                        "is_completed": comment.response.is_completed,
                        "requires_rework": comment.response.requires_rework,
                        "response_data": comment.response.response_data,
                    },
                }
            )

        return formatted_feedback

    def get_feedback_by_governance_area(
        self, db: Session, assessment_id: int
    ) -> Dict[str, Dict[str, Any]]:
        """
        Get feedback comments organized by governance area.

        Args:
            db: Database session
            assessment_id: ID of the assessment

        Returns:
            Dictionary with governance area names as keys and feedback lists as values
        """
        # Get all feedback comments
        all_feedback = self.get_all_assessor_feedback(db, assessment_id)

        # Group feedback by governance area
        feedback_by_area = {}
        for feedback in all_feedback:
            area_name = feedback["indicator"]["governance_area"]
            if area_name not in feedback_by_area:
                feedback_by_area[area_name] = []
            feedback_by_area[area_name].append(feedback)

        # Add summary statistics for each area
        area_summary = {}
        for area_name, feedback_list in feedback_by_area.items():
            area_summary[area_name] = {
                "area_name": area_name,
                "total_feedback": len(feedback_list),
                "feedback_by_type": self._count_feedback_by_type(feedback_list),
                "recent_feedback": sorted(
                    feedback_list, key=lambda x: x["created_at"], reverse=True
                )[:3],
                "all_feedback": feedback_list,
            }

        return area_summary

    def get_recent_feedback_with_timestamps(
        self, db: Session, assessment_id: int, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get recent feedback comments with detailed timestamps.

        Args:
            db: Database session
            assessment_id: ID of the assessment
            limit: Maximum number of recent feedback to return

        Returns:
            List of dictionaries with recent feedback and timestamp details
        """
        # Get recent feedback comments
        recent_feedback = (
            db.query(FeedbackComment)
            .join(AssessmentResponse)
            .options(
                joinedload(FeedbackComment.assessor),
                joinedload(FeedbackComment.response).joinedload(
                    AssessmentResponse.indicator
                ),
            )
            .filter(AssessmentResponse.assessment_id == assessment_id)
            .order_by(FeedbackComment.created_at.desc())
            .limit(limit)
            .all()
        )

        # Format with detailed timestamps
        formatted_recent_feedback = []
        for comment in recent_feedback:
            created_at = comment.created_at
            formatted_recent_feedback.append(
                {
                    "id": comment.id,
                    "comment": comment.comment,
                    "comment_type": comment.comment_type,
                    "timestamps": {
                        "created_at": created_at.isoformat(),
                        "created_at_human": self._format_human_timestamp(created_at),
                        "created_at_relative": self._format_relative_timestamp(
                            created_at
                        ),
                        "day_of_week": created_at.strftime("%A"),
                        "time_of_day": created_at.strftime("%I:%M %p"),
                    },
                    "assessor": {
                        "id": getattr(comment.assessor, "id"),
                        "name": f"{getattr(comment.assessor, 'first_name', '')} {getattr(comment.assessor, 'last_name', '')}".strip(),
                        "role": comment.assessor.role.value
                        if hasattr(comment.assessor.role, "value")
                        else str(comment.assessor.role),
                    },
                    "indicator": {
                        "id": getattr(comment.response.indicator, "id"),
                        "name": comment.response.indicator.name,
                        "governance_area": comment.response.indicator.governance_area.name,
                    },
                    "response": {
                        "id": comment.response.id,
                        "is_completed": comment.response.is_completed,
                        "requires_rework": comment.response.requires_rework,
                    },
                }
            )

        return formatted_recent_feedback

    def _count_feedback_by_type(
        self, feedback_list: List[Dict[str, Any]]
    ) -> Dict[str, int]:
        """Helper method to count feedback by comment type."""
        type_counts = {}
        for feedback in feedback_list:
            comment_type = feedback["comment_type"]
            type_counts[comment_type] = type_counts.get(comment_type, 0) + 1
        return type_counts

    def _format_human_timestamp(self, timestamp: datetime) -> str:
        """Helper method to format timestamp in human-readable format."""
        return timestamp.strftime("%B %d, %Y at %I:%M %p")

    def _format_relative_timestamp(self, timestamp: datetime) -> str:
        """Helper method to format timestamp as relative time."""
        now = datetime.now()
        diff = now - timestamp

        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days != 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        else:
            return "Just now"

    def get_comprehensive_feedback_summary(
        self, db: Session, assessment_id: int
    ) -> Dict[str, Any]:
        """
        Get comprehensive feedback summary including all feedback data.

        Args:
            db: Database session
            assessment_id: ID of the assessment

        Returns:
            Dictionary with comprehensive feedback summary
        """
        # Get all feedback data
        all_feedback = self.get_all_assessor_feedback(db, assessment_id)
        feedback_by_area = self.get_feedback_by_governance_area(db, assessment_id)
        recent_feedback = self.get_recent_feedback_with_timestamps(
            db, assessment_id, limit=10
        )

        # Calculate feedback statistics
        total_feedback = len(all_feedback)
        feedback_by_type = self._count_feedback_by_type(all_feedback)

        # Get unique assessors
        assessors = set()
        for feedback in all_feedback:
            assessors.add(feedback["assessor"]["name"])

        # Get feedback by governance area summary
        area_summary = {}
        for area_name, area_data in feedback_by_area.items():
            area_summary[area_name] = {
                "total_feedback": area_data["total_feedback"],
                "feedback_by_type": area_data["feedback_by_type"],
                "has_recent_feedback": len(area_data["recent_feedback"]) > 0,
            }

        return {
            "summary": {
                "total_feedback": total_feedback,
                "unique_assessors": len(assessors),
                "assessor_names": list(assessors),
                "feedback_by_type": feedback_by_type,
                "governance_areas_with_feedback": len(feedback_by_area),
            },
            "recent_feedback": recent_feedback,
            "feedback_by_area": area_summary,
            "all_feedback": all_feedback,
            "detailed_feedback_by_area": feedback_by_area,
        }

    def get_assessment_dashboard_data(
        self, db: Session, blgu_user_id: int
    ) -> Optional[AssessmentDashboardResponse]:
        """
        Get dashboard data for a BLGU user's assessment.

        Args:
            db: Database session
            blgu_user_id: ID of the BLGU user

        Returns:
            AssessmentDashboardResponse with dashboard data or None if not found
        """
        # Get user information to access barangay name
        from app.db.models.user import User

        user = (
            db.query(User)
            .options(joinedload(User.barangay))
            .filter(User.id == blgu_user_id)
            .first()
        )
        if not user:
            return None

        # Get barangay name
        barangay_name = (
            getattr(user.barangay, "name", "Unknown") if user.barangay else "Unknown"
        )

        # Get current year for performance and assessment years
        current_year = datetime.now().year

        # Get or create assessment
        assessment = self.get_assessment_for_blgu(db, blgu_user_id)
        if not assessment:
            assessment = self.create_assessment(
                db, AssessmentCreate(blgu_user_id=blgu_user_id)
            )

        # Get all governance areas with their indicators
        governance_areas = (
            db.query(GovernanceArea)
            .options(joinedload(GovernanceArea.indicators))
            .all()
        )

        # Get all responses for this assessment
        responses = (
            db.query(AssessmentResponse)
            .options(
                joinedload(AssessmentResponse.indicator),
                joinedload(AssessmentResponse.movs),
                joinedload(AssessmentResponse.feedback_comments),
            )
            .filter(AssessmentResponse.assessment_id == assessment.id)
            .all()
        )

        # Create response lookup by indicator_id
        response_lookup = {r.indicator_id: r for r in responses}

        # Calculate overall statistics
        total_indicators = sum(len(area.indicators) for area in governance_areas)
        completed_indicators = sum(1 for response in responses if response.is_completed)
        completion_percentage = (
            (completed_indicators / total_indicators * 100)
            if total_indicators > 0
            else 0
        )

        # Count responses requiring rework
        responses_requiring_rework = sum(
            1 for response in responses if response.requires_rework
        )

        # Count responses with feedback
        responses_with_feedback = sum(
            1 for response in responses if len(response.feedback_comments) > 0
        )

        # Count responses with MOVs
        responses_with_movs = sum(1 for response in responses if len(response.movs) > 0)

        # Build governance area progress
        governance_area_progress = []
        for area in governance_areas:
            # Filter out areas that are just containers (parent areas with no direct indicators)
            # Only include areas that have actual indicators or are leaf-level areas
            if not area.indicators:
                continue
                
            # Check if this area is just a container by looking for indicators with parent_id
            # If all indicators have parent_id, this area is just a container
            has_direct_indicators = any(indicator.parent_id is None for indicator in area.indicators)
            if not has_direct_indicators:
                continue
                
            area_responses = [
                response_lookup.get(indicator.id)
                for indicator in area.indicators
                if response_lookup.get(indicator.id)
            ]

            completed_in_area = sum(
                1 for response in area_responses if response and response.is_completed
            )
            rework_in_area = sum(
                1
                for response in area_responses
                if response and response.requires_rework
            )

            area_completion_percentage = (
                (completed_in_area / len(area.indicators) * 100)
                if len(area.indicators) > 0
                else 0
            )

            governance_area_progress.append(
                GovernanceAreaProgress(
                    id=getattr(area, "id"),
                    name=getattr(area, "name"),
                    area_type=area.area_type.value,
                    total_indicators=len(area.indicators),
                    completed_indicators=completed_in_area,
                    completion_percentage=area_completion_percentage,
                    requires_rework_count=rework_in_area,
                )
            )

        # Get recent feedback with enhanced formatting
        recent_feedback_data = self.get_recent_feedback_with_timestamps(
            db, assessment.id, limit=5
        )

        # Get comprehensive feedback summary (for future use)
        # feedback_summary = self.get_comprehensive_feedback_summary(db, assessment.id)

        # Create progress object
        progress = ProgressSummary(
            current=completed_indicators,
            total=total_indicators,
            percentage=completion_percentage,
        )

        # Build dashboard stats
        dashboard_stats = AssessmentDashboardStats(
            total_indicators=total_indicators,
            completed_indicators=completed_indicators,
            completion_percentage=completion_percentage,
            progress=progress,
            responses_requiring_rework=responses_requiring_rework,
            responses_with_feedback=responses_with_feedback,
            responses_with_movs=responses_with_movs,
            governance_areas=governance_area_progress,
            assessment_status=assessment.status,
            created_at=assessment.created_at,
            updated_at=assessment.updated_at,
            submitted_at=assessment.submitted_at,
        )

        return AssessmentDashboardResponse(
            assessment_id=assessment.id,
            blgu_user_id=blgu_user_id,
            barangay_name=barangay_name,
            performance_year=current_year,
            assessment_year=current_year,
            stats=dashboard_stats,
            feedback=recent_feedback_data,
            upcoming_deadlines=[],  # TODO: Implement deadline logic if needed
        )

    def get_assessment_stats(self, db: Session) -> Dict[str, Any]:
        """
        Get assessment statistics for admin dashboard.

        Args:
            db: Database session

        Returns:
            Dictionary with assessment statistics
        """
        total_assessments = db.query(Assessment).count()

        # Assessments by status
        status_stats = (
            db.query(Assessment.status, func.count(Assessment.id))
            .group_by(Assessment.status)
            .all()
        )

        # Responses by completion status
        total_responses = db.query(AssessmentResponse).count()
        completed_responses = (
            db.query(AssessmentResponse).filter(AssessmentResponse.is_completed).count()
        )
        responses_requiring_rework = (
            db.query(AssessmentResponse)
            .filter(AssessmentResponse.requires_rework)
            .count()
        )

        return {
            "total_assessments": total_assessments,
            "assessments_by_status": {status: count for status, count in status_stats},
            "total_responses": total_responses,
            "completed_responses": completed_responses,
            "responses_requiring_rework": responses_requiring_rework,
        }

    def get_all_validated_assessments(
        self, db: Session, status: Optional[AssessmentStatus] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all validated assessments with compliance status and area results.

        Used for MLGOO reports page to display all barangay compliance statuses.

        Args:
            db: Database session
            status: Optional filter by assessment status (defaults to VALIDATED)

        Returns:
            List of dictionaries with assessment details including compliance status
        """
        from app.db.models.user import User

        # Query assessments with related user and barangay data
        query = (
            db.query(Assessment)
            .join(User, Assessment.blgu_user_id == User.id)
            .options(joinedload(Assessment.blgu_user).joinedload(User.barangay))
        )

        # Filter by status if provided
        filter_status = status or AssessmentStatus.VALIDATED
        query = query.filter(Assessment.status == filter_status)

        # Order by updated_at descending
        query = query.order_by(Assessment.updated_at.desc())

        assessments = query.all()

        # Build response list
        assessment_list = []
        for assessment in assessments:
            # Get barangay name from relationship
            barangay_name = "Unknown"
            if assessment.blgu_user:
                if (
                    hasattr(assessment.blgu_user, "barangay")
                    and assessment.blgu_user.barangay
                ):
                    barangay_name = assessment.blgu_user.barangay.name

            assessment_list.append(
                {
                    "id": assessment.id,
                    "status": assessment.status.value if assessment.status else None,
                    "final_compliance_status": assessment.final_compliance_status.value
                    if assessment.final_compliance_status
                    else None,
                    "area_results": assessment.area_results,
                    "ai_recommendations": assessment.ai_recommendations,
                    "barangay_name": barangay_name,
                    "blgu_user_name": assessment.blgu_user.name
                    if assessment.blgu_user
                    else "Unknown",
                    "validated_at": assessment.validated_at.isoformat()
                    if assessment.validated_at
                    else None,
                    "updated_at": assessment.updated_at.isoformat()
                    if assessment.updated_at
                    else None,
                }
            )

        return assessment_list


# Create service instance
assessment_service = AssessmentService()
