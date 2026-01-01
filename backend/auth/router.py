"""
OAuth 인증 API 라우터
PPOP Auth SSO 연동
"""

from fastapi import APIRouter, Depends, Request, Response, Cookie, HTTPException
from typing import Optional

from backend.core.security import verify_access_token, extract_token_from_header, get_token_payload
from backend.core.models import User, UserWithAuth, Token
from backend.core.config import settings
from backend.auth.schemas import (
    OAuthCallbackRequest,
    OAuthRefreshRequest,
    AuthResponse,
    UserResponse,
    MessageResponse,
    OAuthLoginURLResponse,
    SubscriptionStatusResponseSchema
)
from backend.auth.service import auth_service

router = APIRouter()


async def get_current_user(
    access_token: Optional[str] = Cookie(None, alias="access_token")
) -> User:
    """현재 인증된 사용자 반환 (쿠키에서 토큰 읽기)"""
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = verify_access_token(access_token)
    user = await auth_service.get_user_by_id(user_id)
    if not user:
        from backend.core.exceptions import UserNotFoundError
        raise UserNotFoundError()
    return user


async def get_current_user_with_token(
    access_token: Optional[str] = Cookie(None, alias="access_token")
) -> tuple[User, str]:
    """현재 인증된 사용자와 access_token 반환 (PPOP Auth API 호출용)"""
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = verify_access_token(access_token)
    user = await auth_service.get_user_by_id(user_id)
    if not user:
        from backend.core.exceptions import UserNotFoundError
        raise UserNotFoundError()
    return user, access_token


async def get_current_user_with_auth(
    access_token: Optional[str] = Cookie(None, alias="access_token")
) -> UserWithAuth:
    """JWT 검증 및 사용자 정보 + 관리자 여부 반환 (JWT 기반)"""
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = get_token_payload(access_token)

    # DB에서 기본 정보만 조회
    user = await auth_service.get_or_create_user_from_token(access_token)

    # JWT의 isAdmin을 런타임에 추가
    return UserWithAuth(
        **user.dict(),
        is_admin=payload.get("isAdmin", False)  # JWT에서만 가져옴
    )


@router.get("/oauth/login", response_model=OAuthLoginURLResponse)
async def get_oauth_login_url():
    """
    PPOP Auth 로그인 URL 반환
    프론트엔드에서 이 URL로 리다이렉트하여 로그인 시작
    """
    state = auth_service.generate_oauth_state()
    login_url = auth_service.get_oauth_login_url(state)
    return OAuthLoginURLResponse(login_url=login_url, state=state)


@router.post("/oauth/callback", response_model=AuthResponse)
async def oauth_callback(request: OAuthCallbackRequest, response: Response):
    """
    OAuth 콜백 처리
    인가 코드를 토큰으로 교환하고 사용자 정보 반환
    """
    # 인가 코드를 토큰으로 교환
    token_response = await auth_service.exchange_code_for_token(request.code)

    # 토큰에서 사용자 정보 추출 및 생성/조회
    user = await auth_service.get_or_create_user_from_token(token_response.access_token)

    # HttpOnly 쿠키로 토큰 설정
    response.set_cookie(
        key="access_token",
        value=token_response.access_token,
        httponly=True,
        secure=settings.cookie_secure,  # 개발: False, 프로덕션: True
        samesite=settings.cookie_samesite,  # "lax"
        max_age=3600,  # 1시간
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=token_response.refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=2592000,  # 30일
        path="/",
    )

    # 응답 바디에서는 토큰 제거 (사용자 정보만 반환)
    return AuthResponse(data=None, user=user)


@router.post("/oauth/refresh", response_model=AuthResponse)
async def oauth_refresh(
    response: Response,
    refresh_token: Optional[str] = Cookie(None, alias="refresh_token")
):
    """
    토큰 갱신
    쿠키에서 리프레시 토큰을 읽어 새 액세스 토큰 발급
    """
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token not found")

    # 리프레시 토큰으로 새 토큰 발급
    token_response = await auth_service.refresh_tokens(refresh_token)

    # 토큰에서 사용자 정보 조회
    user = await auth_service.get_or_create_user_from_token(token_response.access_token)

    # 새 토큰을 HttpOnly 쿠키로 설정
    response.set_cookie(
        key="access_token",
        value=token_response.access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=3600,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=token_response.refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=2592000,
        path="/",
    )

    # 응답 바디에서는 토큰 제거
    return AuthResponse(data=None, user=user)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """현재 로그인한 사용자 정보 반환"""
    return UserResponse(data=current_user)


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    """
    로그아웃 처리
    HttpOnly 쿠키 삭제
    """
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return MessageResponse(message="Logged out successfully")


@router.get("/subscription/{service_code}", response_model=SubscriptionStatusResponseSchema)
async def get_subscription_status(
    service_code: str,
    access_token: Optional[str] = Cookie(None, alias="access_token")
):
    """
    구독 상태 조회 (PPOP Auth API 호출)
    """
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    subscription = await auth_service.get_subscription_status(access_token)
    return SubscriptionStatusResponseSchema(success=True, data=subscription)
