# 🚀 API v1 Package
# Version 1 of the VANTAGE API endpoints 

# 📋 API V1 Router
# Combines all individual routers into a single V1 API router

# 📦 Imports
from fastapi import APIRouter

from . import auth, users, system, lookups

# Create the main API router for V1
api_router = APIRouter()

# Include all individual routers with their prefixes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(system.router, prefix="/system", tags=["system"]) 
api_router.include_router(lookups.router, prefix="/lookups", tags=["lookups"]) 