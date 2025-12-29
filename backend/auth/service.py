"""
OAuth 인증 서비스 로직
PPOP Auth SSO 연동
"""

import secrets
from datetime import datetime
from typing import Optional, Tuple
from uuid import UUID

import httpx

from backend.core.config import settings
from backend.core.database import db
from backend.core.exceptions import (
    InvalidCredentialsError,
    UserNotFoundError,
    UsernameAlreadyExistsError,
    DatabaseError,
    ServiceNotFoundError,
    SubscriptionError,
    OAuthCodeExchangeError,
    OAuthTokenRefreshError
)
from backend.core.logger import get_logger
from backend.core.models import (
    User, Token, PlanType, 
    SubscriptionStatusResponse, SubscriptionPlan, SubscriptionStatus
)
from backend.core.security import get_token_payload
from backend.auth.schemas import OAuthTokenResponse
from backend.utils.linkid_utils import encode_user_seq

logger = get_logger(__name__)


class AuthService:
    TABLE_USERS = "users"
    TABLE_USER_PLANS = "user_plans"
    
    def generate_oauth_state(self) -> str:
        """CSRF 방지용 state 파라미터 생성"""
        return secrets.token_urlsafe(32)
    
    def get_oauth_login_url(self, state: str) -> str:
        """PPOP Auth 로그인 URL 생성"""
        if not settings.PPOP_AUTH_CLIENT_URL:
            raise ValueError("PPOP_AUTH_CLIENT_URL is not configured")
        
        # URL 정규화: 끝에 슬래시가 있으면 제거
        client_url = settings.PPOP_AUTH_CLIENT_URL.rstrip("/")
        
        params = {
            "client_id": settings.PPOP_AUTH_CLIENT_ID,
            "redirect_uri": settings.PPOP_AUTH_REDIRECT_URI,
            "response_type": "code",
            "state": state
        }
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{client_url}/oauth/authorize?{query_string}"
    
    async def exchange_code_for_token(self, code: str) -> OAuthTokenResponse:
        """
        인가 코드를 토큰으로 교환
        
        Args:
            code: PPOP Auth에서 받은 인가 코드
            
        Returns:
            OAuthTokenResponse: 액세스 토큰, 리프레시 토큰 등
        """
        token_url = f"{settings.PPOP_AUTH_API_URL}/oauth/token"
        
        # 요청 데이터 구성
        request_data = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": settings.PPOP_AUTH_CLIENT_ID,
            "client_secret": settings.PPOP_AUTH_CLIENT_SECRET,
            "redirect_uri": settings.PPOP_AUTH_REDIRECT_URI
        }
        
        # 디버깅: 요청 정보 로깅 (client_secret은 마스킹)
        logger.info(f"Token exchange request to: {token_url}")
        logger.info(f"Request data: grant_type={request_data['grant_type']}, "
                   f"code={code[:10]}..., client_id={request_data['client_id']}, "
                   f"redirect_uri={request_data['redirect_uri']}")
        
        async with httpx.AsyncClient() as client:
            # JSON 형식으로 요청 (auth-server가 JSON을 기대함)
            response = await client.post(
                token_url,
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            # 디버깅: 응답 정보 로깅
            logger.info(f"Token exchange response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Token exchange failed: {response.status_code} - {response.text}")
                raise OAuthCodeExchangeError(detail="Failed to exchange authorization code. Please try logging in again.")
            
            token_data = response.json()
            logger.info("Token exchange successful")
            return OAuthTokenResponse(**token_data)
    
    async def refresh_tokens(self, refresh_token: str) -> OAuthTokenResponse:
        """
        리프레시 토큰으로 새 토큰 발급
        
        Args:
            refresh_token: PPOP Auth 리프레시 토큰
            
        Returns:
            OAuthTokenResponse: 새 액세스 토큰, 리프레시 토큰 등
        """
        token_url = f"{settings.PPOP_AUTH_API_URL}/oauth/token"
        
        # 요청 데이터 구성
        request_data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": settings.PPOP_AUTH_CLIENT_ID,
            "client_secret": settings.PPOP_AUTH_CLIENT_SECRET
        }
        
        # 디버깅: 요청 정보 로깅
        logger.info(f"Token refresh request to: {token_url}")
        logger.info(f"Request data: grant_type={request_data['grant_type']}, client_id={request_data['client_id']}")
        
        async with httpx.AsyncClient() as client:
            # JSON 형식으로 요청 (auth-server가 JSON을 기대함)
            response = await client.post(
                token_url,
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            # 디버깅: 응답 정보 로깅
            logger.info(f"Token refresh response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Token refresh failed: {response.status_code} - {response.text}")
                raise OAuthTokenRefreshError(detail="Failed to refresh token. Please log in again.")
            
            token_data = response.json()
            logger.info("Token refresh successful")
            return OAuthTokenResponse(**token_data)
    
    async def get_or_create_user_from_token(self, access_token: str) -> User:
        """
        토큰에서 사용자 정보를 추출하고, 없으면 생성
        
        Args:
            access_token: PPOP Auth 액세스 토큰
            
        Returns:
            User: 사용자 정보
        """
        # 토큰에서 페이로드 추출
        payload = get_token_payload(access_token)
        ppop_user_id = payload.get("sub")
        email = payload.get("email")
        phone_number = payload.get("phone_number")  # PPOP Auth에서 인증된 전화번호
        
        if not ppop_user_id:
            raise InvalidCredentialsError(detail="Invalid token: missing user ID")
        
        # 기존 사용자 조회 (PPOP user_id로)
        user = await self.get_user_by_id(UUID(ppop_user_id))
        
        if user:
            return user
        
        # 신규 사용자 생성 (PPOP Auth에서 이미 검증됨)
        logger.info(f"Creating new user from PPOP Auth: {ppop_user_id}")
        user = await self._create_user_from_ppop(UUID(ppop_user_id), email, phone_number)
        return user
    
    async def _create_user_from_ppop(self, ppop_user_id: UUID, email: Optional[str], phone_number: Optional[str] = None) -> User:
        """
        PPOP Auth 사용자 정보로 새 사용자 생성
        
        Args:
            ppop_user_id: PPOP Auth user_id (UUID)
            email: 사용자 이메일
            phone_number: 사용자 전화번호 (PPOP Auth에서 인증된 번호)
            
        Returns:
            User: 생성된 사용자
        """
        now = datetime.utcnow().isoformat()
        
        # username 생성 (이메일 앞부분 또는 랜덤)
        if email:
            base_username = email.split("@")[0]
            username = await self._generate_unique_username(base_username)
        else:
            username = await self._generate_unique_username(f"user_{str(ppop_user_id)[:8]}")
        
        user_data = {
            "id": str(ppop_user_id),  # PPOP Auth의 user_id를 그대로 사용
            "username": username,
            "email": email or f"{ppop_user_id}@ppop.auth",  # 이메일이 없으면 임시 이메일
            "phone_number": phone_number,  # PPOP Auth에서 인증된 전화번호
            "password_hash": None,  # PPOP Auth 사용자는 비밀번호 없음
            "display_name": username,
            "theme": "default",
            "is_active": True,
            "is_admin": False,
            "created_at": now,
        }
        
        result = db.table(self.TABLE_USERS).insert(user_data).execute()
        
        if not result.data:
            raise DatabaseError(detail="Failed to create user")
        
        # public_link_id 생성
        user_seq = result.data[0].get("user_seq")
        if user_seq:
            public_link_id = encode_user_seq(user_seq)
            db.table(self.TABLE_USERS).update(
                {"public_link_id": public_link_id}
            ).eq("id", str(ppop_user_id)).execute()
            result.data[0]["public_link_id"] = public_link_id
        
        # BASIC 플랜 생성 (로컬 DB에 저장, 실제 구독은 PPOP Auth에서 관리)
        from uuid import uuid4
        plan_data = {
            "id": str(uuid4()),
            "user_id": str(ppop_user_id),
            "plan_type": PlanType.BASIC.value,
            "started_at": now,
        }
        db.table(self.TABLE_USER_PLANS).insert(plan_data).execute()
        
        user = self._map_to_user(result.data[0])
        
        # PPOP Auth에서 BASIC 플랜 활성화
        if email:
            try:
                await self.activate_basic_subscription(email, ppop_user_id)
                logger.info(f"BASIC subscription activated for user: {email}")
            except Exception as e:
                logger.error(f"Failed to activate BASIC subscription for {email}: {e}")
                # 구독 활성화 실패 시 에러 반환
                raise DatabaseError(
                    detail="User created but subscription activation failed. Please contact support."
                )
        
        logger.info(f"User created from PPOP Auth: {user.username}, public_link_id: {user.public_link_id}")
        return user
    
    async def _generate_unique_username(self, base_username: str) -> str:
        """고유한 username 생성"""
        # 영숫자와 언더스코어만 허용
        clean_username = "".join(c for c in base_username if c.isalnum() or c == "_")
        if not clean_username:
            clean_username = "user"
        
        # 길이 제한
        clean_username = clean_username[:40]
        
        # 중복 확인
        username = clean_username
        counter = 1
        while True:
            result = db.table(self.TABLE_USERS).select("id").eq("username", username).execute()
            if not result.data:
                return username
            username = f"{clean_username}_{counter}"
            counter += 1
            if counter > 1000:
                # 안전장치
                username = f"{clean_username}_{secrets.token_hex(4)}"
                break
        return username
    
    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """user_id로 사용자 조회"""
        result = db.table(self.TABLE_USERS).select("*").eq("id", str(user_id)).execute()
        
        if not result.data:
            return None
        
        return self._map_to_user(result.data[0])
    
    async def get_subscription_status(self, access_token: str) -> SubscriptionStatusResponse:
        """
        PPOP Auth에서 구독 상태 조회
        
        Args:
            access_token: PPOP Auth 액세스 토큰
            
        Returns:
            SubscriptionStatusResponse: 구독 상태 정보
            
        Raises:
            InvalidCredentialsError: 토큰이 유효하지 않음
            ServiceNotFoundError: 서비스 코드가 존재하지 않음
            SubscriptionError: 구독 상태 조회 실패
        """
        if not settings.PPOP_AUTH_API_URL or not settings.PPOP_AUTH_SERVICE_CODE:
            raise SubscriptionError(detail="PPOP Auth configuration is missing")
        
        subscription_url = f"{settings.PPOP_AUTH_API_URL}/api/subscriptions/{settings.PPOP_AUTH_SERVICE_CODE}"
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    subscription_url,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 401:
                    logger.warning("Token is invalid or expired")
                    raise InvalidCredentialsError(detail="Token expired or invalid")
                
                if response.status_code == 404:
                    logger.error(f"Service code not found: {settings.PPOP_AUTH_SERVICE_CODE}")
                    raise ServiceNotFoundError(
                        detail=f"Service code '{settings.PPOP_AUTH_SERVICE_CODE}' not found. Please contact administrator."
                    )
                
                if response.status_code != 200:
                    logger.error(f"Failed to get subscription status: {response.status_code} - {response.text}")
                    raise SubscriptionError(
                        detail=f"Failed to check subscription status: {response.status_code}"
                    )
                
                data = response.json()
                expires_at = None
                if data.get("expiresAt"):
                    try:
                        # ISO 8601 형식 파싱 (Z를 +00:00로 변환)
                        expires_str = data["expiresAt"].replace("Z", "+00:00")
                        expires_at = datetime.fromisoformat(expires_str)
                    except (ValueError, AttributeError) as e:
                        logger.warning(f"Failed to parse expiresAt: {data.get('expiresAt')}, error: {e}")
                        expires_at = None
                
                return SubscriptionStatusResponse(
                    hasAccess=data.get("hasAccess", False),
                    plan=SubscriptionPlan(data.get("plan", "BASIC")),
                    status=SubscriptionStatus(data.get("status", "NONE")),
                    expiresAt=expires_at
                )
                
        except httpx.TimeoutException as e:
            logger.error(f"Timeout while checking subscription status: {e}")
            raise SubscriptionError(detail="Network timeout while checking subscription status")
        except httpx.RequestError as e:
            logger.error(f"Network error while checking subscription status: {e}")
            raise SubscriptionError(detail="Network error while checking subscription status")
        except (InvalidCredentialsError, ServiceNotFoundError, SubscriptionError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error while checking subscription status: {e}")
            raise SubscriptionError(detail="Unexpected error while checking subscription status")
    
    async def activate_basic_subscription(self, email: str, user_id: UUID) -> None:
        """
        PPOP Auth 관리자 API를 통해 BASIC 플랜 활성화
        
        Args:
            email: 사용자 이메일
            user_id: 사용자 ID (UUID)
            
        Raises:
            SubscriptionError: 구독 활성화 실패
        """
        if not settings.PPOP_AUTH_API_URL or not settings.PPOP_AUTH_ADMIN_API_KEY:
            raise SubscriptionError(detail="PPOP Auth admin configuration is missing")
        
        activate_url = f"{settings.PPOP_AUTH_API_URL}/api/admin/subscriptions/activate"
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    activate_url,
                    json={
                        "email": email,
                        "serviceCode": settings.PPOP_AUTH_SERVICE_CODE,
                        "plan": "BASIC"
                    },
                    headers={
                        "x-api-key": settings.PPOP_AUTH_ADMIN_API_KEY,
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 404:
                    error_data = response.json()
                    logger.error(f"User not found in PPOP Auth: {email}")
                    raise SubscriptionError(
                        detail=f"User not found in PPOP Auth: {email}. Please ensure the user exists."
                    )
                
                if response.status_code != 200:
                    logger.error(f"Failed to activate BASIC subscription: {response.status_code} - {response.text}")
                    raise SubscriptionError(
                        detail=f"Failed to activate BASIC subscription: {response.status_code}"
                    )
                
                result = response.json()
                if not result.get("success", False):
                    logger.error(f"Subscription activation returned failure: {result}")
                    raise SubscriptionError(
                        detail=result.get("message", "Failed to activate BASIC subscription")
                    )
                
                logger.info(f"BASIC subscription activated for {email}")
                
        except httpx.TimeoutException as e:
            logger.error(f"Timeout while activating subscription: {e}")
            raise SubscriptionError(detail="Network timeout while activating subscription")
        except httpx.RequestError as e:
            logger.error(f"Network error while activating subscription: {e}")
            raise SubscriptionError(detail="Network error while activating subscription")
        except SubscriptionError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error while activating subscription: {e}")
            raise SubscriptionError(detail="Unexpected error while activating subscription")
    
    async def check_user_subscription_by_user_id(self, user_id: str) -> bool:
        """
        사용자 ID로 PRO 구독 상태 확인 (관리자 API 사용)
        
        Note: PPOP Auth 관리자 API의 정확한 엔드포인트 구조에 따라 수정이 필요할 수 있습니다.
        현재는 가정에 기반한 구현이며, 실제 API 구조에 맞게 조정이 필요합니다.
        
        Args:
            user_id: PPOP Auth 사용자 ID (UUID 문자열)
            
        Returns:
            bool: PRO 사용자이고 ACTIVE 상태이면 True, 그 외에는 False
        """
        if not settings.PPOP_AUTH_API_URL or not settings.PPOP_AUTH_ADMIN_API_KEY or not settings.PPOP_AUTH_SERVICE_CODE:
            logger.warning("PPOP Auth admin configuration is missing, returning False for subscription check")
            return False
        
        # 관리자 API로 구독 상태 확인
        # PPOP Auth 관리자 API 구조에 따라 엔드포인트가 다를 수 있음
        # 예시: /api/admin/users/{user_id}/subscriptions/{service_code}
        # 또는: /api/admin/subscriptions/{service_code}?userId={user_id}
        subscription_url = f"{settings.PPOP_AUTH_API_URL}/api/admin/users/{user_id}/subscriptions/{settings.PPOP_AUTH_SERVICE_CODE}"
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    subscription_url,
                    headers={
                        "x-api-key": settings.PPOP_AUTH_ADMIN_API_KEY,
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 404:
                    # 사용자 또는 구독을 찾을 수 없으면 False 반환
                    logger.debug(f"User or subscription not found: {user_id}")
                    return False
                
                if response.status_code != 200:
                    logger.warning(f"Failed to check subscription by user_id: {response.status_code} - {response.text}")
                    return False
                
                data = response.json()
                plan = data.get("plan", "BASIC")
                status = data.get("status", "NONE")
                has_access = data.get("hasAccess", False)
                
                # PRO 플랜이고 ACTIVE 상태이며 접근 권한이 있으면 True
                is_pro = (plan == "PRO" and status == "ACTIVE" and has_access)
                logger.debug(f"Subscription check for {user_id}: plan={plan}, status={status}, hasAccess={has_access}, is_pro={is_pro}")
                return is_pro
                
        except httpx.TimeoutException:
            logger.warning(f"Timeout while checking subscription by user_id: {user_id}")
            return False
        except httpx.RequestError as e:
            logger.warning(f"Network error while checking subscription by user_id: {user_id}, error: {e}")
            return False
        except Exception as e:
            logger.warning(f"Unexpected error while checking subscription by user_id: {user_id}, error: {e}")
            return False
    
    def _map_to_user(self, data: dict) -> User:
        """DB 데이터를 User 모델로 변환"""
        return User(
            id=data["id"],
            user_seq=data.get("user_seq"),
            public_link_id=data.get("public_link_id"),
            username=data["username"],
            email=data["email"],
            phone_number=data.get("phone_number"),
            display_name=data.get("display_name"),
            bio=data.get("bio"),
            profile_image_url=data.get("profile_image_url"),
            background_image_url=data.get("background_image_url"),
            background_color=data.get("background_color"),
            theme=data.get("theme", "default"),
            button_style=data.get("button_style", "default"),
            is_active=data.get("is_active", True),
            is_admin=data.get("is_admin", False),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
        )


auth_service = AuthService()
