# 📋 Assessment Database Models
# SQLAlchemy models for assessment-related tables

from datetime import datetime

from app.db.base import Base
from app.db.enums import AssessmentStatus, ComplianceStatus, MOVStatus, ValidationStatus
from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Assessment(Base):
    """
    Assessment table model for database storage.

    Represents a complete assessment instance for a BLGU user.
    Tracks the overall status and progress of the assessment.
    """

    __tablename__ = "assessments"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Assessment information
    status: Mapped[AssessmentStatus] = mapped_column(
        Enum(AssessmentStatus, name="assessment_status_enum", create_constraint=True),
        nullable=False,
        default=AssessmentStatus.DRAFT,
    )

    # Rework tracking
    rework_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Intelligence layer fields
    final_compliance_status: Mapped[ComplianceStatus | None] = mapped_column(
        Enum(ComplianceStatus, name="compliance_status_enum", create_constraint=True),
        nullable=True,
    )
    area_results: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_recommendations: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Foreign key to BLGU user
    blgu_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    validated_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Relationships
    blgu_user = relationship("User", back_populates="assessments")
    responses = relationship(
        "AssessmentResponse", back_populates="assessment", cascade="all, delete-orphan"
    )
    bbi_results = relationship(
        "BBIResult", back_populates="assessment", cascade="all, delete-orphan"
    )


class AssessmentResponse(Base):
    """
    AssessmentResponse table model for database storage.

    Represents a BLGU user's response to a specific indicator.
    Stores dynamic form data and tracks completion status.
    """

    __tablename__ = "assessment_responses"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Dynamic form data stored as JSON
    response_data: Mapped[dict] = mapped_column(JSON, nullable=True)

    # Completion status
    is_completed: Mapped[bool] = mapped_column(default=False, nullable=False)
    requires_rework: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Validation status (set by assessor)
    validation_status: Mapped[ValidationStatus] = mapped_column(
        Enum(ValidationStatus, name="validation_status_enum", create_constraint=True),
        nullable=True,
    )

    # Generated remark (from remark_schema template)
    generated_remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Foreign keys
    assessment_id: Mapped[int] = mapped_column(
        ForeignKey("assessments.id"), nullable=False
    )
    indicator_id: Mapped[int] = mapped_column(
        ForeignKey("indicators.id"), nullable=False
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    assessment = relationship("Assessment", back_populates="responses")
    indicator = relationship("Indicator", back_populates="responses")
    movs = relationship("MOV", back_populates="response", cascade="all, delete-orphan")
    feedback_comments = relationship(
        "FeedbackComment", back_populates="response", cascade="all, delete-orphan"
    )


class MOV(Base):
    """
    MOV (Means of Verification) table model for database storage.

    Represents uploaded files that serve as evidence for assessment responses.
    """

    __tablename__ = "movs"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # File information
    filename: Mapped[str] = mapped_column(String, nullable=False)
    original_filename: Mapped[str] = mapped_column(String, nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    content_type: Mapped[str] = mapped_column(String, nullable=False)

    # Supabase storage path
    storage_path: Mapped[str] = mapped_column(String, nullable=False)

    # File status
    status: Mapped[MOVStatus] = mapped_column(
        Enum(MOVStatus, name="mov_status_enum", create_constraint=True),
        nullable=False,
        default=MOVStatus.UPLOADED,
    )

    # Foreign key to assessment response
    response_id: Mapped[int] = mapped_column(
        ForeignKey("assessment_responses.id"), nullable=False
    )

    # Timestamps
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    # Relationships
    response = relationship("AssessmentResponse", back_populates="movs")


class FeedbackComment(Base):
    """
    FeedbackComment table model for database storage.

    Represents assessor feedback on specific assessment responses.
    Used for rework workflow and communication.
    """

    __tablename__ = "feedback_comments"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Comment content
    comment: Mapped[str] = mapped_column(Text, nullable=False)

    # Comment type (general feedback, specific issue, etc.)
    comment_type: Mapped[str] = mapped_column(String, nullable=False, default="general")

    # Internal note flag - distinguishes internal assessor notes from public feedback
    is_internal_note: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    # Foreign keys
    response_id: Mapped[int] = mapped_column(
        ForeignKey("assessment_responses.id"), nullable=False
    )
    assessor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    # Relationships
    response = relationship("AssessmentResponse", back_populates="feedback_comments")
    assessor = relationship("User", back_populates="feedback_comments")
