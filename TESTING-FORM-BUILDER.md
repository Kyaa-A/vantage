# Form Schema Builder Testing Guide

## Quick Start

1. **Start servers**: `pnpm dev`
2. **Login** as MLGOO_DILG user
3. **Navigate to**: http://localhost:3000/mlgoo/form-builder-demo

---

## Test Scenarios

### ✅ Scenario 1: Basic Form Building (Builder Mode)

**Steps:**
1. Click on **"Text Input"** in the left palette
2. Click on **"Number Input"**
3. Click on **"Checkbox Group"**
4. Observe fields appear in the center canvas

**Expected Results:**
- ✅ Each click adds a field to the canvas
- ✅ Fields show with default labels
- ✅ Fields have drag handles (☰ icon)
- ✅ Delete button (trash icon) appears on hover

---

### ✅ Scenario 2: Drag and Drop Reordering

**Steps:**
1. Add 3+ fields to the canvas
2. Click and drag the grip handle (☰) of the second field
3. Drop it above the first field

**Expected Results:**
- ✅ Field moves smoothly during drag
- ✅ Other fields shift to make space
- ✅ Field order updates when dropped
- ✅ Drag overlay shows field preview

---

### ✅ Scenario 3: Field Configuration

**Steps:**
1. Add a **Text Input** field
2. Click on the field in the canvas
3. Right panel opens with properties
4. Change the label to "Full Name"
5. Set max length to 100
6. Add placeholder "Enter your full name"
7. Click **"Save Changes"**

**Expected Results:**
- ✅ Right panel shows TextInputProperties
- ✅ Form fields are editable
- ✅ "Unsaved changes" indicator appears
- ✅ Save button is enabled
- ✅ After save, field updates in canvas
- ✅ "Unsaved changes" clears

---

### ✅ Scenario 4: Checkbox/Radio Options Management

**Steps:**
1. Add a **Checkbox Group** field
2. Click on it to open properties
3. Click **"Add Option"** button
4. Rename options to: "Option A", "Option B", "Option C"
5. Try to delete an option (should only work if >2 remain)
6. Click **"Save Changes"**

**Expected Results:**
- ✅ Can add unlimited options
- ✅ Each option has label and value fields
- ✅ Cannot delete if only 2 options remain
- ✅ Validation error if <2 options
- ✅ Options update in canvas after save

---

### ✅ Scenario 5: Number Field Validation

**Steps:**
1. Add a **Number Input** field
2. Open properties
3. Set Min value: 100
4. Set Max value: 50 (intentionally invalid)
5. Try to save

**Expected Results:**
- ✅ Error message: "Min value must be less than max value"
- ✅ Save button disabled
- ✅ Fix the values (min: 0, max: 100)
- ✅ Save succeeds

---

### ✅ Scenario 6: Conditional MOV for File Upload

**Steps:**
1. Add a **Radio Button** field with options: "Yes", "No"
2. Set field_id to "has_experience"
3. Add a **File Upload** field
4. Open file upload properties
5. Enable "Conditional MOV Requirement"
6. Select field: "has_experience"
7. Operator: "equals"
8. Value: "yes"
9. Save both fields

**Expected Results:**
- ✅ Conditional toggle works
- ✅ Field selector shows available fields
- ✅ Operator dropdown has "equals" and "not equals"
- ✅ Value input accepts text
- ✅ Example help text displays
- ✅ Configuration saves successfully

---

### ✅ Scenario 7: Preview Mode

**Steps:**
1. Build a form with 3-4 different field types
2. Press **Cmd+2** (or click "Preview" tab)
3. Observe the form preview

**Expected Results:**
- ✅ Mode switches to Preview
- ✅ All fields render as they appear to BLGU users
- ✅ Required fields show asterisk (*)
- ✅ Help text displays below labels
- ✅ Validation constraints show (min/max, file types, etc.)
- ✅ Fields are read-only (disabled)
- ✅ Conditional MOV displays in amber box
- ✅ Field IDs show as badges

---

### ✅ Scenario 8: JSON View and Copy

**Steps:**
1. Build a form with 2+ fields
2. Press **Cmd+3** (or click "JSON" tab)
3. Observe the JSON output
4. Click **"Copy to Clipboard"** button
5. Paste into a text editor

**Expected Results:**
- ✅ Mode switches to JSON
- ✅ JSON is pretty-printed with indentation
- ✅ Syntax highlighting (colors for keys, strings, numbers)
- ✅ Line numbers display
- ✅ Stats show (X fields, Y lines, Z bytes)
- ✅ Copy button shows "Copied!" feedback
- ✅ Pasted JSON is valid and formatted

---

### ✅ Scenario 9: Keyboard Shortcuts

**Steps:**
1. Press **Cmd+1** (Windows: Ctrl+1)
2. Press **Cmd+2** (Windows: Ctrl+2)
3. Press **Cmd+3** (Windows: Ctrl+3)

**Expected Results:**
- ✅ Cmd+1 switches to Builder mode
- ✅ Cmd+2 switches to Preview mode
- ✅ Cmd+3 switches to JSON mode
- ✅ Transitions are smooth
- ✅ Form state persists between mode switches

---

### ✅ Scenario 10: Delete Field

**Steps:**
1. Add 2 fields to canvas
2. Hover over first field
3. Click trash icon
4. Confirm deletion

**Expected Results:**
- ✅ Trash icon appears on hover
- ✅ Browser confirm dialog appears
- ✅ Field removed from canvas after confirm
- ✅ Other fields remain intact
- ✅ Can cancel deletion

---

### ✅ Scenario 11: Save with Validation (Create New Indicator)

**Steps:**
1. Go to `/mlgoo/indicators/new`
2. Fill in indicator name: "Test Indicator"
3. Select a governance area
4. Add 2-3 fields in the form builder
5. Click **"Save & Publish"**

**Expected Results:**
- ✅ Client-side validation runs first
- ✅ If validation passes, save proceeds
- ✅ Loading spinner shows during save
- ✅ Success toast appears
- ✅ Redirects to indicator detail page
- ✅ Form is cleared/marked as saved

---

### ✅ Scenario 12: Validation Errors

**Steps:**
1. Add a **Checkbox Group** field
2. Delete options until only 1 remains
3. Add a **Number Input** field
4. Set min: 100, max: 50
5. Try to click **"Save & Publish"**

**Expected Results:**
- ✅ Validation error dialog appears
- ✅ Lists all errors with field IDs
- ✅ Errors include:
  - "Field X: Requires at least 2 options"
  - "Field Y: Min value must be less than max value"
- ✅ Save is prevented
- ✅ Can close dialog and fix errors
- ✅ After fixing, save succeeds

---

### ✅ Scenario 13: Duplicate Field IDs

**Steps:**
1. Add a text field with field_id: "test_field"
2. Add another text field
3. Manually change its field_id to: "test_field"
4. Try to save

**Expected Results:**
- ✅ Validation error: "Duplicate field_id: test_field"
- ✅ Both fields highlighted in error dialog
- ✅ Save is prevented
- ✅ Fix by renaming one field
- ✅ Save succeeds after fix

---

### ✅ Scenario 14: Edit Existing Indicator

**Steps:**
1. Create an indicator with form schema
2. Go to `/mlgoo/indicators/[id]/edit`
3. Observe form loads

**Expected Results:**
- ✅ Indicator name pre-filled
- ✅ Governance area selected
- ✅ Description pre-filled
- ✅ Form schema loads into builder
- ✅ All fields appear in canvas
- ✅ Field properties are correct
- ✅ Can edit and save changes

---

### ✅ Scenario 15: Unsaved Changes Warning

**Steps:**
1. Edit an indicator
2. Add a new field to the form
3. Try to close the browser tab

**Expected Results:**
- ✅ Browser warning dialog appears
- ✅ Message warns about unsaved changes
- ✅ Can cancel and stay on page
- ✅ After saving, no warning on close

---

### ✅ Scenario 16: Empty Form Validation

**Steps:**
1. Go to `/mlgoo/indicators/new`
2. Fill in indicator name and governance area
3. Don't add any fields
4. Click **"Save & Publish"**

**Expected Results:**
- ✅ Validation error: "Form must have at least one field"
- ✅ Save is prevented
- ✅ Error toast or dialog appears
- ✅ Add at least 1 field
- ✅ Save succeeds

---

### ✅ Scenario 17: Circular Reference Detection

**Steps:**
1. Add Radio field: field_id="field_a"
2. Add File Upload: field_id="field_b"
3. Set field_b conditional MOV to reference field_a
4. Try to make field_a reference field_b (if possible)
5. Try to save

**Expected Results:**
- ✅ Validation detects circular reference
- ✅ Error: "Circular reference detected"
- ✅ Save is prevented
- ✅ Remove one reference
- ✅ Save succeeds

---

### ✅ Scenario 18: Save Draft (Without Form Schema)

**Steps:**
1. Go to `/mlgoo/indicators/new`
2. Fill in indicator name: "Draft Indicator"
3. Select governance area
4. Don't add any fields
5. Click **"Save Draft"**

**Expected Results:**
- ✅ Saves without form_schema validation
- ✅ Success toast appears
- ✅ Redirects to indicator detail
- ✅ Indicator saved as inactive/draft

---

## Browser Compatibility Testing

Test in multiple browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (Mac)

Check:
- Drag and drop works
- Keyboard shortcuts work (Cmd on Mac, Ctrl on Windows/Linux)
- Copy to clipboard works
- Dialogs display correctly

---

## Performance Testing

1. **Add 20+ fields**: Should remain responsive
2. **Switch between modes**: Should be instant
3. **Save large form**: Should complete in <3 seconds

---

## Edge Cases to Test

### ❌ Invalid Field ID Format
- Try: "Field 1" (with space) → Should error
- Try: "FIELD_1" (uppercase) → Should error
- Try: "field-1" (hyphen) → Should error
- Try: "field_1" (valid) → Should work

### ❌ Self-Reference in Conditional MOV
- File upload references itself → Should error

### ❌ Referenced Field Doesn't Exist
- Conditional MOV references "nonexistent_field" → Should error

### ❌ Empty Labels
- Field with empty label → Should error

---

## API Testing

Use browser DevTools Network tab to verify:

1. **GET /api/v1/indicators** - Fetch governance areas
2. **POST /api/v1/indicators** - Create indicator
3. **GET /api/v1/indicators/[id]** - Fetch indicator for edit
4. **PUT /api/v1/indicators/[id]** - Update indicator

Check:
- ✅ Request payloads include form_schema
- ✅ form_schema has correct structure
- ✅ Responses return created/updated indicator
- ✅ Errors are handled gracefully

---

## Accessibility Testing

1. **Keyboard Navigation**:
   - Tab through form fields
   - Use Enter to submit
   - Use Escape to close dialogs

2. **Screen Reader**:
   - Labels are read correctly
   - Required fields announced
   - Error messages announced

---

## Mobile/Responsive Testing

1. Resize browser to mobile width (375px)
2. Check:
   - ✅ Layout adapts
   - ✅ Sidebars collapse
   - ✅ Buttons accessible
   - ✅ Drag and drop still works (on touch devices)

---

## Quick Smoke Test (5 minutes)

1. ✅ Add 3 different field types
2. ✅ Drag to reorder
3. ✅ Edit one field's properties
4. ✅ Switch to Preview mode (Cmd+2)
5. ✅ Switch to JSON mode (Cmd+3)
6. ✅ Copy JSON
7. ✅ Switch back to Builder (Cmd+1)
8. ✅ Delete one field
9. ✅ Save successfully

If all 9 steps work, basic functionality is confirmed! ✅

---

## Reporting Issues

If you find bugs, note:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (F12 → Console)
- Network errors (F12 → Network)

---

## Next Steps

After manual testing, Story 2.7 would add automated tests:
- Unit tests for validation logic
- Component tests with React Testing Library
- Integration tests with MSW
- E2E tests with Playwright/Cypress
