"""
Fixtures for integration tests.
"""

import pytest
from sqlalchemy.orm import Session

from app.db.models.governance_area import GovernanceArea
from app.db.enums import AreaType


@pytest.fixture
def governance_area(db_session: Session):
    """Create a governance area for integration tests."""
    area = GovernanceArea(
        name="Test Governance Area",
        area_type=AreaType.CORE,
    )
    db_session.add(area)
    db_session.commit()
    db_session.refresh(area)
    return area
