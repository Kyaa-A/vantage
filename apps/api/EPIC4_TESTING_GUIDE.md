# Epic 4.0: MOV Upload System - Quick Testing Guide

## Backend Testing

### Command:
```bash
cd /home/asnari/Project/vantage/apps/api
uv run pytest tests/api/v1/test_movs.py -v
```

### What You Should See:
```
tests/api/v1/test_movs.py::TestUploadMOVFile::test_upload_valid_pdf_file PASSED
tests/api/v1/test_movs.py::TestUploadMOVFile::test_upload_valid_docx_file PASSED
tests/api/v1/test_movs.py::TestUploadMOVFile::test_upload_valid_jpg_file PASSED
...
======================= 22 passed in 5.47s =======================
```

**Expected:** All 22 tests should PASS ✅

---

## Frontend Testing (Manual)

### Prerequisites:
1. Start backend: `pnpm dev:api`
2. Start frontend: `pnpm dev:web`
3. Log in as a BLGU user

### Test Steps:

#### Step 1: Navigate to Test Indicator
```
URL: http://localhost:3000/blgu/assessment/68/indicator/278
```

#### Step 2: What You Should See

**Upload Section (for BLGU users in DRAFT status):**
```
┌─────────────────────────────────────────────────┐
│  Upload Files for BESWMC Documents             │
│  Upload supporting documents (PDF, DOCX...)    │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  📁                                       │ │
│  │  Drag and drop files here                │ │
│  │  or click to browse                      │ │
│  │                                           │ │
│  │  Supported: PDF, DOCX, XLSX, JPG, PNG... │ │
│  │  Max size: 50MB                          │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [Upload File] button (appears after selecting)│
└─────────────────────────────────────────────────┘
```

**If Assessment is NOT DRAFT, you should see:**
```
┌─────────────────────────────────────────────────┐
│  ℹ️ File Upload Not Available                   │
│  Files can only be uploaded when the           │
│  assessment is in Draft or Needs Rework status │
└─────────────────────────────────────────────────┘
```

#### Step 3: Upload a File

1. **Drag and drop** a PDF file into the dotted box
   - OR click the box to open file browser

2. **You should see:**
   ```
   Selected file: test-document.pdf (1.2 MB)
   [Upload File] button appears
   ```

3. **Click "Upload File"**

4. **You should see:**
   - Progress bar (0% → 100%)
   - Success toast: "File uploaded successfully"
   - File appears in the file list below

#### Step 4: Verify File List

**After upload, you should see:**
```
┌─────────────────────────────────────────────────┐
│  📄 test-document.pdf                           │
│  1.2 MB • Uploaded 1 minute ago                 │
│  by: Your Name                                  │
│                                                 │
│  [👁️ Preview] [⬇️ Download] [🗑️ Delete]        │
└─────────────────────────────────────────────────┘
```

#### Step 5: Test Actions

**Preview:**
- Click "Preview" button
- File should open in new tab

**Download:**
- Click "Download" button
- File should download to your computer

**Delete:**
- Click "Delete" button
- Confirmation dialog appears: "Are you sure you want to delete test-document.pdf?"
- Click "Delete" to confirm
- Success toast: "File deleted successfully"
- File disappears from list

---

## Quick Test Checklist

### Backend ✅
```bash
cd apps/api && uv run pytest tests/api/v1/test_movs.py -v
```
- [ ] All 22 tests pass
- [ ] No errors in output

### Frontend ✅
Navigate to: `http://localhost:3000/blgu/assessment/68/indicator/278`

- [ ] Page loads without errors
- [ ] Drag-and-drop upload box appears (if DRAFT status)
- [ ] Can drag and drop a file
- [ ] Can click to browse for file
- [ ] Upload button appears after selecting file
- [ ] Upload shows progress
- [ ] Success toast appears after upload
- [ ] File appears in list below
- [ ] Preview button works (opens in new tab)
- [ ] Download button works
- [ ] Delete button shows confirmation dialog
- [ ] Delete removes file from list

---

## Troubleshooting

### "Page shows empty form"
**Fix:** The indicator might not have `file_upload` field type. Use indicator 278 which was created specifically for testing.

### "Upload component doesn't appear"
**Fix:** Check assessment status. Run this script:
```bash
cd apps/api
uv run python check_assessment_68.py
```
It should show status = "Draft". If not, the script will update it.

### "Tests fail with 403 Forbidden"
**Fix:** This was a previous issue that's now resolved. Run tests fresh:
```bash
cd apps/api
uv run pytest tests/api/v1/test_movs.py -v --cache-clear
```

---

## Test Data

### Test Indicator (ID: 278)
- Created specifically for Epic 4.0 testing
- Has `file_upload` field type
- Associated with assessment 68

### Test Files to Try
Use these file types to test:
- ✅ PDF: `test.pdf`
- ✅ DOCX: `report.docx`
- ✅ XLSX: `data.xlsx`
- ✅ JPG: `photo.jpg`
- ✅ PNG: `screenshot.png`
- ❌ TXT: Should be rejected (not allowed)
- ❌ 60MB file: Should be rejected (too large)

---

## Success Criteria

Epic 4.0 is working correctly if:
1. ✅ Backend: All 22 tests pass
2. ✅ Frontend: Upload component renders
3. ✅ Frontend: File upload succeeds with progress
4. ✅ Frontend: File list displays uploaded files
5. ✅ Frontend: Preview/download/delete actions work
6. ✅ Frontend: Permissions enforce correctly (no upload for SUBMITTED status)
