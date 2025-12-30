"""
컨텐츠 API 라우터
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query

from backend.core.models import User
from backend.core.exceptions import AdminRequiredError
from backend.auth.router import get_current_user
from backend.content.schemas import (
    ContentListResponse,
    ContentResponse,
    ContentCreate,
    ContentUpdate,
    MessageResponse
)
from backend.content.service import content_service

router = APIRouter()


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """관리자 권한 확인"""
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
    admin: User = Depends(get_admin_user)
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
    admin: User = Depends(get_admin_user)
):
    """
    컨텐츠 업데이트 (관리자 전용)
    """
    content = await content_service.update_content(slug, content_data)
    return ContentResponse(data=content)


@router.delete("/{slug}", response_model=MessageResponse)
async def delete_content(
    slug: str,
    admin: User = Depends(get_admin_user)
):
    """
    컨텐츠 삭제 (관리자 전용)
    """
    await content_service.delete_content(slug)
    return MessageResponse(message=f"Content '{slug}' deleted successfully")


@router.get("/admin/all", response_model=ContentListResponse)
async def get_all_content_admin(
    category: Optional[str] = Query(None, description="카테고리 필터"),
    admin: User = Depends(get_admin_user)
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

