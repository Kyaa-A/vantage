# 🏛️ Schemas for Lookup Tables
# Pydantic models for representing data from lookup tables like
# governance areas and barangays in API responses.

from pydantic import BaseModel
from app.db.enums import AreaType


# --- Governance Area Schemas ---

class GovernanceAreaBase(BaseModel):
    """Base schema for a governance area, containing common attributes."""
    name: str
    area_type: AreaType


class GovernanceArea(GovernanceAreaBase):
    """
    Full schema for a governance area, including its database ID.
    Used for API responses.
    """
    id: int

    class Config:
        """Pydantic configuration to allow ORM model mapping."""
        from_attributes = True


# --- Barangay Schemas ---

class BarangayBase(BaseModel):
    """Base schema for a barangay."""
    name: str


class Barangay(BarangayBase):
    """
    Full schema for a barangay, including its database ID.
    Used for API responses.
    """
    id: int

    class Config:
        """Pydantic configuration to allow ORM model mapping."""
        from_attributes = True 