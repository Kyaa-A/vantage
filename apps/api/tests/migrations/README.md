# Database Migration Tests

This directory contains tests for Alembic database migrations.

## Test Files

- `test_all_migrations.py`: Tests that all migrations can be applied and rolled back
- `test_fresh_db.py`: Tests migrations on a fresh database
- `test_migration_cycle.py`: Tests upgrade/downgrade cycles
- `test_data_integrity.py`: Tests data preservation during migrations
- `test_orphaned_objects.py`: Tests for orphaned database objects
- `test_migration_dependencies.py`: Tests migration dependency graph

## Running Migration Tests

```bash
cd apps/api
pytest tests/migrations/ -v
```

## Prerequisites

- PostgreSQL test database configured
- Alembic migrations exist in `alembic/versions/`
- Database connection string in `.env`

## Test Strategy

1. **Forward Migration**: Apply all migrations from base to head
2. **Backward Migration**: Downgrade from head back to base
3. **Fresh Database**: Apply migrations on empty database
4. **Data Integrity**: Verify data preserved during migrations
5. **Dependency Validation**: Check migration revision graph
