"""
관리자 관련 Pydantic 스키마
"""

from typing import List, Optional
from pydantic import BaseModel

from backend.core.models import User, UserWithPlan, AdminStats, PlanType


class UserListResponse(BaseModel):
    success: bool = True
    data: List[UserWithPlan]
    total: int
    page: int
    page_size: int


class StatsResponse(BaseModel):
    success: bool = True
    data: AdminStats


class PlanUpdateRequest(BaseModel):
    plan_type: PlanType


class AdminStatusUpdateRequest(BaseModel):
    is_admin: bool


class UserResponse(BaseModel):
    success: bool = True
    data: UserWithPlan


class MessageResponse(BaseModel):
    success: bool = True
    message: str

