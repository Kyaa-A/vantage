# Epic 1.0: Database Schema & Backend Foundation

**PRD Reference:** FR-1.1, FR-1.2, FR-1.3 - Dynamic form rendering with validation schema, backend calculation engine, and completeness vs. compliance separation

**Objective:** Establish the database schema and backend calculation engine to support dynamic form rendering, backend-only compliance calculation, and two-tier validation (completeness for BLGUs, compliance for assessors).

## Stories

### Three-Tier Structure: Epic → Story → Atomic

- [ ] **1.1 Story: Database Schema Migration for Form Schemas**
  - Add `form_schema` JSON column to store dynamic form structure for each indicator
  - Add `calculation_schema` JSON column to store backend compliance calculation logic
  - Add `remark_schema` JSON column to store remark templates tied to compliance scores
  - Create Alembic migration with proper column types (JSONB for PostgreSQL)
  - Tech stack involved: Alembic, SQLAlchemy, PostgreSQL
  - Dependencies: None (first story in epic)

  - [ ] **1.1.1 Atomic: Create Alembic migration file for form schema columns**
    - **Files:** `apps/api/alembic/versions/xxxx_add_form_schema_columns.py` (NEW)
    - **Dependencies:** None
    - **Acceptance:** Migration file created with `alembic revision --autogenerate -m "add form schema columns to governance_indicators"`. File contains upgrade and downgrade functions.
    - **Tech:** Alembic, SQLAlchemy, PostgreSQL JSONB type
    - **Time Estimate:** 2 hours

  - [ ] **1.1.2 Atomic: Define upgrade function to add form_schema, calculation_schema, remark_schema columns**
    - **Files:** `apps/api/alembic/versions/xxxx_add_form_schema_columns.py`
    - **Dependencies:** Task 1.1.1 must be complete
    - **Acceptance:** Upgrade function adds three JSONB columns (form_schema, calculation_schema, remark_schema) to governance_indicators table. Columns are nullable.
    - **Tech:** Alembic op.add_column(), PostgreSQL JSONB type, SQLAlchemy Column
    - **Time Estimate:** 3 hours

  - [ ] **1.1.3 Atomic: Define downgrade function to remove schema columns**
    - **Files:** `apps/api/alembic/versions/xxxx_add_form_schema_columns.py`
    - **Dependencies:** Task 1.1.2 must be complete
    - **Acceptance:** Downgrade function removes form_schema, calculation_schema, remark_schema columns. Migration can be rolled back successfully with `alembic downgrade -1`.
    - **Tech:** Alembic op.drop_column()
    - **Time Estimate:** 2 hours

  - [ ] **1.1.4 Atomic: Test migration upgrade and downgrade**
    - **Files:** `apps/api/tests/migrations/test_form_schema_migration.py` (NEW)
    - **Dependencies:** Tasks 1.1.2, 1.1.3 must be complete
    - **Acceptance:** Migration runs successfully with `alembic upgrade head`. Rollback succeeds with `alembic downgrade -1`. Columns appear in database after upgrade, disappear after downgrade.
    - **Tech:** Pytest, Alembic, SQLAlchemy test fixtures
    - **Time Estimate:** 3 hours

- [ ] **1.2 Story: Database Schema Migration for Calculated Fields**
  - Add `calculated_status` enum column (PASS, FAIL, CONDITIONAL) to assessment_answers table
  - Add `calculated_remark` text column to store backend-generated compliance remarks
  - Ensure these fields are nullable and read-only from BLGU perspective
  - Create Alembic migration with appropriate indexes
  - Tech stack involved: Alembic, SQLAlchemy, PostgreSQL, Enums
  - Dependencies: Story 1.1 must be complete

  - [ ] **1.2.1 Atomic: Create PostgreSQL enum type for calculated_status**
    - **Files:** `apps/api/alembic/versions/xxxx_add_calculated_fields.py` (NEW)
    - **Dependencies:** Story 1.1 must be complete
    - **Acceptance:** Migration file created. Upgrade function creates PostgreSQL enum type 'calculated_status_enum' with values: PASS, FAIL, CONDITIONAL.
    - **Tech:** Alembic, PostgreSQL CREATE TYPE, SQLAlchemy Enum
    - **Time Estimate:** 3 hours

  - [ ] **1.2.2 Atomic: Add calculated_status and calculated_remark columns to assessment_responses table**
    - **Files:** `apps/api/alembic/versions/xxxx_add_calculated_fields.py`
    - **Dependencies:** Task 1.2.1 must be complete
    - **Acceptance:** Migration adds calculated_status (enum, nullable) and calculated_remark (text, nullable) columns to assessment_responses table.
    - **Tech:** Alembic op.add_column(), PostgreSQL enum type, Text column
    - **Time Estimate:** 3 hours

  - [ ] **1.2.3 Atomic: Add index on calculated_status column for query performance**
    - **Files:** `apps/api/alembic/versions/xxxx_add_calculated_fields.py`
    - **Dependencies:** Task 1.2.2 must be complete
    - **Acceptance:** Migration creates index on calculated_status column: `idx_assessment_responses_calculated_status`. Index creation included in upgrade, drop in downgrade.
    - **Tech:** Alembic op.create_index(), PostgreSQL indexes
    - **Time Estimate:** 2 hours

  - [ ] **1.2.4 Atomic: Define downgrade function to remove calculated fields and enum type**
    - **Files:** `apps/api/alembic/versions/xxxx_add_calculated_fields.py`
    - **Dependencies:** Task 1.2.3 must be complete
    - **Acceptance:** Downgrade drops index, drops columns, drops enum type in correct order. Migration rollback succeeds.
    - **Tech:** Alembic op.drop_index(), op.drop_column(), DROP TYPE
    - **Time Estimate:** 2 hours

  - [ ] **1.2.5 Atomic: Test migration upgrade and downgrade for calculated fields**
    - **Files:** `apps/api/tests/migrations/test_calculated_fields_migration.py` (NEW)
    - **Dependencies:** Tasks 1.2.1-1.2.4 must be complete
    - **Acceptance:** Migration applies successfully. Enum type exists after upgrade. Columns and index are created. Rollback removes all artifacts.
    - **Tech:** Pytest, Alembic, PostgreSQL inspection queries
    - **Time Estimate:** 3 hours

- [ ] **1.3 Story: SQLAlchemy Model Updates**
  - Update `Indicator` model to include form_schema, calculation_schema, remark_schema fields
  - Update `AssessmentAnswer` model to include calculated_status, calculated_remark fields
  - Add proper type hints and relationships
  - Ensure JSON fields are properly typed as JSONB with SQLAlchemy JSON type
  - Tech stack involved: SQLAlchemy, Python type hints
  - Dependencies: Stories 1.1, 1.2 must be complete

  - [ ] **1.3.1 Atomic: Update GovernanceIndicator model with form schema fields**
    - **Files:** `apps/api/app/db/models/governance_area.py`
    - **Dependencies:** Story 1.1 must be complete (migrations applied)
    - **Acceptance:** GovernanceIndicator model includes form_schema, calculation_schema, remark_schema columns typed as JSONB (SQLAlchemy type: JSON). Type hints use Optional[dict[str, Any]].
    - **Tech:** SQLAlchemy Column, JSON type, Python type hints
    - **Time Estimate:** 3 hours

  - [ ] **1.3.2 Atomic: Update AssessmentResponse model with calculated fields**
    - **Files:** `apps/api/app/db/models/assessment.py`
    - **Dependencies:** Story 1.2 must be complete (migrations applied)
    - **Acceptance:** AssessmentResponse model includes calculated_status (Enum) and calculated_remark (String) columns. Type hints use Optional[CalculatedStatusEnum] and Optional[str].
    - **Tech:** SQLAlchemy Column, Enum, String, Python type hints
    - **Time Estimate:** 3 hours

  - [ ] **1.3.3 Atomic: Define CalculatedStatusEnum in db/enums.py**
    - **Files:** `apps/api/app/db/enums.py`
    - **Dependencies:** None (can be done in parallel with 1.3.2)
    - **Acceptance:** Python enum CalculatedStatusEnum defined with values PASS, FAIL, CONDITIONAL. Enum extends str and Python's Enum class.
    - **Tech:** Python enum module, string enums
    - **Time Estimate:** 2 hours

  - [ ] **1.3.4 Atomic: Add relationships between models if needed**
    - **Files:** `apps/api/app/db/models/governance_area.py`, `apps/api/app/db/models/assessment.py`
    - **Dependencies:** Tasks 1.3.1, 1.3.2 must be complete
    - **Acceptance:** Relationships are correctly defined. GovernanceIndicator has relationship to AssessmentResponse if needed for queries. All relationships load correctly.
    - **Tech:** SQLAlchemy relationship(), backref
    - **Time Estimate:** 2 hours

  - [ ] **1.3.5 Atomic: Test SQLAlchemy model fields and relationships**
    - **Files:** `apps/api/tests/db/models/test_governance_indicator.py`, `apps/api/tests/db/models/test_assessment_response.py`
    - **Dependencies:** Tasks 1.3.1-1.3.4 must be complete
    - **Acceptance:** Unit tests verify columns exist, types are correct, JSONB fields accept dict data, enum fields accept valid values, relationships work.
    - **Tech:** Pytest, SQLAlchemy fixtures, test database
    - **Time Estimate:** 4 hours

- [ ] **1.4 Story: Calculation Engine Service Implementation**
  - Implement `CalculationEngineService` in `apps/api/app/services/calculation_engine_service.py`
  - Parse `calculation_schema` and execute calculation logic based on indicator responses
  - Support all calculation types: score-based, boolean, conditional, aggregate
  - Return calculated status (PASS/FAIL/CONDITIONAL) and match to remark from `remark_schema`
  - Handle edge cases (missing data, invalid schema, null values)
  - Tech stack involved: Python, Pydantic for schema validation, business logic
  - Dependencies: Story 1.3 must be complete

  - [ ] **1.4.1 Atomic: Create CalculationEngineService class structure**
    - **Files:** `apps/api/app/services/calculation_engine_service.py` (NEW)
    - **Dependencies:** Story 1.3 must be complete
    - **Acceptance:** Service class created with __init__ method. Class includes method signatures for execute_calculation_schema, evaluate_condition, get_remark_for_status. Docstrings added.
    - **Tech:** Python classes, Google-style docstrings, type hints
    - **Time Estimate:** 2 hours

  - [ ] **1.4.2 Atomic: Implement execute_calculation_schema method for score-based calculations**
    - **Files:** `apps/api/app/services/calculation_engine_service.py`
    - **Dependencies:** Task 1.4.1 must be complete
    - **Acceptance:** Method accepts calculation_schema (dict), response_data (dict), returns CalculatedStatusEnum. Implements score-based logic: sum field values, compare to threshold, return PASS/FAIL/CONDITIONAL.
    - **Tech:** Python, dict parsing, conditional logic
    - **Time Estimate:** 4 hours

  - [ ] **1.4.3 Atomic: Implement execute_calculation_schema for boolean calculations**
    - **Files:** `apps/api/app/services/calculation_engine_service.py`
    - **Dependencies:** Task 1.4.2 must be complete
    - **Acceptance:** Method handles boolean type calculations. Evaluates true/false field values with AND/OR operators. Returns appropriate status.
    - **Tech:** Python, boolean logic, operator evaluation
    - **Time Estimate:** 3 hours

  - [ ] **1.4.4 Atomic: Implement execute_calculation_schema for conditional calculations**
    - **Files:** `apps/api/app/services/calculation_engine_service.py`
    - **Dependencies:** Task 1.4.3 must be complete
    - **Acceptance:** Method handles conditional type: field equals/notEquals/greaterThan/lessThan/contains. Evaluates conditions and returns status based on result.
    - **Tech:** Python, comparison operators, string matching
    - **Time Estimate:** 4 hours

  - [ ] **1.4.5 Atomic: Implement execute_calculation_schema for aggregate calculations**
    - **Files:** `apps/api/app/services/calculation_engine_service.py`
    - **Dependencies:** Task 1.4.4 must be complete
    - **Acceptance:** Method handles aggregate type: count, sum, average of multiple field values. Compares result to threshold. Returns status.
    - **Tech:** Python, list comprehension, aggregate functions
    - **Time Estimate:** 4 hours

  - [ ] **1.4.6 Atomic: Implement evaluate_condition helper method**
    - **Files:** `apps/api/app/services/calculation_engine_service.py`
    - **Dependencies:** Task 1.4.1 must be complete (can be done in parallel with calculation methods)
    - **Acceptance:** Helper method accepts field value, operator, expected value. Returns boolean. Supports operators: equals, notEquals, greaterThan, lessThan, contains.
    - **Tech:** Python, operator dispatch pattern
    - **Time Estimate:** 3 hours

  - [ ] **1.4.7 Atomic: Implement get_remark_for_status method**
    - **Files:** `apps/api/app/services/calculation_engine_service.py`
    - **Dependencies:** Task 1.4.1 must be complete
    - **Acceptance:** Method accepts remark_schema (dict), calculated_status (enum). Returns matching remark string. Handles missing keys gracefully with default remark.
    - **Tech:** Python, dict access, default values
    - **Time Estimate:** 2 hours

  - [ ] **1.4.8 Atomic: Add error handling for invalid schemas and missing data**
    - **Files:** `apps/api/app/services/calculation_engine_service.py`
    - **Dependencies:** Tasks 1.4.2-1.4.5 must be complete
    - **Acceptance:** Service raises custom CalculationSchemaError for invalid schemas. Handles missing field data gracefully (treat as null/zero). Logs errors for debugging.
    - **Tech:** Python exception classes, logging module, error handling
    - **Time Estimate:** 3 hours

  - [ ] **1.4.9 Atomic: Create singleton instance of CalculationEngineService**
    - **Files:** `apps/api/app/services/calculation_engine_service.py`
    - **Dependencies:** Tasks 1.4.1-1.4.8 must be complete
    - **Acceptance:** Module exports singleton: `calculation_engine_service = CalculationEngineService()`. Service can be imported and used across application.
    - **Tech:** Python module-level instantiation
    - **Time Estimate:** 1 hour

  - [ ] **1.4.10 Atomic: Unit test CalculationEngineService with all calculation types**
    - **Files:** `apps/api/tests/services/test_calculation_engine_service.py` (NEW)
    - **Dependencies:** Tasks 1.4.1-1.4.9 must be complete
    - **Acceptance:** Comprehensive unit tests for score, boolean, conditional, aggregate calculations. Test edge cases: null values, missing fields, invalid schemas. All tests pass.
    - **Tech:** Pytest, mock data, parametrized tests
    - **Time Estimate:** 6 hours

- [ ] **1.5 Story: Completeness Validation Service**
  - Implement `CompletenessValidationService` in `apps/api/app/services/completeness_validation_service.py`
  - Parse `form_schema` to identify required fields
  - Validate that all required fields have responses
  - Validate that conditional fields are properly filled based on visibility logic
  - Return validation result with missing field details (field names, labels)
  - Tech stack involved: Python, Pydantic, JSON schema parsing
  - Dependencies: Story 1.3 must be complete

  - [ ] **1.5.1 Atomic: Create CompletenessValidationService class structure**
    - **Files:** `apps/api/app/services/completeness_validation_service.py` (NEW)
    - **Dependencies:** Story 1.3 must be complete
    - **Acceptance:** Service class created with __init__ method. Method signatures defined: validate_completeness, get_required_fields, is_field_visible. Docstrings added.
    - **Tech:** Python classes, Google-style docstrings, type hints
    - **Time Estimate:** 2 hours

  - [ ] **1.5.2 Atomic: Implement get_required_fields method to parse form_schema**
    - **Files:** `apps/api/app/services/completeness_validation_service.py`
    - **Dependencies:** Task 1.5.1 must be complete
    - **Acceptance:** Method accepts form_schema (dict), returns list of required field IDs. Parses sections and fields, filters by required=True. Includes field labels for error messages.
    - **Tech:** Python, dict/list parsing, list comprehension
    - **Time Estimate:** 3 hours

  - [ ] **1.5.3 Atomic: Implement is_field_visible method for conditional logic**
    - **Files:** `apps/api/app/services/completeness_validation_service.py`
    - **Dependencies:** Task 1.5.2 must be complete
    - **Acceptance:** Method accepts field definition (dict), response_data (dict). Evaluates conditional logic: checks if field should be visible based on other field values. Returns boolean.
    - **Tech:** Python, conditional logic evaluation, recursive checks
    - **Time Estimate:** 4 hours

  - [ ] **1.5.4 Atomic: Implement validate_completeness method**
    - **Files:** `apps/api/app/services/completeness_validation_service.py`
    - **Dependencies:** Tasks 1.5.2, 1.5.3 must be complete
    - **Acceptance:** Method accepts form_schema (dict), response_data (dict). Returns validation result: is_complete (bool), missing_fields (list of field IDs and labels). Considers conditional visibility.
    - **Tech:** Python, validation logic, data structures
    - **Time Estimate:** 4 hours

  - [ ] **1.5.5 Atomic: Add error handling for invalid form_schema**
    - **Files:** `apps/api/app/services/completeness_validation_service.py`
    - **Dependencies:** Task 1.5.4 must be complete
    - **Acceptance:** Service raises FormSchemaError for invalid schemas. Handles missing keys gracefully. Logs errors for debugging.
    - **Tech:** Python exception classes, logging, error handling
    - **Time Estimate:** 2 hours

  - [ ] **1.5.6 Atomic: Create singleton instance of CompletenessValidationService**
    - **Files:** `apps/api/app/services/completeness_validation_service.py`
    - **Dependencies:** Tasks 1.5.1-1.5.5 must be complete
    - **Acceptance:** Module exports singleton: `completeness_validation_service = CompletenessValidationService()`. Can be imported across application.
    - **Tech:** Python module-level instantiation
    - **Time Estimate:** 1 hour

  - [ ] **1.5.7 Atomic: Unit test CompletenessValidationService with various form schemas**
    - **Files:** `apps/api/tests/services/test_completeness_validation_service.py` (NEW)
    - **Dependencies:** Tasks 1.5.1-1.5.6 must be complete
    - **Acceptance:** Unit tests cover: all required fields filled (pass), missing required fields (fail), conditional fields hidden/shown correctly, invalid schemas. All tests pass.
    - **Tech:** Pytest, mock form schemas, parametrized tests
    - **Time Estimate:** 5 hours

- [ ] **1.6 Story: Compliance Validation Service**
  - Implement `ComplianceValidationService` in `apps/api/app/services/compliance_validation_service.py`
  - Use CalculationEngineService to run calculation_schema logic
  - Update AssessmentAnswer records with calculated_status and calculated_remark
  - Ensure this service is ONLY called by assessor-facing endpoints (not BLGU endpoints)
  - Provide bulk validation for entire assessments
  - Tech stack involved: Python, SQLAlchemy, service layer pattern
  - Dependencies: Story 1.4 must be complete

  - [ ] **1.6.1 Atomic: Create ComplianceValidationService class structure**
    - **Files:** `apps/api/app/services/compliance_validation_service.py` (NEW)
    - **Dependencies:** Story 1.4 must be complete (CalculationEngineService exists)
    - **Acceptance:** Service class created with __init__ method. Injects CalculationEngineService dependency. Method signatures defined: validate_compliance, validate_indicator_compliance, bulk_validate_assessment. Docstrings added.
    - **Tech:** Python classes, dependency injection, Google-style docstrings
    - **Time Estimate:** 2 hours

  - [ ] **1.6.2 Atomic: Implement validate_indicator_compliance for single indicator**
    - **Files:** `apps/api/app/services/compliance_validation_service.py`
    - **Dependencies:** Task 1.6.1 must be complete
    - **Acceptance:** Method accepts db session, indicator_id, assessment_id. Retrieves calculation_schema, response_data. Calls CalculationEngineService.execute_calculation_schema. Returns calculated_status and remark.
    - **Tech:** Python, SQLAlchemy queries, service method calls
    - **Time Estimate:** 4 hours

  - [ ] **1.6.3 Atomic: Implement update logic to save calculated_status and calculated_remark**
    - **Files:** `apps/api/app/services/compliance_validation_service.py`
    - **Dependencies:** Task 1.6.2 must be complete
    - **Acceptance:** After calculation, method updates AssessmentResponse record with calculated_status and calculated_remark. Commits transaction. Refreshes object.
    - **Tech:** SQLAlchemy update, db.commit(), db.refresh()
    - **Time Estimate:** 3 hours

  - [ ] **1.6.4 Atomic: Implement bulk_validate_assessment for entire assessment**
    - **Files:** `apps/api/app/services/compliance_validation_service.py`
    - **Dependencies:** Tasks 1.6.2, 1.6.3 must be complete
    - **Acceptance:** Method accepts db session, assessment_id. Retrieves all indicators for assessment. Iterates and calls validate_indicator_compliance for each. Returns summary: total indicators, passed, failed, conditional.
    - **Tech:** Python, SQLAlchemy queries, iteration, aggregation
    - **Time Estimate:** 4 hours

  - [ ] **1.6.5 Atomic: Add error handling and logging**
    - **Files:** `apps/api/app/services/compliance_validation_service.py`
    - **Dependencies:** Tasks 1.6.2-1.6.4 must be complete
    - **Acceptance:** Service handles calculation errors gracefully. Logs each validation attempt. Raises ComplianceValidationError on critical failures. Does not halt on single indicator failure (continues bulk validation).
    - **Tech:** Python exception handling, logging module
    - **Time Estimate:** 3 hours

  - [ ] **1.6.6 Atomic: Create singleton instance of ComplianceValidationService**
    - **Files:** `apps/api/app/services/compliance_validation_service.py`
    - **Dependencies:** Tasks 1.6.1-1.6.5 must be complete
    - **Acceptance:** Module exports singleton: `compliance_validation_service = ComplianceValidationService()`. Can be imported across application.
    - **Tech:** Python module-level instantiation
    - **Time Estimate:** 1 hour

  - [ ] **1.6.7 Atomic: Unit test ComplianceValidationService with mock data**
    - **Files:** `apps/api/tests/services/test_compliance_validation_service.py` (NEW)
    - **Dependencies:** Tasks 1.6.1-1.6.6 must be complete
    - **Acceptance:** Unit tests cover: single indicator validation, bulk assessment validation, calculated_status/remark saved to database, error handling. All tests pass.
    - **Tech:** Pytest, SQLAlchemy test fixtures, mock CalculationEngineService
    - **Time Estimate:** 6 hours

- [ ] **1.7 Story: Form Schema Validation Utilities**
  - Create `FormSchemaValidator` utility class to validate form_schema structure
  - Ensure form_schema has valid field types, required flags, conditional logic syntax
  - Create `CalculationSchemaValidator` to validate calculation_schema structure
  - Provide helpful error messages for invalid schemas
  - Tech stack involved: Python, Pydantic, JSON schema validation
  - Dependencies: Story 1.3 must be complete

  - [ ] **1.7.1 Atomic: Create FormSchemaValidator class with validation rules**
    - **Files:** `apps/api/app/utils/schema_validators.py` (NEW)
    - **Dependencies:** Story 1.3 must be complete
    - **Acceptance:** Class created with validate method. Checks: sections list exists, each section has fields, fields have id/type/label/required. Returns validation result with errors list.
    - **Tech:** Python, Pydantic BaseModel or custom validation, type checking
    - **Time Estimate:** 4 hours

  - [ ] **1.7.2 Atomic: Add field type validation (text, number, select, radio, checkbox, file)**
    - **Files:** `apps/api/app/utils/schema_validators.py`
    - **Dependencies:** Task 1.7.1 must be complete
    - **Acceptance:** Validator checks field type is in allowed list. Rejects invalid types. Validates type-specific properties (e.g., select has options, number has min/max).
    - **Tech:** Python, enum validation, schema validation
    - **Time Estimate:** 3 hours

  - [ ] **1.7.3 Atomic: Add conditional logic validation**
    - **Files:** `apps/api/app/utils/schema_validators.py`
    - **Dependencies:** Task 1.7.2 must be complete
    - **Acceptance:** Validator checks conditional object structure: has field, operator, value. Operator is in allowed list (equals, notEquals, greaterThan, lessThan, contains). Referenced field exists in schema.
    - **Tech:** Python, nested dict validation, reference checking
    - **Time Estimate:** 4 hours

  - [ ] **1.7.4 Atomic: Create CalculationSchemaValidator class**
    - **Files:** `apps/api/app/utils/schema_validators.py`
    - **Dependencies:** Task 1.7.1 must be complete (can be done in parallel)
    - **Acceptance:** Class validates calculation_schema structure. Checks: type is valid (score, boolean, conditional, aggregate), logic object exists, conditions are well-formed.
    - **Tech:** Python, schema validation, type checking
    - **Time Estimate:** 4 hours

  - [ ] **1.7.5 Atomic: Add calculation logic validation for each type**
    - **Files:** `apps/api/app/utils/schema_validators.py`
    - **Dependencies:** Task 1.7.4 must be complete
    - **Acceptance:** Validator checks type-specific requirements: score has threshold, boolean has operator (AND/OR), conditional has conditions array, aggregate has function (count/sum/avg).
    - **Tech:** Python, conditional validation based on type
    - **Time Estimate:** 4 hours

  - [ ] **1.7.6 Atomic: Add remark_schema validation**
    - **Files:** `apps/api/app/utils/schema_validators.py`
    - **Dependencies:** Task 1.7.1 must be complete
    - **Acceptance:** Validator checks remark_schema is a dict with keys: PASS, FAIL, CONDITIONAL. Values are non-empty strings.
    - **Tech:** Python, dict validation
    - **Time Estimate:** 2 hours

  - [ ] **1.7.7 Atomic: Unit test FormSchemaValidator with valid and invalid schemas**
    - **Files:** `apps/api/tests/utils/test_schema_validators.py` (NEW)
    - **Dependencies:** Tasks 1.7.1-1.7.3, 1.7.6 must be complete
    - **Acceptance:** Tests cover: valid form_schema (pass), invalid field types (fail), missing required keys (fail), invalid conditionals (fail), valid remark_schema (pass). All tests pass.
    - **Tech:** Pytest, mock schemas, parametrized tests
    - **Time Estimate:** 5 hours

  - [ ] **1.7.8 Atomic: Unit test CalculationSchemaValidator with valid and invalid schemas**
    - **Files:** `apps/api/tests/utils/test_schema_validators.py`
    - **Dependencies:** Tasks 1.7.4, 1.7.5 must be complete
    - **Acceptance:** Tests cover: valid calculation_schema for all types (pass), invalid types (fail), missing logic (fail), malformed conditions (fail). All tests pass.
    - **Tech:** Pytest, mock schemas, parametrized tests
    - **Time Estimate:** 5 hours

- [ ] **1.8 Story: Testing & Validation** ⚠️ **REQUIRED BEFORE NEXT EPIC**
  - Test Alembic migrations (up/down) for schema correctness
  - Test SQLAlchemy model relationships and field types
  - Unit test CalculationEngineService with all calculation types
  - Unit test CompletenessValidationService with various form schemas
  - Unit test ComplianceValidationService with mock AssessmentAnswer records
  - Test FormSchemaValidator and CalculationSchemaValidator with valid/invalid schemas
  - Integration test: end-to-end calculation from form_schema to calculated_status
  - Tech stack involved: Pytest, SQLAlchemy test fixtures, mock data
  - Dependencies: All implementation stories 1.1-1.7 must be complete

  - [ ] **1.8.1 Atomic: Run all migration tests to verify upgrade/downgrade**
    - **Files:** Run existing tests from tasks 1.1.4, 1.2.5
    - **Dependencies:** All migration tasks (1.1.x, 1.2.x) must be complete
    - **Acceptance:** All migration tests pass. Migrations can be applied to fresh database and rolled back. Database schema matches expected state after migrations.
    - **Tech:** Pytest, Alembic, PostgreSQL
    - **Time Estimate:** 2 hours

  - [ ] **1.8.2 Atomic: Run all SQLAlchemy model tests**
    - **Files:** Run existing tests from task 1.3.5
    - **Dependencies:** All model update tasks (1.3.x) must be complete
    - **Acceptance:** All model tests pass. JSONB fields accept dict data. Enum fields accept valid enum values. Relationships load correctly.
    - **Tech:** Pytest, SQLAlchemy fixtures
    - **Time Estimate:** 2 hours

  - [ ] **1.8.3 Atomic: Run all CalculationEngineService tests**
    - **Files:** Run existing tests from task 1.4.10
    - **Dependencies:** All CalculationEngineService tasks (1.4.x) must be complete
    - **Acceptance:** All calculation engine tests pass. All calculation types work correctly. Edge cases handled. Error handling works.
    - **Tech:** Pytest, mock data
    - **Time Estimate:** 2 hours

  - [ ] **1.8.4 Atomic: Run all CompletenessValidationService tests**
    - **Files:** Run existing tests from task 1.5.7
    - **Dependencies:** All CompletenessValidationService tasks (1.5.x) must be complete
    - **Acceptance:** All completeness validation tests pass. Required field detection works. Conditional visibility logic works. Missing fields correctly identified.
    - **Tech:** Pytest, mock form schemas
    - **Time Estimate:** 2 hours

  - [ ] **1.8.5 Atomic: Run all ComplianceValidationService tests**
    - **Files:** Run existing tests from task 1.6.7
    - **Dependencies:** All ComplianceValidationService tasks (1.6.x) must be complete
    - **Acceptance:** All compliance validation tests pass. Single indicator validation works. Bulk assessment validation works. calculated_status saved to database.
    - **Tech:** Pytest, SQLAlchemy fixtures
    - **Time Estimate:** 2 hours

  - [ ] **1.8.6 Atomic: Run all schema validator tests**
    - **Files:** Run existing tests from tasks 1.7.7, 1.7.8
    - **Dependencies:** All schema validator tasks (1.7.x) must be complete
    - **Acceptance:** All schema validator tests pass. FormSchemaValidator correctly validates/rejects schemas. CalculationSchemaValidator correctly validates/rejects schemas.
    - **Tech:** Pytest, mock schemas
    - **Time Estimate:** 2 hours

  - [ ] **1.8.7 Atomic: Create integration test for end-to-end calculation workflow**
    - **Files:** `apps/api/tests/integration/test_calculation_workflow.py` (NEW)
    - **Dependencies:** Tasks 1.8.1-1.8.6 must be complete
    - **Acceptance:** Integration test creates indicator with form_schema and calculation_schema. Creates assessment with responses. Runs ComplianceValidationService. Verifies calculated_status and calculated_remark saved to database. Test passes.
    - **Tech:** Pytest, SQLAlchemy test database, integration testing
    - **Time Estimate:** 6 hours

  - [ ] **1.8.8 Atomic: Verify all Epic 1 tests pass in CI pipeline**
    - **Files:** CI configuration (if applicable), all test files from Epic 1
    - **Dependencies:** Task 1.8.7 must be complete
    - **Acceptance:** Run `pytest apps/api/tests/` - all Epic 1 tests pass. No failures. Test coverage for Epic 1 services >= 80%.
    - **Tech:** Pytest, CI/CD, code coverage tools
    - **Time Estimate:** 2 hours

## Key Technical Decisions

### Form Schema Structure
The `form_schema` JSON will follow this structure:
```json
{
  "sections": [
    {
      "id": "section-1",
      "title": "Section Title",
      "fields": [
        {
          "id": "field-1",
          "type": "text|number|select|radio|checkbox|file",
          "label": "Field Label",
          "required": true,
          "conditional": {
            "field": "other-field-id",
            "operator": "equals|notEquals|greaterThan|lessThan",
            "value": "expected-value"
          }
        }
      ]
    }
  ]
}
```

### Calculation Schema Structure
The `calculation_schema` JSON will follow this structure:
```json
{
  "type": "score|boolean|conditional|aggregate",
  "logic": {
    "conditions": [
      {
        "field": "field-id",
        "operator": "equals|greaterThan|lessThan|contains",
        "value": "expected-value"
      }
    ],
    "operator": "AND|OR",
    "result": "PASS|FAIL|CONDITIONAL"
  }
}
```

### Remark Schema Structure
The `remark_schema` JSON maps calculated status to remark templates:
```json
{
  "PASS": "Remark template for passing",
  "FAIL": "Remark template for failing",
  "CONDITIONAL": "Remark template for conditional"
}
```

## Dependencies for Next Epic

Epic 2.0 (BLGU Dashboard) depends on:
- Story 1.3: SQLAlchemy models must be updated
- Story 1.5: Completeness validation service must be available
- Story 1.8: All testing must pass

Epic 3.0 (Dynamic Form Rendering) depends on:
- Story 1.1: form_schema column must exist
- Story 1.7: Form schema validation must be available
- Story 1.8: All testing must pass
