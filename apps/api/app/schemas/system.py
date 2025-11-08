# 🔧 System Schemas
# Pydantic models for system-level API responses

from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any


class ApiResponse(BaseModel):
    """Generic API response schema."""

    message: str


class HealthCheck(BaseModel):
    """Health check response schema."""

    status: str
    timestamp: datetime
    api: Dict[str, Any]
    connections: Dict[str, Any]
    checks: Dict[str, Any]


class ErrorResponse(BaseModel):
    """Error response schema."""

    error: str
    detail: str | None = None


class SuccessResponse(BaseModel):
    """Success response schema."""

    success: bool = True
    message: str


class ValidationResult(BaseModel):
    """
    File validation result schema.

    Used by FileValidationService to return validation results
    with success status, error messages, and error codes.
    """

    success: bool
    error_message: str | None = None
    error_code: str | None = None
