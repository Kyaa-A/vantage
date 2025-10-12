# 👥 User Database Model
# SQLAlchemy model for the users table

from datetime import datetime

from app.db.base import Base
from app.db.enums import UserRole
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
)
from sqlalchemy.orm import relationship


class User(Base):
    """
    User table model for database storage.

    This represents the actual database table structure,
    not the API request/response format.
    """

    __tablename__ = "users"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # User information
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    role = Column(
        Enum(UserRole, name="user_role_enum", create_constraint=True),
        nullable=False,
        default=UserRole.BLGU_USER,
    )
    governance_area_id = Column(
        SmallInteger, ForeignKey("governance_areas.id"), nullable=True
    )  # Reference to governance_areas.id for Area Assessors
    barangay_id = Column(Integer, ForeignKey("barangays.id"), nullable=True)

    # Authentication
    hashed_password = Column(String, nullable=False)
    must_change_password = Column(Boolean, default=True, nullable=False)

    # User status
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    barangay = relationship("Barangay", back_populates="users")
    governance_area = relationship("GovernanceArea", back_populates="assessors")
    assessments = relationship("Assessment", back_populates="blgu_user")
    feedback_comments = relationship("FeedbackComment", back_populates="assessor")
