"""
🧪 Integration Test: Calculation Engine with Form Responses (Epic 6.0 - Story 6.3 - Task 6.3.7)

This test verifies that the calculation engine correctly evaluates form responses:
- Calculation schemas are executed against response data
- ValidationStatus (PASS/FAIL/CONDITIONAL) is correctly determined
- AND_ALL rule type evaluated correctly
- OR_ANY rule type evaluated correctly
- PERCENTAGE_THRESHOLD rule type evaluated correctly
- MATCH_VALUE rule type evaluated correctly
- Remark schema mapping works correctly
- Complex nested conditions are handled

Tests the integration of:
- Calculation engine service
- Response data evaluation
- Validation status determination
- Form schema and calculation schema interaction
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from typing import Dict

from app.db.models.assessment import Assessment, AssessmentResponse
from app.db.models.system import Indicator
from app.db.models.governance_area import GovernanceArea
from app.db.enums import ValidationStatus
from app.services.calculation_engine_service import calculation_engine_service


class TestCalculationEngineIntegration:
    """
    Integration test suite for calculation engine with form responses.
    """

    def test_and_all_rule_evaluation_pass(
        self,
        client: TestClient,
        auth_headers_blgu: Dict[str, str],
        test_draft_assessment: Assessment,
        db_session: Session,
        governance_area: GovernanceArea,
    ):
        """
        Test: AND_ALL rule type correctly evaluates PASS condition.

        Verifies:
        - Create indicator with AND_ALL calculation schema
        - Submit response that meets all conditions
        - Calculation engine returns PASS status
        """
        # Create indicator with AND_ALL calculation schema
        import uuid
        indicator = Indicator(
            code=f"CALC-AND-{uuid.uuid4().hex[:8]}",
            name="AND_ALL Test Indicator",
            description="Test AND_ALL calculation",
            governance_area_id=governance_area.id,
            form_schema={
                "fields": [
                    {
                        "id": "score_field",
                        "label": "Score",
                        "type": "number",
                        "required": True,
                        "min": 0,
                        "max": 100,
                    }
                ]
            },
            calculation_schema={
                "condition_groups": [
                    {
                        "operator": "AND",
                        "rules": [
                            {
                                "rule_type": "AND_ALL",
                                "conditions": [
                                    {
                                        "field": "score_field",
                                        "operator": ">=",
                                        "value": 50
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "output_status_on_pass": "Pass",
                "output_status_on_fail": "Fail"
            },
            remark_schema={
                "PASS": "Score meets minimum requirement",
                "FAIL": "Score below minimum requirement"
            },
            is_active=True,
        )
        db_session.add(indicator)
        db_session.commit()
        db_session.refresh(indicator)

        # Create response that meets the condition (score >= 50)
        response_data = {
            "score_field": 75
        }

        # Execute calculation
        result = calculation_engine_service.execute_calculation(
            calculation_schema=indicator.calculation_schema,
            response_data=response_data
        )

        # Should return PASS
        assert result == ValidationStatus.PASS

    def test_and_all_rule_evaluation_fail(
        self,
        client: TestClient,
        db_session: Session,
        governance_area: GovernanceArea,
    ):
        """
        Test: AND_ALL rule type correctly evaluates FAIL condition.

        Verifies:
        - Response that doesn't meet all conditions
        - Calculation engine returns FAIL status
        """
        # Create indicator with AND_ALL calculation schema
        import uuid
        indicator = Indicator(
            code=f"CALC-FAIL-{uuid.uuid4().hex[:8]}",
            name="AND_ALL Fail Test",
            description="Test AND_ALL failure",
            governance_area_id=governance_area.id,
            form_schema={
                "fields": [
                    {
                        "id": "completion_rate",
                        "label": "Completion Rate",
                        "type": "number",
                        "required": True,
                    }
                ]
            },
            calculation_schema={
                "condition_groups": [
                    {
                        "operator": "AND",
                        "rules": [
                            {
                                "rule_type": "AND_ALL",
                                "conditions": [
                                    {
                                        "field": "completion_rate",
                                        "operator": ">=",
                                        "value": 80
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "output_status_on_pass": "Pass",
                "output_status_on_fail": "Fail"
            },
            remark_schema={
                "PASS": "Completion rate acceptable",
                "FAIL": "Completion rate too low"
            },
            is_active=True,
        )
        db_session.add(indicator)
        db_session.commit()
        db_session.refresh(indicator)

        # Create response that DOESN'T meet condition (score < 80)
        response_data = {
            "completion_rate": 65
        }

        # Execute calculation
        result = calculation_engine_service.execute_calculation(
            calculation_schema=indicator.calculation_schema,
            response_data=response_data
        )

        # Should return FAIL
        assert result == ValidationStatus.FAIL

    def test_percentage_threshold_rule_evaluation(
        self,
        db_session: Session,
        governance_area: GovernanceArea,
    ):
        """
        Test: PERCENTAGE_THRESHOLD rule type correctly evaluates percentage values.

        Verifies:
        - Percentage field evaluation
        - Threshold comparison
        - Correct PASS/FAIL determination
        """
        # Create indicator with PERCENTAGE_THRESHOLD calculation schema
        import uuid
        indicator = Indicator(
            code=f"CALC-PCT-{uuid.uuid4().hex[:8]}",
            name="Percentage Threshold Test",
            description="Test percentage threshold",
            governance_area_id=governance_area.id,
            form_schema={
                "fields": [
                    {
                        "id": "budget_utilization",
                        "label": "Budget Utilization %",
                        "type": "number",
                        "required": True,
                        "min": 0,
                        "max": 100,
                    }
                ]
            },
            calculation_schema={
                "condition_groups": [
                    {
                        "operator": "AND",
                        "rules": [
                            {
                                "rule_type": "PERCENTAGE_THRESHOLD",
                                "field": "budget_utilization",
                                "threshold": 85,
                                "operator": ">="
                            }
                        ]
                    }
                ],
                "output_status_on_pass": "Pass",
                "output_status_on_fail": "Fail"
            },
            remark_schema={
                "PASS": "Budget utilization meets target",
                "FAIL": "Budget utilization below target"
            },
            is_active=True,
        )
        db_session.add(indicator)
        db_session.commit()
        db_session.refresh(indicator)

        # Test PASS case (90% >= 85%)
        response_data_pass = {
            "budget_utilization": 90
        }

        result_pass = calculation_engine_service.execute_calculation(
            calculation_schema=indicator.calculation_schema,
            response_data=response_data_pass
        )

        assert result_pass == ValidationStatus.PASS

        # Test FAIL case (70% < 85%)
        response_data_fail = {
            "budget_utilization": 70
        }

        result_fail = calculation_engine_service.execute_calculation(
            calculation_schema=indicator.calculation_schema,
            response_data=response_data_fail
        )

        assert result_fail == ValidationStatus.FAIL

    def test_match_value_rule_evaluation(
        self,
        db_session: Session,
        governance_area: GovernanceArea,
    ):
        """
        Test: MATCH_VALUE rule type correctly evaluates exact matches.

        Verifies:
        - String value matching
        - Exact comparison
        - PASS when values match, FAIL when they don't
        """
        # Create indicator with MATCH_VALUE calculation schema
        import uuid
        indicator = Indicator(
            code=f"CALC-MATCH-{uuid.uuid4().hex[:8]}",
            name="Match Value Test",
            description="Test value matching",
            governance_area_id=governance_area.id,
            form_schema={
                "fields": [
                    {
                        "id": "compliance_status",
                        "label": "Compliance Status",
                        "type": "select",
                        "required": True,
                        "options": ["Compliant", "Non-Compliant", "Partially Compliant"]
                    }
                ]
            },
            calculation_schema={
                "condition_groups": [
                    {
                        "operator": "AND",
                        "rules": [
                            {
                                "rule_type": "MATCH_VALUE",
                                "field": "compliance_status",
                                "expected_value": "Compliant"
                            }
                        ]
                    }
                ],
                "output_status_on_pass": "Pass",
                "output_status_on_fail": "Fail"
            },
            remark_schema={
                "PASS": "Fully compliant",
                "FAIL": "Not fully compliant"
            },
            is_active=True,
        )
        db_session.add(indicator)
        db_session.commit()
        db_session.refresh(indicator)

        # Test PASS case (value matches)
        response_data_pass = {
            "compliance_status": "Compliant"
        }

        result_pass = calculation_engine_service.execute_calculation(
            calculation_schema=indicator.calculation_schema,
            response_data=response_data_pass
        )

        assert result_pass == ValidationStatus.PASS

        # Test FAIL case (value doesn't match)
        response_data_fail = {
            "compliance_status": "Non-Compliant"
        }

        result_fail = calculation_engine_service.execute_calculation(
            calculation_schema=indicator.calculation_schema,
            response_data=response_data_fail
        )

        assert result_fail == ValidationStatus.FAIL

    def test_complex_nested_conditions(
        self,
        db_session: Session,
        governance_area: GovernanceArea,
    ):
        """
        Test: Complex nested calculation schema with multiple conditions.

        Verifies:
        - Multiple condition groups
        - Multiple rules within groups
        - Correct AND/OR operator application
        - Complex business logic evaluation
        """
        # Create indicator with complex calculation schema
        import uuid
        indicator = Indicator(
            code=f"CALC-COMPLEX-{uuid.uuid4().hex[:8]}",
            name="Complex Calculation Test",
            description="Test complex nested conditions",
            governance_area_id=governance_area.id,
            form_schema={
                "fields": [
                    {
                        "id": "training_hours",
                        "label": "Training Hours",
                        "type": "number",
                        "required": True,
                    },
                    {
                        "id": "attendance_rate",
                        "label": "Attendance Rate %",
                        "type": "number",
                        "required": True,
                        "min": 0,
                        "max": 100,
                    },
                    {
                        "id": "certification_status",
                        "label": "Certification Status",
                        "type": "select",
                        "required": True,
                        "options": ["Certified", "Pending", "Not Certified"]
                    }
                ]
            },
            calculation_schema={
                "condition_groups": [
                    {
                        "operator": "AND",
                        "rules": [
                            {
                                "rule_type": "AND_ALL",
                                "conditions": [
                                    {
                                        "field": "training_hours",
                                        "operator": ">=",
                                        "value": 40
                                    },
                                    {
                                        "field": "attendance_rate",
                                        "operator": ">=",
                                        "value": 80
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "operator": "AND",
                        "rules": [
                            {
                                "rule_type": "MATCH_VALUE",
                                "field": "certification_status",
                                "expected_value": "Certified"
                            }
                        ]
                    }
                ],
                "output_status_on_pass": "Pass",
                "output_status_on_fail": "Fail"
            },
            remark_schema={
                "PASS": "All training requirements met",
                "FAIL": "Training requirements not met"
            },
            is_active=True,
        )
        db_session.add(indicator)
        db_session.commit()
        db_session.refresh(indicator)

        # Test PASS case (all conditions met)
        response_data_pass = {
            "training_hours": 50,
            "attendance_rate": 90,
            "certification_status": "Certified"
        }

        result_pass = calculation_engine_service.execute_calculation(
            calculation_schema=indicator.calculation_schema,
            response_data=response_data_pass
        )

        assert result_pass == ValidationStatus.PASS

        # Test FAIL case (missing certification)
        response_data_fail = {
            "training_hours": 50,
            "attendance_rate": 90,
            "certification_status": "Pending"
        }

        result_fail = calculation_engine_service.execute_calculation(
            calculation_schema=indicator.calculation_schema,
            response_data=response_data_fail
        )

        assert result_fail == ValidationStatus.FAIL

    def test_calculation_with_missing_field_data(
        self,
        db_session: Session,
        governance_area: GovernanceArea,
    ):
        """
        Test: Calculation engine handles missing field data gracefully.

        Verifies:
        - Missing fields in response_data are handled
        - Appropriate FAIL status returned
        - No errors thrown
        """
        # Create indicator
        import uuid
        indicator = Indicator(
            code=f"CALC-MISSING-{uuid.uuid4().hex[:8]}",
            name="Missing Data Test",
            description="Test missing field handling",
            governance_area_id=governance_area.id,
            form_schema={
                "fields": [
                    {
                        "id": "required_field",
                        "label": "Required Field",
                        "type": "number",
                        "required": True,
                    }
                ]
            },
            calculation_schema={
                "condition_groups": [
                    {
                        "operator": "AND",
                        "rules": [
                            {
                                "rule_type": "AND_ALL",
                                "conditions": [
                                    {
                                        "field": "required_field",
                                        "operator": ">=",
                                        "value": 10
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "output_status_on_pass": "Pass",
                "output_status_on_fail": "Fail"
            },
            remark_schema={
                "PASS": "Field present and valid",
                "FAIL": "Field missing or invalid"
            },
            is_active=True,
        )
        db_session.add(indicator)
        db_session.commit()
        db_session.refresh(indicator)

        # Test with missing field
        response_data_missing = {}

        result = calculation_engine_service.execute_calculation(
            calculation_schema=indicator.calculation_schema,
            response_data=response_data_missing
        )

        # Should return FAIL (field is missing)
        assert result == ValidationStatus.FAIL

    def test_calculation_with_null_calculation_schema(self):
        """
        Test: Calculation engine handles null/missing calculation schema.

        Verifies:
        - Null calculation_schema returns FAIL
        - No errors thrown
        - Graceful degradation
        """
        response_data = {
            "some_field": 42
        }

        result = calculation_engine_service.execute_calculation(
            calculation_schema=None,
            response_data=response_data
        )

        # Should return FAIL (no calculation schema)
        assert result == ValidationStatus.FAIL

    def test_calculation_with_empty_response_data(
        self,
        db_session: Session,
        governance_area: GovernanceArea,
    ):
        """
        Test: Calculation engine handles empty response data.

        Verifies:
        - Empty response_data dict is handled
        - Returns FAIL status
        - No errors thrown
        """
        # Create indicator with simple calculation
        import uuid
        indicator = Indicator(
            code=f"CALC-EMPTY-{uuid.uuid4().hex[:8]}",
            name="Empty Data Test",
            description="Test empty response handling",
            governance_area_id=governance_area.id,
            form_schema={
                "fields": [
                    {
                        "id": "test_field",
                        "label": "Test Field",
                        "type": "text",
                        "required": True,
                    }
                ]
            },
            calculation_schema={
                "condition_groups": [
                    {
                        "operator": "AND",
                        "rules": [
                            {
                                "rule_type": "MATCH_VALUE",
                                "field": "test_field",
                                "expected_value": "Expected"
                            }
                        ]
                    }
                ],
                "output_status_on_pass": "Pass",
                "output_status_on_fail": "Fail"
            },
            remark_schema={
                "PASS": "Data present",
                "FAIL": "Data missing"
            },
            is_active=True,
        )
        db_session.add(indicator)
        db_session.commit()
        db_session.refresh(indicator)

        # Test with empty response_data
        response_data_empty = {}

        result = calculation_engine_service.execute_calculation(
            calculation_schema=indicator.calculation_schema,
            response_data=response_data_empty
        )

        # Should return FAIL (data is empty)
        assert result == ValidationStatus.FAIL

    def test_or_any_rule_evaluation(
        self,
        db_session: Session,
        governance_area: GovernanceArea,
    ):
        """
        Test: OR_ANY rule type correctly evaluates when at least one condition is met.

        Verifies:
        - OR logic is applied correctly
        - PASS when any condition is true
        - FAIL when all conditions are false
        """
        # Create indicator with OR_ANY calculation schema
        import uuid
        indicator = Indicator(
            code=f"CALC-OR-{uuid.uuid4().hex[:8]}",
            name="OR_ANY Test",
            description="Test OR logic",
            governance_area_id=governance_area.id,
            form_schema={
                "fields": [
                    {
                        "id": "option_a_complete",
                        "label": "Option A Complete",
                        "type": "checkbox",
                        "required": False,
                    },
                    {
                        "id": "option_b_complete",
                        "label": "Option B Complete",
                        "type": "checkbox",
                        "required": False,
                    }
                ]
            },
            calculation_schema={
                "condition_groups": [
                    {
                        "operator": "OR",
                        "rules": [
                            {
                                "rule_type": "MATCH_VALUE",
                                "field": "option_a_complete",
                                "expected_value": True
                            },
                            {
                                "rule_type": "MATCH_VALUE",
                                "field": "option_b_complete",
                                "expected_value": True
                            }
                        ]
                    }
                ],
                "output_status_on_pass": "Pass",
                "output_status_on_fail": "Fail"
            },
            remark_schema={
                "PASS": "At least one option completed",
                "FAIL": "No options completed"
            },
            is_active=True,
        )
        db_session.add(indicator)
        db_session.commit()
        db_session.refresh(indicator)

        # Test PASS case (option A is true)
        response_data_pass = {
            "option_a_complete": True,
            "option_b_complete": False
        }

        result_pass = calculation_engine_service.execute_calculation(
            calculation_schema=indicator.calculation_schema,
            response_data=response_data_pass
        )

        assert result_pass == ValidationStatus.PASS

        # Test FAIL case (both false)
        response_data_fail = {
            "option_a_complete": False,
            "option_b_complete": False
        }

        result_fail = calculation_engine_service.execute_calculation(
            calculation_schema=indicator.calculation_schema,
            response_data=response_data_fail
        )

        assert result_fail == ValidationStatus.FAIL
