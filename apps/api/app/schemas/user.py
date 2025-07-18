# 👥 User Schemas
# Pydantic models for user-related API requests and responses

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class User(BaseModel):
    """User response model for API endpoints."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    email: str
    name: str
    role: str
    phone_number: Optional[str] = None
    barangay_id: Optional[int] = None
    is_active: bool
    must_change_password: bool
    created_at: datetime


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    email: str
    name: str
    password: str
    role: str = "BLGU User"
    phone_number: Optional[str] = None
    barangay_id: Optional[int] = None
    is_active: bool = True
    must_change_password: bool = True


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    phone_number: Optional[str] = None
    barangay_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserAdminCreate(BaseModel):
    """Schema for admin creating a new user with all permissions."""
    email: str
    name: str
    password: str
    role: str = "BLGU User"
    phone_number: Optional[str] = None
    barangay_id: Optional[int] = None
    is_active: bool = True
    is_superuser: bool = False
    must_change_password: bool = True


class UserAdminUpdate(BaseModel):
    """Schema for admin updating user information with all permissions."""
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    phone_number: Optional[str] = None
    barangay_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    must_change_password: Optional[bool] = None


class UserListResponse(BaseModel):
    """Schema for paginated user list response."""
    model_config = ConfigDict(from_attributes=True)
    
    users: list[User]
    total: int
    page: int
    size: int
    total_pages: int


class UserInDB(User):
    """User model as stored in database (includes sensitive fields)."""
    hashed_password: str
    is_superuser: bool = False
    updated_at: Optional[datetime] = None 