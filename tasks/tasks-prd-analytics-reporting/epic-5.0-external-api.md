# Epic 5.0: External API for Partner Institutions

> **PRD Reference:** FR-23 to FR-30  
> **User Stories:** US-10, US-11  
> **Duration:** 2 weeks  
> **Status:** ⚠️ Pending - 8 stories → Atomic tasks pending

**[← Back to Overview](./README.md)**

---

## Epic Overview

**Description:** Create a secure, read-only REST API endpoint for UMDC Peace Center and Katuparan Center to access anonymized, aggregated SGLGB data with API key authentication, rate limiting, and comprehensive audit logging.

**Success Criteria:**
- External API endpoint requires valid API key for access
- Only anonymized, aggregated data is exposed (no PII, no MOVs, no individual attributable scores)
- Query parameters (cycle_id, date range, governance_area) filter data correctly
- Rate limiting prevents abuse (100 requests/hour per key)
- All API access logged with timestamp, endpoint, key, and query parameters
- OpenAPI documentation generated and accessible

---

  - [ ] **5.1 Story: Database Schema for External API Management**

    - **Scope:** Create tables for API keys and access logs
    - **Duration:** 1 day
    - **Dependencies:** Epic 6.0 (migrations setup)
    - **Files:**
      - `apps/api/app/db/models/external_api_key.py`
      - `apps/api/app/db/models/api_access_log.py`
      - `apps/api/alembic/versions/xxxx_add_external_api_tables.py`
    - **Tech:** SQLAlchemy, Alembic
    - **Success Criteria:**
      - `external_api_keys` table: id, institution_name, api_key (hashed), is_active, rate_limit, created_at, last_used_at
      - `api_access_logs` table: id, api_key_id (FK), endpoint, query_parameters (JSONB), response_status, timestamp
      - Indexes on api_key, timestamp
      - Migration runs successfully

    - [ ] **5.1.1 Atomic:** Create ExternalAPIKey SQLAlchemy model

      - **Files:** `apps/api/app/db/models/external_api_key.py`
      - **Dependencies:** None
      - **Acceptance:**
        - Create `ExternalAPIKey` model class inheriting from Base
        - Columns: `id` (Integer, PK), `institution_name` (String), `api_key_hash` (String, unique, indexed), `is_active` (Boolean, default=True), `rate_limit` (Integer, default=100), `created_at` (DateTime, default=now), `last_used_at` (DateTime, nullable)
        - Method `verify_key(plain_key)` to check hashed key using bcrypt
        - Method `generate_key()` static method to create new API key and return plain + hash
        - `__tablename__ = "external_api_keys"`
        - Model exports at module level
      - **Tech:** SQLAlchemy, bcrypt for hashing

    - [ ] **5.1.2 Atomic:** Create APIAccessLog SQLAlchemy model

      - **Files:** `apps/api/app/db/models/api_access_log.py`
      - **Dependencies:** 5.1.1 (ExternalAPIKey model exists)
      - **Acceptance:**
        - Create `APIAccessLog` model class inheriting from Base
        - Columns: `id` (Integer, PK), `api_key_id` (ForeignKey to external_api_keys), `endpoint` (String), `query_parameters` (JSONB for PostgreSQL), `response_status` (Integer), `ip_address` (String), `timestamp` (DateTime, default=now, indexed)
        - Relationship: `api_key` (back to ExternalAPIKey)
        - `__tablename__ = "api_access_logs"`
        - Model exports at module level
      - **Tech:** SQLAlchemy, PostgreSQL JSONB

    - [ ] **5.1.3 Atomic:** Create Alembic migration for external API tables

      - **Files:** `apps/api/alembic/versions/xxxx_add_external_api_tables.py`
      - **Dependencies:** 5.1.2 (both models exist)
      - **Acceptance:**
        - Run: `cd apps/api && alembic revision --autogenerate -m "add external api tables"`
        - Review generated migration, ensure all columns and constraints correct
        - Add indexes: `create_index('ix_external_api_keys_api_key_hash', 'external_api_keys', ['api_key_hash'])`, `create_index('ix_api_access_logs_timestamp', 'api_access_logs', ['timestamp'])`
        - Run: `alembic upgrade head`
        - Verify tables created in database with correct schema
        - Test downgrade: `alembic downgrade -1`, then upgrade again
      - **Tech:** Alembic, SQL DDL

    - [ ] **5.1.4 Atomic:** Import and register models in models init file
      - **Files:** `apps/api/app/db/models/__init__.py`
      - **Dependencies:** 5.1.3 (migration complete)
      - **Acceptance:**
        - Import `ExternalAPIKey` and `APIAccessLog` models in `__init__.py`
        - Add to `__all__` list for proper module exports
        - Verify models are discoverable by Alembic autogenerate
        - Run `alembic check` to verify no pending changes
      - **Tech:** Python imports, Alembic

  - [ ] **5.2 Story: Backend External API Service**

    - **Scope:** Implement data anonymization and aggregation logic for partner institutions
    - **Duration:** 2-3 days
    - **Dependencies:** 5.1 (database tables exist)
    - **Files:** `apps/api/app/services/external_api_service.py`, `apps/api/app/schemas/external_api.py`
    - **Tech:** SQLAlchemy, Pydantic, Python
    - **Success Criteria:**
      - Service retrieves only validated assessments (no in-progress data)
      - Anonymizes barangay identifiers (replace names with anonymous IDs)
      - Aggregates: overall pass/fail rates, rates by governance area
      - Provides trend data across cycles
      - Excludes PII, MOVs, individual attributable scores
      - Supports filtering by cycle_id, date range, governance_area

    - [ ] **5.2.1 Atomic:** Create Pydantic schemas for external API responses

      - **Files:** `apps/api/app/schemas/external_api.py`
      - **Dependencies:** None
      - **Acceptance:**
        - Schema `ExternalAPIDataResponse` with fields: `aggregated_data`, `trends`, `metadata`
        - Schema `AggregatedData` with fields: `overall_pass_rate`, `overall_fail_rate`, `total_barangays`, `area_breakdown` (list)
        - Schema `AreaBreakdownExternal` with fields: `area_code`, `area_name`, `pass_rate`, `fail_rate`
        - Schema `TrendDataExternal` with fields: `cycle_id`, `cycle_name`, `pass_rate`, `assessment_date`
        - Schema `ExternalAPIMetadata` with fields: `date_range`, `filters_applied`, `data_as_of`, `anonymization_level`
        - All schemas use proper types and include `Config` with `from_attributes = True`
        - No PII fields included (no barangay names, no individual scores)
      - **Tech:** Pydantic, Python typing

    - [ ] **5.2.2 Atomic:** Implement data anonymization service methods

      - **Files:** `apps/api/app/services/external_api_service.py`
      - **Dependencies:** 5.2.1 (schemas exist), 5.1.4 (models registered)
      - **Acceptance:**
        - Create `ExternalAPIService` class
        - Add method `anonymize_barangay_data(assessments)` that:
          - Replaces barangay names with anonymous IDs (e.g., "BRG-001", "BRG-002")
          - Removes all PII fields (contact info, user names, etc.)
          - Excludes MOVs (Means of Verification files/links)
          - Excludes individual indicator scores (only aggregated area scores)
          - Returns anonymized dataset
        - Method uses consistent hashing for reproducible anonymous IDs
      - **Tech:** SQLAlchemy ORM, Python hashing (hashlib)

    - [ ] **5.2.3 Atomic:** Implement aggregation service methods

      - **Files:** `apps/api/app/services/external_api_service.py` (extend)
      - **Dependencies:** 5.2.2 (anonymization methods exist)
      - **Acceptance:**
        - Add method `get_aggregated_data(db, cycle_id, start_date, end_date, governance_area)` that:
          - Queries only validated assessments (final_compliance_status IS NOT NULL)
          - Filters by cycle_id, date range, governance_area (if provided)
          - Calculates overall pass/fail rates
          - Groups by governance area and calculates area-specific rates
          - Excludes in-progress assessments
          - Returns `AggregatedData` schema
        - Add method `get_trends_data(db, start_date, end_date)` for historical trends
        - Both methods filter out incomplete/draft data
      - **Tech:** SQLAlchemy aggregations, date filtering

    - [ ] **5.2.4 Atomic:** Implement query filtering and metadata generation
      - **Files:** `apps/api/app/services/external_api_service.py` (extend)
      - **Dependencies:** 5.2.3 (aggregation methods exist)
      - **Acceptance:**
        - Add method `get_external_api_data(db, filters)` that orchestrates the full response:
          - Calls aggregation methods with filters
          - Calls anonymization methods
          - Calls trend data methods
          - Generates metadata: applied filters, data timestamp, anonymization level
          - Returns `ExternalAPIDataResponse` schema
        - Supports optional query parameters: cycle_id, start_date, end_date, governance_area
        - Export singleton: `external_api_service = ExternalAPIService()`
      - **Tech:** SQLAlchemy, Pydantic, Python datetime

  - [ ] **5.3 Story: API Key Authentication System**

    - **Scope:** Implement API key validation and authentication dependency
    - **Duration:** 1-2 days
    - **Dependencies:** 5.1 (external_api_keys table exists)
    - **Files:** `apps/api/app/core/auth.py` (extend), `apps/api/app/api/deps.py` (extend)
    - **Tech:** FastAPI dependencies, bcrypt for hashing
    - **Success Criteria:**
      - Dependency function `get_api_key()` validates API key from header (`X-API-Key`)
      - Checks key exists, is active, and not expired
      - Returns associated institution metadata
      - Updates `last_used_at` timestamp on successful validation
      - Returns 401 for invalid/missing keys

    - [ ] **5.3.1 Atomic:** Create API key validation utility functions

      - **Files:** `apps/api/app/core/auth.py` (extend)
      - **Dependencies:** 5.1.4 (ExternalAPIKey model registered)
      - **Acceptance:**
        - Add function `validate_api_key(db: Session, api_key: str)` that:
          - Queries `external_api_keys` table for matching key hash
          - Uses bcrypt to verify plain key against stored hash
          - Checks `is_active` field is True
          - Returns `ExternalAPIKey` instance if valid, None otherwise
        - Add function `update_last_used(db: Session, api_key_id: int)` to update timestamp
        - Handle timing attacks with constant-time comparison
      - **Tech:** bcrypt, SQLAlchemy, Python secrets

    - [ ] **5.3.2 Atomic:** Create FastAPI dependency for API key authentication

      - **Files:** `apps/api/app/api/deps.py` (extend)
      - **Dependencies:** 5.3.1 (validation functions exist)
      - **Acceptance:**
        - Create dependency function `get_current_api_key(x_api_key: str = Header(...), db: Session = Depends(get_db))` that:
          - Extracts API key from `X-API-Key` header
          - Calls `validate_api_key()` to verify
          - Raises `HTTPException(401, "Invalid or missing API key")` if validation fails
          - Updates `last_used_at` timestamp on success
          - Returns `ExternalAPIKey` instance
        - Export dependency for use in external API endpoints
      - **Tech:** FastAPI dependencies, Header extraction

    - [ ] **5.3.3 Atomic:** Create API key management CLI commands
      - **Files:** `apps/api/app/cli/api_keys.py` (new)
      - **Dependencies:** 5.3.2 (auth system complete)
      - **Acceptance:**
        - Create CLI command `generate-api-key --institution "UMDC Peace Center"` that:
          - Calls `ExternalAPIKey.generate_key()` to create new key
          - Stores hashed version in database
          - Prints plain key to stdout (only time it's visible)
          - Sets default rate_limit and is_active=True
        - Create CLI command `revoke-api-key --key-id 123` to deactivate key
        - Create CLI command `list-api-keys` to show all keys (masked)
        - Register commands with FastAPI CLI or Typer
      - **Tech:** Typer/Click, SQLAlchemy, CLI development

  - [ ] **5.4 Story: Rate Limiting Middleware**

    - **Scope:** Implement rate limiting for external API (100 req/hour per key)
    - **Duration:** 1-2 days
    - **Dependencies:** 5.3 (API key auth exists)
    - **Files:** `apps/api/app/core/rate_limiter.py`, `apps/api/app/core/config.py` (extend)
    - **Tech:** Redis, FastAPI middleware, Slowapi or custom implementation
    - **Success Criteria:**
      - Rate limiter tracks requests per API key using Redis
      - Configurable limit (default 100 req/hour)
      - Returns 429 Too Many Requests when limit exceeded
      - Response includes `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers

  - [ ] **5.5 Story: Backend External API Endpoints**

    - **Scope:** Create external API endpoint with comprehensive query parameters
    - **Duration:** 1-2 days
    - **Dependencies:** 5.2, 5.3, 5.4 (service, auth, rate limiting complete)
    - **Files:** `apps/api/app/api/v1/external_api.py`
    - **Tech:** FastAPI
    - **Success Criteria:**
      - `GET /api/v1/external/sglgb-data` endpoint with tag `external-api`
      - Requires API key authentication (no JWT)
      - Query params: `cycle_id`, `start_date`, `end_date`, `governance_area`
      - Returns anonymized, aggregated JSON data
      - Rate limiting enforced
      - All access logged to `api_access_logs` table

  - [ ] **5.6 Story: API Access Logging**

    - **Scope:** Implement comprehensive audit logging for all external API calls
    - **Duration:** 1 day
    - **Dependencies:** 5.5 (endpoint exists)
    - **Files:** `apps/api/app/api/v1/external_api.py` (extend), `apps/api/app/services/external_api_service.py` (extend)
    - **Tech:** SQLAlchemy, FastAPI middleware
    - **Success Criteria:**
      - Every external API request logged: timestamp, api_key_id, endpoint, query_parameters, response_status
      - Logging happens asynchronously (doesn't slow requests)
      - Logs stored in `api_access_logs` table
      - Failed requests (401, 403, 429) also logged

  - [ ] **5.7 Story: OpenAPI Documentation for External API**

    - **Scope:** Enhance OpenAPI docs specifically for external partners
    - **Duration:** 1 day
    - **Dependencies:** 5.5 (endpoint exists)
    - **Files:** `apps/api/app/api/v1/external_api.py` (extend with docstrings)
    - **Tech:** FastAPI OpenAPI generation
    - **Success Criteria:**
      - Endpoint includes comprehensive description, parameter docs, example responses
      - OpenAPI spec accessible at `/openapi.json` includes external-api tag
      - Swagger UI at `/docs` displays external API documentation
      - Authentication requirements clearly documented

  - [ ] **5.8 Story: External API Testing**
    - **Scope:** Test external API service, auth, rate limiting, and endpoints
    - **Duration:** 2 days
    - **Dependencies:** 5.7 (all features complete)
    - **Files:** `apps/api/tests/api/v1/test_external_api.py`, `apps/api/tests/services/test_external_api_service.py`
    - **Tech:** Pytest
    - **Success Criteria:**
      - Backend: Test anonymization logic (no PII leaked)
      - Backend: Test API key authentication (valid, invalid, inactive keys)
      - Backend: Test rate limiting (exceeding limit returns 429)
      - Backend: Test access logging (all requests logged)
      - Backend: Test filtering with various query parameters
      - Backend: Test that in-progress data is excluded
      - All tests pass

