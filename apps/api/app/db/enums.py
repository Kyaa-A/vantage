# 🎯 Database Enums
# Python enums for database fields to improve type safety and code readability

import enum


class UserRole(str, enum.Enum):
    """
    Enum for user roles.

    Using a string-based enum improves readability and maintainability.

    Roles:
    - MLGOO_DILG: Admin/Chairman role with system-wide access (enum value 0 in DB)
    - ASSESSOR: Assessor role with arbitrary barangay selection (enum value 1 in DB)
    - VALIDATOR: Validator role with governance area specialization (enum value 2 in DB)
    - BLGU_USER: BLGU user role with specific barangay assignment (enum value 3 in DB)
    """

    MLGOO_DILG = "MLGOO_DILG"
    ASSESSOR = "ASSESSOR"
    VALIDATOR = "VALIDATOR"
    BLGU_USER = "BLGU_USER"


class AreaType(str, enum.Enum):
    """
    Enum for the type of governance area (Core or Essential).
    """

    CORE = "Core"
    ESSENTIAL = "Essential"


class AssessmentStatus(str, enum.Enum):
    """
    Enum for assessment status throughout the workflow.
    """

    DRAFT = "Draft"
    SUBMITTED_FOR_REVIEW = "Submitted for Review"
    VALIDATED = "Validated"
    NEEDS_REWORK = "Needs Rework"


class MOVStatus(str, enum.Enum):
    """
    Enum for MOV (Means of Verification) file status.
    """

    PENDING = "Pending"
    UPLOADED = "Uploaded"
    DELETED = "Deleted"


class ValidationStatus(str, enum.Enum):
    """
    Enum for individual assessment response validation status.
    """

    PASS = "Pass"
    FAIL = "Fail"
    CONDITIONAL = "Conditional"


class ComplianceStatus(str, enum.Enum):
    """
    Enum for final SGLGB compliance status of an assessment.
    """

    PASSED = "Passed"
    FAILED = "Failed"
