"""
공개 페이지 서비스 로직
"""

from typing import List, Optional
from uuid import UUID

from backend.core.database import db
from backend.core.exceptions import UserNotFoundError
from backend.core.logger import get_logger
from backend.core.models import PublicProfile, Link, SocialLink, SocialPlatform
from backend.links.service import link_service
from backend.analytics.service import analytics_service
from backend.auth.service import auth_service

logger = get_logger(__name__)


class PublicService:
    TABLE_USERS = "users"
    TABLE_LINKS = "links"
    TABLE_SOCIAL_LINKS = "social_links"
    
    async def get_public_profile(self, link_id: str) -> PublicProfile:
        """
        공개 링크 ID로 프로필 조회
        
        Args:
            link_id: 암호화된 공개 링크 ID
        """
        # public_link_id로 사용자 조회
        user_data = db.execute(
            "SELECT * FROM users WHERE public_link_id = %s AND is_active = %s",
            (link_id, True),
            fetch_one=True
        )
        
        if not user_data:
            raise UserNotFoundError(detail="Profile not found")
        
        user_id = user_data["id"]  # PPOP Auth user_id와 동일
        
        # 활성화된 링크 조회
        links = await self._get_active_links(user_id)
        
        # 활성화된 소셜 링크 조회
        social_links = await self._get_active_social_links(user_id)
        
        # 프로필 소유자의 PRO 구독 상태 확인 (관리자 API 사용)
        is_pro_user = False
        try:
            is_pro_user = await auth_service.check_user_subscription_by_user_id(user_id)
        except Exception as e:
            logger.warning(f"Failed to check subscription status for user {user_id}: {e}")
            # 에러 발생 시 기본값 False 사용 (워터마크 표시)
        
        return PublicProfile(
            public_link_id=user_data["public_link_id"],
            username=user_data["username"],
            display_name=user_data.get("display_name"),
            bio=user_data.get("bio"),
            profile_image_url=user_data.get("profile_image_url"),
            background_image_url=user_data.get("background_image_url"),
            background_color=user_data.get("background_color"),
            theme=user_data.get("theme", "default"),
            button_style=user_data.get("button_style", "default"),
            font_family=user_data.get("font_family", "default"),
            contact_email=user_data.get("contact_email"),
            contact_message=user_data.get("contact_message"),
            links=links,
            social_links=social_links,
            is_pro_user=is_pro_user
        )
    
    async def record_click(
        self, 
        public_link_id: str, 
        link_id: UUID, 
        user_agent: str = None, 
        ip_address: str = None
    ) -> None:
        """
        링크 클릭 기록
        
        Args:
            public_link_id: 암호화된 공개 링크 ID
            link_id: 클릭된 링크의 UUID
            user_agent: 클라이언트 User-Agent
            ip_address: 클라이언트 IP 주소
        """
        # 사용자 확인 (public_link_id로 조회)
        user_result = db.execute(
            "SELECT id FROM users WHERE public_link_id = %s",
            (public_link_id,),
            fetch_one=True
        )
        
        if not user_result:
            raise UserNotFoundError(detail="Profile not found")
        
        # 클릭 수 증가 (links 테이블)
        await link_service.increment_click_count(link_id)
        
        # 상세 클릭 이벤트 기록 (analytics 테이블)
        await analytics_service.record_click_event(link_id, user_agent, ip_address)
        
        logger.info(f"Click recorded: public_link_id={public_link_id}, link_id={link_id}")
    
    async def _get_active_links(self, user_id: str) -> List[Link]:
        rows = db.execute(
            "SELECT * FROM links WHERE user_id = %s AND is_active = %s ORDER BY display_order",
            (user_id, True)
        )
        return [self._map_to_link(data) for data in rows]
    
    async def _get_active_social_links(self, user_id: str) -> List[SocialLink]:
        rows = db.execute(
            "SELECT * FROM social_links WHERE user_id = %s AND is_active = %s ORDER BY display_order",
            (user_id, True)
        )
        return [self._map_to_social_link(data) for data in rows]
    
    def _map_to_link(self, data: dict) -> Link:
        return Link(
            id=data["id"],
            user_id=data["user_id"],
            title=data["title"],
            url=data["url"],
            thumbnail_url=data.get("thumbnail_url"),
            display_order=data.get("display_order", 0),
            is_active=data.get("is_active", True),
            click_count=data.get("click_count", 0),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
        )
    
    def _map_to_social_link(self, data: dict) -> SocialLink:
        return SocialLink(
            id=data["id"],
            user_id=data["user_id"],
            platform=SocialPlatform(data["platform"]),
            url=data["url"],
            display_order=data.get("display_order", 0),
            is_active=data.get("is_active", True),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
        )


public_service = PublicService()
