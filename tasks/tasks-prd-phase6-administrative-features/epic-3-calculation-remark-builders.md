# Epic 3.0: Indicator Management - Calculation Schema Builder & Remark Builder

**PRD Reference:** FR-4.1.3, FR-4.1.4
**Duration:** 8-12 days
**Dependencies:** Epic 1.0, Epic 2.0 (requires form_schema fields to reference)

---

## Story 3.1: Calculation Schema Data Models & Rule Engine Foundation

**Duration:** 2 days
**Dependencies:** Epic 1.0 complete

### Atomic Tasks (8 tasks)

- [ ] **3.1.1** Create Pydantic models for 6 rule types (AndAllRule, OrAnyRule, PercentageThresholdRule, CountThresholdRule, MatchValueRule, BBIFunctionalityCheckRule)
  - **File:** `apps/api/app/schemas/calculation_schema.py`
  - **Criteria:** Each rule type with proper fields, discriminator, validation
  - **Duration:** 3 hours

- [ ] **3.1.2** Create CalculationSchema root model with nested condition groups
  - **File:** `apps/api/app/schemas/calculation_schema.py`
  - **Criteria:** Support nesting, AND/OR groups, output status (Pass/Fail)
  - **Duration:** 2 hours

- [ ] **3.1.3** Extend intelligence_service.py with evaluate_rule() function
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** Recursively evaluate nested rules, handle all 6 types
  - **Duration:** 4 hours

- [ ] **3.1.4** Implement AND_ALL rule evaluation
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** All conditions must be true
  - **Duration:** 2 hours

- [ ] **3.1.5** Implement OR_ANY rule evaluation
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** At least one condition must be true
  - **Duration:** 2 hours

- [ ] **3.1.6** Implement PERCENTAGE_THRESHOLD rule evaluation
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** Check number field >= threshold
  - **Duration:** 2 hours

- [ ] **3.1.7** Implement COUNT_THRESHOLD and MATCH_VALUE rules
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** Count checkboxes, match specific values
  - **Duration:** 2 hours

- [ ] **3.1.8** Implement BBI_FUNCTIONALITY_CHECK rule (placeholder)
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** Check if BBI is Functional (Epic 4 dependency)
  - **Duration:** 1 hour

---

## Story 3.2: Backend Calculation Schema Validation & Test Endpoint

**Duration:** 1 day

### Atomic Tasks (4 tasks)

- [ ] **3.2.1** Create validation endpoint for calculation_schema
  - **File:** `apps/api/app/api/v1/indicators.py`
  - **Endpoint:** `POST /api/v1/indicators/validate-calculation-schema`
  - **Criteria:** Validate rule structure, field references
  - **Duration:** 2 hours

- [ ] **3.2.2** Create test calculation endpoint
  - **File:** `apps/api/app/api/v1/indicators.py`
  - **Endpoint:** `POST /api/v1/indicators/test-calculation`
  - **Criteria:** Accept sample data, return Pass/Fail with explanation
  - **Duration:** 3 hours

- [ ] **3.2.3** Integrate validation with update_indicator service
  - **File:** `apps/api/app/services/indicator_service.py`
  - **Criteria:** Validate calculation_schema before saving
  - **Duration:** 2 hours

- [ ] **3.2.4** Add is_auto_calculable flag logic
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** Only evaluate if flag is true, else leave NULL
  - **Duration:** 1 hour

---

## Story 3.3: Frontend Calculation Rule Builder Core Architecture

**Duration:** 2 days
**Dependencies:** Epic 2.0 (needs form_schema fields), `pnpm generate-types`

### Atomic Tasks (6 tasks)

- [ ] **3.3.1** Create Zustand store for calculation rule builder
  - **File:** `apps/web/src/store/calculationRuleStore.ts`
  - **Criteria:** Manage condition groups, rules, nesting
  - **Duration:** 2 hours

- [ ] **3.3.2** Create CalculationRuleBuilder main component
  - **File:** `apps/web/src/components/features/admin/indicators/CalculationRuleBuilder.tsx`
  - **Criteria:** Flowchart/tree UI, add/remove condition groups
  - **Duration:** 4 hours

- [ ] **3.3.3** Create ConditionGroup component with nesting
  - **File:** `apps/web/src/components/features/admin/indicators/CalculationRuleBuilder/ConditionGroup.tsx`
  - **Criteria:** AND/OR selector, add nested groups, visual indentation
  - **Duration:** 3 hours

- [ ] **3.3.4** Create RuleSelector component
  - **File:** `apps/web/src/components/features/admin/indicators/CalculationRuleBuilder/RuleSelector.tsx`
  - **Criteria:** Dropdown with 6 rule types, icons, descriptions
  - **Duration:** 2 hours

- [ ] **3.3.5** Create FieldSelector component
  - **File:** `apps/web/src/components/features/admin/indicators/CalculationRuleBuilder/FieldSelector.tsx`
  - **Criteria:** Dropdown populated from form_schema fields
  - **Duration:** 2 hours

- [ ] **3.3.6** Create OperatorSelector and ValueInput components
  - **Files:** `CalculationRuleBuilder/OperatorSelector.tsx`, `ValueInput.tsx`
  - **Criteria:** Operators (>=, =, contains), dynamic value input by type
  - **Duration:** 2 hours

---

## Story 3.4: Frontend Calculation Rule Builder - Rule Type Components

**Duration:** 2 days

### Atomic Tasks (7 tasks)

- [ ] **3.4.1** Create AndAllRuleComponent
  - **File:** `apps/web/src/components/features/admin/indicators/CalculationRuleBuilder/Rules/AndAllRule.tsx`
  - **Criteria:** Multiple conditions, all must be true UI
  - **Duration:** 2 hours

- [ ] **3.4.2** Create OrAnyRuleComponent
  - **File:** `CalculationRuleBuilder/Rules/OrAnyRule.tsx`
  - **Criteria:** Multiple conditions, at least one true UI
  - **Duration:** 2 hours

- [ ] **3.4.3** Create PercentageThresholdRuleComponent
  - **File:** `CalculationRuleBuilder/Rules/PercentageThresholdRule.tsx`
  - **Criteria:** Field selector, threshold input (%), comparison operator
  - **Duration:** 2 hours

- [ ] **3.4.4** Create CountThresholdRuleComponent
  - **File:** `CalculationRuleBuilder/Rules/CountThresholdRule.tsx`
  - **Criteria:** Checkbox field selector, threshold input (count)
  - **Duration:** 2 hours

- [ ] **3.4.5** Create MatchValueRuleComponent
  - **File:** `CalculationRuleBuilder/Rules/MatchValueRule.tsx`
  - **Criteria:** Field selector, value input (dynamic by field type)
  - **Duration:** 2 hours

- [ ] **3.4.6** Create BBIFunctionalityCheckComponent
  - **File:** `CalculationRuleBuilder/Rules/BBIFunctionalityCheckRule.tsx`
  - **Criteria:** BBI selector dropdown (Epic 4 dependency)
  - **Duration:** 2 hours

- [ ] **3.4.7** Add Pass/Fail output indicators
  - **File:** `CalculationRuleBuilder.tsx` (update)
  - **Criteria:** Green for Pass, Red for Fail, visual badges
  - **Duration:** 1 hour

---

## Story 3.5: Frontend Calculation Rule Builder - Test Calculation Feature

**Duration:** 1 day

### Atomic Tasks (4 tasks)

- [ ] **3.5.1** Create TestCalculationPanel component
  - **File:** `apps/web/src/components/features/admin/indicators/CalculationRuleBuilder/TestCalculationPanel.tsx`
  - **Criteria:** Collapsible panel, sample data inputs matching form_schema
  - **Duration:** 3 hours

- [ ] **3.5.2** Generate dynamic input fields from form_schema
  - **File:** `TestCalculationPanel.tsx` (update)
  - **Criteria:** Render inputs for each field in form_schema
  - **Duration:** 2 hours

- [ ] **3.5.3** Implement "Run Test" button and API call
  - **File:** `TestCalculationPanel.tsx` (update)
  - **Criteria:** Call POST /api/v1/indicators/test-calculation, handle response
  - **Duration:** 2 hours

- [ ] **3.5.4** Display test result with explanation
  - **File:** `TestCalculationPanel.tsx` (update)
  - **Criteria:** Show Pass/Fail badge, explain which rules passed/failed
  - **Duration:** 1 hour

---

## Story 3.6: Frontend Remark Schema Builder

**Duration:** 2 days

### Atomic Tasks (6 tasks)

- [ ] **3.6.1** Create Pydantic model for remark_schema
  - **File:** `apps/api/app/schemas/remark_schema.py`
  - **Criteria:** Conditions (all_children_pass, any_child_fail, bbi_status), output_template
  - **Duration:** 2 hours

- [ ] **3.6.2** Create RemarkSchemaBuilder component
  - **File:** `apps/web/src/components/features/admin/indicators/RemarkSchemaBuilder.tsx`
  - **Criteria:** List of conditions with templates, add/edit/delete
  - **Duration:** 3 hours

- [ ] **3.6.3** Create condition selector dropdown
  - **File:** `RemarkSchemaBuilder/ConditionSelector.tsx`
  - **Criteria:** Options: all_children_pass, any_child_fail, has_associated_bbi
  - **Duration:** 1 hour

- [ ] **3.6.4** Create template editor with placeholder support
  - **File:** `RemarkSchemaBuilder/TemplateEditor.tsx`
  - **Criteria:** Textarea with placeholder suggestions ({indicator_name}, {bbi_name})
  - **Duration:** 2 hours

- [ ] **3.6.5** Create default remark template field
  - **File:** `RemarkSchemaBuilder.tsx` (update)
  - **Criteria:** Input for fallback template when no conditions met
  - **Duration:** 1 hour

- [ ] **3.6.6** Add preview of generated remarks
  - **File:** `RemarkSchemaBuilder/RemarkPreview.tsx`
  - **Criteria:** Show examples based on sample statuses
  - **Duration:** 2 hours

---

## Story 3.7: Backend Remark Generation Service

**Duration:** 1 day

### Atomic Tasks (4 tasks)

- [ ] **3.7.1** Create generate_indicator_remark() function
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** Evaluate remark_schema conditions, select template
  - **Duration:** 3 hours

- [ ] **3.7.2** Implement template rendering with Jinja2
  - **File:** `apps/api/app/services/intelligence_service.py`
  - **Criteria:** Replace placeholders ({indicator_name}, {bbi_name})
  - **Duration:** 2 hours

- [ ] **3.7.3** Integrate with assessment response workflow
  - **File:** `apps/api/app/services/assessment_service.py`
  - **Criteria:** Generate remarks when assessment finalized
  - **Duration:** 2 hours

- [ ] **3.7.4** Add generated_remark column to assessment_responses
  - **File:** `apps/api/app/db/models/assessment.py`
  - **Alembic:** Create migration
  - **Criteria:** Store generated remark (VARCHAR), nullable
  - **Duration:** 1 hour

---

## Story 3.8: Testing for Calculation & Remark Builders

**Duration:** 1 day

### Atomic Tasks (6 tasks)

- [ ] **3.8.1** Write tests for all 6 rule types evaluation
  - **File:** `apps/api/tests/services/test_intelligence_service.py`
  - **Criteria:** Test each rule type with sample data
  - **Duration:** 3 hours

- [ ] **3.8.2** Write tests for nested condition group evaluation
  - **File:** `apps/api/tests/services/test_intelligence_service.py`
  - **Criteria:** Test (A AND B) OR C logic
  - **Duration:** 2 hours

- [ ] **3.8.3** Write tests for remark generation
  - **File:** `apps/api/tests/services/test_intelligence_service.py`
  - **Criteria:** Test template rendering with various conditions
  - **Duration:** 2 hours

- [ ] **3.8.4** Write frontend tests for CalculationRuleBuilder
  - **File:** `apps/web/src/components/features/admin/indicators/CalculationRuleBuilder.test.tsx`
  - **Criteria:** Test add/remove rules, nesting, field selection
  - **Duration:** 3 hours

- [ ] **3.8.5** Write tests for TestCalculationPanel
  - **File:** `apps/web/src/components/features/admin/indicators/CalculationRuleBuilder/TestCalculationPanel.test.tsx`
  - **Criteria:** Mock API, test input generation, result display
  - **Duration:** 2 hours

- [ ] **3.8.6** Write integration test for calculation workflow
  - **File:** `apps/api/tests/integration/test_calculation_workflow.py`
  - **Criteria:** Create indicator with calculation_schema → evaluate → verify result
  - **Duration:** 3 hours

---

## Summary

**Epic 3.0 Total Atomic Tasks:** 45 tasks
**Estimated Total Duration:** 8-12 days

### Task Breakdown by Story:
- Story 3.1 (Rule Engine): 8 tasks (18 hours)
- Story 3.2 (Validation): 4 tasks (8 hours)
- Story 3.3 (Builder Architecture): 6 tasks (15 hours)
- Story 3.4 (Rule Components): 7 tasks (13 hours)
- Story 3.5 (Test Calculation): 4 tasks (8 hours)
- Story 3.6 (Remark Builder): 6 tasks (11 hours)
- Story 3.7 (Remark Service): 4 tasks (8 hours)
- Story 3.8 (Testing): 6 tasks (15 hours)

**Total: 96 hours across 8 stories**
