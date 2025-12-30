"""
컨텐츠 API 라우터
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, File, UploadFile

from backend.core.models import User, UserWithAuth
from backend.core.exceptions import AdminRequiredError
from backend.auth.router import get_current_user_with_auth
from backend.content.schemas import (
    ContentListResponse,
    ContentResponse,
    ContentCreate,
    ContentUpdate,
    MessageResponse
)
from backend.content.service import content_service
from backend.files.service import file_service

router = APIRouter()


async def get_admin_user(current_user: UserWithAuth = Depends(get_current_user_with_auth)) -> UserWithAuth:
    """관리자 권한 확인 (JWT 기반)"""
    if not current_user.is_admin:
        raise AdminRequiredError()
    return current_user


@router.get("", response_model=ContentListResponse)
async def get_all_content(
    category: Optional[str] = Query(None, description="카테고리 필터")
):
    """
    모든 발행된 컨텐츠 조회 (공개 API)
    """
    content_list = await content_service.get_all_content(
        published_only=True,
        category=category
    )
    return ContentListResponse(
        data=content_list,
        total=len(content_list)
    )


@router.get("/{slug}", response_model=ContentResponse)
async def get_content_by_slug(slug: str):
    """
    slug로 컨텐츠 조회 (공개 API)
    """
    content = await content_service.get_content_by_slug(slug, published_only=True)
    return ContentResponse(data=content)


@router.post("", response_model=ContentResponse)
async def create_content(
    content_data: ContentCreate,
    admin: UserWithAuth = Depends(get_admin_user)
):
    """
    새 컨텐츠 생성 (관리자 전용)
    """
    content = await content_service.create_content(content_data, admin.id)
    return ContentResponse(data=content)


@router.put("/{slug}", response_model=ContentResponse)
async def update_content(
    slug: str,
    content_data: ContentUpdate,
    admin: UserWithAuth = Depends(get_admin_user)
):
    """
    컨텐츠 업데이트 (관리자 전용)
    """
    content = await content_service.update_content(slug, content_data)
    return ContentResponse(data=content)


@router.delete("/{slug}", response_model=MessageResponse)
async def delete_content(
    slug: str,
    admin: UserWithAuth = Depends(get_admin_user)
):
    """
    컨텐츠 삭제 (관리자 전용)
    """
    await content_service.delete_content(slug)
    return MessageResponse(message=f"Content '{slug}' deleted successfully")


@router.get("/admin/all", response_model=ContentListResponse)
async def get_all_content_admin(
    category: Optional[str] = Query(None, description="카테고리 필터"),
    admin: UserWithAuth = Depends(get_admin_user)
):
    """
    모든 컨텐츠 조회 (발행/미발행 포함, 관리자 전용)
    """
    content_list = await content_service.get_all_content(
        published_only=False,
        category=category
    )
    return ContentListResponse(
        data=content_list,
        total=len(content_list)
    )


@router.post("/images/upload")
async def upload_content_image(
    file: UploadFile = File(...),
    admin: UserWithAuth = Depends(get_admin_user)
):
    """
    컨텐츠 이미지 업로드 (관리자 전용)
    마크다운 에디터에서 사용
    """
    public_url, file_path = await file_service.upload_content_image(admin.id, file)
    
    return {
        "success": True,
        "url": public_url,
        "file_path": file_path
    }

