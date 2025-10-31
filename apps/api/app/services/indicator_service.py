"""
🧪 Indicator Service
Seed and manage mock indicators for development/testing.
"""

from typing import Any, Dict, List

from sqlalchemy.orm import Session  # type: ignore[reportMissingImports]

from app.db.models.governance_area import Indicator


class IndicatorService:
    """Service for managing indicator data, including mock seeding."""

    def seed_mock_indicators(self, db: Session) -> None:
        """
        Seed a small set of mock indicators if none exist.

        This creates simple, frontend-friendly `form_schema` payloads.
        """
        # Avoid duplicate seeding
        existing_count = db.query(Indicator).count()
        if existing_count > 0:
            return

        sample_indicators: List[Dict[str, Any]] = [
            {
                "name": "Budget Planning and Execution",
                "description": "Barangay maintains an annual budget plan and tracks execution.",
                "form_schema": {
                    "type": "object",
                    "properties": {
                        "has_budget_plan": {"type": "boolean", "title": "Has Budget Plan"},
                        "budget_amount": {"type": "number", "title": "Budget Amount"},
                        "notes": {"type": "string", "title": "Notes"},
                    },
                    "required": ["has_budget_plan"],
                },
                "governance_area_id": 1,
            },
            {
                "name": "Disaster Risk Reduction Plan",
                "description": "Comprehensive DRR plan in place and updated.",
                "form_schema": {
                    "type": "object",
                    "properties": {
                        "has_drr_plan": {"type": "boolean", "title": "Has DRR Plan"},
                        "plan_year": {"type": "string", "title": "Plan Year"},
                    },
                    "required": ["has_drr_plan"],
                },
                "governance_area_id": 2,
            },
            {
                "name": "Peace and Order Council",
                "description": "Functional Barangay Peace and Order Council.",
                "form_schema": {
                    "type": "object",
                    "properties": {
                        "meets_quarterly": {"type": "boolean", "title": "Meets Quarterly"},
                        "num_meetings": {"type": "number", "title": "Meetings Held"},
                    },
                    "required": ["meets_quarterly"],
                },
                "governance_area_id": 3,
            },
        ]

        for data in sample_indicators:
            db.add(Indicator(**data))

        db.commit()

    def seed_area1_financial_indicators(self, db: Session) -> None:
        """
        Seed the Core Governance Area 1 (Financial Administration and Sustainability)
        indicators based on the provided checklist.

        Creates the following indicators if none exist for area 1:
        1.1 Compliance with the Barangay Full Disclosure Policy (BFDPP) Board
        1.2 Innovations on Revenue Generation or Exercise of Corporate Powers
        1.3 Approval of the Barangay Budget on the Specified Timeframe
        """
        # Desired indicators for Area 1
        area1_indicators = [
            {
                "name": "1.1 - Compliance with the Barangay Full Disclosure Policy (BFDP) Board",
                "description": (
                    "Posted CY 2023 financial documents in the BFDP board as per DILG MCs."
                ),
                "form_schema": {
                    "type": "object",
                    "title": "1.1 Minimum Requirements and MOVs",
                    "properties": {
                        "section_1_1_1": {
                            "type": "object",
                            "title": "1.1.1 Posted CY 2023 financial documents",
                            "properties": {
                                "barangay_financial_report": {"type": "boolean", "title": "a) Barangay Financial Report"},
                                "barangay_budget": {"type": "boolean", "title": "b) Barangay Budget"},
                                "summary_income_exp": {"type": "boolean", "title": "c) Summary of Income and Expenditures"},
                                "twenty_percent_cout": {"type": "boolean", "title": "d) 20% CoUtilization"},
                                "annual_proc_plan": {"type": "boolean", "title": "e) Annual Procurement Plan / NTA component List"},
                                "list_notices_award": {"type": "boolean", "title": "f) List of Notices of Award (1st-3rd Qtr 2023)"},
                                "itemized_collections": {"type": "boolean", "title": "g) Itemized Monthly Collections & Disbursements (Jan-Sep 2023)"}
                            },
                            "required": []
                        },
                        "movs_1_1_1": {
                            "type": "array",
                            "title": "Required MOVs (1.1.1)",
                            "items": {"type": "string"},
                            "default": [
                                "Three (3) BFDP Monitoring Form A (1st-3rd quarter) signed by C/MLGOO, Punong Barangay, Barangay Secretary",
                                "Two (2) photos of BFDP board with barangay name (1 distant, 1 close-up)"
                            ],
                            "readOnly": True
                        },
                        "section_1_1_2": {
                            "type": "object",
                            "title": "1.1.2 Accomplished and signed BFR with received stamp",
                            "properties": {
                                "bfr_signed": {"type": "boolean", "title": "BFR signed and stamped by C/M Accountant"}
                            }
                        },
                        "movs_1_1_2": {
                            "type": "array",
                            "title": "Required MOV (1.1.2)",
                            "items": {"type": "string"},
                            "default": [
                                "Annex B of DBM-DOF-DILG JMC No. 2018-1"
                            ],
                            "readOnly": True
                        },
                        "notes": {"type": "string", "title": "Notes / Remarks"}
                    }
                },
                "governance_area_id": 1,
            },
            {
                "name": "1.2 - Innovations on Revenue Generation or Exercise of Corporate Powers",
                "description": (
                    "Increase in local resources for CY 2023 with supporting certifications."
                ),
                "form_schema": {
                    "type": "object",
                    "title": "1.2 Minimum Requirement and MOVs",
                    "properties": {
                        "increase_local_resources": {
                            "type": "boolean",
                            "title": "1.2.1 Increase in local resources in CY 2023"
                        },
                        "movs": {
                            "type": "array",
                            "title": "Required MOVs",
                            "items": {"type": "string"},
                            "default": [
                                "SRE for 2022 and 2023, signed by Barangay Treasurer and Punong Barangay",
                                "Certification on Increase in Local Resources signed by City/Municipal Treasurer or Budget Officer"
                            ],
                            "readOnly": True
                        },
                        "details": {"type": "string", "title": "Details"}
                    }
                },
                "governance_area_id": 1,
            },
            {
                "name": "1.3 - Approval of the Barangay Budget on the Specified Timeframe",
                "description": (
                    "Barangay Appropriation Ordinance approved on/before Dec 31, 2022 (considerations apply)."
                ),
                "form_schema": {
                    "type": "object",
                    "title": "1.3 Minimum Requirement and MOV",
                    "properties": {
                        "ordinance_approved": {
                            "type": "boolean",
                            "title": "1.3.1 Appropriation Ordinance approved on/before Dec 31, 2022 (or by Mar 31, 2023 consideration)"
                        },
                        "approval_date": {"type": "string", "title": "Approval Date"},
                        "movs": {
                            "type": "array",
                            "title": "Required MOV",
                            "items": {"type": "string"},
                            "default": [
                                "Approved Barangay Appropriation Ordinance signed by SBMs, SK Chairperson, Barangay Secretary, and Punong Barangay"
                            ],
                            "readOnly": True
                        },
                        "notes": {"type": "string", "title": "Notes / Remarks"}
                    }
                },
                "governance_area_id": 1,
            },
        ]
        # Fetch existing names for Area 1
        existing = (
            db.query(Indicator)
            .filter(Indicator.governance_area_id == 1)
            .all()
        )
        existing_names = {i.name for i in existing}

        created = 0
        for data in area1_indicators:
            if data["name"] in existing_names:
                continue
            db.add(Indicator(**data))
            created += 1

        if created:
            db.commit()

    def normalize_area1_and_cleanup(self, db: Session) -> None:
        """Cleanup old sample indicators and normalize Area 1 names/schemas.

        - Removes the original sample "Budget Planning and Execution" in Area 1
        - Upgrades pre-existing Area 1 indicators without numeric prefixes to the
          canonical names and schemas defined in `seed_area1_financial_indicators`.
        """
        # Build the canonical specs we want to enforce
        canonical_specs: Dict[str, Dict[str, Any]] = {}
        # Reuse builder from seed method
        tmp_session_list: List[Dict[str, Any]] = []
        # construct same list as seed
        tmp_session_list.extend([
            {
                "name": "1.1 - Compliance with the Barangay Full Disclosure Policy (BFDP) Board",
                "description": "Posted CY 2023 financial documents in the BFDP board as per DILG MCs.",
                "form_schema": {
                    "type": "object",
                    "title": "1.1 Minimum Requirements and MOVs",
                    "properties": {
                        "section_1_1_1": {
                            "type": "object",
                            "title": "1.1.1 Posted CY 2023 financial documents",
                            "properties": {
                                "barangay_financial_report": {"type": "boolean", "title": "a) Barangay Financial Report"},
                                "barangay_budget": {"type": "boolean", "title": "b) Barangay Budget"},
                                "summary_income_exp": {"type": "boolean", "title": "c) Summary of Income and Expenditures"},
                                "twenty_percent_cout": {"type": "boolean", "title": "d) 20% CoUtilization"},
                                "annual_proc_plan": {"type": "boolean", "title": "e) Annual Procurement Plan / NTA component List"},
                                "list_notices_award": {"type": "boolean", "title": "f) List of Notices of Award (1st-3rd Qtr 2023)"},
                                "itemized_collections": {"type": "boolean", "title": "g) Itemized Monthly Collections & Disbursements (Jan-Sep 2023)"}
                            },
                        },
                        "movs_1_1_1": {
                            "type": "array",
                            "items": {"type": "string"},
                            "default": [
                                "Three (3) BFDP Monitoring Form A (1st-3rd quarter) signed by C/MLGOO, Punong Barangay, Barangay Secretary",
                                "Two (2) photos of BFDP board with barangay name (1 distant, 1 close-up)"
                            ],
                        },
                        "section_1_1_2": {
                            "type": "object",
                            "title": "1.1.2 Accomplished and signed BFR with received stamp",
                            "properties": {"bfr_signed": {"type": "boolean", "title": "BFR signed and stamped by C/M Accountant"}},
                        },
                        "movs_1_1_2": {
                            "type": "array",
                            "items": {"type": "string"},
                            "default": ["Annex B of DBM-DOF-DILG JMC No. 2018-1"],
                        },
                    },
                },
                "governance_area_id": 1,
            },
            {
                "name": "1.2 - Innovations on Revenue Generation or Exercise of Corporate Powers",
                "description": "Increase in local resources for CY 2023 with supporting certifications.",
                "form_schema": {
                    "type": "object",
                    "title": "1.2 Minimum Requirement and MOVs",
                    "properties": {
                        "increase_local_resources": {"type": "boolean", "title": "1.2.1 Increase in local resources in CY 2023"},
                        "movs": {
                            "type": "array",
                            "items": {"type": "string"},
                            "default": [
                                "SRE for 2022 and 2023, signed by Barangay Treasurer and Punong Barangay",
                                "Certification on Increase in Local Resources signed by City/Municipal Treasurer or Budget Officer",
                            ],
                        },
                    },
                },
                "governance_area_id": 1,
            },
            {
                "name": "1.3 - Approval of the Barangay Budget on the Specified Timeframe",
                "description": "Barangay Appropriation Ordinance approved on/before Dec 31, 2022 (considerations apply).",
                "form_schema": {
                    "type": "object",
                    "title": "1.3 Minimum Requirement and MOV",
                    "properties": {
                        "ordinance_approved": {"type": "boolean", "title": "1.3.1 Appropriation Ordinance approved on/before Dec 31, 2022 (or by Mar 31, 2023 consideration)"},
                        "approval_date": {"type": "string", "title": "Approval Date"},
                        "movs": {
                            "type": "array",
                            "items": {"type": "string"},
                            "default": [
                                "Approved Barangay Appropriation Ordinance signed by SBMs, SK Chairperson, Barangay Secretary, and Punong Barangay",
                            ],
                        },
                    },
                },
                "governance_area_id": 1,
            },
        ])
        for spec in tmp_session_list:
            canonical_specs[spec["name"]] = spec

        # Delete the old sample indicator in area 1 if it exists
        old_sample = (
            db.query(Indicator)
            .filter(Indicator.governance_area_id == 1, Indicator.name == "Budget Planning and Execution")
            .first()
        )
        if old_sample:
            db.delete(old_sample)

        # Upgrade legacy names (without numeric prefixes) to canonical ones
        legacy_map = {
            "Compliance with the Barangay Full Disclosure Policy (BFDPP) Board": "1.1 - Compliance with the Barangay Full Disclosure Policy (BFDP) Board",
            "Innovations on Revenue Generation or Exercise of Corporate Powers": "1.2 - Innovations on Revenue Generation or Exercise of Corporate Powers",
            "Approval of the Barangay Budget on the Specified Timeframe": "1.3 - Approval of the Barangay Budget on the Specified Timeframe",
        }

        area1_existing = (
            db.query(Indicator)
            .filter(Indicator.governance_area_id == 1)
            .all()
        )
        for ind in area1_existing:
            if ind.name in legacy_map:
                new_name = legacy_map[ind.name]
                spec = canonical_specs[new_name]
                ind.name = new_name
                ind.description = spec["description"]
                ind.form_schema = spec["form_schema"]

        db.commit()

    def enforce_area1_canonical_indicators(self, db: Session) -> None:
        """Ensure only the exact 1.1, 1.2, 1.3 indicators exist for Area 1.

        - Deletes any Area 1 indicators not matching the canonical names
        - Re-seeds missing canonical indicators with correct schema
        """
        allowed_names = {
            "1.1 - Compliance with the Barangay Full Disclosure Policy (BFDP) Board",
            "1.2 - Innovations on Revenue Generation or Exercise of Corporate Powers",
            "1.3 - Approval of the Barangay Budget on the Specified Timeframe",
        }

        # Delete any non-canonical indicators in Area 1
        area1_all = (
            db.query(Indicator)
            .filter(Indicator.governance_area_id == 1)
            .all()
        )
        for ind in area1_all:
            if ind.name not in allowed_names:
                db.delete(ind)

        db.commit()

        # Seed missing canonical ones
        self.seed_area1_financial_indicators(db)

    def enforce_area1_as_single_indicator(self, db: Session) -> None:
        """
        Collapse Area 1 into a SINGLE indicator that encapsulates 1.1, 1.2, 1.3
        as sub-sections in `form_schema` (no separate rows in DB).
        """
        # Remove all existing Area 1 indicators first
        existing = (
            db.query(Indicator)
            .filter(Indicator.governance_area_id == 1)
            .all()
        )
        for ind in existing:
            db.delete(ind)
        db.commit()

        # Create a single consolidated indicator for Area 1
        consolidated = Indicator(
            name="Financial Administration and Sustainability",
            description=(
                "The barangay has a comprehensive budget plan that is properly executed and monitored."
            ),
            form_schema={
                "type": "object",
                "title": "Financial Administration and Sustainability (1.1, 1.2, 1.3)",
                "properties": {
                    # 1.1
                    "section_1_1": {
                        "type": "object",
                        "title": "1.1 Compliance with the Barangay Full Disclosure Policy (BFDP) Board",
                        "properties": {
                            "section_1_1_1": {
                                "type": "object",
                                "title": "1.1.1 Posted CY 2023 financial documents",
                                "properties": {
                                    "barangay_financial_report": {"type": "boolean", "title": "a) Barangay Financial Report"},
                                    "barangay_budget": {"type": "boolean", "title": "b) Barangay Budget"},
                                    "summary_income_exp": {"type": "boolean", "title": "c) Summary of Income and Expenditures"},
                                    "twenty_percent_cout": {"type": "boolean", "title": "d) 20% CoUtilization"},
                                    "annual_proc_plan": {"type": "boolean", "title": "e) Annual Procurement Plan / NTA component List"},
                                    "list_notices_award": {"type": "boolean", "title": "f) List of Notices of Award (1st-3rd Qtr 2023)"},
                                    "itemized_collections": {"type": "boolean", "title": "g) Itemized Monthly Collections & Disbursements (Jan-Sep 2023)"},
                                },
                            },
                            "movs_1_1_1": {
                                "type": "array",
                                "items": {"type": "string"},
                                "default": [
                                    "Three (3) BFDP Monitoring Form A (1st-3rd quarter) signed by C/MLGOO, Punong Barangay, Barangay Secretary",
                                    "Two (2) photos of BFDP board with barangay name (1 distant, 1 close-up)",
                                ],
                                "readOnly": True,
                            },
                            "section_1_1_2": {
                                "type": "object",
                                "title": "1.1.2 Accomplished and signed BFR with received stamp",
                                "properties": {"bfr_signed": {"type": "boolean", "title": "BFR signed and stamped by C/M Accountant"}},
                            },
                            "movs_1_1_2": {
                                "type": "array",
                                "items": {"type": "string"},
                                "default": ["Annex B of DBM-DOF-DILG JMC No. 2018-1"],
                                "readOnly": True,
                            },
                        },
                    },
                    # 1.2
                    "section_1_2": {
                        "type": "object",
                        "title": "1.2 Innovations on Revenue Generation or Exercise of Corporate Powers",
                        "properties": {
                            "increase_local_resources": {"type": "boolean", "title": "1.2.1 Increase in local resources in CY 2023"},
                            "movs": {
                                "type": "array",
                                "items": {"type": "string"},
                                "default": [
                                    "SRE for 2022 and 2023, signed by Barangay Treasurer and Punong Barangay",
                                    "Certification on Increase in Local Resources signed by City/Municipal Treasurer or Budget Officer",
                                ],
                                "readOnly": True,
                            },
                        },
                    },
                    # 1.3
                    "section_1_3": {
                        "type": "object",
                        "title": "1.3 Approval of the Barangay Budget on the Specified Timeframe",
                        "properties": {
                            "ordinance_approved": {"type": "boolean", "title": "1.3.1 Appropriation Ordinance approved on/before Dec 31, 2022 (or by Mar 31, 2023 consideration)"},
                            "approval_date": {"type": "string", "title": "Approval Date"},
                            "movs": {
                                "type": "array",
                                "items": {"type": "string"},
                                "default": [
                                    "Approved Barangay Appropriation Ordinance signed by SBMs, SK Chairperson, Barangay Secretary, and Punong Barangay",
                                ],
                                "readOnly": True,
                            },
                        },
                    },
                },
            },
            governance_area_id=1,
        )

        db.add(consolidated)
        db.commit()

    def standardize_indicator_area_names(self, db: Session) -> None:
        """Rename indicators to match the official governance area names (1-6)
        and align descriptions to the standard format.
        """
        mapping = {
            1: "Financial Administration and Sustainability",
            2: "Disaster Preparedness",
            3: "Safety, Peace and Order",
            4: "Social Protection and Sensitivity",
            5: "Business-Friendliness and Competitiveness",
            6: "Environmental Management",
        }

        for area_id, official_name in mapping.items():
            ind = (
                db.query(Indicator)
                .filter(Indicator.governance_area_id == area_id)
                .first()
            )
            if ind:
                ind.name = official_name
                if area_id == 1:
                    ind.description = (
                        "The barangay has a comprehensive budget plan that is properly executed and monitored."
                    )
        db.commit()

    def ensure_environmental_indicator(self, db: Session) -> None:
        """Ensure Area 6 environmental indicator exists following other format."""
        exists = (
            db.query(Indicator)
            .filter(Indicator.governance_area_id == 6)
            .first()
        )
        if exists:
            return

        env = Indicator(
            name="Environmental Management",
            description="The barangay implements environmental protection and sustainability programs.",
            form_schema={
                "type": "object",
                "properties": {
                    "has_programs": {"type": "boolean", "title": "Has Environmental Programs"},
                    "program_types": {"type": "string", "title": "Types of Programs"},
                    "trees_planted": {"type": "number", "title": "Trees Planted This Year"},
                },
                "required": ["has_programs"],
            },
            governance_area_id=6,
        )
        db.add(env)
        db.commit()


indicator_service = IndicatorService()


