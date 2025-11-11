# 🔐 Authentication API Routes
# Endpoints for user authentication and authorization

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.security import verify_password, create_access_token, get_password_hash
from app.db.models.user import User
from app.schemas.token import LoginRequest, AuthToken, ChangePasswordRequest
from app.schemas.system import ApiResponse

router = APIRouter()


@router.post("/login", response_model=AuthToken, tags=["auth"])
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint - authenticate user and return JWT token.

    This endpoint:
    1. Validates user credentials against the database
    2. Checks if the user account is active
    3. Generates a secure JWT token
    4. Returns token with expiration info
    """
    # Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()

    # Check if user exists and password is correct
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account"
        )

    # Set token expiration based on remember_me flag
    from datetime import timedelta
    if login_data.remember_me:
        expires_delta = timedelta(days=30)  # 30 days for remember me
        expires_in_seconds = 60 * 60 * 24 * 30  # 30 days in seconds
    else:
        expires_delta = None  # Use default from settings (typically 7 days)
        expires_in_seconds = 60 * 60 * 24 * 7  # 7 days in seconds

    # Generate JWT token with user data
    access_token = create_access_token(
        subject=user.id,
        role=user.role,
        must_change_password=user.must_change_password,
        expires_delta=expires_delta
    )

    return AuthToken(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in_seconds,
    )


@router.post(
    "/change-password",
    response_model=ApiResponse,
    tags=["auth"],
)
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Change user password endpoint.

    This endpoint:
    1. Verifies the current password
    2. Updates the user's password
    3. Sets must_change_password to False
    4. Returns success message
    """
    # Verify current password
    if not verify_password(
        password_data.current_password, current_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password"
        )

    # Update password and reset must_change_password flag
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.must_change_password = False

    # Save changes to database
    db.commit()
    db.refresh(current_user)

    return ApiResponse(message="Password changed successfully")


@router.post("/logout", response_model=ApiResponse, tags=["auth"])
async def logout():
    """
    Logout endpoint - invalidate user session.

    In production, this will:
    1. Blacklist the JWT token
    2. Clear any session data
    3. Log the logout event
    """
    # TODO: Implement proper logout logic
    # - Add token to blacklist/revocation list
    # - Clear Redis session if using sessions
    # - Log security event

    return ApiResponse(message="Successfully logged out")
