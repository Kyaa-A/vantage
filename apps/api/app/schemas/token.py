# 🔐 Token & Authentication Schemas
# Pydantic models for authentication-related API requests and responses

from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Schema for user login request."""

    email: str
    password: str
    remember_me: bool = False


class AuthToken(BaseModel):
    """Schema for authentication token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int


class Token(BaseModel):
    """Standard token response schema."""

    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    """Schema for token payload data."""

    sub: str | None = None
    user_id: str | None = None
    role: str | None = None
    must_change_password: bool | None = None


class ChangePasswordRequest(BaseModel):
    """Schema for password change request."""

    current_password: str
    new_password: str
