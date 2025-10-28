# 🗄️ Database Base Configuration
# Supabase client, SQLAlchemy engine, session management, and base models

import logging
from typing import Any, Dict, Generator

from app.core.config import settings
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from supabase import Client, create_client

# Setup logging
logger = logging.getLogger(__name__)

# Supabase client for real-time features, auth, and storage
# Initialize only if credentials are provided
supabase: Client | None = None
try:
    if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    else:
        logger.warning("Supabase client not configured (missing URL or ANON_KEY)")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {str(e)}")
    supabase = None

# Admin Supabase client for server-side operations
supabase_admin: Client | None = None
try:
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        supabase_admin = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
        )
    else:
        logger.warning(
            "Supabase admin client not configured (missing URL or SERVICE_ROLE_KEY)"
        )
except Exception as e:
    logger.error(f"Failed to initialize Supabase admin client: {str(e)}")
    supabase_admin = None

# SQLAlchemy engine for direct database operations
engine = None
SessionLocal = None

if settings.DATABASE_URL:
    # Create database engine with Supabase PostgreSQL
    engine = create_engine(
        settings.DATABASE_URL,
        # Connection pool settings optimized for Supabase
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20,
        # Supabase specific connection parameters
        connect_args={
            "options": "-c timezone=utc",
            "sslmode": "require",
        },
    )

    # Create session factory
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Database session generator for SQLAlchemy operations.
    Creates a new session for each request and ensures it's properly closed.

    Yields:
        Session: SQLAlchemy database session
    """
    if not SessionLocal:
        raise RuntimeError(
            "Database not configured. Please set DATABASE_URL in environment variables."
        )

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_supabase() -> Client:
    """
    Get Supabase client for real-time operations, auth, and storage.

    Returns:
        Client: Supabase client instance

    Raises:
        RuntimeError: If Supabase client is not configured
    """
    if supabase is None:
        raise RuntimeError(
            "Supabase client not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY."
        )
    return supabase


def get_supabase_admin() -> Client:
    """
    Get Supabase admin client for server-side operations.

    Returns:
        Client: Supabase admin client instance

    Raises:
        RuntimeError: If service role key is not configured
    """
    if not supabase_admin:
        raise RuntimeError(
            "Supabase admin client not configured. Please set SUPABASE_SERVICE_ROLE_KEY."
        )

    return supabase_admin


# 🔍 Database Connectivity Checks


async def check_database_connection() -> Dict[str, Any]:
    """
    Check SQLAlchemy database connection health.

    Returns:
        Dict containing connection status and details
    """
    if not engine:
        return {
            "connected": False,
            "error": "Database engine not configured",
            "details": "DATABASE_URL not set in environment variables",
        }

    try:
        # Test connection with a simple query
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1 as test"))
            test_value = result.scalar()

            if test_value == 1:
                return {
                    "connected": True,
                    "database": "PostgreSQL (via SQLAlchemy)",
                    "status": "healthy",
                }
            else:
                return {
                    "connected": False,
                    "error": "Database query returned unexpected result",
                    "details": f"Expected 1, got {test_value}",
                }

    except Exception as e:
        logger.error(f"Database connection check failed: {str(e)}")
        return {
            "connected": False,
            "error": "Database connection failed",
            "details": str(e),
        }


async def check_supabase_connection() -> Dict[str, Any]:
    """
    Check Supabase client connection health.

    Returns:
        Dict containing connection status and details
    """
    if supabase is None:
        return {
            "connected": False,
            "error": "Supabase not configured",
            "details": "SUPABASE_URL or SUPABASE_ANON_KEY not set or initialization failed",
        }

    try:
        # Test Supabase connection by checking auth status
        # This is a lightweight check that doesn't require authentication
        supabase.auth.get_session()

        return {
            "connected": True,
            "service": "Supabase",
            "status": "healthy",
            "url": settings.SUPABASE_URL,
        }

    except Exception as e:
        logger.error(f"Supabase connection check failed: {str(e)}")
        return {
            "connected": False,
            "error": "Supabase connection failed",
            "details": str(e),
        }


async def check_all_connections() -> Dict[str, Any]:
    """
    Check all database connections (SQLAlchemy + Supabase).

    Returns:
        Dict containing overall status and individual connection details
    """
    db_check = await check_database_connection()
    supabase_check = await check_supabase_connection()

    overall_healthy = db_check.get("connected", False) and supabase_check.get(
        "connected", False
    )

    return {
        "overall_status": "healthy" if overall_healthy else "unhealthy",
        "database": db_check,
        "supabase": supabase_check,
        "timestamp": None,  # Will be set by caller
    }


async def validate_connections_startup(require_all: bool = True) -> None:
    """
    Validates database connections during application startup.
    Raises a clear exception if connections fail based on requirements.

    Args:
        require_all: If True, both PostgreSQL and Supabase connections must succeed.
                    If False, at least one connection must succeed.

    Raises:
        RuntimeError: If database connections fail according to requirements
    """
    connection_status = await check_all_connections()

    # Collect error messages for failed connections
    errors = []
    success_messages = []

    # Check database connection
    if not connection_status["database"]["connected"]:
        db_error = connection_status["database"].get("error", "Unknown error")
        db_details = connection_status["database"].get("details", "No details provided")
        errors.append(f"PostgreSQL connection failed: {db_error} ({db_details})")
    else:
        success_messages.append("PostgreSQL connection: Successful")

    # Check Supabase connection
    if not connection_status["supabase"]["connected"]:
        supabase_error = connection_status["supabase"].get("error", "Unknown error")
        supabase_details = connection_status["supabase"].get(
            "details", "No details provided"
        )
        errors.append(
            f"Supabase connection failed: {supabase_error} ({supabase_details})"
        )
    else:
        success_messages.append("Supabase connection: Successful")

    # Check if we should fail startup based on requirements
    should_fail = False
    if require_all:
        # Fail if ANY connection failed
        should_fail = len(errors) > 0
    else:
        # Fail only if ALL connections failed
        should_fail = len(success_messages) == 0

    # If validation failed, raise an exception with detailed error message
    if should_fail:
        error_message = "🚨 Failed to start application due to connection errors:\n\n"

        if require_all:
            error_message += "All connections are required but the following failed:\n"
        else:
            error_message += "At least one connection is required but all failed:\n"

        error_message += "- " + "\n- ".join(errors) + "\n\n"

        # Include information about successful connections if any
        if success_messages:
            error_message += "Successful connections:\n- " + "\n- ".join(
                success_messages
            )

        error_message += (
            "\n\nPlease check your database configuration and connection settings."
        )

        raise RuntimeError(error_message)
