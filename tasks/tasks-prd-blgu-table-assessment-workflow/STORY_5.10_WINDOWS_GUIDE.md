# Story 5.10: Type Generation - Windows Guide

## Current Status

✅ **Backend API Running**: Docker containers are healthy at `http://localhost:8000`
✅ **Import Bug Fixed**: Corrected `governance_area` import path
❌ **Type Generation Blocked**: Node.js not available in WSL environment

## Why This Failed in WSL

The error you saw:
```
/mnt/c/Users/Asnari Pacalna/AppData/Roaming/npm/pnpm: 15: exec: node: not found
```

This happens because:
1. You have Node.js/pnpm installed on **Windows**
2. You're running commands in **WSL (Linux)**
3. WSL can't directly execute Windows Node.js

## Solution: Run Type Generation from Windows

Since your Docker containers are running and accessible from both Windows and WSL (they share localhost), you just need to run the type generation command from a Windows terminal.

### Steps to Complete Story 5.10

#### 1. Open Windows PowerShell or Command Prompt

Press `Win + X` and select:
- **Windows PowerShell** (recommended), or
- **Command Prompt**

Do NOT use WSL/Ubuntu terminal for this step.

#### 2. Navigate to Project Directory

```powershell
# Change to your project directory
# The path is typically something like:
cd "C:\Users\Asnari Pacalna\Projects\vantage"

# Or wherever your project is located
# You can find it by running in WSL: pwd
# Then convert: /home/asnari/Project/vantage → C:\Users\Asnari Pacalna\...\vantage
```

**Tip**: You can also open the project folder in File Explorer, then type `powershell` in the address bar to open PowerShell directly in that folder.

#### 3. Verify API is Accessible

```powershell
curl http://localhost:8000/openapi.json
```

You should see JSON output starting with `{"openapi":"3.1.0",...}`

If this fails, make sure Docker Desktop is running and containers are healthy.

#### 4. Run Type Generation

```powershell
pnpm generate-types
```

Expected output:
```
🚀 Generating TypeScript types with Orval + React Query...
📡 Fetching OpenAPI schema from: http://localhost:8000/openapi.json
✓ Type generation complete!
```

#### 5. Verify Generated Files

Check that new files were created in Windows Explorer or PowerShell:

```powershell
dir packages\shared\src\generated\schemas\assessments\
dir packages\shared\src\generated\endpoints\assessments\
```

You should see new files:
- `submitAssessmentResponse.ts`
- `requestReworkRequest.ts`
- `requestReworkResponse.ts`
- `resubmitAssessmentResponse.ts`
- `submissionStatusResponse.ts`
- `submissionValidationResult.ts`

And updated hooks in `endpoints/assessments/assessments.ts`:
- `useSubmitAssessment`
- `useRequestRework`
- `useResubmitAssessment`
- `useGetSubmissionStatus`

#### 6. Commit the Generated Files

Switch back to **WSL terminal** and commit:

```bash
git add packages/shared/src/generated/
git commit -m "feat(epic-5.0): generate TypeScript types for submission workflow

- Generate types for Epic 5.0 submission endpoints
- Add React Query hooks for submit/request-rework/resubmit/status
- Update generated schemas for SubmitAssessmentResponse, RequestReworkRequest, etc.

Story 5.10 complete

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Alternative: Install Node.js in WSL

If you prefer to run everything in WSL (optional):

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20

# Verify installation
node --version
pnpm --version

# Then you can run from WSL
pnpm generate-types
```

## Troubleshooting

### "fetch failed" Error
**Cause**: Backend API not running
**Solution**: Start Docker containers: `./scripts/docker-dev.sh up`

### "Command 'generate-types' not found"
**Cause**: Running from wrong directory
**Solution**: Must run from project root, not from `apps/api` or `apps/web`

### Files Not Generated
**Cause**: OpenAPI schema doesn't include new endpoints
**Solution**:
1. Check API logs: `docker logs vantage-api`
2. Verify endpoints exist: `curl http://localhost:8000/docs`
3. Check for import errors in Python code

### Permission Errors on Windows
**Cause**: Git line ending conversion
**Solution**: Files should be auto-fixed by git, just commit them

## What Happens Next (Stories 5.11-5.18)

Once Story 5.10 is complete, we can begin frontend implementation:

1. **Story 5.11**: Submission Button Component (BLGU)
2. **Story 5.12**: Rework Request Modal (Assessor)
3. **Story 5.13**: Resubmission Button (BLGU)
4. **Story 5.14**: Submission Status Indicator
5. **Story 5.15**: Rework Feedback Display
6. **Story 5.16**: Locked State UI Handling
7. **Story 5.17**: Validation Error Display
8. **Story 5.18**: Frontend Integration Testing

These stories will use the generated hooks:
```typescript
import { useSubmitAssessment } from '@vantage/shared';

const { mutate: submitAssessment } = useSubmitAssessment();
```

## Summary

**Current Situation**:
- ✅ Backend Epic 5.0 complete (Stories 5.1-5.9)
- ✅ API running in Docker
- ✅ Import bugs fixed
- ⏳ Waiting for type generation from Windows terminal

**Next Action**: Run `pnpm generate-types` from Windows PowerShell in project root directory.
