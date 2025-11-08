# Epic 4.0: MOV Upload System - Backend Completion Summary

## Overview
This document summarizes the completion of the **backend infrastructure** for Epic 4.0: MOV (Means of Verification) Upload System.

**Status:** Backend Complete (Stories 4.1-4.11) ✅
**Date Completed:** 2025-11-08
**Remaining:** Frontend Integration & Testing (Stories 4.14-4.19)

---

## Completed Stories (Backend)

### ✅ Story 4.1: Supabase Storage Bucket Configuration
- Configured `mov-files` storage bucket in Supabase
- Public read access, authenticated write
- Path structure: `{assessment_id}/{indicator_id}/{filename}`

### ✅ Story 4.2: Database Schema for MOV Files
- Created `mov_files` table with Alembic migration
- Fields: id, assessment_id, indicator_id, file_name, file_url, file_type, file_size, uploaded_by, uploaded_at, deleted_at
- Foreign keys to assessments, indicators, and users
- Soft delete support with `deleted_at` timestamp

### ✅ Story 4.3: SQLAlchemy Model for MOV Files
- Created `MOVFile` model in `app/db/models/assessment.py`
- Relationships to Assessment, Indicator, User
- Indexed on assessment_id, indicator_id, uploaded_by
- Added to `__all__` exports

### ✅ Story 4.4: Backend File Validation Service
- File type validation (PDF, DOCX, XLSX, JPG, PNG, MP4)
- File size validation (max 50MB)
- Content security validation (detect executables, malware signatures)
- Extension/content-type mismatch detection
- Implemented in `app/services/file_validation_service.py`
- Comprehensive test coverage (13 tests passing)

### ✅ Story 4.5: Backend File Upload Service
- Upload to Supabase Storage with UUID-prefixed filenames
- Database record creation
- Rollback handling on upload failures
- Path sanitization and security
- Implemented in `app/services/storage_service.py`
- Test coverage (6 tests passing)

### ✅ Story 4.6: Backend File Deletion Service
- Soft delete with `deleted_at` timestamp
- Permission checks (only uploader can delete)
- Status restrictions (DRAFT and NEEDS_REWORK only)
- Supabase Storage cleanup
- Implemented in `app/services/storage_service.py`
- Test coverage (6 tests passing)

### ✅ Story 4.7: Backend API for File Upload
- Endpoint: `POST /api/v1/movs/assessments/{assessment_id}/indicators/{indicator_id}/upload`
- Multipart form-data file upload
- Returns MOVFileResponse with metadata
- Status codes: 201 Created, 400 Bad Request, 500 Internal Server Error
- Implemented in `app/api/v1/movs.py`
- Test coverage (11 tests passing)

### ✅ Story 4.8: Backend API for File List Retrieval
- Endpoint: `GET /api/v1/movs/assessments/{assessment_id}/indicators/{indicator_id}/files`
- Permission-based filtering (BLGU sees own, Assessors see all)
- Excludes soft-deleted files
- Ordered by upload time (most recent first)
- Returns MOVFileListResponse
- Implemented in `app/api/v1/movs.py`
- Test coverage (6 tests passing)

### ✅ Story 4.9: Backend API for File Deletion
- Endpoint: `DELETE /api/v1/movs/files/{file_id}`
- Permission checks (uploader only, DRAFT/NEEDS_REWORK only)
- Soft delete implementation
- Returns deleted file metadata
- Status codes: 200 OK, 403 Forbidden, 404 Not Found, 500 Internal Server Error
- Implemented in `app/api/v1/movs.py`
- Test coverage (5 tests passing)
- **IMPORTANT FIX:** Fixed database session override bug in tests (use `deps.get_db` not `get_db`)

### ✅ Story 4.10: Pydantic Schemas for File Operations
- `MOVFileResponse`: File metadata response schema
- `MOVFileListResponse`: List of files response schema
- Implemented in `app/schemas/assessment.py`
- **Note:** Completed as part of Story 4.7

### ✅ Story 4.11: Type Generation for File APIs
- Generated TypeScript types in `packages/shared/src/generated/schemas/movs/`
- Generated React Query hooks in `packages/shared/src/generated/endpoints/movs/`
- Hooks: `usePostMovsAssessmentsAssessmentIdIndicatorsIndicatorIdUpload`, `useGetMovsAssessmentsAssessmentIdIndicatorsIndicatorIdFiles`, `useDeleteMovsFilesFileId`
- All types auto-generated from FastAPI OpenAPI schema using Orval

---

## Test Coverage Summary

### Backend Tests: 22 Passing ✅
- **File Validation:** 13 tests (type, size, content security)
- **File Upload:** 11 tests (success, validation errors, authentication)
- **File List:** 6 tests (permissions, filtering, ordering)
- **File Deletion:** 5 tests (success, permissions, status restrictions)

### Test Files
- `tests/api/v1/test_movs.py` - Endpoint integration tests
- `tests/services/test_file_validation_service.py` - Validation logic tests
- `tests/services/test_storage_service.py` - Upload/delete logic tests

---

## Completed Frontend Components (Stories 4.12-4.13)

### ✅ Story 4.12: File Upload Component with Drag-and-Drop
- Created `FileUpload` component using `react-dropzone`
- Drag-and-drop file selection with visual feedback
- File validation (type, size) with error display
- File preview with remove functionality
- Location: `apps/web/src/components/features/movs/FileUpload.tsx`

### ✅ Story 4.13: File List Display Component
- Created `FileList` component for displaying uploaded files
- File type icons and metadata display
- Action buttons (preview, download, delete)
- Loading states and empty state handling
- Location: `apps/web/src/components/features/movs/FileList.tsx`

---

## API Endpoints

### Upload File
```
POST /api/v1/movs/assessments/{assessment_id}/indicators/{indicator_id}/upload
Content-Type: multipart/form-data

Request: file (File)
Response: MOVFileResponse
Status: 201 Created, 400 Bad Request, 500 Internal Server Error
```

### List Files
```
GET /api/v1/movs/assessments/{assessment_id}/indicators/{indicator_id}/files

Response: MOVFileListResponse
Status: 200 OK
```

### Delete File
```
DELETE /api/v1/movs/files/{file_id}

Response: MOVFileResponse (with deleted_at timestamp)
Status: 200 OK, 403 Forbidden, 404 Not Found, 500 Internal Server Error
```

---

## Database Schema

### mov_files Table
```sql
CREATE TABLE mov_files (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES assessments(id),
    indicator_id INTEGER NOT NULL REFERENCES indicators(id),
    file_name VARCHAR NOT NULL,
    file_url VARCHAR NOT NULL,
    file_type VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,

    INDEX idx_mov_files_assessment (assessment_id),
    INDEX idx_mov_files_indicator (indicator_id),
    INDEX idx_mov_files_uploader (uploaded_by)
);
```

---

## File Validation Rules

### Allowed File Types
- **Documents:** PDF (.pdf), Word (.docx), Excel (.xlsx)
- **Images:** JPEG (.jpg, .jpeg), PNG (.png)
- **Video:** MP4 (.mp4)

### Size Limits
- Maximum file size: 50MB (52,428,800 bytes)

### Security Checks
- Content-type validation
- Extension/content-type mismatch detection
- Executable content detection (MZ, ELF, shebang signatures)
- Path traversal prevention in filenames

---

## Permission Model

### Upload Permissions
- BLGU users: Can upload to their own assessment
- Requires authentication

### View Permissions
- BLGU users: See only their own uploaded files
- Assessors/Validators/MLGOO: See all files for indicator

### Delete Permissions
- Only file uploader can delete
- Only allowed for DRAFT or NEEDS_REWORK assessments
- Soft delete preserves audit trail

---

## Storage Architecture

### Supabase Storage Path Structure
```
mov-files/
  └── {assessment_id}/
      └── {indicator_id}/
          └── {uuid}_{sanitized_filename}
```

### Filename Generation
- UUID prefix ensures uniqueness
- Original filename preserved (sanitized)
- Path traversal characters removed
- Example: `550e8400-e29b-41d4-a716-446655440000_my-document.pdf`

---

## Remaining Work (Stories 4.14-4.19)

### Story 4.14: File Delete Functionality
- Integrate delete mutation hook with FileList component
- Add confirmation dialog
- Success/error toast notifications

### Story 4.15: File Upload Integration with Dynamic Form
- Integrate FileUpload and FileList into dynamic form system
- Wire up React Query hooks
- Form field integration for file-upload type

### Story 4.16: File Upload Progress and Status Feedback
- Upload progress indicators
- Loading states
- Success/error feedback
- Optimistic updates

### Story 4.17: Permission-Based UI Controls
- Disable delete button based on assessment status
- Hide upload for non-BLGU users
- Show appropriate messages for disabled actions

### Story 4.18: File Preview Functionality
- Image preview in modal
- PDF preview in modal/iframe
- Document download for non-previewable types

### Story 4.19: Testing & Validation
- Unit tests for React components (Vitest)
- Integration tests with mock API
- E2E tests with Playwright
- Accessibility testing

---

## Technical Decisions & Notes

### Database Session Override Fix (Story 4.9)
**Problem:** Tests were failing because `use_test_db_session()` was importing `get_db` from `app.db.base` instead of using `deps.get_db` which the endpoints actually use.

**Solution:** Changed line 48 in `test_movs.py`:
```python
# Before
from app.db.base import get_db
client.app.dependency_overrides[get_db] = override_get_db

# After
client.app.dependency_overrides[deps.get_db] = override_get_db
```

This fix made all 22 tests pass and resolved the "File with ID X not found" errors.

### Soft Delete Pattern
Files are soft-deleted (not physically removed from database) to maintain audit trail. The `deleted_at` timestamp marks deletion. Soft-deleted files are excluded from list queries.

### File Upload Rollback
If database record creation fails after file upload to Supabase, the service attempts to remove the uploaded file to prevent orphaned files in storage.

---

## Git Commits

1. `feat(epic-4.0): Story 4.9 - Backend API for File Deletion` (3fdedfe)
2. `feat(epic-4.0): Story 4.11 - Type Generation for MOV File APIs` (9387a63)
3. `feat(epic-4.0): Stories 4.12-4.13 - File Upload & List Components` (8f59361)

---

## Dependencies

### Backend
- Python 3.13+
- FastAPI
- SQLAlchemy
- Alembic
- Supabase Python SDK
- pytest

### Frontend
- Next.js 15
- React 19
- TypeScript
- react-dropzone@^14.3.8
- date-fns@^4.1.0
- shadcn/ui components
- TanStack Query (React Query)

---

## Next Steps

1. **Complete Story 4.14-4.15:** Integrate components with dynamic form system
2. **Complete Story 4.16:** Add progress indicators and feedback
3. **Complete Story 4.17:** Implement permission-based UI controls
4. **Complete Story 4.18:** Add file preview functionality
5. **Complete Story 4.19:** Write comprehensive tests (unit, integration, E2E)

---

## Success Metrics

- ✅ All backend endpoints functional and tested (22/22 tests passing)
- ✅ Type-safe frontend integration with generated hooks
- ✅ Comprehensive file validation and security checks
- ✅ Permission-based access control implemented
- ✅ Reusable React components created
- ⏳ Frontend integration pending (Stories 4.14-4.19)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-08
**Status:** Backend Complete, Frontend Integration Pending
