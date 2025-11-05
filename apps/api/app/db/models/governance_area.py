# 🏛️ Governance Area Database Model
# SQLAlchemy model for the governance_areas table

from app.db.base import Base
from app.db.enums import AreaType
from sqlalchemy import JSON, Column, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional


class GovernanceArea(Base):
    """
    Governance Area table model for database storage.

    Represents the SGLGB governance areas that Validators can be assigned to.
    Each area has a type: Core or Essential
    """

    __tablename__ = "governance_areas"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Area information
    name = Column(String, nullable=False, unique=True)
    area_type = Column(
        Enum(AreaType, name="area_type_enum", create_constraint=True), nullable=False
    )

    # Relationships
    validators = relationship("User", back_populates="validator_area")
    indicators = relationship("Indicator", back_populates="governance_area")


class Indicator(Base):
    """
    Indicator table model for database storage.

    Represents assessment indicators within governance areas.
    Each indicator has a dynamic form schema that defines the input fields.
    """

    __tablename__ = "indicators"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Indicator information
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)

    # Dynamic form schema stored as JSON
    form_schema: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Foreign key to governance area
    governance_area_id: Mapped[int] = mapped_column(
        ForeignKey("governance_areas.id"), nullable=False
    )

    # Self-referencing hierarchy
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("indicators.id"), nullable=True
    )

    # Relationships
    governance_area = relationship("GovernanceArea", back_populates="indicators")
    responses = relationship("AssessmentResponse", back_populates="indicator")
    parent: Mapped[Optional["Indicator"]] = relationship(
        "Indicator",
        remote_side="Indicator.id",
        back_populates="children",
    )
    children: Mapped[list["Indicator"]] = relationship(
        "Indicator",
        back_populates="parent",
        cascade="all, delete-orphan",
    )
