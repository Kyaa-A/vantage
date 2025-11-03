# Tasks: High-Level Analytics & Reporting Feature

> Generated from: `docs/prds/prd-analytics-reporting.md`
> Status: Phase 3 - Atomic Tasks Generated (Partially Complete - Epics 1.0-3.0 Fully Detailed)
>
> **Completion Status:**
>
> - ✅ Epic 1.0 (MLGOO-DILG Dashboard): 6 stories → 24 atomic tasks
> - ✅ Epic 2.0 (Reports Page): 10 stories → 44 atomic tasks
> - ✅ Epic 3.0 (Gap Analysis): 7 stories → 20 atomic tasks
> - ⚠️ Epic 4.0 (AI Recommendations): 8 stories → Atomic tasks in progress
> - ⚠️ Epic 5.0 (External API): 8 stories → Atomic tasks pending
> - ⚠️ Epic 6.0 (Infrastructure): 8 stories → Atomic tasks pending
>
> **Total:** 88 atomic tasks completed for 23 stories across 3 epics
>
> **Note:** Epics 1.0-3.0 provide comprehensive atomic task templates. Epics 4.0-6.0 follow the same pattern and can be completed using the established methodology demonstrated in the first 3 epics.

---

## Epic Files

This directory contains separate files for each epic to make the tasks more manageable:

- [Epic 1.0: MLGOO-DILG Dashboard](./epic-1.0-mlgoo-dilg-dashboard.md) - _(FR-1 to FR-6)_
- [Epic 2.0: Reports Page with Interactive Visualizations](./epic-2.0-reports-page.md) - _(FR-7 to FR-11)_
- [Epic 3.0: Gap Analysis Report System](./epic-3.0-gap-analysis.md) - _(FR-12 to FR-17)_
- [Epic 4.0: AI Recommendations Display & Tracking](./epic-4.0-ai-recommendations.md) - _(FR-18 to FR-22)_
- [Epic 5.0: External API for Partner Institutions](./epic-5.0-external-api.md) - _(FR-23 to FR-30)_
- [Epic 6.0: Analytics Infrastructure & Optimization](./epic-6.0-analytics-infrastructure.md) - _(FR-31 to FR-35)_

---

## 🔔 IMPORTANT TODO

**After completing implementation of Epics 1.0-3.0, generate atomic tasks for the remaining epics:**

- [ ] **TODO: Generate Atomic Tasks for Epic 4.0** (AI Recommendations Display & Tracking)

  - Apply the same 3-tier methodology used in Epics 1.0-3.0
  - Break down each of the 8 stories into 3-5 atomic tasks
  - Expected output: ~25-30 atomic tasks

- [ ] **TODO: Generate Atomic Tasks for Epic 5.0** (External API for Partner Institutions)

  - Apply the same 3-tier methodology used in Epics 1.0-3.0
  - Break down each of the 8 stories into 3-5 atomic tasks
  - Expected output: ~25-30 atomic tasks

- [ ] **TODO: Generate Atomic Tasks for Epic 6.0** (Analytics Infrastructure & Optimization)
  - Apply the same 3-tier methodology used in Epics 1.0-3.0
  - Break down each of the 8 stories into 3-5 atomic tasks
  - Expected output: ~25-30 atomic tasks

**Rationale:** Complete Epics 1.0-3.0 first to validate the approach and incorporate lessons learned before generating detailed tasks for the remaining epics. The established pattern in Epics 1.0-3.0 serves as the template.

---

## PRD Traceability Matrix

Map each functional requirement to specific epics:

- **FR-1 to FR-6** (MLGOO-DILG Dashboard) → Epic 1.0
- **FR-7 to FR-11** (Reports Page) → Epic 2.0
- **FR-12 to FR-17** (Gap Analysis Report) → Epic 3.0
- **FR-18 to FR-22** (AI Recommendations Display & Tracking) → Epic 4.0
- **FR-23 to FR-30** (External API Endpoint) → Epic 5.0
- **FR-31 to FR-35** (Analytics Infrastructure & Optimization) → Epic 6.0

## Relevant Files

Tech-stack specific file structure for the Analytics & Reporting feature:

### Backend Files

- `apps/api/app/db/models/recommendation_tracking.py` - SQLAlchemy model for recommendation tracking
- `apps/api/app/db/models/external_api_key.py` - SQLAlchemy model for external API keys
- `apps/api/app/db/models/api_access_log.py` - SQLAlchemy model for API access audit logs
- `apps/api/app/schemas/analytics.py` - Pydantic schemas for analytics data
- `apps/api/app/schemas/recommendations.py` - Pydantic schemas for AI recommendations
- `apps/api/app/schemas/external_api.py` - Pydantic schemas for external API responses
- `apps/api/app/services/analytics_service.py` - Business logic for analytics calculations
- `apps/api/app/services/gap_analysis_service.py` - Business logic for gap analysis
- `apps/api/app/services/external_api_service.py` - Business logic for external API data anonymization
- `apps/api/app/api/v1/analytics.py` - FastAPI endpoints for analytics (tag: `analytics`)
- `apps/api/app/api/v1/recommendations.py` - FastAPI endpoints for recommendations (tag: `recommendations`)
- `apps/api/app/api/v1/external_api.py` - FastAPI endpoints for external partners (tag: `external-api`)
- `apps/api/app/core/cache.py` - Redis caching utilities for analytics data
- `apps/api/app/core/rate_limiter.py` - Rate limiting middleware for external API
- `apps/api/alembic/versions/xxxx_add_analytics_tables.py` - Alembic migration for new tables

### Frontend Files

- `apps/web/src/app/(app)/analytics/page.tsx` - MLGOO-DILG dashboard page
- `apps/web/src/app/(app)/reports/page.tsx` - Reports page with visualizations
- `apps/web/src/app/(app)/gap-analysis/page.tsx` - Gap Analysis page
- `apps/web/src/app/(app)/recommendations/page.tsx` - AI Recommendations page
- `apps/web/src/components/features/analytics/DashboardKPIs.tsx` - Dashboard KPI cards
- `apps/web/src/components/features/analytics/TrendChart.tsx` - Trend visualization component
- `apps/web/src/components/features/analytics/BarangayMap.tsx` - Geographic map component
- `apps/web/src/components/features/reports/VisualizationGrid.tsx` - Reports page layout
- `apps/web/src/components/features/reports/ChartComponents.tsx` - Recharts wrappers
- `apps/web/src/components/features/reports/DataTable.tsx` - TanStack Table implementation
- `apps/web/src/components/features/reports/ExportControls.tsx` - CSV/PNG/PDF export UI
- `apps/web/src/components/features/gap-analysis/GapAnalysisView.tsx` - Gap analysis drill-down UI
- `apps/web/src/components/features/gap-analysis/ComparisonTable.tsx` - Before/after comparison
- `apps/web/src/components/features/recommendations/RecommendationCard.tsx` - AI recommendation display
- `apps/web/src/components/features/recommendations/StatusTracker.tsx` - Implementation status UI
- `apps/web/src/components/features/recommendations/PDFGenerator.tsx` - PDF export component
- `apps/web/src/hooks/useAnalytics.ts` - Custom hook wrapping Orval-generated analytics hooks
- `apps/web/src/hooks/useGapAnalysis.ts` - Custom hook for gap analysis data
- `apps/web/src/hooks/useRecommendations.ts` - Custom hook for recommendations data
- `apps/web/src/lib/pdf-export.ts` - PDF generation utility using jsPDF/html2canvas

### Shared/Generated Files

- `packages/shared/src/generated/endpoints/analytics/` - Auto-generated React Query hooks
- `packages/shared/src/generated/endpoints/recommendations/` - Auto-generated React Query hooks
- `packages/shared/src/generated/endpoints/external-api/` - Auto-generated React Query hooks
- `packages/shared/src/generated/schemas/analytics/` - TypeScript types for analytics
- `packages/shared/src/generated/schemas/recommendations/` - TypeScript types for recommendations
- `packages/shared/src/generated/schemas/external-api/` - TypeScript types for external API

### Testing Files

- `apps/api/tests/api/v1/test_analytics.py` - Pytest tests for analytics endpoints
- `apps/api/tests/api/v1/test_recommendations.py` - Pytest tests for recommendations endpoints
- `apps/api/tests/api/v1/test_external_api.py` - Pytest tests for external API
- `apps/api/tests/services/test_analytics_service.py` - Unit tests for analytics service
- `apps/api/tests/services/test_gap_analysis_service.py` - Unit tests for gap analysis service
- `apps/web/src/components/features/analytics/__tests__/DashboardKPIs.test.tsx` - Component tests

### Configuration Files

- `apps/api/app/core/config.py` - Add Redis cache configuration
- `apps/web/package.json` - Add Recharts, Leaflet, jsPDF dependencies
- `orval.config.ts` - Ensure analytics/recommendations/external-api tags are included

---

## Quality Gates - Story Review Checklist

- [x] Stories align with VANTAGE full-stack architecture (Frontend, Backend, Database)
- [x] Each story represents a cohesive implementation domain (1-3 days)
- [x] Dependencies between stories are clearly identified
- [x] Stories can be worked on sequentially to build each epic
- [x] Story descriptions specify exact tech stack components
- [x] Success criteria are specific and testable
