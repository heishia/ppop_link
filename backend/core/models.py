"""
Pydantic 모델 정의 (Supabase 테이블 스키마와 매핑)
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class PlanType(str, Enum):
    BASIC = "basic"
    PRO = "pro"


class SubscriptionPlan(str, Enum):
    """PPOP Auth 구독 플랜"""
    BASIC = "BASIC"
    PRO = "PRO"


class SubscriptionStatus(str, Enum):
    """PPOP Auth 구독 상태"""
    ACTIVE = "ACTIVE"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    NONE = "NONE"


class SocialPlatform(str, Enum):
    THREADS = "threads"
    YOUTUBE = "youtube"
    EMAIL = "email"
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    TWITTER = "twitter"
    FACEBOOK = "facebook"
    LINKEDIN = "linkedin"
    GITHUB = "github"
    WEBSITE = "website"
    # 추가 플랫폼들
    NAVERBLOG = "naverblog"
    DISCORD = "discord"
    TWITCH = "twitch"
    SPOTIFY = "spotify"
    SOUNDCLOUD = "soundcloud"


# Base Models
class TimestampMixin(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


# User Models
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    phone_number: Optional[str] = Field(None, max_length=20)
    display_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)

# UserCreate 모델 완전 삭제 (OAuth 전용)


class ButtonStyle(str, Enum):
    DEFAULT = "default"      # 기본 스타일 (primary 색상)
    OUTLINE = "outline"      # 하얀 배경 + 검은 외곽선
    FILLED = "filled"        # 검은 배경 + 하얀 텍스트


class FontFamily(str, Enum):
    DEFAULT = "default"
    NOTO_SANS_KR = "Noto Sans KR"
    NANUM_GOTHIC = "Nanum Gothic"
    GOWUN_BATANG = "Gowun Batang"


class UserUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    profile_image_url: Optional[str] = None
    background_image_url: Optional[str] = None
    background_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    theme: Optional[str] = None
    button_style: Optional[ButtonStyle] = None
    font_family: Optional[FontFamily] = None


class User(UserBase, TimestampMixin):
    """DB에 저장되는 기본 사용자 정보 (is_admin 제거 - JWT에서만 관리)"""
    id: UUID
    user_seq: Optional[int] = None
    public_link_id: Optional[str] = None
    phone_number: Optional[str] = None
    profile_image_url: Optional[str] = None
    background_image_url: Optional[str] = None
    background_color: Optional[str] = None
    theme: str = "default"
    button_style: str = "default"
    font_family: str = "default"
    is_active: bool = True
    
    model_config = ConfigDict(from_attributes=True)


class UserWithAuth(User):
    """JWT 정보를 포함한 사용자 (API 응답용, 런타임 전용)"""
    is_admin: bool = False  # JWT에서 추출, DB에는 저장 안 함

# UserInDB 모델 완전 삭제 (OAuth 전용이므로 password_hash 불필요)


# User Plan Models
class UserPlanBase(BaseModel):
    plan_type: PlanType = PlanType.BASIC


class UserPlan(UserPlanBase, TimestampMixin):
    id: UUID
    user_id: UUID
    started_at: datetime
    expires_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Link Models
class LinkBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    url: str = Field(..., max_length=2000)
    thumbnail_url: Optional[str] = None


class LinkCreate(LinkBase):
    pass


class LinkUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    url: Optional[str] = Field(None, max_length=2000)
    thumbnail_url: Optional[str] = None
    is_active: Optional[bool] = None


class Link(LinkBase, TimestampMixin):
    id: UUID
    user_id: UUID
    display_order: int = 0
    is_active: bool = True
    click_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class LinkReorder(BaseModel):
    link_ids: List[UUID]


# Social Link Models
class SocialLinkBase(BaseModel):
    platform: SocialPlatform
    url: str = Field(..., max_length=500)


class SocialLinkCreate(SocialLinkBase):
    pass


class SocialLinkUpdate(BaseModel):
    url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class SocialLink(SocialLinkBase, TimestampMixin):
    id: UUID
    user_id: UUID
    display_order: int = 0
    is_active: bool = True
    
    model_config = ConfigDict(from_attributes=True)


# Public Profile Response
class PublicProfile(BaseModel):
    public_link_id: str
    username: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    background_image_url: Optional[str] = None
    background_color: Optional[str] = None
    theme: str = "default"
    button_style: str = "default"
    font_family: str = "default"
    links: List[Link] = []
    social_links: List[SocialLink] = []
    is_pro_user: bool = False


# Auth Models
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    exp: int
    type: str


# Admin Models
class AdminStats(BaseModel):
    total_users: int
    active_users: int
    total_links: int
    total_clicks: int
    pro_users: int
    free_users: int


class UserWithPlan(User):
    plan: Optional[UserPlan] = None


# Subscription Models (PPOP Auth)
class SubscriptionStatusResponse(BaseModel):
    """PPOP Auth 구독 상태 응답"""
    hasAccess: bool
    plan: SubscriptionPlan
    status: SubscriptionStatus
    expiresAt: Optional[datetime] = None

