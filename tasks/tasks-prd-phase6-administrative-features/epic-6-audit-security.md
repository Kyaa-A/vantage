# Epic 6.0: Audit & Security Infrastructure

**PRD Reference:** FR-4.4.1, FR-4.4.3, FR-4.5, FR-4.6
**Duration:** 4-6 days
**Dependencies:** None (supports all other epics)

---

## Story 6.1: Database Schema for Audit Logs

**Duration:** 0.5 days

### Atomic Tasks (3 tasks)

- [ ] **6.1.1** Create audit_logs table model
  - **File:** `apps/api/app/db/models/admin.py`
  - **Criteria:** Fields: id, user_id, entity_type, entity_id, action, changes (JSONB), timestamp, ip_address
  - **Duration:** 2 hours

- [ ] **6.1.2** Add indexes for audit log queries
  - **File:** `apps/api/app/db/models/admin.py`
  - **Criteria:** Indexes on: timestamp (DESC), user_id, entity_type, (entity_type, entity_id)
  - **Duration:** 1 hour

- [ ] **6.1.3** Create Alembic migration for audit_logs
  - **File:** `apps/api/alembic/versions/xxxx_create_audit_logs.py`
  - **Criteria:** Create table with indexes
  - **Duration:** 1 hour

---

## Story 6.2: Backend Audit Service

**Duration:** 1 day
**Dependencies:** 6.1

### Atomic Tasks (6 tasks)

- [ ] **6.2.1** Create audit_service.py with base structure
  - **File:** `apps/api/app/services/audit_service.py`
  - **Criteria:** AuditService class with db session
  - **Duration:** 1 hour

- [ ] **6.2.2** Implement log_audit_event() generic function
  - **File:** `apps/api/app/services/audit_service.py`
  - **Criteria:** Accept entity_type, entity_id, action, user_id, changes (dict), save to audit_logs
  - **Duration:** 2 hours

- [ ] **6.2.3** Implement calculate_json_diff() helper
  - **File:** `apps/api/app/services/audit_service.py`
  - **Criteria:** Compare before/after states, return dict of changes
  - **Duration:** 2 hours

- [ ] **6.2.4** Implement get_audit_logs() with filtering
  - **File:** `apps/api/app/services/audit_service.py`
  - **Criteria:** Filter by date range, user, entity_type, action; support pagination
  - **Duration:** 2 hours

- [ ] **6.2.5** Integrate audit logging into indicator_service
  - **File:** `apps/api/app/services/indicator_service.py` (update)
  - **Criteria:** Log create, update, deactivate actions
  - **Duration:** 1.5 hours

- [ ] **6.2.6** Integrate audit logging into bbi_service and deadline_service
  - **Files:** `bbi_service.py`, `deadline_service.py` (update)
  - **Criteria:** Log all CRUD and override actions
  - **Duration:** 1.5 hours

---

## Story 6.3: Backend Access Control Middleware

**Duration:** 1 day

### Atomic Tasks (5 tasks)

- [ ] **6.3.1** Create require_mlgoo_dilg() dependency function
  - **File:** `apps/api/app/api/deps.py`
  - **Criteria:** Check current user role is MLGOO_DILG, raise 403 if not
  - **Duration:** 1.5 hours

- [ ] **6.3.2** Apply access control to all admin endpoints
  - **Files:** `indicators.py`, `bbis.py`, `admin.py` (update)
  - **Criteria:** Add require_mlgoo_dilg to all admin endpoint dependencies
  - **Duration:** 2 hours

- [ ] **6.3.3** Implement access attempt logging
  - **File:** `apps/api/app/api/deps.py` (update)
  - **Criteria:** Log all 403 Forbidden access attempts with user info
  - **Duration:** 1.5 hours

- [ ] **6.3.4** Add IP address capture for audit logs
  - **File:** `apps/api/app/api/deps.py`
  - **Criteria:** Extract client IP from request, pass to audit service
  - **Duration:** 1 hour

- [ ] **6.3.5** Write tests for access control
  - **File:** `apps/api/tests/api/test_access_control.py`
  - **Criteria:** Test non-MLGOO users get 403 on admin endpoints
  - **Duration:** 2 hours

---

## Story 6.4: Backend Data Validation for JSON Schemas

**Duration:** 2 days
**Dependencies:** Epic 2.1, Epic 3.1 (Pydantic models must exist)

### Atomic Tasks (8 tasks)

- [ ] **6.4.1** Create comprehensive form_schema validators
  - **File:** `apps/api/app/services/form_schema_validator.py` (update from Epic 2)
  - **Criteria:** Validate field IDs unique, required fields, data types
  - **Duration:** 2 hours

- [ ] **6.4.2** Implement circular dependency detection for indicators
  - **File:** `apps/api/app/services/indicator_service.py` (update)
  - **Criteria:** Recursive check for parent_id cycles
  - **Duration:** 2 hours

- [ ] **6.4.3** Implement field reference validation for calculation_schema
  - **File:** `apps/api/app/services/form_schema_validator.py`
  - **Criteria:** Ensure referenced field_ids exist in form_schema
  - **Duration:** 2 hours

- [ ] **6.4.4** Create user-friendly error message formatter
  - **File:** `apps/api/app/services/validation_error_formatter.py`
  - **Criteria:** Convert Pydantic errors to readable messages with field paths
  - **Duration:** 2 hours

- [ ] **6.4.5** Implement HTML sanitization for text inputs
  - **File:** `apps/api/app/core/security.py`
  - **Criteria:** Use bleach library, strip dangerous HTML tags
  - **Duration:** 2 hours

- [ ] **6.4.6** Add XSS prevention to rich text fields
  - **File:** `apps/api/app/services/indicator_service.py` (update)
  - **Criteria:** Sanitize technical_notes_text, description before saving
  - **Duration:** 1.5 hours

- [ ] **6.4.7** Write validation tests
  - **File:** `apps/api/tests/services/test_validation.py`
  - **Criteria:** Test circular refs, invalid field refs, XSS attempts
  - **Duration:** 3 hours

- [ ] **6.4.8** Write integration tests for validation flow
  - **File:** `apps/api/tests/integration/test_validation_workflow.py`
  - **Criteria:** Test end-to-end validation from API to database
  - **Duration:** 2 hours

---

## Story 6.5: Backend Security Measures

**Duration:** 1 day
**Dependencies:** 6.3

### Atomic Tasks (6 tasks)

- [ ] **6.5.1** Install and configure slowapi for rate limiting
  - **File:** `apps/api/app/main.py`
  - **Criteria:** Add slowapi limiter, configure Redis backend
  - **Duration:** 1.5 hours

- [ ] **6.5.2** Apply rate limiting to admin endpoints
  - **Files:** `indicators.py`, `bbis.py`, `admin.py` (update)
  - **Criteria:** 100 requests per minute per user
  - **Duration:** 2 hours

- [ ] **6.5.3** Verify SQL injection prevention
  - **File:** Review all service files
  - **Criteria:** Ensure all queries use parameterized statements (no string concatenation)
  - **Duration:** 2 hours

- [ ] **6.5.4** Configure CORS for admin endpoints
  - **File:** `apps/api/app/main.py`
  - **Criteria:** Restrict CORS to allowed origins, verify credentials
  - **Duration:** 1 hour

- [ ] **6.5.5** Add security headers
  - **File:** `apps/api/app/main.py`
  - **Criteria:** Add X-Content-Type-Options, X-Frame-Options, CSP headers
  - **Duration:** 1 hour

- [ ] **6.5.6** Write security tests
  - **File:** `apps/api/tests/security/test_security_measures.py`
  - **Criteria:** Test rate limiting, CORS, XSS prevention
  - **Duration:** 2.5 hours

---

## Story 6.6: Frontend Audit Log Viewer

**Duration:** 1 day
**Dependencies:** 6.2, `pnpm generate-types`

### Atomic Tasks (6 tasks)

- [ ] **6.6.1** Generate TypeScript types for audit logs
  - **Command:** `pnpm generate-types`
  - **Criteria:** AuditLogResponse type available
  - **Duration:** 0.5 hours

- [ ] **6.6.2** Create useAuditLogs custom hook
  - **File:** `apps/web/src/hooks/useAuditLogs.ts`
  - **Criteria:** Wrap useGetAuditLogs with filters
  - **Duration:** 1.5 hours

- [ ] **6.6.3** Create audit log viewer page
  - **File:** `apps/web/src/app/(app)/admin/audit/page.tsx`
  - **Criteria:** Server Component, protected route, renders AuditLogTable
  - **Duration:** 1 hour

- [ ] **6.6.4** Create AuditLogTable component
  - **File:** `apps/web/src/components/features/admin/audit/AuditLogTable.tsx`
  - **Criteria:** Table with columns: Timestamp, User, Entity Type, Entity ID, Action, Changes
  - **Duration:** 3 hours

- [ ] **6.6.5** Create JsonDiffViewer component
  - **File:** `apps/web/src/components/features/admin/audit/JsonDiffViewer.tsx`
  - **Criteria:** Show before/after comparison, highlight changes
  - **Duration:** 2 hours

- [ ] **6.6.6** Add filter controls and pagination
  - **File:** `AuditLogTable.tsx` (update)
  - **Criteria:** Filters: date range, user, entity type, action; pagination
  - **Duration:** 2 hours

---

## Story 6.7: Frontend Error Handling & User Feedback

**Duration:** 1 day

### Atomic Tasks (6 tasks)

- [ ] **6.7.1** Create global error handler for TanStack Query
  - **File:** `apps/web/src/lib/queryClient.ts`
  - **Criteria:** Handle 403, 404, 500 errors globally, show toasts
  - **Duration:** 2 hours

- [ ] **6.7.2** Create error message mapping utility
  - **File:** `apps/web/src/lib/errorMessages.ts`
  - **Criteria:** Map technical errors to user-friendly messages
  - **Duration:** 1.5 hours

- [ ] **6.7.3** Implement toast notification system
  - **File:** `apps/web/src/providers/ToastProvider.tsx`
  - **Criteria:** Use shadcn/ui Toaster, success/error/warning variants
  - **Duration:** 1.5 hours

- [ ] **6.7.4** Add loading states to all forms
  - **Files:** All form components (update)
  - **Criteria:** Disable buttons, show spinners during submission
  - **Duration:** 2 hours

- [ ] **6.7.5** Implement form validation error display
  - **Files:** All form components (update)
  - **Criteria:** Show inline errors below fields, summary at top
  - **Duration:** 2 hours

- [ ] **6.7.6** Create ErrorBoundary for React error handling
  - **File:** `apps/web/src/components/shared/ErrorBoundary.tsx`
  - **Criteria:** Catch React errors, display friendly message, report to logging service
  - **Duration:** 1 hour

---

## Story 6.8: Testing for Audit & Security

**Duration:** 1 day
**Dependencies:** 6.7

### Atomic Tasks (6 tasks)

- [ ] **6.8.1** Write audit_service unit tests
  - **File:** `apps/api/tests/services/test_audit_service.py`
  - **Criteria:** Test log_audit_event, get_audit_logs with filters, JSON diff calculation
  - **Duration:** 2.5 hours

- [ ] **6.8.2** Write access control integration tests
  - **File:** `apps/api/tests/integration/test_access_control.py`
  - **Criteria:** Test MLGOO_DILG can access, other roles get 403
  - **Duration:** 2 hours

- [ ] **6.8.3** Write schema validation tests
  - **File:** `apps/api/tests/services/test_validation.py`
  - **Criteria:** Test invalid JSON, circular refs, XSS attempts blocked
  - **Duration:** 2 hours

- [ ] **6.8.4** Write rate limiting tests
  - **File:** `apps/api/tests/security/test_rate_limiting.py`
  - **Criteria:** Test 100 requests succeeds, 101st fails with 429
  - **Duration:** 2 hours

- [ ] **6.8.5** Write frontend AuditLogTable tests
  - **File:** `apps/web/src/components/features/admin/audit/AuditLogTable.test.tsx`
  - **Criteria:** Mock API, test rendering, filters, JSON diff viewer
  - **Duration:** 2.5 hours

- [ ] **6.8.6** Write error handling tests
  - **File:** `apps/web/src/lib/queryClient.test.ts`
  - **Criteria:** Test global error handler, toast notifications
  - **Duration:** 1 hour

---

## Summary

**Epic 6.0 Total Atomic Tasks:** 46 tasks
**Estimated Total Duration:** 4-6 days

### Task Breakdown by Story:
- Story 6.1 (Database): 3 tasks (4 hours)
- Story 6.2 (Audit Service): 6 tasks (10 hours)
- Story 6.3 (Access Control): 5 tasks (8 hours)
- Story 6.4 (Validation): 8 tasks (16.5 hours)
- Story 6.5 (Security): 6 tasks (10 hours)
- Story 6.6 (Audit Viewer): 6 tasks (10 hours)
- Story 6.7 (Error Handling): 6 tasks (10 hours)
- Story 6.8 (Testing): 6 tasks (12 hours)

**Total: 80.5 hours across 8 stories**
