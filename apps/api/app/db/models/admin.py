# 🔒 Administrative Features Database Models
# SQLAlchemy models for admin-specific tables (audit logs, assessment cycles, BBI, etc.)

from datetime import datetime

from app.db.base import Base
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship


class AuditLog(Base):
    """
    Audit log table for tracking all administrative actions.

    This table maintains a comprehensive audit trail of all changes
    made by MLGOO-DILG users to indicators, BBIs, deadlines, and
    other administrative configurations.
    """

    __tablename__ = "audit_logs"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Who made the change
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # What entity was changed
    entity_type = Column(
        String(50), nullable=False, index=True
    )  # e.g., "indicator", "bbi", "deadline_override"
    entity_id = Column(
        Integer, nullable=True, index=True
    )  # FK to the entity (may be null for bulk operations)

    # What action was performed
    action = Column(
        String(50), nullable=False
    )  # e.g., "create", "update", "delete", "deactivate"

    # What changed (JSON diff of before/after states)
    # Use JSON.with_variant() to support both PostgreSQL (JSONB) and SQLite (JSON)
    changes = Column(
        JSON().with_variant(JSONB(astext_type=Text), "postgresql"),
        nullable=True
    )  # Store structured change data: {"field": {"before": X, "after": Y}}

    # Request metadata
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6

    # Timestamp
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User")

    # Composite indexes for efficient queries
    __table_args__ = (
        Index('ix_audit_logs_created_at_desc', created_at.desc()),  # For time-based sorting
        Index('ix_audit_logs_entity_lookup', entity_type, entity_id),  # For entity-specific queries
    )

    def __repr__(self):
        return f"<AuditLog(id={self.id}, user_id={self.user_id}, entity_type='{self.entity_type}', action='{self.action}')>"
