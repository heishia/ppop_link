"""
관리자 API 라우터
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query

from backend.core.models import User
from backend.core.exceptions import AdminRequiredError
from backend.auth.router import get_current_user
from backend.admin.schemas import (
    UserListResponse,
    StatsResponse,
    PlanUpdateRequest,
    AdminStatusUpdateRequest,
    UserResponse
)
from backend.admin.service import admin_service

router = APIRouter()


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise AdminRequiredError()
    return current_user


@router.get("/users", response_model=UserListResponse)
async def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    admin: User = Depends(get_admin_user)
):
    users, total = await admin_service.get_users(page, page_size, search)
    return UserListResponse(
        data=users,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/stats", response_model=StatsResponse)
async def get_stats(admin: User = Depends(get_admin_user)):
    stats = await admin_service.get_stats()
    return StatsResponse(data=stats)


@router.put("/users/{user_id}/plan", response_model=UserResponse)
async def update_user_plan(
    user_id: UUID,
    request: PlanUpdateRequest,
    admin: User = Depends(get_admin_user)
):
    user = await admin_service.update_user_plan(user_id, request.plan_type)
    return UserResponse(data=user)


@router.put("/users/{user_id}/admin", response_model=UserResponse)
async def update_admin_status(
    user_id: UUID,
    request: AdminStatusUpdateRequest,
    admin: User = Depends(get_admin_user)
):
    """
    사용자의 관리자 권한 설정
    
    Note: 슈퍼 관리자만 다른 사용자의 관리자 권한을 변경할 수 있습니다.
    """
    user = await admin_service.update_admin_status(user_id, request.is_admin)
    return UserResponse(data=user)

