"""
Supabase 데이터베이스 연결 관리
"""

from typing import Optional

from supabase import create_client, Client

from backend.core.config import settings
from backend.core.logger import get_logger

logger = get_logger(__name__)

_supabase_client: Optional[Client] = None
_supabase_admin_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """anon 키를 사용하는 일반 클라이언트 (RLS 적용)"""
    global _supabase_client
    
    if _supabase_client is None:
        # 환경변수 검증
        if not settings.SUPABASE_URL or settings.SUPABASE_URL == "https://xxxx.supabase.co":
            error_msg = (
                "SUPABASE_URL is not configured properly. "
                "Please set a valid Supabase URL in your environment variables. "
                f"Current value: '{settings.SUPABASE_URL}'"
            )
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        if not settings.SUPABASE_KEY:
            error_msg = "SUPABASE_KEY is not configured. Please set this environment variable."
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        try:
            _supabase_client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )
            logger.info("Supabase client initialized")
        except Exception as e:
            logger.error(f"Failed to create Supabase client: {e}")
            raise
    
    return _supabase_client


def get_supabase_admin_client() -> Client:
    """서비스 롤 키를 사용하는 관리자 클라이언트 (RLS 우회)"""
    global _supabase_admin_client
    
    if _supabase_admin_client is None:
        # 환경변수 검증
        if not settings.SUPABASE_URL or settings.SUPABASE_URL == "https://xxxx.supabase.co":
            error_msg = (
                "SUPABASE_URL is not configured properly. "
                "Please set a valid Supabase URL in your environment variables. "
                f"Current value: '{settings.SUPABASE_URL}'"
            )
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # 서비스 롤 키가 있으면 사용, 없으면 anon key 사용
        key = settings.SUPABASE_SERVICE_KEY if settings.SUPABASE_SERVICE_KEY else settings.SUPABASE_KEY
        
        if not key:
            error_msg = (
                "Neither SUPABASE_SERVICE_KEY nor SUPABASE_KEY is configured. "
                "Please set at least one of these environment variables."
            )
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        try:
            _supabase_admin_client = create_client(
                settings.SUPABASE_URL,
                key
            )
            if settings.SUPABASE_SERVICE_KEY:
                logger.info("Supabase admin client initialized with service role key")
            else:
                logger.warning("Supabase admin client using anon key - RLS will be applied")
        except Exception as e:
            logger.error(f"Failed to create Supabase client: {e}")
            raise
    
    return _supabase_admin_client


class SupabaseDB:
    """백엔드 서비스용 DB 클라이언트 - 서비스 롤 키 사용 (RLS 우회)"""
    def __init__(self):
        self._client: Optional[Client] = None
    
    @property
    def client(self) -> Client:
        if self._client is None:
            # 백엔드 서비스에서는 서비스 롤 키를 사용하여 RLS 우회
            self._client = get_supabase_admin_client()
        return self._client
    
    def table(self, name: str):
        return self.client.table(name)
    
    @property
    def storage(self):
        return self.client.storage


db = SupabaseDB()

