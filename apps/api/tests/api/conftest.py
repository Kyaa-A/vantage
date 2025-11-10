"""
API Test Fixtures
Provides fixtures for API endpoint testing
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


@pytest.fixture(autouse=True)
def override_db_dependency(client: TestClient, db_session: Session):
    """
    Automatically override the database dependency for all API tests.
    This ensures that API endpoints use the same database session as test fixtures.
    """
    from app.api.deps import get_db

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    client.app.dependency_overrides[get_db] = _override_get_db

    yield

    # Clean up after test
    client.app.dependency_overrides.clear()
