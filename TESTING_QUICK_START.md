# 🧪 Quick Start: Testing the BLGU Dashboard

This guide helps you quickly test the Epic 2.0 BLGU Dashboard implementation.

---

## 🚀 Fastest Way to Test

### Option 1: Interactive Test Script (Recommended)

```bash
./test-dashboard.sh
```

This will show you a menu with all testing options.

### Option 2: Manual Testing Steps

```bash
# Terminal 1: Start Backend
pnpm dev:api

# Terminal 2: Start Frontend
pnpm dev:web

# Terminal 3: Test Backend API
cd apps/api
uv run python test_blgu_dashboard.py

# Browser: Test Frontend
# Navigate to: http://localhost:3000/login
# Login with BLGU user credentials
# Dashboard should load automatically
```

---

## 📋 Before You Start

1. **Update test credentials** in `apps/api/test_blgu_dashboard.py`:
   ```python
   BLGU_USER_EMAIL = "your_blgu_user@example.com"
   BLGU_USER_PASSWORD = "your_actual_password"
   TEST_ASSESSMENT_ID = 1  # Use a valid assessment ID
   ```

2. **Ensure you have test data**:
   - A BLGU user in the database
   - At least one assessment with responses
   - Indicators with form schemas

---

## 🎯 Quick Test Checklist

### Backend (5 minutes)
- [ ] Run `uv run python test_blgu_dashboard.py`
- [ ] Verify dashboard endpoint returns data
- [ ] Verify navigation endpoint returns indicators
- [ ] Check completion percentages are correct
- [ ] Confirm no compliance status in response

### Frontend (5 minutes)
- [ ] Login as BLGU user
- [ ] Verify dashboard loads at `/blgu/dashboard`
- [ ] Check completion metrics display correctly
- [ ] Test accordion expand/collapse
- [ ] Click an indicator to navigate
- [ ] Verify assessor comments show (if applicable)

---

## 🌐 Testing URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend Dashboard | http://localhost:3000/blgu/dashboard | Main dashboard page |
| Login Page | http://localhost:3000/login | Authentication |
| API Docs (Swagger) | http://localhost:8000/docs | Interactive API testing |
| Backend Health | http://localhost:8000/api/v1/system/health | Backend status check |

---

## 📚 Detailed Documentation

For comprehensive testing instructions, see:
- **[TESTING_EPIC2_DASHBOARD.md](apps/api/TESTING_EPIC2_DASHBOARD.md)** - Full testing guide
- **[test_blgu_dashboard.py](apps/api/test_blgu_dashboard.py)** - Backend API test script

---

## 🐛 Common Issues

### "Failed to Load Dashboard"
- **Fix**: Check backend is running (`pnpm dev:api`)
- **Fix**: Verify assessment ID exists in database

### "403 Forbidden"
- **Fix**: Login with BLGU user role (not admin/assessor)
- **Fix**: Use your own assessment ID, not another user's

### "Module not found" errors
- **Fix**: Run `pnpm install` in project root
- **Fix**: Run `pnpm generate-types` to generate API client

### Components not showing
- **Fix**: Run `pnpm generate-types`
- **Fix**: Restart frontend dev server

---

## 💡 Pro Tips

1. **Use Swagger UI** for quick API testing without writing code:
   - Go to http://localhost:8000/docs
   - Click "Authorize" and login
   - Try the endpoints interactively

2. **Check Browser DevTools**:
   - Network tab: See API requests/responses
   - Console: Check for errors
   - React DevTools: Inspect component state

3. **Use the Test Script** for automated testing:
   - Quickly verify both endpoints
   - Get formatted output of all data
   - Easy to run after code changes

---

## ✅ Success Criteria

Your testing is successful when:

✅ Backend API returns proper JSON structure
✅ Completion percentages calculate correctly
✅ No compliance status exposed (security requirement)
✅ Frontend displays all metrics correctly
✅ Navigation works (accordion, click-to-navigate)
✅ Loading and error states work
✅ Only BLGU users can access their own data

---

## 🆘 Need Help?

1. Check [TESTING_EPIC2_DASHBOARD.md](apps/api/TESTING_EPIC2_DASHBOARD.md) for detailed troubleshooting
2. Review the implementation in:
   - Backend: [apps/api/app/api/v1/blgu_dashboard.py](apps/api/app/api/v1/blgu_dashboard.py)
   - Frontend: [apps/web/src/app/(app)/blgu/dashboard/page.tsx](apps/web/src/app/(app)/blgu/dashboard/page.tsx)
3. Check git commits for implementation details:
   ```bash
   git log --oneline | grep -i "epic 2"
   ```

---

**Happy Testing! 🎉**
