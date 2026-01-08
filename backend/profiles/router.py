"""
프로필 API 라우터
"""

from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.core.models import User
from backend.auth.router import get_current_user
from backend.profiles.schemas import (
    ProfileUpdateRequest,
    ThemeUpdateRequest,
    ProfileResponse,
    ImageUploadResponse,
    ShareLinkResponse,
    PresignedUploadUrlResponse
)
from backend.profiles.service import profile_service

router = APIRouter()
security = HTTPBearer()


@router.get("", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    profile = await profile_service.get_profile(current_user.id)
    return ProfileResponse(data=profile)


@router.put("", response_model=ProfileResponse)
async def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    profile = await profile_service.update_profile(current_user.id, request)
    return ProfileResponse(data=profile)


@router.put("/theme", response_model=ProfileResponse)
async def update_theme(
    request: ThemeUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    profile = await profile_service.update_theme(current_user.id, request)
    return ProfileResponse(data=profile)


@router.post("/image/presigned-url", response_model=PresignedUploadUrlResponse)
async def get_presigned_upload_url(
    current_user: User = Depends(get_current_user)
):
    result = profile_service.get_profile_image_presigned_url(current_user.id)
    return PresignedUploadUrlResponse(**result)


@router.post("/image/confirm", response_model=ProfileResponse)
async def confirm_profile_image_upload(
    public_url: str,
    current_user: User = Depends(get_current_user)
):
    profile = await profile_service.confirm_profile_image_upload(current_user.id, public_url)
    return ProfileResponse(data=profile)


@router.post("/image", response_model=ImageUploadResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    url = await profile_service.upload_profile_image(current_user.id, file)
    return ImageUploadResponse(url=url)


@router.post("/background", response_model=ImageUploadResponse)
async def upload_background_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    access_token = credentials.credentials if credentials else None
    url = await profile_service.upload_background_image(current_user.id, file, access_token)
    return ImageUploadResponse(url=url)


@router.get("/share-link", response_model=ShareLinkResponse)
async def get_share_link(current_user: User = Depends(get_current_user)):
    """
    공유 링크 발급 (인증 필수)
    사용자의 public_link_id를 반환
    """
    profile = await profile_service.get_profile(current_user.id)
    if not profile.public_link_id:
        from backend.core.exceptions import NotFoundError
        raise NotFoundError(detail="Public link ID not found. Please contact support.")
    
    return ShareLinkResponse(
        public_link_id=profile.public_link_id,
        share_url=f"/{profile.public_link_id}"
    )

