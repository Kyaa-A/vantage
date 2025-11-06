# Epic 5.0: Assessment Cycle & Deadline Management System

**PRD Reference:** FR-4.3.1, FR-4.3.2, FR-4.3.3, FR-4.3.4
**Duration:** 6-8 days
**Dependencies:** Epic 1.0 (indicators must exist), Epic 6.0 (audit logging)

---

## Story 5.1: Database Schema for Cycles & Deadline Overrides

**Duration:** 1 day

### Atomic Tasks (5 tasks)

- [x] **5.1.1** Create assessment_cycles table model
  - **File:** `apps/api/app/db/models/admin.py`
  - **Criteria:** Fields: id, name, year, phase1_deadline, rework_deadline, phase2_deadline, calibration_deadline, is_active, created_at
  - **Duration:** 2 hours
  - **Completed:** Added AssessmentCycle model with all required fields, indexes, and relationships

- [x] **5.1.2** Create deadline_overrides table model
  - **File:** `apps/api/app/db/models/admin.py`
  - **Criteria:** Fields: id, barangay_id, indicator_id, original_deadline, new_deadline, reason, created_by, created_at
  - **Duration:** 2 hours
  - **Completed:** Added DeadlineOverride model with cycle_id, all required fields, composite indexes, and relationships to cycle, barangay, indicator, and user

- [x] **5.1.3** Add unique constraint for active cycle
  - **File:** `apps/api/app/db/models/admin.py`
  - **Criteria:** Only one assessment_cycle can have is_active=True
  - **Duration:** 1 hour
  - **Completed:** Added partial unique index 'uq_assessment_cycles_single_active' that ensures only one cycle can have is_active=True at database level

- [x] **5.1.4** Create Alembic migration for admin tables
  - **File:** `apps/api/alembic/versions/c0ef832297f3_create_assessment_cycles_and_deadline_.py`
  - **Criteria:** Create assessment_cycles and deadline_overrides tables
  - **Duration:** 2 hours
  - **Completed:** Generated migration with both tables, all indexes including partial unique index, foreign key constraints, and proper upgrade/downgrade functions

- [x] **5.1.5** Add relationships to barangays and users
  - **Files:** `admin.py`, `barangay.py`, `user.py`, `governance_area.py` (update)
  - **Criteria:** Link overrides to barangays, indicators, users
  - **Duration:** 1 hour
  - **Completed:** Added bidirectional relationships with back_populates between DeadlineOverride and Barangay, Indicator, User models for efficient querying in both directions

---

## Story 5.2: Backend Deadline Management Service

**Duration:** 2 days
**Dependencies:** 5.1

### Atomic Tasks (9 tasks)

- [ ] **5.2.1** Create deadline_service.py with base structure
  - **File:** `apps/api/app/services/deadline_service.py`
  - **Criteria:** DeadlineService class with db session
  - **Duration:** 1 hour

- [ ] **5.2.2** Implement create_assessment_cycle() method
  - **File:** `apps/api/app/services/deadline_service.py`
  - **Criteria:** Create cycle, validate deadlines in chronological order, deactivate previous cycle
  - **Duration:** 3 hours

- [ ] **5.2.3** Implement get_active_cycle() method
  - **File:** `apps/api/app/services/deadline_service.py`
  - **Criteria:** Fetch currently active cycle
  - **Duration:** 1 hour

- [ ] **5.2.4** Implement update_cycle() method
  - **File:** `apps/api/app/services/deadline_service.py`
  - **Criteria:** Update deadlines, validate chronological order, only allow if cycle not started
  - **Duration:** 2 hours

- [ ] **5.2.5** Implement get_deadline_status() method
  - **File:** `apps/api/app/services/deadline_service.py`
  - **Criteria:** For each barangay, check submission status vs deadlines (submitted on time, late, pending, overdue)
  - **Duration:** 4 hours

- [ ] **5.2.6** Implement apply_deadline_override() method
  - **File:** `apps/api/app/services/deadline_service.py`
  - **Criteria:** Create override record, validate new_deadline not in past, unlock submission
  - **Duration:** 3 hours

- [ ] **5.2.7** Implement get_deadline_overrides() method
  - **File:** `apps/api/app/services/deadline_service.py`
  - **Criteria:** Fetch overrides with filters (date range, barangay, user), support pagination
  - **Duration:** 2 hours

- [ ] **5.2.8** Implement export_overrides_to_csv() method
  - **File:** `apps/api/app/services/deadline_service.py`
  - **Criteria:** Generate CSV with all override fields
  - **Duration:** 2 hours

- [ ] **5.2.9** Create Pydantic schemas for cycles and overrides
  - **File:** `apps/api/app/schemas/admin.py`
  - **Criteria:** CycleCreate, CycleResponse, OverrideRequest, OverrideResponse, DeadlineStatusResponse
  - **Duration:** 2 hours

---

## Story 5.3: Backend Deadline API Endpoints

**Duration:** 1 day
**Dependencies:** 5.2

### Atomic Tasks (8 tasks)

- [ ] **5.3.1** Create admin.py router (if not exists from Epic 6)
  - **File:** `apps/api/app/api/v1/admin.py`
  - **Criteria:** APIRouter with /admin prefix, tags=["admin"]
  - **Duration:** 0.5 hours

- [ ] **5.3.2** Implement POST /api/v1/admin/cycles endpoint
  - **File:** `apps/api/app/api/v1/admin.py`
  - **Criteria:** Create cycle, require MLGOO_DILG role, validate deadlines
  - **Duration:** 1.5 hours

- [ ] **5.3.3** Implement GET /api/v1/admin/cycles/active endpoint
  - **File:** `apps/api/app/api/v1/admin.py`
  - **Criteria:** Get active cycle, return 404 if none
  - **Duration:** 1 hour

- [ ] **5.3.4** Implement PUT /api/v1/admin/cycles/{id} endpoint
  - **File:** `apps/api/app/api/v1/admin.py`
  - **Criteria:** Update cycle deadlines
  - **Duration:** 1.5 hours

- [ ] **5.3.5** Implement GET /api/v1/admin/deadlines/status endpoint
  - **File:** `apps/api/app/api/v1/admin.py`
  - **Criteria:** Get deadline status for all barangays, support filters
  - **Duration:** 2 hours

- [ ] **5.3.6** Implement POST /api/v1/admin/deadlines/override endpoint
  - **File:** `apps/api/app/api/v1/admin.py`
  - **Criteria:** Apply deadline override, return confirmation
  - **Duration:** 2 hours

- [ ] **5.3.7** Implement GET /api/v1/admin/deadlines/overrides endpoint
  - **File:** `apps/api/app/api/v1/admin.py`
  - **Criteria:** List overrides with filters, pagination
  - **Duration:** 1.5 hours

- [ ] **5.3.8** Implement GET /api/v1/admin/deadlines/overrides/export endpoint
  - **File:** `apps/api/app/api/v1/admin.py`
  - **Criteria:** Return CSV file response
  - **Duration:** 1 hour

---

## Story 5.4: Frontend Assessment Cycle Management Page

**Duration:** 1 day
**Dependencies:** 5.3, `pnpm generate-types`

### Atomic Tasks (5 tasks)

- [ ] **5.4.1** Generate TypeScript types
  - **Command:** `pnpm generate-types`
  - **Criteria:** CycleResponse, OverrideResponse types available
  - **Duration:** 0.5 hours

- [ ] **5.4.2** Create useCycles custom hook
  - **File:** `apps/web/src/hooks/useCycles.ts`
  - **Criteria:** Wrap TanStack Query hooks (useGetActiveCycle, useCreateCycle, useUpdateCycle)
  - **Duration:** 1.5 hours

- [ ] **5.4.3** Create cycle management page
  - **File:** `apps/web/src/app/(app)/admin/cycles/page.tsx`
  - **Criteria:** Server Component, protected route, displays active cycle + create/edit form
  - **Duration:** 2 hours

- [ ] **5.4.4** Create CycleForm component
  - **File:** `apps/web/src/components/features/admin/cycles/CycleForm.tsx`
  - **Criteria:** Form with name, year, 4 deadline date pickers, chronological validation
  - **Duration:** 3 hours

- [ ] **5.4.5** Add validation for chronological deadlines
  - **File:** `CycleForm.tsx` (update)
  - **Criteria:** Client-side validation: phase1 < rework < phase2 < calibration
  - **Duration:** 1 hour

---

## Story 5.5: Frontend Deadline Status Dashboard

**Duration:** 2 days
**Dependencies:** 5.3, `pnpm generate-types`

### Atomic Tasks (8 tasks)

- [ ] **5.5.1** Create useDeadlines custom hook
  - **File:** `apps/web/src/hooks/useDeadlines.ts`
  - **Criteria:** Wrap deadline status and override hooks
  - **Duration:** 1.5 hours

- [ ] **5.5.2** Create deadline monitoring page
  - **File:** `apps/web/src/app/(app)/admin/deadlines/page.tsx`
  - **Criteria:** Server Component, renders DeadlineStatusDashboard
  - **Duration:** 1 hour

- [ ] **5.5.3** Create DeadlineStatusDashboard component structure
  - **File:** `apps/web/src/components/features/admin/deadlines/DeadlineStatusDashboard.tsx`
  - **Criteria:** Grid/table layout showing barangays × phases
  - **Duration:** 3 hours

- [ ] **5.5.4** Implement status color coding
  - **File:** `DeadlineStatusDashboard.tsx` (update)
  - **Criteria:** Green (on time), Yellow (approaching), Red (overdue), Blue (late but submitted)
  - **Duration:** 2 hours

- [ ] **5.5.5** Add filter controls
  - **File:** `DeadlineStatusDashboard.tsx` (update)
  - **Criteria:** Filters: barangay name, governance area, phase
  - **Duration:** 2 hours

- [ ] **5.5.6** Add summary statistics panel
  - **File:** `DeadlineStatusDashboard/StatsSummary.tsx`
  - **Criteria:** Show totals: submitted, overdue, pending
  - **Duration:** 2 hours

- [ ] **5.5.7** Add "Extend Deadline" button per barangay
  - **File:** `DeadlineStatusDashboard.tsx` (update)
  - **Criteria:** Button opens DeadlineOverrideModal
  - **Duration:** 1 hour

- [ ] **5.5.8** Implement real-time updates
  - **File:** `DeadlineStatusDashboard.tsx` (update)
  - **Criteria:** Auto-refresh every 30 seconds, manual refresh button
  - **Duration:** 1.5 hours

---

## Story 5.6: Frontend Deadline Override Modal & Workflow

**Duration:** 2 days
**Dependencies:** 5.5

### Atomic Tasks (8 tasks)

- [ ] **5.6.1** Create DeadlineOverrideModal component structure
  - **File:** `apps/web/src/components/features/admin/deadlines/DeadlineOverrideModal.tsx`
  - **Criteria:** Multi-step dialog using shadcn/ui Dialog
  - **Duration:** 2 hours

- [ ] **5.6.2** Implement Step 1: Select Barangay
  - **File:** `DeadlineOverrideModal/Step1SelectBarangay.tsx`
  - **Criteria:** Searchable dropdown or combobox, show barangay name + region
  - **Duration:** 2 hours

- [ ] **5.6.3** Implement Step 2: Select Indicators
  - **File:** `DeadlineOverrideModal/Step2SelectIndicators.tsx`
  - **Criteria:** Multi-select checkbox list, "Select All" option
  - **Duration:** 2 hours

- [ ] **5.6.4** Implement Step 3: Set New Deadline & Reason
  - **File:** `DeadlineOverrideModal/Step3SetDeadline.tsx`
  - **Criteria:** Date picker (min = today), textarea for reason (required)
  - **Duration:** 2 hours

- [ ] **5.6.5** Implement Step 4: Confirmation Summary
  - **File:** `DeadlineOverrideModal/Step4Confirmation.tsx`
  - **Criteria:** Display all selections, plain language summary (e.g., "Extending deadline for 3 indicators...")
  - **Duration:** 1.5 hours

- [ ] **5.6.6** Implement navigation between steps
  - **File:** `DeadlineOverrideModal.tsx` (update)
  - **Criteria:** Next/Previous buttons, validation before next, progress indicator
  - **Duration:** 1.5 hours

- [ ] **5.6.7** Implement submit and API integration
  - **File:** `DeadlineOverrideModal.tsx` (update)
  - **Criteria:** Call POST /api/v1/admin/deadlines/override, handle success/error
  - **Duration:** 2 hours

- [ ] **5.6.8** Add success notification and close
  - **File:** `DeadlineOverrideModal.tsx` (update)
  - **Criteria:** Toast notification, close modal, refresh dashboard
  - **Duration:** 1 hour

---

## Story 5.7: Frontend Deadline Override Audit Log

**Duration:** 1 day
**Dependencies:** 5.3, `pnpm generate-types`

### Atomic Tasks (5 tasks)

- [ ] **5.7.1** Create useDeadlineAuditLog custom hook
  - **File:** `apps/web/src/hooks/useDeadlineAuditLog.ts`
  - **Criteria:** Wrap useGetDeadlineOverrides with filters
  - **Duration:** 1 hour

- [ ] **5.7.2** Create DeadlineAuditLog component
  - **File:** `apps/web/src/components/features/admin/deadlines/DeadlineAuditLog.tsx`
  - **Criteria:** Table with columns: Timestamp, User, Barangay, Indicators, Old Deadline, New Deadline, Reason
  - **Duration:** 3 hours

- [ ] **5.7.3** Add filter controls
  - **File:** `DeadlineAuditLog.tsx` (update)
  - **Criteria:** Date range picker, barangay filter, user filter
  - **Duration:** 2 hours

- [ ] **5.7.4** Implement CSV export button
  - **File:** `DeadlineAuditLog.tsx` (update)
  - **Criteria:** Call GET /api/v1/admin/deadlines/overrides/export, trigger download
  - **Duration:** 1.5 hours

- [ ] **5.7.5** Add pagination
  - **File:** `DeadlineAuditLog.tsx` (update)
  - **Criteria:** shadcn/ui Pagination component, page size selector
  - **Duration:** 1.5 hours

---

## Story 5.8: Deadline Extension Email Notifications

**Duration:** 1 day
**Dependencies:** 5.2

### Atomic Tasks (5 tasks)

- [ ] **5.8.1** Create admin_notifications.py worker file
  - **File:** `apps/api/app/workers/admin_notifications.py`
  - **Criteria:** Celery tasks for admin notifications
  - **Duration:** 1 hour

- [ ] **5.8.2** Create send_deadline_extension_email task
  - **File:** `apps/api/app/workers/admin_notifications.py`
  - **Criteria:** Celery task accepting barangay_id, indicator_ids, new_deadline
  - **Duration:** 2 hours

- [ ] **5.8.3** Create email template for deadline extension
  - **File:** `apps/api/app/templates/emails/deadline_extension.html`
  - **Criteria:** HTML template with barangay name, indicators, new deadline, reason
  - **Duration:** 2 hours

- [ ] **5.8.4** Integrate task with apply_deadline_override service
  - **File:** `apps/api/app/services/deadline_service.py` (update)
  - **Criteria:** Call send_deadline_extension_email.delay() after creating override
  - **Duration:** 1 hour

- [ ] **5.8.5** Test email sending (dev environment)
  - **Tool:** Mailtrap or similar
  - **Criteria:** Verify email sent with correct content
  - **Duration:** 1 hour

---

## Story 5.9: Testing for Deadline Management

**Duration:** 1 day
**Dependencies:** 5.8

### Atomic Tasks (7 tasks)

- [ ] **5.9.1** Write deadline_service unit tests
  - **File:** `apps/api/tests/services/test_deadline_service.py`
  - **Criteria:** Test cycle creation, deadline validation, override logic
  - **Duration:** 3 hours

- [ ] **5.9.2** Write chronological deadline validation tests
  - **File:** `apps/api/tests/services/test_deadline_service.py`
  - **Criteria:** Test phase1 < rework < phase2 < calibration, reject invalid order
  - **Duration:** 2 hours

- [ ] **5.9.3** Write deadline API endpoint tests
  - **File:** `apps/api/tests/api/v1/test_admin.py`
  - **Criteria:** Test all cycle and override endpoints
  - **Duration:** 3 hours

- [ ] **5.9.4** Write frontend DeadlineOverrideModal tests
  - **File:** `apps/web/src/components/features/admin/deadlines/DeadlineOverrideModal.test.tsx`
  - **Criteria:** Test multi-step flow, validation, submission
  - **Duration:** 3 hours

- [ ] **5.9.5** Write DeadlineStatusDashboard tests
  - **File:** `apps/web/src/components/features/admin/deadlines/DeadlineStatusDashboard.test.tsx`
  - **Criteria:** Mock API, test status colors, filters, summary stats
  - **Duration:** 2 hours

- [ ] **5.9.6** Write email notification tests
  - **File:** `apps/api/tests/workers/test_admin_notifications.py`
  - **Criteria:** Mock email service, verify task called with correct args
  - **Duration:** 2 hours

- [ ] **5.9.7** Write CSV export tests
  - **File:** `apps/api/tests/api/v1/test_admin.py`
  - **Criteria:** Test export endpoint returns valid CSV
  - **Duration:** 1 hour

---

## Summary

**Epic 5.0 Total Atomic Tasks:** 60 tasks
**Estimated Total Duration:** 6-8 days

### Task Breakdown by Story:
- Story 5.1 (Database): 5 tasks (8 hours)
- Story 5.2 (Service Layer): 9 tasks (20 hours)
- Story 5.3 (API Endpoints): 8 tasks (11 hours)
- Story 5.4 (Cycle Management): 5 tasks (8 hours)
- Story 5.5 (Status Dashboard): 8 tasks (14 hours)
- Story 5.6 (Override Modal): 8 tasks (14 hours)
- Story 5.7 (Audit Log): 5 tasks (9 hours)
- Story 5.8 (Email Notifications): 5 tasks (7 hours)
- Story 5.9 (Testing): 7 tasks (16 hours)

**Total: 107 hours across 9 stories**
