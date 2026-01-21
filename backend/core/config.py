"""
환경 설정 관리
pydantic-settings를 사용하여 .env 파일에서 설정값 로드
"""

import os
from functools import lru_cache
from typing import List, Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App Configuration
    APP_ENV: Literal["dev", "prod"] = "dev"
    APP_NAME: str = "PPOPLINK"
    APP_PORT: int = 8005
    
    # Database (Railway PostgreSQL)
    DATABASE_URL: str = ""
    
    # Storage (Railway Buckets - S3 compatible)
    S3_ENDPOINT_URL: str = ""
    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET_NAME: str = "ppoplink"
    S3_REGION: str = "auto"
    
    # PPOP Auth (SSO)
    PPOP_AUTH_API_URL: str = ""  # https://auth-api.yourdomain.com
    PPOP_AUTH_CLIENT_URL: str = ""  # https://auth.yourdomain.com
    PPOP_AUTH_CLIENT_ID: str = ""
    PPOP_AUTH_CLIENT_SECRET: str = ""
    PPOP_AUTH_REDIRECT_URI: str = ""  # https://ppoplink.site/auth/callback
    PPOP_AUTH_JWKS_URI: str = ""  # https://auth-api.yourdomain.com/.well-known/jwks.json
    PPOP_AUTH_SERVICE_CODE: str = "ppop-link"  # PPOP Auth 서비스 코드
    PPOP_AUTH_ADMIN_API_KEY: str = ""  # PPOP Auth 관리자 API 키
    
    # Server
    DEBUG: bool = True  # 개발 환경에서는 기본값을 True로 설정
    API_PREFIX: str = "/api"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:3005"  # 프로덕션은 환경변수로 설정
    PPOP_AUTH_CLIENT_ORIGIN: str = ""  # PPOP Auth 클라이언트 도메인 (CORS용, 예: https://auth-client-production-04b4.up.railway.app)
    
    # Storage
    STORAGE_BUCKET_PROFILES: str = "profiles"
    STORAGE_BUCKET_BACKGROUNDS: str = "backgrounds"
    STORAGE_BUCKET_CONTENT_IMAGES: str = "content-images"
    MAX_FILE_SIZE_MB: int = 5
    
    # Plan Limits
    FREE_MAX_LINKS: int = 6
    FREE_MAX_SOCIAL_LINKS: int = 5
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Developer IPs (로그에서 구분하기 위함)
    DEVELOPER_IPS: str = ""  # 쉼표로 구분 (예: "1.2.3.4,5.6.7.8")
    
    # Cookie Settings (for cross-origin development)
    COOKIE_SAMESITE: str = ""  # "lax", "strict", or "none" (none for cross-origin)
    
    # Discord Webhook (보안 알림용)
    DISCORD_WEBHOOK_URL: str = ""
    
    @property
    def cors_origins_list(self) -> List[str]:
        """CORS 허용 오리진 목록"""
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        # PPOP Auth 클라이언트 도메인이 설정되어 있으면 추가
        if self.PPOP_AUTH_CLIENT_ORIGIN:
            origins.append(self.PPOP_AUTH_CLIENT_ORIGIN.strip())
        return origins
    
    @property
    def developer_ips_list(self) -> List[str]:
        """개발자 IP 목록"""
        if not self.DEVELOPER_IPS:
            return []
        return [ip.strip() for ip in self.DEVELOPER_IPS.split(",") if ip.strip()]
    
    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.APP_ENV == "dev"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.APP_ENV == "prod"

    @property
    def cookie_secure(self) -> bool:
        """쿠키 Secure 플래그 (HTTPS 사용 시 True)"""
        # Railway는 HTTPS를 제공하므로 프로덕션에서 True
        return self.is_production

    @property
    def cookie_samesite(self) -> str:
        """쿠키 SameSite 설정"""
        # 환경변수로 설정 가능 (크로스 도메인 개발 시 "none" 필요)
        if self.COOKIE_SAMESITE:
            return self.COOKIE_SAMESITE.lower()
        # Railway: 프론트엔드와 백엔드가 같은 도메인이면 "lax" 사용
        # 개발: "lax" 사용 (localhost끼리는 같은 사이트)
        return "lax"

    COOKIE_DOMAIN: str = ""
    
    @property
    def cookie_domain(self) -> str | None:
        """쿠키 Domain 설정"""
        if self.COOKIE_DOMAIN:
            return self.COOKIE_DOMAIN
        return None

    model_config = SettingsConfigDict(
        # 개발: .env.local, 프로덕션: .env (또는 환경변수)
        env_file=".env.local" if os.getenv("APP_ENV", "dev") == "dev" else ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    try:
        settings = Settings()
        
        # 중요 환경변수 검증
        missing_vars = []
        invalid_vars = []
        
        # Database 검증
        if not settings.DATABASE_URL:
            missing_vars.append("DATABASE_URL")
        
        # 프로덕션 환경에서는 Storage 설정도 검증
        if settings.APP_ENV == "prod":
            if not settings.S3_ENDPOINT_URL:
                missing_vars.append("S3_ENDPOINT_URL")
            if not settings.S3_ACCESS_KEY_ID:
                missing_vars.append("S3_ACCESS_KEY_ID")
            if not settings.S3_SECRET_ACCESS_KEY:
                missing_vars.append("S3_SECRET_ACCESS_KEY")
        
        if missing_vars or invalid_vars:
            import sys
            print("=" * 60)
            print("ERROR: Environment Configuration Issues Detected")
            print("=" * 60)
            
            if missing_vars:
                print("\nMissing required environment variables:")
                for var in missing_vars:
                    print(f"  - {var}")
            
            if invalid_vars:
                print("\nInvalid environment variable values:")
                for var in invalid_vars:
                    print(f"  - {var}")
            
            print("\n" + "=" * 60)
            print("Configuration Guide:")
            print("=" * 60)
            print("\n1. For Railway deployment:")
            print("   - Go to your Railway project settings")
            print("   - Navigate to 'Variables' tab")
            print("   - Add/update the required variables")
            print("\n2. For local development:")
            print("   - Create/update .env.local file")
            print("   - Add the required variables")
            print("\nExample values:")
            print("  DATABASE_URL=postgresql://user:pass@host:5432/railway")
            print("  S3_ENDPOINT_URL=https://your-bucket.storage.railway.app")
            print("  S3_ACCESS_KEY_ID=your-access-key")
            print("  S3_SECRET_ACCESS_KEY=your-secret-key")
            print("=" * 60)
            sys.exit(1)
        
        return settings
        
    except Exception as e:
        import sys
        print("=" * 60)
        print("ERROR: Failed to load settings")
        print("=" * 60)
        print(f"Error: {e}")
        print()
        print("Required environment variables:")
        print("  - DATABASE_URL")
        print("  - PPOP_AUTH_API_URL")
        print("  - PPOP_AUTH_CLIENT_URL")
        print("  - PPOP_AUTH_CLIENT_ID")
        print("  - PPOP_AUTH_CLIENT_SECRET")
        print("  - PPOP_AUTH_REDIRECT_URI")
        print("  - PPOP_AUTH_JWKS_URI")
        print()
        print("For production, also required:")
        print("  - S3_ENDPOINT_URL")
        print("  - S3_ACCESS_KEY_ID")
        print("  - S3_SECRET_ACCESS_KEY")
        print()
        print("Please create a .env.local file in the project root with these variables.")
        print("Example:")
        print("  DATABASE_URL=postgresql://user:pass@host:5432/railway")
        print("  PPOP_AUTH_API_URL=https://auth-api.yourdomain.com")
        print("  PPOP_AUTH_CLIENT_ID=your-client-id")
        print("=" * 60)
        sys.exit(1)


settings = get_settings()

