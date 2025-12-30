"""
관리자 서비스 로직
"""

from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID, uuid4

from backend.core.database import db
from backend.core.exceptions import UserNotFoundError, AdminRequiredError
from backend.core.logger import get_logger
from backend.core.models import (
    User, UserPlan, UserWithPlan, AdminStats, PlanType
)

logger = get_logger(__name__)


class AdminService:
    TABLE_USERS = "users"
    TABLE_USER_PLANS = "user_plans"
    TABLE_LINKS = "links"
    TABLE_SOCIAL_LINKS = "social_links"
    
    async def get_users(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None
    ) -> Tuple[List[UserWithPlan], int]:
        offset = (page - 1) * page_size
        
        query = db.table(self.TABLE_USERS).select("*", count="exact")
        
        if search:
            query = query.or_(f"username.ilike.%{search}%,email.ilike.%{search}%")
        
        result = query.order("created_at", desc=True).range(
            offset, offset + page_size - 1
        ).execute()
        
        total = result.count or 0
        
        users_with_plans = []
        for user_data in result.data:
            user = self._map_to_user(user_data)
            plan = await self._get_user_plan(UUID(user_data["id"]))
            users_with_plans.append(UserWithPlan(**user.model_dump(), plan=plan))
        
        return users_with_plans, total
    
    async def get_stats(self) -> AdminStats:
        # 전체 사용자 수
        users_result = db.table(self.TABLE_USERS).select(
            "*", count="exact"
        ).execute()
        total_users = users_result.count or 0
        
        # 활성 사용자 수
        active_result = db.table(self.TABLE_USERS).select(
            "*", count="exact"
        ).eq("is_active", True).execute()
        active_users = active_result.count or 0
        
        # 전체 링크 수
        links_result = db.table(self.TABLE_LINKS).select(
            "*", count="exact"
        ).execute()
        total_links = links_result.count or 0
        
        # 전체 클릭 수
        clicks_result = db.table(self.TABLE_LINKS).select("click_count").execute()
        total_clicks = sum(
            link.get("click_count", 0) or 0 for link in clicks_result.data
        )
        
        # Pro 사용자 수
        pro_result = db.table(self.TABLE_USER_PLANS).select(
            "*", count="exact"
        ).eq("plan_type", PlanType.PRO.value).execute()
        pro_users = pro_result.count or 0
        
        free_users = total_users - pro_users
        
        return AdminStats(
            total_users=total_users,
            active_users=active_users,
            total_links=total_links,
            total_clicks=total_clicks,
            pro_users=pro_users,
            free_users=free_users
        )
    
    async def update_user_plan(
        self,
        user_id: UUID,
        plan_type: PlanType
    ) -> UserWithPlan:
        # 사용자 확인
        user_result = db.table(self.TABLE_USERS).select("*").eq(
            "id", str(user_id)
        ).execute()
        
        if not user_result.data:
            raise UserNotFoundError()
        
        user = self._map_to_user(user_result.data[0])
        
        # 기존 플랜 확인
        existing_plan = await self._get_user_plan(user_id)
        
        if existing_plan and existing_plan.plan_type != PlanType.BASIC:
            # 기존 플랜 업데이트
            db.table(self.TABLE_USER_PLANS).update({
                "plan_type": plan_type.value,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("user_id", str(user_id)).execute()
        else:
            # 새 플랜 생성
            now = datetime.utcnow().isoformat()
            plan_data = {
                "id": str(uuid4()),
                "user_id": str(user_id),
                "plan_type": plan_type.value,
                "started_at": now,
                "created_at": now,
            }
            db.table(self.TABLE_USER_PLANS).insert(plan_data).execute()
        
        new_plan = await self._get_user_plan(user_id)
        
        logger.info(f"User plan updated: user_id={user_id}, plan={plan_type}")
        return UserWithPlan(**user.model_dump(), plan=new_plan)
    
    async def update_admin_status(
        self,
        user_id: UUID,
        is_admin: bool
    ) -> UserWithPlan:
        """
        사용자의 관리자 권한 설정
        
        Args:
            user_id: 사용자 ID
            is_admin: 관리자 권한 여부
            
        Returns:
            UserWithPlan: 업데이트된 사용자 정보
        """
        # 사용자 확인
        user_result = db.table(self.TABLE_USERS).select("*").eq(
            "id", str(user_id)
        ).execute()
        
        if not user_result.data:
            raise UserNotFoundError()
        
        # 관리자 권한 업데이트
        db.table(self.TABLE_USERS).update({
            "is_admin": is_admin,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", str(user_id)).execute()
        
        # 업데이트된 사용자 정보 조회
        updated_result = db.table(self.TABLE_USERS).select("*").eq(
            "id", str(user_id)
        ).execute()
        
        user = self._map_to_user(updated_result.data[0])
        plan = await self._get_user_plan(user_id)
        
        logger.info(f"User admin status updated: user_id={user_id}, is_admin={is_admin}")
        return UserWithPlan(**user.model_dump(), plan=plan)
    
    async def _get_user_plan(self, user_id: UUID) -> Optional[UserPlan]:
        result = db.table(self.TABLE_USER_PLANS).select("*").eq(
            "user_id", str(user_id)
        ).order("started_at", desc=True).limit(1).execute()
        
        if not result.data:
            return None
        
        data = result.data[0]
        return UserPlan(
            id=data["id"],
            user_id=data["user_id"],
            plan_type=PlanType(data["plan_type"]),
            started_at=data["started_at"],
            expires_at=data.get("expires_at"),
            created_at=data.get("created_at")
        )
    
    def _map_to_user(self, data: dict) -> User:
        return User(
            id=data["id"],
            user_seq=data.get("user_seq"),
            public_link_id=data.get("public_link_id"),
            username=data["username"],
            email=data["email"],
            display_name=data.get("display_name"),
            bio=data.get("bio"),
            profile_image_url=data.get("profile_image_url"),
            background_image_url=data.get("background_image_url"),
            background_color=data.get("background_color"),
            theme=data.get("theme", "default"),
            is_active=data.get("is_active", True),
            is_admin=data.get("is_admin", False),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
        )


admin_service = AdminService()

