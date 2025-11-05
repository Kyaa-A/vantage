# 👥 User Service
# Business logic for user management operations

from typing import List, Optional

from app.core.security import get_password_hash, verify_password
from app.db.enums import UserRole
from app.db.models.user import User
from app.schemas.user import UserAdminCreate, UserAdminUpdate, UserCreate, UserUpdate
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session


class UserService:
    """Service class for user management operations."""

    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """Get a user by their ID."""
        return db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get a user by their email address."""
        return db.query(User).filter(User.email == email).first()

    def get_users(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[List[User], int]:
        """
        Get a paginated list of users with optional filtering.

        Returns:
            tuple: (users, total_count)
        """
        query = db.query(User)

        # Apply filters
        if search:
            query = query.filter(
                (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
            )

        if role:
            query = query.filter(User.role == role)

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        # Get total count before pagination
        total = query.count()

        # Apply pagination
        users = query.offset(skip).limit(limit).all()

        return users, total

    def create_user(self, db: Session, user_create: UserCreate) -> User:
        """Create a new user (regular user creation)."""
        # This function is simplified as regular users can't choose complex roles.
        db_user = User(
            email=user_create.email,
            name=user_create.name,
            phone_number=user_create.phone_number,
            role=UserRole.BLGU_USER,  # Enforce default role
            barangay_id=user_create.barangay_id,
            hashed_password=get_password_hash(user_create.password),
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    def create_user_admin(self, db: Session, user_create: UserAdminCreate) -> User:
        """Create a new user with admin privileges (can set all fields)."""
        if self.get_user_by_email(db, user_create.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Business logic for role-specific fields
        if user_create.role == UserRole.VALIDATOR:
            # VALIDATOR role requires validator_area_id
            if not user_create.validator_area_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Governance area is required for Validator role.",
                )
            # Ensure barangay_id is null for validators
            user_create.barangay_id = None
        elif user_create.role == UserRole.BLGU_USER:
            # BLGU_USER role requires barangay_id
            if not user_create.barangay_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Barangay is required for BLGU User role.",
                )
            # Ensure validator_area_id is null for BLGU users
            user_create.validator_area_id = None
        elif user_create.role in (UserRole.ASSESSOR, UserRole.MLGOO_DILG):
            # ASSESSOR and MLGOO_DILG roles should not have any assignments
            user_create.validator_area_id = None
            user_create.barangay_id = None

        db_user = User(
            **user_create.model_dump(exclude={"password"}),
            hashed_password=get_password_hash(user_create.password),
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    def update_user(
        self, db: Session, user_id: int, user_update: UserUpdate
    ) -> Optional[User]:
        """Update user information (regular user update)."""
        db_user = self.get_user_by_id(db, user_id)
        if not db_user:
            return None

        # Check email uniqueness if email is being updated
        if user_update.email and user_update.email != db_user.email:
            if self.get_user_by_email(db, user_update.email):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )

        # Update fields that are provided
        update_data = user_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)

        db.commit()
        db.refresh(db_user)
        return db_user

    def update_user_admin(
        self, db: Session, user_id: int, user_update: UserAdminUpdate
    ) -> Optional[User]:
        """Update user information with admin privileges (can update all fields)."""
        db_user = self.get_user_by_id(db, user_id)
        if not db_user:
            return None

        update_data = user_update.model_dump(exclude_unset=True)

        # Business logic for role-specific fields
        role = update_data.get("role", db_user.role)

        if role == UserRole.VALIDATOR:
            # VALIDATOR role requires validator_area_id
            if (
                "validator_area_id" not in update_data
                and db_user.validator_area_id is None
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Governance area is required for Validator role.",
                )
            # Ensure barangay_id is set to null if role is changed to Validator
            update_data["barangay_id"] = None
        elif role == UserRole.BLGU_USER:
            # BLGU_USER role requires barangay_id
            if "barangay_id" not in update_data and db_user.barangay_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Barangay is required for BLGU User role.",
                )
            # Ensure validator_area_id is set to null for BLGU users
            update_data["validator_area_id"] = None
        elif role in (UserRole.ASSESSOR, UserRole.MLGOO_DILG):
            # ASSESSOR and MLGOO_DILG roles should not have any assignments
            update_data["validator_area_id"] = None
            update_data["barangay_id"] = None

        # Check email uniqueness if email is being updated
        if "email" in update_data and update_data["email"] != db_user.email:
            if self.get_user_by_email(db, update_data["email"]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )

        for field, value in update_data.items():
            setattr(db_user, field, value)

        db.commit()
        db.refresh(db_user)
        return db_user

    def deactivate_user(self, db: Session, user_id: int) -> Optional[User]:
        """Deactivate a user (soft delete)."""
        db_user = self.get_user_by_id(db, user_id)
        if not db_user:
            return None

        setattr(db_user, "is_active", False)
        db.commit()
        db.refresh(db_user)
        return db_user

    def activate_user(self, db: Session, user_id: int) -> Optional[User]:
        """Activate a user."""
        db_user = self.get_user_by_id(db, user_id)
        if not db_user:
            return None

        setattr(db_user, "is_active", True)
        db.commit()
        db.refresh(db_user)
        return db_user

    def change_password(
        self, db: Session, user_id: int, current_password: str, new_password: str
    ) -> bool:
        """Change user password after verifying current password."""
        db_user = self.get_user_by_id(db, user_id)
        if not db_user:
            return False

        # Verify current password
        if not verify_password(current_password, str(db_user.hashed_password)):
            return False

        # Update password
        setattr(db_user, "hashed_password", get_password_hash(new_password))
        setattr(db_user, "must_change_password", False)
        db.commit()
        return True

    def reset_password(
        self, db: Session, user_id: int, new_password: str
    ) -> Optional[User]:
        """Reset user password (admin function)."""
        db_user = self.get_user_by_id(db, user_id)
        if not db_user:
            return None

        setattr(db_user, "hashed_password", get_password_hash(new_password))
        setattr(db_user, "must_change_password", True)
        db.commit()
        db.refresh(db_user)
        return db_user

    def get_user_stats(self, db: Session) -> dict:
        """Get user statistics for admin dashboard."""
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active).count()
        inactive_users = total_users - active_users
        users_need_password_change = (
            db.query(User).filter(User.must_change_password, User.is_active).count()
        )

        # Users by role
        role_stats = db.query(User.role, func.count(User.id)).group_by(User.role).all()  # type: ignore

        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": inactive_users,
            "users_need_password_change": users_need_password_change,
            "users_by_role": {role: count for role, count in role_stats},
        }


# Create service instance
user_service = UserService()
