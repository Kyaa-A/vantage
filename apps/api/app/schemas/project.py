# 📁 Project Schemas
# Pydantic models for project-related API requests and responses

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List


class ProjectBase(BaseModel):
    """Base project fields."""
    name: str
    description: str


class ProjectCreate(ProjectBase):
    """Schema for creating a new project."""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""
    name: str | None = None
    description: str | None = None


class Project(ProjectBase):
    """Project response model for API endpoints."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    owner_id: str
    created_at: datetime


class ProjectList(BaseModel):
    """Schema for project list response."""
    projects: List[Project]
    total: int 