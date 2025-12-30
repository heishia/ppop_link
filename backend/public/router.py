"""
공개 페이지 API 라우터
"""

from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Request, Header
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.public.schemas import PublicProfileResponse, ClickResponse
from backend.public.service import public_service

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/{link_id}", response_model=PublicProfileResponse)
@limiter.limit("30/minute")
async def get_public_profile(link_id: str, request: Request):
    """
    공개 링크 ID로 프로필 조회
    
    Args:
        link_id: 암호화된 공개 링크 ID (예: Ab3x2Kq9)
    
    Rate Limit: 30 requests per minute per IP
    """
    profile = await public_service.get_public_profile(link_id)
    return PublicProfileResponse(data=profile)


@router.post("/{public_link_id}/click/{link_id}", response_model=ClickResponse)
@limiter.limit("60/minute")
async def record_click(
    public_link_id: str, 
    link_id: UUID, 
    request: Request,
    user_agent: Optional[str] = Header(None)
):
    """
    링크 클릭 기록
    
    Args:
        public_link_id: 암호화된 공개 링크 ID
        link_id: 클릭된 링크의 UUID
    
    Rate Limit: 60 requests per minute per IP
    """
    # 클라이언트 IP 주소 가져오기
    ip_address = request.client.host if request.client else None
    
    await public_service.record_click(
        public_link_id, 
        link_id, 
        user_agent=user_agent,
        ip_address=ip_address
    )
    return ClickResponse()

