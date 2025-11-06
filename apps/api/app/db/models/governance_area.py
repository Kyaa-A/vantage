# 🏛️ Governance Area Database Model
# SQLAlchemy model for the governance_areas table

from datetime import datetime

from app.db.base import Base
from app.db.enums import AreaType
from sqlalchemy import JSON, Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint, func
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

    Versioning Support:
    - version: Tracks the current version number of the indicator
    - When schemas are modified, a new version is created and old version is archived
    - Historical versions are stored in indicators_history table
    """

    __tablename__ = "indicators"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Indicator information
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)

    # Versioning field
    version: Mapped[int] = mapped_column(nullable=False, default=1)

    # Active status (for soft delete)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)

    # Auto-calculable flag - determines if Pass/Fail is calculated automatically
    is_auto_calculable: Mapped[bool] = mapped_column(nullable=False, default=False)

    # Profiling-only flag (existing field retained for compatibility)
    is_profiling_only: Mapped[bool] = mapped_column(nullable=False, default=False)

    # Dynamic form schema stored as JSON (existing field, now nullable for migration)
    form_schema: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Calculation schema for automatic Pass/Fail determination
    calculation_schema: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Remark schema for generating human-readable status summaries
    remark_schema: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Technical notes (plain text for backward compatibility)
    technical_notes_text: Mapped[str | None] = mapped_column(String, nullable=True)

    # Foreign key to governance area
    governance_area_id: Mapped[int] = mapped_column(
        ForeignKey("governance_areas.id"), nullable=False
    )

    # Self-referencing hierarchy
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("indicators.id"), nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())

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
    history = relationship("IndicatorHistory", back_populates="indicator")


class IndicatorHistory(Base):
    """
    IndicatorHistory table model for database storage.

    Stores historical versions of indicators to maintain data integrity.
    When an indicator's schemas are modified, the old version is archived here
    to ensure existing assessments continue to reference the correct schema version.
    """

    __tablename__ = "indicators_history"
    __table_args__ = (
        UniqueConstraint('indicator_id', 'version', name='uq_indicator_version'),
    )

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign key to the current indicator
    indicator_id: Mapped[int] = mapped_column(
        ForeignKey("indicators.id"), nullable=False, index=True
    )

    # Version number of this archived indicator
    version: Mapped[int] = mapped_column(nullable=False)

    # Indicator information (snapshot at time of archival)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)

    # Active status at time of archival
    is_active: Mapped[bool] = mapped_column(nullable=False)

    # Auto-calculable flag
    is_auto_calculable: Mapped[bool] = mapped_column(nullable=False)

    # Profiling-only flag
    is_profiling_only: Mapped[bool] = mapped_column(nullable=False)

    # Archived schema snapshots (JSONB fields)
    form_schema: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    calculation_schema: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    remark_schema: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    technical_notes_text: Mapped[str | None] = mapped_column(String, nullable=True)

    # Foreign keys preserved from original indicator
    governance_area_id: Mapped[int] = mapped_column(nullable=False)
    parent_id: Mapped[int | None] = mapped_column(nullable=True)

    # Original timestamps from indicator
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Archive metadata
    archived_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    archived_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    # Relationships
    indicator = relationship("Indicator", back_populates="history")
    archived_by_user = relationship("User", foreign_keys=[archived_by])
