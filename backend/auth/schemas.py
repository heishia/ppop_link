"""
OAuth 인증 관련 Pydantic 스키마
PPOP Auth SSO 연동용
"""

from typing import Optional
from pydantic import BaseModel

from backend.core.models import User, Token, SubscriptionStatusResponse


class OAuthCallbackRequest(BaseModel):
    """OAuth 콜백 요청 (인가 코드 교환)"""
    code: str
    state: str


class OAuthRefreshRequest(BaseModel):
    """OAuth 토큰 갱신 요청"""
    refresh_token: str


class OAuthTokenResponse(BaseModel):
    """PPOP Auth 토큰 응답"""
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int


class AuthResponse(BaseModel):
    """인증 응답 (토큰 + 사용자 정보)"""
    success: bool = True
    data: Token
    user: User


class UserResponse(BaseModel):
    """사용자 정보 응답"""
    success: bool = True
    data: User


class MessageResponse(BaseModel):
    """일반 메시지 응답"""
    success: bool = True
    message: str


class OAuthLoginURLResponse(BaseModel):
    """OAuth 로그인 URL 응답"""
    success: bool = True
    login_url: str
    state: str


class SubscriptionStatusResponseSchema(BaseModel):
    """구독 상태 응답 스키마"""
    success: bool = True
    data: SubscriptionStatusResponse