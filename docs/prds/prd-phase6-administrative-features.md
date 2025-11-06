# Product Requirements Document (PRD)
## Phase 6: Administrative Features (MLGOO-DILG)

**Version:** 1.0
**Date:** November 6, 2025
**Status:** Draft
**Author:** VANTAGE Development Team
**Based on:** November 4, 2025 DILG Consultation

---

## 1. Introduction/Overview

### Problem Statement

The MLGOO-DILG currently lacks the administrative tools needed to independently manage the VANTAGE system as SGLGB standards evolve. Changes to indicators, assessment rules, deadlines, and BBI (Barangay-based Institutions) configuration currently require developer intervention, creating bottlenecks and reducing system adaptability.

### Solution Overview

Phase 6 introduces a comprehensive administrative interface that empowers the MLGOO-DILG to:

1. **Manage SGLGB Indicators** - Create, edit, and deactivate indicators with metadata-driven form schemas and calculation rules
2. **Configure BBI Functionality Logic** - Define which indicators determine whether BBIs (e.g., Lupon, BAC, BCPC) are "Functional" or "Non-Functional"
3. **Control Assessment Cycles & Deadlines** - Set phase-specific deadlines and provide granular deadline extensions for specific barangays

This phase transforms VANTAGE from a developer-dependent system into a flexible, MLGOO-controlled platform that adapts to changing SGLGB requirements without code changes.

### Goal

Enable the MLGOO-DILG to independently manage all critical aspects of the SGLGB assessment system, including indicator definitions, calculation logic, BBI mappings, and deadline control, without requiring developer support.

---

## 2. Goals

1. **MLGOO-DILG Independence**: Eliminate dependency on developers for indicator updates, rule changes, and deadline management
2. **Metadata-Driven Flexibility**: Support complex, dynamic indicator logic through visual configuration tools (form_schema and calculation_schema builders)
3. **BBI Automation**: Enable automatic calculation of BBI functionality status based on configurable indicator-to-BBI mappings
4. **Granular Deadline Control**: Provide the ability to unlock submissions and extend deadlines at the indicator and barangay level
5. **System Adaptability**: Allow the system to evolve with SGLGB standards through administrative configuration rather than code changes
6. **Audit & Accountability**: Maintain comprehensive audit trails for all administrative actions
7. **Historical Data Integrity**: Ensure changes to indicators do not retroactively affect completed or in-progress assessments

---

## 3. User Stories

### 3.1 Indicator Management

**US-6.1.1:** As an MLGOO-DILG administrator, I want to create a new SGLGB indicator with custom input fields (checkboxes, number inputs, date pickers, file uploads) using a visual form builder, so that I can adapt the system to updated DILG Technical Notes without developer help.

**US-6.1.2:** As an MLGOO-DILG administrator, I want to define calculation rules for an indicator (e.g., "Pass if 50% physical accomplishment OR 50% financial accomplishment") using a visual rule builder, so that the system can automatically determine compliance status based on BLGU submissions.

**US-6.1.3:** As an MLGOO-DILG administrator, I want to mark an indicator as "auto-calculable" or "human-judged only," so that the system knows whether to attempt automatic validation or leave it entirely to Assessor/Validator judgment.

**US-6.1.4:** As an MLGOO-DILG administrator, I want to edit an existing indicator's form schema or calculation schema, knowing that changes will only apply to future assessments, so that I can improve the system without invalidating historical data.

**US-6.1.5:** As an MLGOO-DILG administrator, I want to deactivate an outdated indicator, so that it no longer appears in new assessment cycles while preserving historical assessment data.

**US-6.1.6:** As an MLGOO-DILG administrator, I want to preview the JSON representation of my form_schema and calculation_schema, so that I can debug issues or share configurations with technical support if needed.

**US-6.1.7:** As an MLGOO-DILG administrator, I want to define when MOVs are required for an indicator (e.g., "MOV required if checkbox X is checked"), so that the system enforces proper documentation standards dynamically.

**US-6.1.8:** As an MLGOO-DILG administrator, I want to specify whether an indicator supports the "Conditional" status option, so that Assessors/Validators only see this choice when it's applicable.

**US-6.1.9:** As an MLGOO-DILG administrator, I want to define a remark_schema for an indicator to generate human-readable summaries (e.g., "All requirements met," "BDRRMC Functional"), so that reports automatically provide meaningful status descriptions.

### 3.2 BBI Configuration

**US-6.2.1:** As an MLGOO-DILG administrator, I want to create a BBI definition (e.g., "Lupon Tagapamayapa," "Barangay Anti-Drug Abuse Council"), so that the system can track and report on BBI functionality across all barangays.

**US-6.2.2:** As an MLGOO-DILG administrator, I want to map specific indicators to a BBI and define the rule for "Functional" status (e.g., "If Indicator 1.1 = Pass AND Indicator 1.2 = Pass, then Lupon = Functional"), so that the system automatically calculates BBI status from assessment results.

**US-6.2.3:** As an MLGOO-DILG administrator, I want to edit BBI calculation rules when DILG standards change, so that future assessments reflect updated BBI functionality criteria.

**US-6.2.4:** As an MLGOO-DILG administrator, I want to view a list of all configured BBIs and their associated indicator mappings, so that I can audit and verify the system's BBI logic.

### 3.3 Assessment Cycle & Deadline Management

**US-6.3.1:** As an MLGOO-DILG administrator, I want to create a new SGLGB assessment cycle with distinct deadlines for Table Assessment Phase 1, Rework, Table Validation Phase 2, and Calibration, so that the system enforces proper workflow timing.

**US-6.3.2:** As an MLGOO-DILG administrator, I want to view the current deadline status for all barangays across all phases, so that I can monitor overall progress and identify at-risk submissions.

**US-6.3.3:** As an MLGOO-DILG administrator, I want to unlock submissions for specific indicators for a specific barangay that missed the deadline, so that I can provide "leeway" to barangays facing legitimate challenges.

**US-6.3.4:** As an MLGOO-DILG administrator, I want to extend the deadline for specific indicators for a specific barangay by selecting a new deadline date, so that I can assist barangays on a case-by-case basis.

**US-6.3.5:** As an MLGOO-DILG administrator, I want to see a notification/confirmation before applying deadline overrides, so that I can avoid accidental changes.

**US-6.3.6:** As an MLGOO-DILG administrator, I want to view an audit log of all deadline overrides I've applied (with timestamps and reasons), so that I can maintain accountability and track my administrative actions.

### 3.4 Audit & Historical Integrity

**US-6.4.1:** As an MLGOO-DILG administrator, I want to view a complete audit trail of all indicator edits (who changed what, when), so that I can ensure accountability and debug issues.

**US-6.4.2:** As an MLGOO-DILG administrator, I want the system to clearly show me which version of an indicator was active during a specific assessment cycle, so that I can understand historical results in their proper context.

**US-6.4.3:** As a developer or system auditor, I want assurance that changes to indicators never retroactively affect completed or in-progress assessments, so that historical data integrity is maintained.

---

## 4. Functional Requirements

### 4.1 Indicator Management Interface

#### 4.1.1 Indicator CRUD Operations

**FR-6.1.1.1:** The system MUST provide a dedicated "Indicator Management" page accessible only to users with the MLGOO_DILG role.

**FR-6.1.1.2:** The system MUST display a searchable, filterable list of all indicators with columns for: Indicator Name, Governance Area, Active Status, Auto-Calculable Status, Last Modified Date.

**FR-6.1.1.3:** The system MUST allow MLGOO-DILG to create a new indicator with the following core fields:
- `name` (text, required)
- `description` (rich text, required)
- `governance_area_id` (dropdown selection, required)
- `parent_id` (dropdown selection of existing indicators, optional for hierarchical indicators)
- `is_active` (boolean, default: true)
- `is_profiling_only` (boolean, default: false)
- `is_auto_calculable` (boolean, default: false)
- `technical_notes_text` (rich text, required)

**FR-6.1.1.4:** The system MUST allow MLGOO-DILG to edit any field of an existing indicator.

**FR-6.1.1.5:** The system MUST allow MLGOO-DILG to deactivate (soft delete) an indicator by setting `is_active` to false.

**FR-6.1.1.6:** The system MUST prevent hard deletion of indicators that have associated assessment responses.

**FR-6.1.1.7:** The system MUST implement indicator versioning: when an indicator's `form_schema` or `calculation_schema` is edited, a new version is created, and existing assessments continue to reference the original version.

#### 4.1.2 Form Schema Builder (Visual)

**FR-6.1.2.1:** The system MUST provide a visual "Form Builder" interface for defining the `form_schema` of an indicator.

**FR-6.1.2.2:** The Form Builder MUST support adding the following input types via drag-and-drop or button clicks:
- Checkbox Group (multi-select)
- Radio Button Group (single-select)
- Number Input (with min/max validation)
- Text Input (short answer)
- Text Area (long answer)
- Date Picker
- File Upload (with conditional requirement logic)

**FR-6.1.2.3:** For each input field added, the system MUST allow the MLGOO-DILG to configure:
- Field Label (text)
- Field ID (auto-generated, editable)
- Required/Optional toggle
- Conditional MOV Requirement (e.g., "Require MOV if this checkbox is checked")
- Validation Rules (for number inputs: min, max; for text inputs: max length)

**FR-6.1.2.4:** For Checkbox Groups and Radio Button Groups, the system MUST allow the MLGOO-DILG to define multiple options dynamically.

**FR-6.1.2.5:** The system MUST provide a live preview of how the form will appear to the BLGU user as the MLGOO-DILG builds it.

**FR-6.1.2.6:** The system MUST allow the MLGOO-DILG to reorder form fields via drag-and-drop.

**FR-6.1.2.7:** The system MUST provide a "View JSON" toggle that displays the underlying `form_schema` JSON representation for debugging and verification.

**FR-6.1.2.8:** The system MUST validate the `form_schema` JSON structure before saving to ensure it can be correctly rendered.

#### 4.1.3 Calculation Schema Builder (Visual Rule Builder)

**FR-6.1.3.1:** The system MUST provide a visual "Calculation Rule Builder" interface for defining the `calculation_schema` of an indicator.

**FR-6.1.3.2:** The Calculation Rule Builder MUST only be accessible if `is_auto_calculable` is set to `true` for the indicator.

**FR-6.1.3.3:** The system MUST support the following rule types in the Calculation Rule Builder:
- `AND_ALL` - All conditions must be true
- `OR_ANY` - At least one condition must be true
- `PERCENTAGE_THRESHOLD` - A numeric field must meet a percentage threshold (e.g., >= 50%)
- `COUNT_THRESHOLD` - A count of selected checkboxes must meet a threshold (e.g., at least 3 of 5)
- `MATCH_VALUE` - A field must match a specific value
- `BBI_FUNCTIONALITY_CHECK` - Check if a specific BBI is "Functional"

**FR-6.1.3.4:** The system MUST allow the MLGOO-DILG to create nested condition groups (e.g., "(Condition A AND Condition B) OR Condition C").

**FR-6.1.3.5:** The system MUST allow the MLGOO-DILG to select which field from the `form_schema` to reference in each rule condition.

**FR-6.1.3.6:** The system MUST allow the MLGOO-DILG to define the output status for when conditions are met (Pass) and not met (Fail).

**FR-6.1.3.7:** The system MUST allow the MLGOO-DILG to specify whether the "Conditional" status is allowed for this indicator via a checkbox.

**FR-6.1.3.8:** The system MUST provide a "View JSON" toggle for the `calculation_schema` for debugging and verification.

**FR-6.1.3.9:** The system MUST validate the `calculation_schema` JSON structure before saving to ensure it can be correctly executed by the rule engine.

**FR-6.1.3.10:** The system MUST provide a "Test Calculation" feature where the MLGOO-DILG can input sample data and see the resulting Pass/Fail status based on the defined rules.

#### 4.1.4 Remark Schema Builder

**FR-6.1.4.1:** The system MUST provide a "Remark Builder" interface for defining the `remark_schema` of an indicator.

**FR-6.1.4.2:** The system MUST allow the MLGOO-DILG to define conditional text templates based on:
- All children pass
- Any child fails
- Associated BBI status (Functional/Non-Functional)
- Custom conditions

**FR-6.1.4.3:** The system MUST support placeholders in remark templates (e.g., `{indicator_name}`, `{bbi_name}`) that are dynamically replaced at runtime.

**FR-6.1.4.4:** The system MUST provide a default remark template option (e.g., "Status pending.").

### 4.2 BBI Configuration Interface

#### 4.2.1 BBI Definition Management

**FR-6.2.1.1:** The system MUST provide a dedicated "BBI Configuration" page accessible only to users with the MLGOO_DILG role.

**FR-6.2.1.2:** The system MUST allow the MLGOO-DILG to create a new BBI with the following fields:
- BBI Name (e.g., "Lupon Tagapamayapa", "Barangay Anti-Drug Abuse Council")
- BBI Abbreviation (e.g., "LUPON", "BADAC")
- Description (optional)
- Associated Governance Area (dropdown selection)

**FR-6.2.1.3:** The system MUST display a list of all configured BBIs with columns for: BBI Name, Governance Area, Number of Mapped Indicators, Active Status.

**FR-6.2.1.4:** The system MUST allow the MLGOO-DILG to edit or deactivate a BBI.

#### 4.2.2 Indicator-to-BBI Mapping

**FR-6.2.2.1:** For each BBI, the system MUST provide an interface to define the calculation rule for determining "Functional" vs. "Non-Functional" status.

**FR-6.2.2.2:** The BBI rule builder MUST support the same rule types as the indicator calculation schema (AND_ALL, OR_ANY, etc.).

**FR-6.2.2.3:** The system MUST allow the MLGOO-DILG to select which indicators contribute to the BBI functionality determination.

**FR-6.2.2.4:** The system MUST allow the MLGOO-DILG to define the logic: "If [these indicator conditions are met], then BBI = Functional, else BBI = Non-Functional."

**FR-6.2.2.5:** The system MUST provide a "Test BBI Calculation" feature where the MLGOO-DILG can input sample indicator statuses and see the resulting BBI functionality status.

**FR-6.2.2.6:** The system MUST validate that all indicators referenced in a BBI mapping rule actually exist and are active.

### 4.3 Assessment Cycle & Deadline Management

#### 4.3.1 Assessment Cycle Creation

**FR-6.3.1.1:** The system MUST provide a dedicated "Assessment Cycle Management" page accessible only to users with the MLGOO_DILG role.

**FR-6.3.1.2:** The system MUST allow the MLGOO-DILG to create a new assessment cycle with the following fields:
- Cycle Name (e.g., "SGLGB 2026")
- Cycle Year
- Table Assessment Phase 1 Deadline (date/time)
- Rework Submission Deadline (date/time)
- Table Validation Phase 2 Deadline (date/time)
- Calibration Submission Deadline (date/time)

**FR-6.3.1.3:** The system MUST enforce that deadlines are set in chronological order (Phase 1 → Rework → Phase 2 → Calibration).

**FR-6.3.1.4:** The system MUST allow only one active assessment cycle at a time.

**FR-6.3.1.5:** The system MUST allow the MLGOO-DILG to edit cycle-wide deadlines before the cycle begins.

#### 4.3.2 Deadline Monitoring Dashboard

**FR-6.3.2.1:** The system MUST provide a "Deadline Status Dashboard" showing all barangays and their submission status for each phase.

**FR-6.3.2.2:** The dashboard MUST visually distinguish between:
- Submitted on time
- Submitted late
- Not yet submitted (approaching deadline)
- Not yet submitted (past deadline)

**FR-6.3.2.3:** The dashboard MUST allow filtering by barangay, governance area, and phase.

#### 4.3.3 Granular Deadline Override Controls

**FR-6.3.3.1:** The system MUST provide a "Deadline Override" interface accessible from the Deadline Status Dashboard.

**FR-6.3.3.2:** The system MUST allow the MLGOO-DILG to select:
- A specific barangay
- One or more specific indicators (or "All indicators")
- A new deadline date/time
- A reason for the override (text input, required)

**FR-6.3.3.3:** The system MUST display a confirmation dialog before applying the deadline override, showing exactly what will be changed.

**FR-6.3.3.4:** Upon confirmation, the system MUST:
- Update the deadline for the selected indicator(s) and barangay
- Unlock the submission if it was previously locked due to the deadline
- Log the override action to the audit trail

**FR-6.3.3.5:** The system MUST send an email notification to the affected barangay's BLGU_USER(s) informing them of the deadline extension.

**FR-6.3.3.6:** The system MUST prevent the MLGOO-DILG from setting a new deadline in the past.

#### 4.3.4 Audit Trail for Deadline Overrides

**FR-6.3.4.1:** The system MUST provide a dedicated "Deadline Override Audit Log" page accessible to MLGOO_DILG users.

**FR-6.3.4.2:** The audit log MUST display all deadline overrides with the following information:
- Timestamp of override
- MLGOO-DILG user who performed the override
- Barangay affected
- Indicator(s) affected
- Original deadline
- New deadline
- Reason provided

**FR-6.3.4.3:** The audit log MUST be filterable by date range, barangay, and user.

**FR-6.3.4.4:** The audit log MUST be exportable to CSV format.

### 4.4 Audit & Versioning

#### 4.4.1 Indicator Edit Audit Trail

**FR-6.4.1.1:** The system MUST log every change to an indicator's core fields, `form_schema`, `calculation_schema`, or `remark_schema`.

**FR-6.4.1.2:** The audit log entry MUST include:
- Timestamp
- MLGOO-DILG user who made the change
- Indicator ID and name
- Fields changed (before and after values, if feasible)
- Indicator version number

**FR-6.4.1.3:** The system MUST provide an "Indicator Change History" view accessible from the Indicator Management page.

#### 4.4.2 Indicator Versioning

**FR-6.4.2.1:** The system MUST maintain a version history for each indicator, incrementing the version number whenever `form_schema`, `calculation_schema`, or `remark_schema` is edited.

**FR-6.4.2.2:** The system MUST link each assessment to the specific version of the indicator that was active when the assessment was created.

**FR-6.4.2.3:** The system MUST ensure that changes to an indicator never retroactively affect existing assessments.

**FR-6.4.2.4:** The system MUST allow the MLGOO-DILG to view previous versions of an indicator (read-only).

**FR-6.4.2.5:** The system MUST clearly label which version of an indicator is currently active for new assessments.

#### 4.4.3 BBI Configuration Audit Trail

**FR-6.4.3.1:** The system MUST log every change to BBI definitions and indicator-to-BBI mappings.

**FR-6.4.3.2:** The audit log entry MUST include:
- Timestamp
- MLGOO-DILG user who made the change
- BBI ID and name
- Change description (e.g., "Updated functionality rule")

**FR-6.4.3.3:** The system MUST provide a "BBI Change History" view accessible from the BBI Configuration page.

### 4.5 Access Control

**FR-6.5.1:** All administrative features in Phase 6 MUST be accessible only to users with the `MLGOO_DILG` role.

**FR-6.5.2:** The system MUST return a 403 Forbidden error if a non-MLGOO_DILG user attempts to access any administrative endpoint.

**FR-6.5.3:** The system MUST log all access attempts to administrative features for security auditing.

### 4.6 Data Validation & Error Handling

**FR-6.6.1:** The system MUST validate all form inputs before saving (e.g., required fields, valid date formats, valid JSON structures).

**FR-6.6.2:** The system MUST display clear, user-friendly error messages if validation fails.

**FR-6.6.3:** The system MUST prevent the MLGOO-DILG from creating circular dependencies in hierarchical indicators (e.g., Indicator A is parent of B, B is parent of A).

**FR-6.6.4:** The system MUST prevent the MLGOO-DILG from referencing non-existent fields in `calculation_schema` rules.

**FR-6.6.5:** The system MUST gracefully handle errors during JSON parsing and provide specific feedback on what is invalid.

---

## 5. Non-Goals (Out of Scope)

**NG-6.1:** **Multi-Tenancy for Multiple Municipalities** - This phase assumes a single-municipality deployment. Multi-tenancy support is out of scope.

**NG-6.2:** **Advanced Workflow Automation** - Features like "auto-approve assessments that meet X criteria" or "auto-send reminders 3 days before deadline" are out of scope. The system provides the tools; the MLGOO-DILG performs the actions.

**NG-6.3:** **Role-Based Indicator Editing** - All MLGOO_DILG users have the same administrative privileges. Granular permissions within the MLGOO_DILG role (e.g., "User A can edit indicators but not deadlines") are out of scope.

**NG-6.4:** **AI-Assisted Indicator Creation** - Using AI to suggest indicator structures or calculation rules based on Technical Notes is out of scope for this phase.

**NG-6.5:** **Mobile-First Administrative Interface** - While the UI should be responsive, the primary target for administrative features is desktop/laptop users. Mobile optimization is secondary.

**NG-6.6:** **Indicator Deletion with Data Migration** - Hard deletion of indicators with automatic migration of associated assessment data to a replacement indicator is out of scope. Deactivation (soft delete) is the supported approach.

**NG-6.7:** **Weighted Scoring for BBI Functionality** - BBI functionality is determined by rule-based logic (Pass/Fail of specific indicators), not by weighted scores or percentages.

**NG-6.8:** **Bulk Import of Indicators** - Importing indicators from Excel or CSV files is out of scope. All indicator creation is done through the UI.

**NG-6.9:** **Collaborative Editing** - Real-time collaborative editing of indicators by multiple MLGOO-DILG users simultaneously is out of scope.

---

## 6. Design Considerations

### 6.1 User Interface Design

**DC-6.1.1:** The administrative interface should follow the existing VANTAGE design system (Tailwind CSS, shadcn/ui components).

**DC-6.1.2:** The Form Builder and Calculation Rule Builder should use a clean, modern interface similar to tools like Google Forms (for form building) and Zapier/Make.com (for rule building).

**DC-6.1.3:** Visual feedback should be provided at every step:
- Loading spinners during save operations
- Success toasts after successful saves
- Clear error messages with actionable guidance

**DC-6.1.4:** The interface should use progressive disclosure - show basic options first, with "Advanced Settings" accordions for complex features.

**DC-6.1.5:** The "View JSON" toggle should be clearly separated from the visual builder to avoid confusion for non-technical users.

### 6.2 Form Builder UX

**DC-6.2.1:** The Form Builder should have a left sidebar with draggable input types and a center canvas showing the live form preview.

**DC-6.2.2:** Clicking on a field in the preview should open a right sidebar with field properties (label, validation, MOV requirement, etc.).

**DC-6.2.3:** The live preview should show exactly how the form will appear to the BLGU user, including all labels, placeholders, and validation indicators.

### 6.3 Calculation Rule Builder UX

**DC-6.3.1:** The Calculation Rule Builder should use a visual "flowchart" or "decision tree" style interface.

**DC-6.3.2:** Users should be able to add condition groups and nest them visually (with indentation or connecting lines).

**DC-6.3.3:** Each rule should show:
- The field being evaluated (dropdown selection from form_schema fields)
- The operator (e.g., ">=", "=", "contains")
- The comparison value (input field)

**DC-6.3.4:** The output (Pass/Fail) should be clearly indicated with color coding (e.g., green for Pass, red for Fail).

### 6.4 Deadline Override UX

**DC-6.4.1:** The Deadline Override interface should use a multi-step modal:
- Step 1: Select barangay
- Step 2: Select indicator(s)
- Step 3: Set new deadline and provide reason
- Step 4: Review and confirm

**DC-6.4.2:** The confirmation step should clearly summarize the change in plain language (e.g., "You are extending the deadline for Indicator 1.1 for Barangay San Jose from November 10, 2025 to November 17, 2025.").

### 6.5 Responsive Design

**DC-6.5.1:** While desktop is the primary target, the interface should be usable on tablets (landscape mode).

**DC-6.5.2:** Complex builders (Form Builder, Rule Builder) may have simplified mobile views or display a "Best viewed on desktop" message.

---

## 7. Technical Considerations

### 7.1 Backend Architecture

**TC-7.1.1:** All administrative endpoints should be implemented in a new FastAPI router: `apps/api/app/api/v1/admin.py` with the tag `admin`.

**TC-7.1.2:** A new service layer should be created: `apps/api/app/services/admin_service.py` to handle all administrative business logic.

**TC-7.1.3:** Indicator versioning should be implemented in the database with an `indicators_history` table that stores previous versions.

**TC-7.1.4:** The `indicators` table should include a `version` column (integer) that increments on each schema edit.

**TC-7.1.5:** The `assessment_responses` table should include a `indicator_version_id` foreign key to link to the specific indicator version used.

### 7.2 Database Schema Updates

**TC-7.2.1:** New tables required:
- `indicators_history` - Stores previous versions of indicators
- `bbis` - Stores BBI definitions
- `bbi_indicator_mappings` - Stores indicator-to-BBI mappings and calculation rules
- `assessment_cycles` - Stores assessment cycle definitions and deadlines
- `deadline_overrides` - Stores all deadline override actions for audit

**TC-7.2.2:** Updated tables:
- `indicators` - Add columns: `is_auto_calculable`, `version`, `remark_schema`
- `assessment_responses` - Add column: `indicator_version_id`

**TC-7.2.3:** All new tables should have `created_at`, `updated_at`, and `created_by` audit columns.

### 7.3 JSON Schema Validation

**TC-7.3.1:** The backend must validate `form_schema`, `calculation_schema`, and `remark_schema` JSON structures using Pydantic models before saving to the database.

**TC-7.3.2:** A library of Pydantic models should be created to define the structure of each rule type (AND_ALL, OR_ANY, PERCENTAGE_THRESHOLD, etc.).

**TC-7.3.3:** The backend should return specific error messages if JSON validation fails (e.g., "Field 'field_id' is required in PERCENTAGE_THRESHOLD rule").

### 7.4 Rule Engine Integration

**TC-7.4.1:** The existing `intelligence_service.py` rule engine must be extended to support all new rule types defined in the Calculation Rule Builder.

**TC-7.4.2:** The rule engine must check the `is_auto_calculable` flag before attempting to evaluate an indicator.

**TC-7.4.3:** The rule engine must handle nested condition groups correctly (respecting AND/OR precedence).

**TC-7.4.4:** The rule engine must support BBI_FUNCTIONALITY_CHECK rule type by querying the BBI calculation results.

### 7.5 Frontend Type Generation

**TC-7.5.1:** After implementing backend schemas, run `pnpm generate-types` to generate TypeScript types and React Query hooks for all new administrative endpoints.

**TC-7.5.2:** All admin components should be located in `apps/web/src/components/features/admin/`.

**TC-7.5.3:** Admin pages should be located in `apps/web/src/app/(app)/admin/`.

### 7.6 Performance Considerations

**TC-7.6.1:** The Form Builder and Rule Builder should use local state (useState) for editing to avoid unnecessary API calls during the build process.

**TC-7.6.2:** Only save to the backend when the user clicks "Save" or "Publish."

**TC-7.6.3:** The Deadline Status Dashboard should use pagination and filtering to avoid loading all barangays at once.

**TC-7.6.4:** The audit log queries should be indexed on `created_at` and `user_id` for performance.

### 7.7 Security Considerations

**TC-7.7.1:** All administrative endpoints must verify the user's role is `MLGOO_DILG` before allowing access.

**TC-7.7.2:** The system must sanitize all user inputs to prevent XSS attacks, especially in rich text fields (description, technical_notes_text).

**TC-7.7.3:** The system must rate-limit administrative API endpoints to prevent abuse.

**TC-7.7.4:** All database mutations (create, update, delete) must be logged to the audit trail.

### 7.8 Migration Strategy

**TC-7.8.1:** Existing indicators in the database must be migrated to the new versioning system with `version = 1`.

**TC-7.8.2:** A database migration script must populate the `indicators_history` table with the current state of all indicators as version 1.

**TC-7.8.3:** The migration must be reversible (provide a downgrade script).

---

## 8. Success Metrics

### 8.1 Primary Metrics

**SM-6.1:** **MLGOO-DILG Independence** - MLGOO-DILG can create or edit indicators without developer support (Target: 100% of indicator changes performed via UI, 0% via developer tickets).

**SM-6.2:** **Time to Configure New Cycle** - Time required to configure a new SGLGB assessment cycle is reduced by at least 50% compared to manual/developer-assisted configuration.

**SM-6.3:** **Developer Ticket Reduction** - Number of developer tickets for "change indicator logic," "update calculation rules," or "extend deadline for barangay X" is reduced to zero.

**SM-6.4:** **System Adaptability** - VANTAGE adapts to updated DILG SGLGB Technical Notes within 1 business day of release, without requiring code deployments.

### 8.2 Secondary Metrics

**SM-6.5:** **BBI Calculation Accuracy** - BBI functionality status is correctly auto-calculated for 100% of barangays based on configured rules.

**SM-6.6:** **Audit Compliance** - 100% of administrative actions (indicator edits, deadline overrides, BBI changes) are logged to the audit trail with complete information.

**SM-6.7:** **User Satisfaction** - MLGOO-DILG users rate the administrative interface as "Easy to Use" or "Very Easy to Use" (Target: ≥ 80% satisfaction).

**SM-6.8:** **Historical Data Integrity** - Zero instances of retroactive changes affecting completed or in-progress assessments (verified via automated tests).

### 8.3 Usage Metrics

**SM-6.9:** **Indicator Creation Rate** - Track the number of new indicators created per month via the UI.

**SM-6.10:** **Deadline Override Frequency** - Track the number of deadline overrides applied per assessment cycle to identify patterns and potential workflow improvements.

**SM-6.11:** **Form Builder Usage** - Percentage of indicators created using the visual Form Builder vs. direct JSON editing (Target: ≥ 90% use visual builder).

---

## 9. Open Questions

**OQ-6.1:** **Indicator Templates** - Should the system provide pre-built indicator templates for common patterns (e.g., "Document Posting Checklist," "Percentage Threshold Evaluation") to speed up indicator creation?

**OQ-6.2:** **Multi-Language Support** - Should indicator names, descriptions, and technical notes support multiple languages (English, Filipino) for future expansion?

**OQ-6.3:** **Indicator Duplication** - Should the system allow MLGOO-DILG to duplicate an existing indicator as a starting point for creating a similar one?

**OQ-6.4:** **BBI Versioning** - Should BBI definitions and mappings also be versioned (similar to indicators) to maintain historical accuracy?

**OQ-6.5:** **Deadline Extension Notifications** - Should the system notify the assigned Assessor/Validator when a deadline is extended for a barangay they're working with?

**OQ-6.6:** **Bulk Deadline Extensions** - Should the system support bulk deadline extensions (e.g., "Extend deadline for all barangays in a specific municipality by 7 days")?

**OQ-6.7:** **Indicator Approval Workflow** - Should indicator edits require a review/approval step before going live, or should MLGOO-DILG changes be immediately active?

**OQ-6.8:** **Remark Schema Complexity** - How complex should the remark schema builder be? Should it support conditional logic as advanced as the calculation schema, or should it remain simpler?

**OQ-6.9:** **Indicator Preview for BLGUs** - Should there be a "Preview Mode" where MLGOO-DILG can see how an indicator will appear to BLGUs before activating it?

**OQ-6.10:** **Export/Import Configuration** - Should the system support exporting indicator configurations (JSON) for backup or sharing with other municipalities in the future?

---

## Appendix A: Related Documents

- `docs/project-roadmap.md` - VANTAGE Feature Roadmap
- `tasks/tasks-prd-blgu-preassessmet-workflow/README.md` - Metadata-Driven Indicator Management Approach
- `CLAUDE.md` - VANTAGE Architecture & Development Guidelines
- `.cursor/rules/create-prd.mdc` - PRD Creation Guidelines

---

## Appendix B: Glossary

- **MLGOO-DILG**: Municipal Local Government Operations Officer - DILG, the primary administrator of the VANTAGE system
- **BBI**: Barangay-based Institutions (e.g., Lupon, BAC, BCPC, BHW)
- **SGLGB**: Seal of Good Local Governance for Barangays
- **MOV**: Means of Verification (documentary evidence)
- **form_schema**: JSON schema defining the input fields for an indicator
- **calculation_schema**: JSON schema defining the automatic Pass/Fail calculation rules for an indicator
- **remark_schema**: JSON schema defining how human-readable remarks are generated for an indicator
- **is_auto_calculable**: Boolean flag indicating whether the system should attempt automatic validation for an indicator

---

**End of PRD**
