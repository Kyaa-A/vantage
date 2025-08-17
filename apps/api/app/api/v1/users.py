# 👥 Users API Routes
# Endpoints for user management and user information

import math
from typing import Optional

from app.api import deps
from app.db.models.user import User
from app.schemas.user import User as UserSchema
from app.schemas.user import (
    UserAdminCreate,
    UserAdminUpdate,
    UserListResponse,
    UserUpdate,
)
from app.services.user_service import user_service
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/me", response_model=UserSchema, tags=["users"])
async def get_current_user(current_user: User = Depends(deps.get_current_active_user)):
    """
    Get current user information.

    Returns the profile information of the authenticated user.
    """
    return current_user


@router.put("/me", response_model=UserSchema, tags=["users"])
async def update_current_user(
    user_update: UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Update current user information.

    Allows users to update their own profile information.
    """
    updated_user = user_service.update_user(db, current_user.id, user_update)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return updated_user


@router.get("/", response_model=UserListResponse, tags=["users"])
async def get_users(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    search: Optional[str] = Query(None, description="Search in name and email"),
    role: Optional[str] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
):
    """
    Get paginated list of users with optional filtering.

    Requires admin privileges (System Admin role).
    """
    skip = (page - 1) * size
    users, total = user_service.get_users(
        db, skip=skip, limit=size, search=search, role=role, is_active=is_active
    )

    total_pages = math.ceil(total / size)

    return UserListResponse(
        users=users, total=total, page=page, size=size, total_pages=total_pages
    )


@router.post("/", response_model=UserSchema, tags=["users"])
async def create_user(
    user_create: UserAdminCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    """
    Create a new user.

    Requires admin privileges (System Admin role).
    """
    return user_service.create_user_admin(db, user_create)


@router.get("/{user_id}", response_model=UserSchema, tags=["users"])
async def get_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    """
    Get user by ID.

    Requires admin privileges (System Admin role).
    """
    user = user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


@router.put("/{user_id}", response_model=UserSchema, tags=["users"])
async def update_user(
    user_id: int,
    user_update: UserAdminUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    """
    Update user by ID.

    Requires admin privileges (System Admin role).
    """
    updated_user = user_service.update_user_admin(db, user_id, user_update)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return updated_user


@router.delete("/{user_id}", response_model=UserSchema, tags=["users"])
async def deactivate_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    """
    Deactivate user by ID (soft delete).

    Requires admin privileges (System Admin role).
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    deactivated_user = user_service.deactivate_user(db, user_id)
    if not deactivated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return deactivated_user


@router.post("/{user_id}/activate", response_model=UserSchema, tags=["users"])
async def activate_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    """
    Activate user by ID.

    Requires admin privileges (System Admin role).
    """
    activated_user = user_service.activate_user(db, user_id)
    if not activated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return activated_user


@router.post("/{user_id}/reset-password", response_model=dict, tags=["users"])
async def reset_user_password(
    user_id: int,
    new_password: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    """
    Reset user password.

    Requires admin privileges (System Admin role).
    Sets must_change_password to True.
    """
    reset_user = user_service.reset_password(db, user_id, new_password)
    if not reset_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return {"message": "Password reset successfully"}


@router.get("/stats/dashboard", response_model=dict, tags=["users"])
async def get_user_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
):
    """
    Get user statistics for admin dashboard.

    Requires admin privileges (System Admin role).
    """
    return user_service.get_user_stats(db)
