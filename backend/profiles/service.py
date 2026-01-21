"""
프로필 서비스 로직
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import UploadFile

from backend.core.config import settings
from backend.core.database import db
from backend.core.exceptions import (
    UserNotFoundError,
    FeatureNotAvailableError
)
from backend.core.logger import get_logger
from backend.core.models import (
    User, PlanType, UserPlan,
    SubscriptionStatusResponse, SubscriptionPlan, SubscriptionStatus
)
from backend.auth.service import auth_service
from backend.files.service import file_service
from backend.profiles.schemas import ProfileUpdateRequest, ThemeUpdateRequest

logger = get_logger(__name__)


class ProfileService:
    TABLE_USERS = "users"
    TABLE_USER_PLANS = "user_plans"
    
    async def get_profile(self, user_id: UUID) -> User:
        result = db.execute(
            "SELECT * FROM users WHERE id = %s",
            (str(user_id),),
            fetch_one=True
        )
        
        if not result:
            raise UserNotFoundError()
        
        return self._map_to_user(result)
    
    async def update_profile(self, user_id: UUID, request: ProfileUpdateRequest) -> User:
        update_data = request.model_dump(exclude_unset=True)
        
        if not update_data:
            return await self.get_profile(user_id)
        
        # 동적 UPDATE 쿼리 생성
        update_data["updated_at"] = datetime.utcnow()
        set_clause = ", ".join([f"{key} = %s" for key in update_data.keys()])
        values = list(update_data.values()) + [str(user_id)]
        
        result = db.execute_returning(
            f"UPDATE users SET {set_clause} WHERE id = %s RETURNING *",
            tuple(values)
        )
        
        if not result:
            raise UserNotFoundError()
        
        logger.info(f"Profile updated: user_id={user_id}")
        return self._map_to_user(result)
    
    async def update_theme(self, user_id: UUID, request: ThemeUpdateRequest) -> User:
        update_data = request.model_dump(exclude_unset=True)
        
        if not update_data:
            return await self.get_profile(user_id)
        
        # 동적 UPDATE 쿼리 생성
        update_data["updated_at"] = datetime.utcnow()
        set_clause = ", ".join([f"{key} = %s" for key in update_data.keys()])
        values = list(update_data.values()) + [str(user_id)]
        
        result = db.execute_returning(
            f"UPDATE users SET {set_clause} WHERE id = %s RETURNING *",
            tuple(values)
        )
        
        if not result:
            raise UserNotFoundError()
        
        logger.info(f"Theme updated: user_id={user_id}")
        return self._map_to_user(result)
    
    def get_profile_image_presigned_url(self, user_id: UUID) -> dict:
        result = file_service.create_profile_image_presigned_url(user_id)
        logger.info(f"Profile image presigned URL created: user_id={user_id}")
        return result
    
    async def confirm_profile_image_upload(self, user_id: UUID, public_url: str) -> User:
        result = db.execute_returning(
            "UPDATE users SET profile_image_url = %s, updated_at = %s WHERE id = %s RETURNING *",
            (public_url, datetime.utcnow(), str(user_id))
        )
        
        logger.info(f"Profile image URL confirmed: user_id={user_id}")
        return self._map_to_user(result)
    
    async def upload_profile_image(self, user_id: UUID, file: UploadFile) -> str:
        url = await file_service.upload_profile_image(user_id, file)
        
        db.execute(
            "UPDATE users SET profile_image_url = %s, updated_at = %s WHERE id = %s",
            (url, datetime.utcnow(), str(user_id))
        )
        
        logger.info(f"Profile image uploaded: user_id={user_id}")
        return url
    
    async def upload_background_image(self, user_id: UUID, file: UploadFile, access_token: Optional[str] = None) -> str:
        # Pro 플랜 체크
        plan = await self._get_user_plan(user_id, access_token)
        if plan.plan_type != PlanType.PRO:
            raise FeatureNotAvailableError(
                detail="Background image is available for Pro plan only"
            )
        
        url = await file_service.upload_background_image(user_id, file)
        
        db.execute(
            "UPDATE users SET background_image_url = %s, updated_at = %s WHERE id = %s",
            (url, datetime.utcnow(), str(user_id))
        )
        
        logger.info(f"Background image uploaded: user_id={user_id}")
        return url
    
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
            # 플랜이 없으면 BASIC 플랜으로 간주
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
            button_style=data.get("button_style", "default"),
            font_family=data.get("font_family", "default"),
            theme=data.get("theme", "default"),
            contact_email=data.get("contact_email"),
            contact_message=data.get("contact_message"),
            is_active=data.get("is_active", True),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
        )


profile_service = ProfileService()
