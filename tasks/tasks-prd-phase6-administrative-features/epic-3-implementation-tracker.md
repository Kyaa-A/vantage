# Epic 3.0 Implementation Tracker
# Indicator Management - Calculation Schema Builder & Remark Builder

**PRD Reference:** FR-4.1.3, FR-4.1.4
**Duration:** 8-12 days
**Dependencies:** Epic 1.0, Epic 2.0 (requires form_schema fields to reference)
**Started:** 2025-11-06

---

## Progress Overview

- **Total Stories:** 8
- **Total Tasks:** 45
- **Completed Tasks:** 18 (Stories 3.1, 3.2 & 3.3 complete!)
- **Current Story:** Story 3.4
- **Progress:** 40% (18/45 tasks)

---

## Story 3.1: Calculation Schema Data Models & Rule Engine Foundation

**Duration:** 2 days
**Status:** ✅ Complete
**Dependencies:** Epic 1.0 complete

### Tasks

- [x] **3.1.1** Create Pydantic models for 6 rule types (AndAllRule, OrAnyRule, PercentageThresholdRule, CountThresholdRule, MatchValueRule, BBIFunctionalityCheckRule)
  - **File:** `apps/api/app/schemas/calculation_schema.py`
  - **Criteria:** Each rule type with proper fields, discriminator, validation
  - **Duration:** 3 hours
  - **Completed:** Created all 6 rule types with discriminated union pattern

- [x] **3.1.2** Create CalculationSchema root model with nested condition groups
  - **File:** `apps/api/app/schemas/calculation_schema.py`
  - **Criteria:** Support nesting, AND/OR groups, output status (Pass/Fail)
  - **Duration:** 2 hours
  - **Completed:** Created ConditionGroup and CalculationSchema models with full nesting support

- [x] **3.1.3** Extend intelligence_service.py with evaluate_rule() function
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** Recursively evaluate nested rules, handle all 6 types
  - **Duration:** 4 hours
  - **Completed:** Created comprehensive evaluate_rule() function with type dispatching and recursion support

- [x] **3.1.4** Implement AND_ALL rule evaluation
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** All conditions must be true
  - **Duration:** 2 hours
  - **Completed:** Implemented _evaluate_and_all_rule() with recursive condition checking

- [x] **3.1.5** Implement OR_ANY rule evaluation
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** At least one condition must be true
  - **Duration:** 2 hours
  - **Completed:** Implemented _evaluate_or_any_rule() with short-circuit evaluation

- [x] **3.1.6** Implement PERCENTAGE_THRESHOLD rule evaluation
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** Check number field >= threshold
  - **Duration:** 2 hours
  - **Completed:** Implemented _evaluate_percentage_threshold_rule() with 5 operators (>=, >, <=, <, ==)

- [x] **3.1.7** Implement COUNT_THRESHOLD and MATCH_VALUE rules
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** Count checkboxes, match specific values
  - **Duration:** 2 hours
  - **Completed:** Implemented both _evaluate_count_threshold_rule() and _evaluate_match_value_rule() with full operator support

- [x] **3.1.8** Implement BBI_FUNCTIONALITY_CHECK rule (placeholder)
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** Check if BBI is Functional (Epic 4 dependency)
  - **Duration:** 1 hour
  - **Completed:** Implemented _evaluate_bbi_functionality_check_rule() with placeholder logic and TODO for Epic 4

---

## Story 3.2: Backend Calculation Schema Validation & Test Endpoint

**Duration:** 1 day
**Status:** ✅ Complete
**Dependencies:** Story 3.1

### Tasks

- [x] **3.2.1** Create validation endpoint for calculation_schema
  - **File:** `apps/api/app/api/v1/indicators.py`
  - **Endpoint:** `POST /api/v1/indicators/validate-calculation-schema`
  - **Completed:** Created validation endpoint that leverages Pydantic's built-in validation

- [x] **3.2.2** Create test calculation endpoint
  - **File:** `apps/api/app/api/v1/indicators.py`
  - **Endpoint:** `POST /api/v1/indicators/test-calculation`
  - **Completed:** Created endpoint to test calculation schemas with sample data, returns Pass/Fail with explanation

- [x] **3.2.3** Integrate validation with update_indicator service
  - **File:** `apps/api/app/services/indicator_service.py`
  - **Completed:** Added calculation_schema validation to both create_indicator() and update_indicator() methods

- [x] **3.2.4** Add is_auto_calculable flag logic
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Completed:** Created evaluate_indicator_calculation() method that checks is_auto_calculable flag before evaluation

---

## Story 3.3: Frontend Calculation Rule Builder Core Architecture

**Duration:** 2 days
**Status:** ✅ Complete
**Dependencies:** Epic 2.0 (needs form_schema fields), `pnpm generate-types`

### Tasks

- [x] **3.3.1** Create Zustand store for calculation rule builder
  - **File:** `apps/web/src/store/useCalculationRuleStore.ts`
  - **Completed:** Full Zustand store with nested state management, CRUD operations for condition groups and rules
- [x] **3.3.2** Create CalculationRuleBuilder main component
  - **File:** `apps/web/src/components/features/indicators/CalculationRuleBuilder/CalculationRuleBuilder.tsx`
  - **Completed:** Main orchestrator component with initialization logic and props interface
- [x] **3.3.3** Create ConditionGroup component with nesting
  - **Files:** `ConditionGroupList.tsx`, `ConditionGroupItem.tsx`
  - **Completed:** Full condition group rendering with AND/OR operators, rule display, and nested structure support
- [x] **3.3.4** Create RuleSelector component
  - **File:** `apps/web/src/components/features/indicators/CalculationRuleBuilder/RuleSelector.tsx`
  - **Completed:** Dialog-based rule type selector with descriptions for all 6 rule types
- [x] **3.3.5** Create FieldSelector component
  - **File:** `apps/web/src/components/features/indicators/CalculationRuleBuilder/FieldSelector.tsx`
  - **Completed:** Field selector with type filtering and form_schema integration
- [x] **3.3.6** Create OperatorSelector and ValueInput components
  - **Files:** `OperatorSelector.tsx`, `ValueInput.tsx`
  - **Completed:** Both components with operator labeling and value input handling

---

## Story 3.4: Frontend Calculation Rule Builder - Rule Type Components

**Duration:** 2 days
**Status:** Pending
**Dependencies:** Story 3.3

### Tasks

- [ ] **3.4.1** Create AndAllRuleComponent
- [ ] **3.4.2** Create OrAnyRuleComponent
- [ ] **3.4.3** Create PercentageThresholdRuleComponent
- [ ] **3.4.4** Create CountThresholdRuleComponent
- [ ] **3.4.5** Create MatchValueRuleComponent
- [ ] **3.4.6** Create BBIFunctionalityCheckComponent
- [ ] **3.4.7** Add Pass/Fail output indicators

---

## Story 3.5: Frontend Calculation Rule Builder - Test Calculation Feature

**Duration:** 1 day
**Status:** Pending
**Dependencies:** Story 3.4

### Tasks

- [ ] **3.5.1** Create TestCalculationPanel component
- [ ] **3.5.2** Generate dynamic input fields from form_schema
- [ ] **3.5.3** Implement "Run Test" button and API call
- [ ] **3.5.4** Display test result with explanation

---

## Story 3.6: Frontend Remark Schema Builder

**Duration:** 2 days
**Status:** Pending

### Tasks

- [ ] **3.6.1** Create Pydantic model for remark_schema
- [ ] **3.6.2** Create RemarkSchemaBuilder component
- [ ] **3.6.3** Create condition selector dropdown
- [ ] **3.6.4** Create template editor with placeholder support
- [ ] **3.6.5** Create default remark template field
- [ ] **3.6.6** Add preview of generated remarks

---

## Story 3.7: Backend Remark Generation Service

**Duration:** 1 day
**Status:** Pending
**Dependencies:** Story 3.6

### Tasks

- [ ] **3.7.1** Create generate_indicator_remark() function
- [ ] **3.7.2** Implement template rendering with Jinja2
- [ ] **3.7.3** Integrate with assessment response workflow
- [ ] **3.7.4** Add generated_remark column to assessment_responses

---

## Story 3.8: Testing for Calculation & Remark Builders

**Duration:** 1 day
**Status:** Pending
**Dependencies:** All previous stories

### Tasks

- [ ] **3.8.1** Write tests for all 6 rule types evaluation
- [ ] **3.8.2** Write tests for nested condition group evaluation
- [ ] **3.8.3** Write tests for remark generation
- [ ] **3.8.4** Write frontend tests for CalculationRuleBuilder
- [ ] **3.8.5** Write tests for TestCalculationPanel
- [ ] **3.8.6** Write integration test for calculation workflow

---

## Relevant Files

### Backend Files
- `apps/api/app/schemas/calculation_schema.py` - Calculation rule Pydantic models (✅ created - 6 rule types with discriminated unions)
- `apps/api/app/schemas/remark_schema.py` - Remark schema Pydantic models (to be created)
- `apps/api/app/services/intelligence_service.py` - Rule evaluation logic (✅ complete - evaluation engine + evaluate_indicator_calculation())
- `apps/api/app/services/indicator_service.py` - Indicator service (✅ updated - calculation_schema validation in create/update)
- `apps/api/app/services/assessment_service.py` - Assessment workflow (to be updated)
- `apps/api/app/api/v1/indicators.py` - Indicator endpoints (✅ extended - validate-calculation-schema & test-calculation endpoints)
- `apps/api/app/db/models/assessment.py` - Assessment models (to be updated)

### Frontend Files
- `apps/web/src/store/useCalculationRuleStore.ts` - Calculation rule state (✅ created - complete Zustand store with CRUD operations)
- `apps/web/src/components/features/indicators/CalculationRuleBuilder/` - Calculation rule builder directory (✅ created)
  - `CalculationRuleBuilder.tsx` - Main builder component (✅ created)
  - `OutputStatusConfig.tsx` - Pass/Fail status configuration (✅ created)
  - `ConditionGroupList.tsx` - List renderer for condition groups (✅ created)
  - `ConditionGroupItem.tsx` - Individual condition group with AND/OR logic (✅ created)
  - `RuleSelector.tsx` - Dialog-based rule type selector (✅ created)
  - `RuleConfigForm.tsx` - Dynamic form for rule configuration (✅ created)
  - `FieldSelector.tsx` - Field selector with type filtering (✅ created)
  - `OperatorSelector.tsx` - Operator selector with labels (✅ created)
  - `ValueInput.tsx` - Generic value input component (✅ created)
  - `index.ts` - Barrel export file (✅ created)
- `apps/web/src/components/features/indicators/RemarkSchemaBuilder.tsx` - Remark builder component (to be created)

### Test Files
- `apps/api/tests/services/test_intelligence_service.py` - Intelligence service tests (to be created/updated)
- `apps/api/tests/integration/test_calculation_workflow.py` - Integration tests (to be created)
- `apps/web/src/components/features/admin/indicators/CalculationRuleBuilder.test.tsx` - Frontend tests (to be created)

---

## Notes

- Follow service layer pattern: Fat services, thin routers
- Run `pnpm generate-types` after creating/modifying Pydantic schemas
- Create Alembic migration for database model changes
- Write tests following pytest conventions for backend
- Use shadcn/ui components for frontend
- Ensure type safety throughout with generated types

---

## Completion Protocol

When each subtask is completed:
1. Mark subtask as `[x]`
2. Update "Relevant Files" section with actual changes
3. When all subtasks in a story are complete:
   - Run tests: `pytest` for backend, ensure all pass
   - Stage changes: `git add .`
   - Clean up temporary files
   - Commit with format: `feat(epic-3): complete Story X.Y - description`
4. Wait for user approval before starting next subtask
