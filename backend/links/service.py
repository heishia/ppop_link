"""
링크 서비스 로직
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from backend.core.config import settings
from backend.core.database import db
from backend.core.exceptions import (
    LinkNotFoundError,
    LinkLimitExceededError,
    SocialLinkLimitExceededError,
    AuthorizationError
)
from backend.core.logger import get_logger
from backend.core.models import (
    Link, SocialLink, PlanType, UserPlan, SocialPlatform,
    SubscriptionStatusResponse, SubscriptionPlan, SubscriptionStatus
)
from backend.auth.service import auth_service
from backend.links.schemas import (
    LinkCreateRequest,
    LinkUpdateRequest,
    SocialLinkCreateRequest,
    SocialLinkUpdateRequest
)

logger = get_logger(__name__)


class LinkService:
    TABLE_LINKS = "links"
    TABLE_SOCIAL_LINKS = "social_links"
    TABLE_USER_PLANS = "user_plans"
    
    # Link CRUD
    async def get_links(self, user_id: UUID) -> List[Link]:
        rows = db.execute(
            "SELECT * FROM links WHERE user_id = %s ORDER BY display_order",
            (str(user_id),)
        )
        return [self._map_to_link(row) for row in rows]
    
    async def create_link(self, user_id: UUID, request: LinkCreateRequest, access_token: Optional[str] = None) -> Link:
        await self._check_link_limit(user_id, access_token)
        
        # 현재 최대 display_order 가져오기
        max_order = await self._get_max_display_order(user_id, self.TABLE_LINKS)
        
        link_id = uuid4()
        now = datetime.utcnow()
        
        result = db.execute_returning(
            """
            INSERT INTO links (id, user_id, title, url, thumbnail_url, display_order, is_active, click_count, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (str(link_id), str(user_id), request.title, request.url, request.thumbnail_url,
             max_order + 1, True, 0, now)
        )
        
        logger.info(f"Link created: user_id={user_id}, link_id={link_id}")
        return self._map_to_link(result)
    
    async def update_link(
        self,
        user_id: UUID,
        link_id: UUID,
        request: LinkUpdateRequest
    ) -> Link:
        await self._verify_link_ownership(user_id, link_id)
        
        update_data = request.model_dump(exclude_unset=True)
        logger.info(f"Update request data: {update_data}")
        
        if not update_data:
            link = await self._get_link_by_id(link_id)
            return link
        
        # 동적 UPDATE 쿼리 생성
        update_data["updated_at"] = datetime.utcnow()
        set_clause = ", ".join([f"{key} = %s" for key in update_data.keys()])
        values = list(update_data.values()) + [str(link_id)]
        
        # 업데이트 전 현재 값 확인
        before = await self._get_link_by_id(link_id)
        logger.info(f"Before update - is_active: {before.is_active}")
        
        # 업데이트 실행
        result = db.execute_returning(
            f"UPDATE links SET {set_clause} WHERE id = %s RETURNING *",
            tuple(values)
        )
        
        logger.info(f"Link updated: link_id={link_id}")
        logger.info(f"After update - is_active: {result.get('is_active')}")
        return self._map_to_link(result)
    
    async def delete_link(self, user_id: UUID, link_id: UUID) -> None:
        await self._verify_link_ownership(user_id, link_id)
        
        db.execute(
            "DELETE FROM links WHERE id = %s",
            (str(link_id),)
        )
        
        logger.info(f"Link deleted: link_id={link_id}")
    
    async def reorder_links(self, user_id: UUID, link_ids: List[UUID]) -> List[Link]:
        now = datetime.utcnow()
        for order, link_id in enumerate(link_ids):
            db.execute(
                "UPDATE links SET display_order = %s, updated_at = %s WHERE id = %s AND user_id = %s",
                (order, now, str(link_id), str(user_id))
            )
        
        logger.info(f"Links reordered: user_id={user_id}")
        return await self.get_links(user_id)
    
    async def increment_click_count(self, link_id: UUID) -> None:
        # PostgreSQL에서는 직접 증가 가능
        db.execute(
            "UPDATE links SET click_count = click_count + 1 WHERE id = %s",
            (str(link_id),)
        )
    
    # Social Link CRUD
    async def get_social_links(self, user_id: UUID) -> List[SocialLink]:
        rows = db.execute(
            "SELECT * FROM social_links WHERE user_id = %s ORDER BY display_order",
            (str(user_id),)
        )
        return [self._map_to_social_link(row) for row in rows]
    
    async def create_social_link(
        self,
        user_id: UUID,
        request: SocialLinkCreateRequest,
        access_token: Optional[str] = None
    ) -> SocialLink:
        await self._check_social_link_limit(user_id, access_token)
        
        max_order = await self._get_max_display_order(user_id, self.TABLE_SOCIAL_LINKS)
        
        social_link_id = uuid4()
        now = datetime.utcnow()
        
        result = db.execute_returning(
            """
            INSERT INTO social_links (id, user_id, platform, url, display_order, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (str(social_link_id), str(user_id), request.platform.value, request.url,
             max_order + 1, True, now)
        )
        
        logger.info(f"Social link created: user_id={user_id}, platform={request.platform}")
        return self._map_to_social_link(result)
    
    async def update_social_link(
        self,
        user_id: UUID,
        social_link_id: UUID,
        request: SocialLinkUpdateRequest
    ) -> SocialLink:
        await self._verify_social_link_ownership(user_id, social_link_id)
        
        update_data = request.model_dump(exclude_unset=True)
        if not update_data:
            social_link = await self._get_social_link_by_id(social_link_id)
            return social_link
        
        # 동적 UPDATE 쿼리 생성
        update_data["updated_at"] = datetime.utcnow()
        set_clause = ", ".join([f"{key} = %s" for key in update_data.keys()])
        values = list(update_data.values()) + [str(social_link_id)]
        
        result = db.execute_returning(
            f"UPDATE social_links SET {set_clause} WHERE id = %s RETURNING *",
            tuple(values)
        )
        
        logger.info(f"Social link updated: social_link_id={social_link_id}")
        return self._map_to_social_link(result)
    
    async def delete_social_link(self, user_id: UUID, social_link_id: UUID) -> None:
        await self._verify_social_link_ownership(user_id, social_link_id)
        
        db.execute(
            "DELETE FROM social_links WHERE id = %s",
            (str(social_link_id),)
        )
        
        logger.info(f"Social link deleted: social_link_id={social_link_id}")
    
    # Helper methods
    async def _get_link_by_id(self, link_id: UUID) -> Link:
        result = db.execute(
            "SELECT * FROM links WHERE id = %s",
            (str(link_id),),
            fetch_one=True
        )
        
        if not result:
            raise LinkNotFoundError()
        
        return self._map_to_link(result)
    
    async def _get_social_link_by_id(self, social_link_id: UUID) -> SocialLink:
        result = db.execute(
            "SELECT * FROM social_links WHERE id = %s",
            (str(social_link_id),),
            fetch_one=True
        )
        
        if not result:
            raise LinkNotFoundError(detail="Social link not found")
        
        return self._map_to_social_link(result)
    
    async def _verify_link_ownership(self, user_id: UUID, link_id: UUID) -> None:
        result = db.execute(
            "SELECT user_id FROM links WHERE id = %s",
            (str(link_id),),
            fetch_one=True
        )
        
        if not result:
            raise LinkNotFoundError()
        
        if result["user_id"] != str(user_id):
            raise AuthorizationError(detail="Not your link")
    
    async def _verify_social_link_ownership(
        self,
        user_id: UUID,
        social_link_id: UUID
    ) -> None:
        result = db.execute(
            "SELECT user_id FROM social_links WHERE id = %s",
            (str(social_link_id),),
            fetch_one=True
        )
        
        if not result:
            raise LinkNotFoundError(detail="Social link not found")
        
        if result["user_id"] != str(user_id):
            raise AuthorizationError(detail="Not your social link")
    
    async def _get_max_display_order(self, user_id: UUID, table: str) -> int:
        result = db.execute(
            f"SELECT display_order FROM {table} WHERE user_id = %s ORDER BY display_order DESC LIMIT 1",
            (str(user_id),),
            fetch_one=True
        )
        
        if result:
            return result["display_order"]
        return -1
    
    async def _get_user_plan(self, user_id: UUID, access_token: Optional[str] = None) -> UserPlan:
        """
        사용자 플랜 조회 (PPOP Auth API 우선, 실패 시 로컬 DB)
        
        Args:
            user_id: 사용자 ID
            access_token: PPOP Auth access token (선택사항, 있으면 PPOP Auth API 호출)
        """
        # access_token이 있으면 PPOP Auth API 호출
        if access_token:
            try:
                subscription = await auth_service.get_subscription_status(access_token)
                # PPOP Auth 응답을 UserPlan으로 변환
                plan_type = PlanType.PRO if subscription.plan == SubscriptionPlan.PRO else PlanType.BASIC
                return UserPlan(
                    id=user_id,
                    user_id=user_id,
                    plan_type=plan_type,
                    started_at=datetime.utcnow(),
                    expires_at=subscription.expiresAt
                )
            except Exception as e:
                logger.warning(f"Failed to get subscription from PPOP Auth, falling back to local DB: {e}")
                # PPOP Auth API 호출 실패 시 로컬 DB 조회로 폴백
        
        # 로컬 DB에서 플랜 조회
        result = db.execute(
            "SELECT * FROM user_plans WHERE user_id = %s ORDER BY started_at DESC LIMIT 1",
            (str(user_id),),
            fetch_one=True
        )
        
        if not result:
            return UserPlan(
                id=user_id,
                user_id=user_id,
                plan_type=PlanType.BASIC,
                started_at=datetime.utcnow()
            )
        
        return UserPlan(
            id=result["id"],
            user_id=result["user_id"],
            plan_type=PlanType(result["plan_type"]),
            started_at=result["started_at"],
            expires_at=result.get("expires_at"),
            created_at=result.get("created_at")
        )
    
    async def _check_link_limit(self, user_id: UUID, access_token: Optional[str] = None) -> None:
        plan = await self._get_user_plan(user_id, access_token)
        
        if plan.plan_type == PlanType.PRO:
            return
        
        current_count = db.count("links", "user_id = %s", (str(user_id),))
        
        if current_count >= settings.FREE_MAX_LINKS:
            raise LinkLimitExceededError(
                detail=f"Basic plan allows up to {settings.FREE_MAX_LINKS} links"
            )
    
    async def _check_social_link_limit(self, user_id: UUID, access_token: Optional[str] = None) -> None:
        plan = await self._get_user_plan(user_id, access_token)
        
        if plan.plan_type == PlanType.PRO:
            return
        
        current_count = db.count("social_links", "user_id = %s", (str(user_id),))
        
        if current_count >= settings.FREE_MAX_SOCIAL_LINKS:
            raise SocialLinkLimitExceededError(
                detail=f"Basic plan allows up to {settings.FREE_MAX_SOCIAL_LINKS} social links"
            )
    
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


link_service = LinkService()
