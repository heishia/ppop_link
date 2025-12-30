"""
관리자 API 라우터
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query

from backend.core.models import User, UserWithAuth
from backend.core.exceptions import AdminRequiredError
from backend.auth.router import get_current_user_with_auth
from backend.admin.schemas import (
    UserListResponse,
    StatsResponse,
    PlanUpdateRequest,
    AdminStatusUpdateRequest,
    UserResponse,
    BlacklistResponse,
    AddBlacklistRequest,
    MessageResponse,
    SecurityStatsResponse,
    SecurityStats,
    BlacklistEntry
)
from backend.admin.service import admin_service
from backend.core.security_service import security_service

router = APIRouter()


async def get_admin_user(current_user: UserWithAuth = Depends(get_current_user_with_auth)) -> UserWithAuth:
    """관리자 권한 확인 (JWT 기반)"""
    if not current_user.is_admin:
        raise AdminRequiredError()
    return current_user


@router.get("/users", response_model=UserListResponse)
async def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    admin: UserWithAuth = Depends(get_admin_user)
):
    users, total = await admin_service.get_users(page, page_size, search)
    return UserListResponse(
        data=users,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/stats", response_model=StatsResponse)
async def get_stats(admin: UserWithAuth = Depends(get_admin_user)):
    stats = await admin_service.get_stats()
    return StatsResponse(data=stats)


@router.put("/users/{user_id}/plan", response_model=UserResponse)
async def update_user_plan(
    user_id: UUID,
    request: PlanUpdateRequest,
    admin: UserWithAuth = Depends(get_admin_user)
):
    user = await admin_service.update_user_plan(user_id, request.plan_type)
    return UserResponse(data=user)


@router.put("/users/{user_id}/admin", response_model=UserResponse)
async def update_admin_status(
    user_id: UUID,
    request: AdminStatusUpdateRequest,
    admin: UserWithAuth = Depends(get_admin_user)
):
    """
    사용자의 관리자 권한 설정
    
    Note: 이 엔드포인트는 더 이상 사용되지 않습니다.
    관리자 권한은 PPOP Auth에서 JWT의 isAdmin 필드로 관리됩니다.
    """
    user = await admin_service.update_admin_status(user_id, request.is_admin)
    return UserResponse(data=user)


# Security Management Endpoints

@router.get("/security/blacklist", response_model=BlacklistResponse)
async def get_blacklist(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    admin: UserWithAuth = Depends(get_admin_user)
):
    """
    IP 블랙리스트 조회
    
    Args:
        page: 페이지 번호
        page_size: 페이지 크기
    """
    offset = (page - 1) * page_size
    blacklist = await security_service.get_blacklist(limit=page_size, offset=offset)
    
    # 총 개수 조회를 위해 추가 쿼리 (간단히 현재 결과 수로 대체)
    total = len(blacklist) if blacklist else 0
    
    entries = [BlacklistEntry(**entry) for entry in blacklist]
    
    return BlacklistResponse(
        data=entries,
        total=total
    )


@router.post("/security/blacklist", response_model=MessageResponse)
async def add_to_blacklist(
    request: AddBlacklistRequest,
    admin: UserWithAuth = Depends(get_admin_user)
):
    """
    IP를 블랙리스트에 추가
    
    Args:
        request: IP 주소, 이유, 차단 기간 등
    """
    success = await security_service.add_to_blacklist(
        ip=request.ip_address,
        reason=request.reason,
        duration_hours=request.duration_hours,
        is_permanent=request.is_permanent
    )
    
    if success:
        return MessageResponse(
            message=f"Successfully added {request.ip_address} to blacklist"
        )
    else:
        return MessageResponse(
            success=False,
            message=f"Failed to add {request.ip_address} to blacklist"
        )


@router.delete("/security/blacklist/{ip_address}", response_model=MessageResponse)
async def remove_from_blacklist(
    ip_address: str,
    admin: UserWithAuth = Depends(get_admin_user)
):
    """
    IP를 블랙리스트에서 제거
    
    Args:
        ip_address: 제거할 IP 주소
    """
    success = await security_service.remove_from_blacklist(ip_address)
    
    if success:
        return MessageResponse(
            message=f"Successfully removed {ip_address} from blacklist"
        )
    else:
        return MessageResponse(
            success=False,
            message=f"Failed to remove {ip_address} from blacklist"
        )


@router.get("/security/stats", response_model=SecurityStatsResponse)
async def get_security_stats(
    admin: UserWithAuth = Depends(get_admin_user)
):
    """
    보안 통계 조회
    
    Returns:
        총 차단된 IP 수, 위반 횟수 등
    """
    stats = await security_service.get_violation_stats()
    
    return SecurityStatsResponse(
        data=SecurityStats(**stats)
    )

