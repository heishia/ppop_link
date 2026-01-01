"""
링크 API 라우터
"""

from uuid import UUID
from fastapi import APIRouter, Depends

from backend.core.models import User
from backend.auth.router import get_current_user, get_current_user_with_token
from backend.links.schemas import (
    LinkCreateRequest,
    LinkUpdateRequest,
    LinkReorderRequest,
    LinkResponse,
    LinksResponse,
    SocialLinkCreateRequest,
    SocialLinkUpdateRequest,
    SocialLinkResponse,
    SocialLinksResponse,
    MessageResponse
)
from backend.links.service import link_service

router = APIRouter()


# Link Endpoints
@router.get("", response_model=LinksResponse)
async def get_links(current_user: User = Depends(get_current_user)):
    links = await link_service.get_links(current_user.id)
    return LinksResponse(data=links)


@router.post("", response_model=LinkResponse)
async def create_link(
    request: LinkCreateRequest,
    current_user_with_token: tuple[User, str] = Depends(get_current_user_with_token)
):
    current_user, access_token = current_user_with_token
    link = await link_service.create_link(current_user.id, request, access_token)
    return LinkResponse(data=link)


@router.put("/{link_id}", response_model=LinkResponse)
async def update_link(
    link_id: UUID,
    request: LinkUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    link = await link_service.update_link(current_user.id, link_id, request)
    return LinkResponse(data=link)


@router.delete("/{link_id}", response_model=MessageResponse)
async def delete_link(
    link_id: UUID,
    current_user: User = Depends(get_current_user)
):
    await link_service.delete_link(current_user.id, link_id)
    return MessageResponse(message="Link deleted successfully")


@router.put("/reorder", response_model=LinksResponse)
async def reorder_links(
    request: LinkReorderRequest,
    current_user: User = Depends(get_current_user)
):
    links = await link_service.reorder_links(current_user.id, request.link_ids)
    return LinksResponse(data=links)


# Social Link Router 생성
social_router = APIRouter()


@social_router.get("", response_model=SocialLinksResponse)
async def get_social_links(current_user: User = Depends(get_current_user)):
    social_links = await link_service.get_social_links(current_user.id)
    return SocialLinksResponse(data=social_links)


@social_router.post("", response_model=SocialLinkResponse)
async def create_social_link(
    request: SocialLinkCreateRequest,
    current_user_with_token: tuple[User, str] = Depends(get_current_user_with_token)
):
    current_user, access_token = current_user_with_token
    social_link = await link_service.create_social_link(current_user.id, request, access_token)
    return SocialLinkResponse(data=social_link)


@social_router.put("/{social_link_id}", response_model=SocialLinkResponse)
async def update_social_link(
    social_link_id: UUID,
    request: SocialLinkUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    social_link = await link_service.update_social_link(
        current_user.id, social_link_id, request
    )
    return SocialLinkResponse(data=social_link)


@social_router.delete("/{social_link_id}", response_model=MessageResponse)
async def delete_social_link(
    social_link_id: UUID,
    current_user: User = Depends(get_current_user)
):
    await link_service.delete_social_link(current_user.id, social_link_id)
    return MessageResponse(message="Social link deleted successfully")

