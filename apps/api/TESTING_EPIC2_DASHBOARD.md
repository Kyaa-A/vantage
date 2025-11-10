# Testing Epic 2.0: BLGU Dashboard with Completion Tracking

This guide covers testing both backend API endpoints and frontend dashboard components.

---

## 🔧 Prerequisites

1. **Database Setup**: Ensure you have test data in your database
   - At least one BLGU user
   - At least one assessment with responses
   - Indicators with form schemas

2. **Environment**: Both backend and frontend servers running
   ```bash
   # Terminal 1: Backend
   pnpm dev:api

   # Terminal 2: Frontend
   pnpm dev:web
   ```

---

## 🎯 Backend API Testing

### Method 1: Using the Python Test Script (Recommended)

1. **Edit the test configuration** in `test_blgu_dashboard.py`:
   ```python
   BLGU_USER_EMAIL = "your_blgu_user@example.com"
   BLGU_USER_PASSWORD = "your_password"
   TEST_ASSESSMENT_ID = 1  # Your actual assessment ID
   ```

2. **Run the test**:
   ```bash
   cd apps/api
   uv run python test_blgu_dashboard.py
   ```

3. **Expected Output**:
   ```
   ✅ Login successful!
   ✅ Dashboard endpoint successful!
   📈 Dashboard Data:
     Assessment ID: 1
     Total Indicators: 45
     Completed: 30
     Incomplete: 15
     Completion %: 66.67%

   ✅ Navigation endpoint successful!
   🗺️  Navigation Data:
     Total Indicators: 45
     Complete: 30
     Incomplete: 15
   ```

### Method 2: Using Swagger UI (Interactive API Docs)

1. Navigate to: `http://localhost:8000/docs`
2. Click "Authorize" button (top right)
3. Login to get your token:
   - Go to `POST /api/v1/auth/login`
   - Click "Try it out"
   - Enter credentials: `{"email": "...", "password": "..."}`
   - Copy the `access_token` from response
   - Click "Authorize" and paste token as `Bearer <token>`

4. Test the endpoints:
   - `GET /api/v1/blgu-dashboard/{assessment_id}` - Dashboard metrics
   - `GET /api/v1/blgu-dashboard/{assessment_id}/indicators/navigation` - Navigation

### Method 3: Using curl

```bash
# Step 1: Login
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "blgu_user@example.com", "password": "password"}' \
  | jq -r '.access_token')

# Step 2: Test dashboard endpoint
curl -X GET "http://localhost:8000/api/v1/blgu-dashboard/1" \
  -H "Authorization: Bearer $TOKEN" \
  | jq .

# Step 3: Test navigation endpoint
curl -X GET "http://localhost:8000/api/v1/blgu-dashboard/1/indicators/navigation" \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

### Method 4: Using pytest (Unit Tests)

Create a test file for the dashboard endpoints:

```bash
cd apps/api
pytest tests/api/v1/test_blgu_dashboard.py -v
```

---

## 🌐 Frontend Testing

### Method 1: Manual Browser Testing (Recommended)

1. **Start the frontend**:
   ```bash
   pnpm dev:web
   ```

2. **Login as BLGU user**:
   - Navigate to: `http://localhost:3000/login`
   - Login with BLGU user credentials
   - You should be automatically redirected to `/blgu/dashboard`

3. **Test Dashboard Features**:

   ✅ **Completion Metrics Card**:
   - [ ] Shows total indicators count
   - [ ] Shows completed indicators (green)
   - [ ] Shows incomplete indicators (amber)
   - [ ] Displays completion percentage
   - [ ] Progress bar fills correctly
   - [ ] Shows appropriate completion message

   ✅ **Indicator Navigation List**:
   - [ ] Shows governance areas as accordion sections
   - [ ] Displays completion count per area (e.g., "30/45 completed")
   - [ ] Clicking area expands/collapses indicator list
   - [ ] Each indicator shows completion badge (Complete/Incomplete)
   - [ ] Clicking an indicator navigates to indicator page
   - [ ] Green/amber dot indicators show correctly

   ✅ **Assessor Comments Panel** (only if assessment needs rework):
   - [ ] Panel appears when assessment has rework comments
   - [ ] Comments grouped by indicator
   - [ ] Shows comment type badge (specific issue, general, etc.)
   - [ ] Shows timestamp for each comment
   - [ ] Tip message appears at bottom

   ✅ **Loading & Error States**:
   - [ ] Loading spinner appears while fetching data
   - [ ] Error message appears if fetch fails
   - [ ] "Try Again" button refetches data

4. **Test Navigation**:
   - [ ] Sidebar shows "Dashboard" link
   - [ ] Dashboard is highlighted in sidebar when active
   - [ ] Can navigate to "My Assessments"
   - [ ] Can navigate back to Dashboard
   - [ ] Page title shows "SGLGB Dashboard"

### Method 2: Component Testing (React Testing Library)

To test individual components in isolation, you would create test files:

```typescript
// Example: apps/web/src/components/features/dashboard/__tests__/CompletionMetricsCard.test.tsx

import { render, screen } from '@testing-library/react';
import { CompletionMetricsCard } from '../CompletionMetricsCard';

test('displays completion metrics correctly', () => {
  render(
    <CompletionMetricsCard
      totalIndicators={45}
      completedIndicators={30}
      incompleteIndicators={15}
      completionPercentage={66.67}
    />
  );

  expect(screen.getByText('45')).toBeInTheDocument();
  expect(screen.getByText('30')).toBeInTheDocument();
  expect(screen.getByText('15')).toBeInTheDocument();
  expect(screen.getByText('66.7%')).toBeInTheDocument();
});
```

### Method 3: Browser Developer Tools

1. **Open DevTools** (F12)
2. **Network Tab**:
   - Verify API calls to `/api/v1/blgu-dashboard/1`
   - Check response data structure
   - Verify authentication headers

3. **Console Tab**:
   - Check for any errors or warnings
   - Verify React Query cache updates

4. **React DevTools** (if installed):
   - Inspect component props
   - Verify state management
   - Check TanStack Query cache

---

## 🔍 What to Look For

### Backend Validation

✅ **Response Structure**:
```json
{
  "assessment_id": 1,
  "total_indicators": 45,
  "completed_indicators": 30,
  "incomplete_indicators": 15,
  "completion_percentage": 66.67,
  "governance_areas": [
    {
      "governance_area_id": 1,
      "governance_area_name": "Financial Administration",
      "indicators": [
        {
          "indicator_id": 101,
          "indicator_name": "Revenue Generation",
          "is_complete": true,
          "response_id": 501
        }
      ]
    }
  ],
  "rework_comments": null  // or array if status is NEEDS_REWORK
}
```

✅ **Security Checks**:
- ❌ Response should NOT contain: `compliance_status`, `pass_fail_status`, `score`
- ✅ Response should ONLY show: `is_complete` (boolean), completion counts, percentages
- ✅ Only BLGU users can access (403 for other roles)
- ✅ Users can only see their own assessments (403 for others' assessments)

### Frontend Validation

✅ **Visual Design**:
- Colors match design system (green for complete, amber for incomplete)
- Progress bar animates smoothly
- Cards have proper shadows and borders
- Dark mode support works correctly

✅ **Type Safety**:
- No TypeScript errors in console
- Completion status badges only accept "complete" | "incomplete"
- All generated types match backend schemas

✅ **Performance**:
- Dashboard loads in < 2 seconds
- No unnecessary re-renders
- TanStack Query caches data properly

---

## 🐛 Common Issues & Troubleshooting

### Issue: "Failed to Load Dashboard"

**Possible Causes**:
1. Backend server not running → Start with `pnpm dev:api`
2. Wrong assessment ID → Check database for valid IDs
3. User not authenticated → Re-login
4. User trying to access another user's assessment → Use correct assessment ID

### Issue: "403 Forbidden"

**Possible Causes**:
1. Not logged in as BLGU user → Login with correct role
2. Trying to access another user's assessment → Use your own assessment ID

### Issue: "No data showing"

**Possible Causes**:
1. Assessment has no responses → Create responses in database
2. Indicators have no form_schema → Set up indicators properly
3. Database connection issue → Check Supabase connection

### Issue: Components not rendering

**Possible Causes**:
1. Type generation not run → Run `pnpm generate-types`
2. Build cache issue → Delete `.next` folder and rebuild
3. Missing dependencies → Run `pnpm install`

---

## 📊 Test Data Setup

If you need to create test data:

1. **Create a BLGU user** (via API or database):
   ```python
   # Using the API
   POST /api/v1/users/
   {
     "email": "test_blgu@example.com",
     "name": "Test BLGU User",
     "role": "BLGU_USER",
     "barangay_id": 1,
     "password": "secure_password"
   }
   ```

2. **Create an assessment**:
   ```python
   POST /api/v1/assessments/
   {
     "year": 2025,
     "blgu_user_id": <user_id>
   }
   ```

3. **Add responses to indicators**:
   ```python
   POST /api/v1/assessment-responses/
   {
     "assessment_id": <assessment_id>,
     "indicator_id": <indicator_id>,
     "response_data": {"field1": "value1"}
   }
   ```

---

## ✅ Test Checklist

Use this checklist to ensure comprehensive testing:

### Backend API
- [ ] Dashboard endpoint returns correct data structure
- [ ] Navigation endpoint returns all indicators
- [ ] Completion percentage calculated correctly
- [ ] Rework comments shown only when status is NEEDS_REWORK
- [ ] Role-based access control works (BLGU only)
- [ ] Ownership check prevents accessing other users' data
- [ ] No compliance status exposed in response

### Frontend Components
- [ ] CompletionMetricsCard displays all metrics
- [ ] Progress bar shows correct percentage
- [ ] IndicatorNavigationList groups by governance area
- [ ] Accordion expand/collapse works
- [ ] Navigation to indicators works
- [ ] AssessorCommentsPanel shows when needed
- [ ] Comments grouped correctly by indicator
- [ ] Loading state shows spinner
- [ ] Error state shows error message
- [ ] Retry button refetches data

### Integration
- [ ] Page loads successfully at /blgu/dashboard
- [ ] Data fetches from API correctly
- [ ] TanStack Query caching works
- [ ] Navigation between pages works
- [ ] Sidebar highlights active page
- [ ] Responsive design works on mobile

---

## 🚀 Next Steps

After successful testing:

1. **Create automated tests** (Story 2.13):
   - Backend unit tests (`tests/api/v1/test_blgu_dashboard.py`)
   - Frontend component tests
   - E2E tests with Playwright/Cypress

2. **Performance testing**:
   - Load testing with multiple concurrent users
   - Database query optimization if needed

3. **User acceptance testing (UAT)**:
   - Get feedback from actual BLGU users
   - Iterate based on feedback

---

## 📝 Notes

- The dashboard shows **completion status only**, never compliance status
- This is a critical security feature - verify it in all tests
- The backend uses `CompletenessValidationService` from Epic 1
- The frontend uses generated TanStack Query hooks from Orval
