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


# Security Management Schemas

class BlacklistEntry(BaseModel):
    """IP 블랙리스트 항목"""
    id: str
    ip_address: str
    reason: str
    blocked_at: str
    expires_at: Optional[str] = None
    violation_count: int
    last_violation_at: str
    is_permanent: bool


class BlacklistResponse(BaseModel):
    success: bool = True
    data: List[BlacklistEntry]
    total: int


class AddBlacklistRequest(BaseModel):
    ip_address: str
    reason: str
    duration_hours: Optional[int] = 24
    is_permanent: bool = False


class SecurityStats(BaseModel):
    """보안 통계"""
    total_blocked_ips: int
    total_violations: int
    active_monitoring_ips: int
    cache_size: int


class SecurityStatsResponse(BaseModel):
    success: bool = True
    data: SecurityStats
