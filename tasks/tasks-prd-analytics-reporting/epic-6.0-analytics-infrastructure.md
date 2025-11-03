# Epic 6.0: Analytics Infrastructure & Optimization

> **PRD Reference:** FR-31 to FR-35  
> **User Stories:** All (cross-cutting)  
> **Duration:** 1-2 weeks  
> **Status:** ⚠️ Pending - 8 stories → Atomic tasks pending

**[← Back to Overview](./README.md)**

---

## Epic Overview

**Description:** Implement cross-cutting infrastructure requirements including database schema migrations, caching strategy with Redis, query optimization, RBAC enforcement, and timezone handling to support high-performance analytics features.

**Success Criteria:**
- New database tables created: recommendation_tracking, external_api_keys, api_access_logs
- Database indexes created on high-query columns (cycle_id, compliance_status, area_code, is_completed)
- Redis caching implemented with 15-minute TTL and on-demand invalidation
- Dashboard KPI queries execute in <1 second
- All reports include metadata (date range, filters, generation timestamp)
- Timezone handling defaults to Philippine Time (UTC+8)

---

  - [ ] **6.1 Story: Database Migrations for All Analytics Tables**

    - **Scope:** Consolidate all analytics-related database migrations
    - **Duration:** 1 day
    - **Dependencies:** None (foundation for other epics)
    - **Files:** `apps/api/alembic/versions/xxxx_add_analytics_infrastructure.py`
    - **Tech:** Alembic, SQLAlchemy
    - **Success Criteria:**
      - Single migration creates: recommendation_tracking, external_api_keys, api_access_logs
      - Migration is reversible (`alembic downgrade` works)
      - `alembic upgrade head` runs without errors
      - All tables created with proper constraints and relationships

  - [ ] **6.2 Story: Database Indexes & Query Optimization**

    - **Scope:** Create indexes on high-query columns for performance
    - **Duration:** 1-2 days
    - **Dependencies:** 6.1 (tables exist)
    - **Files:** `apps/api/alembic/versions/xxxx_add_analytics_indexes.py`
    - **Tech:** Alembic, PostgreSQL indexes
    - **Success Criteria:**
      - Indexes created on: `assessments.cycle_id`, `assessments.final_compliance_status`, `governance_area_results.area_code`, `assessment_responses.is_completed`
      - Composite indexes for common query patterns (e.g., `cycle_id + barangay_id`)
      - Use EXPLAIN ANALYZE to verify query performance improvements
      - Dashboard KPI queries execute in <1 second

  - [ ] **6.3 Story: Redis Caching Implementation**

    - **Scope:** Set up Redis caching for aggregated analytics data
    - **Duration:** 2 days
    - **Dependencies:** None
    - **Files:** `apps/api/app/core/cache.py`, `apps/api/app/core/config.py` (extend)
    - **Tech:** Redis, redis-py, FastAPI
    - **Success Criteria:**
      - Cache utility functions: `get_cached_data()`, `set_cached_data()`, `invalidate_cache()`
      - Cache key pattern: `analytics:{cycle_id}:{filter_hash}`
      - TTL: 15 minutes (configurable)
      - Cache invalidation function called when assessment is validated
      - Redis connection pooling configured
      - Error handling: Cache failures don't break API (fallback to DB)

  - [ ] **6.4 Story: Apply Caching to Analytics Endpoints**

    - **Scope:** Integrate Redis caching into analytics service methods
    - **Duration:** 1-2 days
    - **Dependencies:** 6.3 (cache utilities exist)
    - **Files:** `apps/api/app/services/analytics_service.py` (extend), `apps/api/app/api/v1/analytics.py` (extend)
    - **Tech:** Redis, Python
    - **Success Criteria:**
      - Dashboard KPIs cached (check cache before querying DB)
      - Reports data cached per filter combination
      - Gap analysis cached per assessment/cycle
      - Cache hit/miss logged for monitoring
      - Cached responses include `X-Cache: HIT` or `X-Cache: MISS` header

  - [ ] **6.5 Story: RBAC Enforcement Utilities**

    - **Scope:** Create reusable RBAC dependencies and filters for analytics endpoints
    - **Duration:** 1-2 days
    - **Dependencies:** None (uses existing user service)
    - **Files:** `apps/api/app/api/deps.py` (extend)
    - **Tech:** FastAPI dependencies, SQLAlchemy
    - **Success Criteria:**
      - Dependency `get_current_mlgoo_dilg_user()` enforces MLGOO_DILG role (returns 403 otherwise)
      - Dependency `get_rbac_filtered_query()` applies role-based filters:
        - MLGOO_DILG: No filter (sees all)
        - Assessor: Filters by assigned governance_area
        - BLGU: Filters by barangay_id
      - Dependencies reused across all analytics endpoints
      - Unit tested for each role

  - [ ] **6.6 Story: Timezone Handling**

    - **Scope:** Implement consistent timezone handling (default Philippine Time UTC+8)
    - **Duration:** 1 day
    - **Dependencies:** None
    - **Files:** `apps/api/app/core/config.py` (extend), `apps/api/app/services/analytics_service.py` (extend)
    - **Tech:** Python pytz, datetime
    - **Success Criteria:**
      - All datetime fields stored in DB as UTC
      - API responses convert to Philippine Time (UTC+8) before serialization
      - Frontend displays times in user's configured timezone (default PT)
      - Timestamps include timezone info in ISO 8601 format

  - [ ] **6.7 Story: Report Metadata Generation**

    - **Scope:** Add metadata to all analytics responses (date range, filters, timestamp)
    - **Duration:** 1 day
    - **Dependencies:** 6.6 (timezone handling exists)
    - **Files:** `apps/api/app/schemas/analytics.py` (extend), `apps/api/app/services/analytics_service.py` (extend)
    - **Tech:** Pydantic
    - **Success Criteria:**
      - All analytics response schemas include `metadata` field
      - Metadata contains: `date_range`, `applied_filters`, `generated_at` (timestamp), `cache_status`
      - Frontend displays metadata in report headers/footers
      - PDF exports include metadata on cover page

  - [ ] **6.8 Story: Infrastructure Testing**
    - **Scope:** Test caching, RBAC, timezone handling, and query optimization
    - **Duration:** 2 days
    - **Dependencies:** 6.7 (all infrastructure complete)
    - **Files:**
      - `apps/api/tests/core/test_cache.py`
      - `apps/api/tests/api/test_deps.py`
      - `apps/api/tests/services/test_analytics_service.py` (extend)
    - **Tech:** Pytest, pytest-redis, pytest-mock
    - **Success Criteria:**
      - Test cache hit/miss scenarios
      - Test cache invalidation logic
      - Test RBAC dependencies for all 3 roles
      - Test timezone conversions (UTC → PT)
      - Test query performance with indexes (EXPLAIN ANALYZE)
      - Test metadata generation
      - All tests pass

---

