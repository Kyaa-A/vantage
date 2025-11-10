# Testing Epic 1.0 Services

This guide shows you how to test the three core services implemented in Epic 1.0:
- **CalculationEngineService**
- **CompletenessValidationService**
- **ComplianceValidationService**

## 🧪 Method 1: Run Unit Tests (Recommended)

The fastest way to verify everything works:

```bash
cd apps/api

# Run all Epic 1 service tests
.venv/bin/pytest tests/services/test_calculation_engine_service.py \
                  tests/services/test_completeness_validation_service.py -v

# Run with detailed output
.venv/bin/pytest tests/services/test_calculation_engine_service.py \
                  tests/services/test_completeness_validation_service.py -vv

# Run a specific test
.venv/bin/pytest tests/services/test_calculation_engine_service.py::TestCalculationEngineService::test_percentage_threshold_rule_pass -v
```

**Expected Output:**
```
38 passed in 0.06s
```

## 🔬 Method 2: Interactive Testing Script

Run the included interactive test script to see the services in action:

```bash
cd apps/api
.venv/bin/python test_epic1_services.py
```

This script demonstrates:
- ✅ Calculation engine with real calculation schemas
- ✅ Completeness validation with form schemas
- ✅ Example usage patterns for all three services

## 🐍 Method 3: Python REPL (For Experimentation)

Open a Python shell and import the services directly:

```bash
cd apps/api
.venv/bin/python
```

### Example: Test Calculation Engine

```python
from app.services.calculation_engine_service import calculation_engine_service

# Define a simple calculation schema
calculation_schema = {
    "condition_groups": [
        {
            "operator": "AND",
            "rules": [
                {
                    "rule_type": "PERCENTAGE_THRESHOLD",
                    "field_id": "completion_rate",
                    "operator": ">=",
                    "threshold": 75.0
                }
            ]
        }
    ],
    "output_status_on_pass": "Pass",
    "output_status_on_fail": "Fail"
}

# Test with sample data
response_data = {"completion_rate": 85.0}

result = calculation_engine_service.execute_calculation(
    calculation_schema,
    response_data
)

print(result)  # Should output: ValidationStatus.PASS
```

### Example: Test Completeness Validation

```python
from app.services.completeness_validation_service import completeness_validation_service

# Define a form schema
form_schema = {
    "fields": [
        {
            "field_id": "project_name",
            "field_type": "text_input",
            "label": "Project Name",
            "required": True
        },
        {
            "field_id": "description",
            "field_type": "text_area",
            "label": "Description",
            "required": True
        }
    ]
}

# Test with incomplete data
response_data = {"project_name": "My Project"}  # Missing description

result = completeness_validation_service.validate_completeness(
    form_schema,
    response_data
)

print(result["is_complete"])      # False
print(result["missing_fields"])   # Shows missing description
print(f"{result['filled_field_count']}/{result['required_field_count']} complete")
```

## 🌐 Method 4: Test with Real Database (Integration Testing)

To test the ComplianceValidationService with real data, you need:

### Setup
1. Start the API server:
   ```bash
   pnpm dev:api
   ```

2. Ensure you have indicators with `calculation_schema` in the database

3. Create a test script:

```python
# test_with_db.py
from app.db.session import SessionLocal
from app.services.compliance_validation_service import compliance_validation_service

def test_compliance_validation():
    db = SessionLocal()
    try:
        # Validate a specific indicator response
        result = compliance_validation_service.validate_indicator_compliance(
            db=db,
            assessment_id=1,  # Replace with real assessment ID
            indicator_id=1    # Replace with real indicator ID
        )

        print("Validation Result:")
        print(f"  Status: {result['calculated_status']}")
        print(f"  Remark: {result['generated_remark']}")
        print(f"  Updated: {result['was_updated']}")

        # Bulk validate entire assessment
        summary = compliance_validation_service.bulk_validate_assessment(
            db=db,
            assessment_id=1
        )

        print("\nBulk Validation Summary:")
        print(f"  Total responses: {summary['total_responses']}")
        print(f"  Auto-calculable: {summary['auto_calculable_count']}")
        print(f"  Validated: {summary['validated_count']}")
        print(f"  Passed: {summary['passed_count']}")
        print(f"  Failed: {summary['failed_count']}")

    finally:
        db.close()

if __name__ == "__main__":
    test_compliance_validation()
```

Run with:
```bash
.venv/bin/python test_with_db.py
```

## 🔧 Method 5: API Endpoint Testing (Once Endpoints Are Created)

In future epics, when API endpoints are created, you can test via HTTP:

### Using curl
```bash
# Validate completeness (future endpoint)
curl -X POST http://localhost:8000/api/v1/assessments/123/responses/456/validate-completeness \
  -H "Authorization: Bearer $TOKEN"

# Calculate compliance (future endpoint)
curl -X POST http://localhost:8000/api/v1/assessments/123/calculate-compliance \
  -H "Authorization: Bearer $TOKEN"
```

### Using Python requests
```python
import requests

# Assuming you have authentication
headers = {"Authorization": f"Bearer {token}"}

# Validate completeness
response = requests.post(
    "http://localhost:8000/api/v1/assessments/123/responses/456/validate-completeness",
    headers=headers
)
print(response.json())

# Calculate compliance
response = requests.post(
    "http://localhost:8000/api/v1/assessments/123/calculate-compliance",
    headers=headers
)
print(response.json())
```

## 📊 Understanding Test Results

### Calculation Engine Tests (19 tests)
- ✅ `test_percentage_threshold_rule_*`: Tests numeric comparisons
- ✅ `test_count_threshold_rule_*`: Tests counting selected items
- ✅ `test_match_value_rule_*`: Tests exact value matching
- ✅ `test_and_all_rule`: Tests AND logic with multiple conditions
- ✅ `test_or_any_rule`: Tests OR logic with multiple conditions
- ✅ `test_bbi_functionality_check`: Tests BBI status checking
- ✅ `test_get_remark_for_status_*`: Tests remark generation

### Completeness Validation Tests (19 tests)
- ✅ `test_all_required_fields_filled`: Complete form validation
- ✅ `test_missing_required_*`: Various missing field scenarios
- ✅ `test_*_considered_filled/missing`: Edge cases (empty strings, zero, etc.)
- ✅ `test_file_upload_*`: MOV file upload requirements
- ✅ `test_conditional_mov_requirement_*`: Conditional file requirements
- ✅ `test_get_completion_percentage_*`: Progress tracking

## 🐛 Troubleshooting

### Tests fail with import errors
Make sure you're in the correct directory and using the virtual environment:
```bash
cd apps/api
.venv/bin/pytest tests/services/test_calculation_engine_service.py -v
```

### Services return unexpected results
Check your input data structure matches the expected format:
- `calculation_schema` must have `condition_groups` array
- `form_schema` must have `fields` array
- `response_data` must be a dictionary with field IDs as keys

### Database errors in compliance validation
Ensure:
1. Database is running (Supabase connection)
2. You have valid indicator IDs with `calculation_schema` set
3. You have valid assessment IDs with responses

## 📚 Additional Resources

- **Service Documentation**: Check the docstrings in each service file
- **Test Examples**: Look at the test files for more usage examples
- **PRD Reference**: [epic-1-database-backend-foundation.md](../../tasks/tasks-prd-blgu-table-assessment-workflow/epic-1-database-backend-foundation.md)

## ✅ Success Criteria

You've successfully tested Epic 1.0 services when:
- ✅ All 38 unit tests pass
- ✅ Interactive test script runs without errors
- ✅ You can import and use services in Python REPL
- ✅ Services return expected results for your test data

## 🎯 Next Steps

Once testing is complete:
1. **Epic 2.0**: Create API endpoints that use these services
2. **Epic 3.0**: Build frontend forms that call the endpoints
3. **Epic 4.0**: Integrate with table-assessment workflow
4. **End-to-end testing**: Test complete user workflow from form submission to compliance calculation
