"""
프로필 관련 Pydantic 스키마
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field

from backend.core.models import User


class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    background_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    button_style: Optional[Literal["default", "outline", "filled"]] = None
    font_family: Optional[Literal["default", "Noto Sans KR", "Nanum Gothic", "Gowun Batang"]] = None


class ThemeUpdateRequest(BaseModel):
    theme: Optional[str] = None
    background_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class ProfileResponse(BaseModel):
    success: bool = True
    data: User


class ImageUploadResponse(BaseModel):
    success: bool = True
    url: str


class ShareLinkResponse(BaseModel):
    success: bool = True
    public_link_id: str
    share_url: str

