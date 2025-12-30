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
    
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    
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
    MAX_FILE_SIZE_MB: int = 5
    
    # Plan Limits
    FREE_MAX_LINKS: int = 6
    FREE_MAX_SOCIAL_LINKS: int = 5
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """CORS 허용 오리진 목록"""
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        # PPOP Auth 클라이언트 도메인이 설정되어 있으면 추가
        if self.PPOP_AUTH_CLIENT_ORIGIN:
            origins.append(self.PPOP_AUTH_CLIENT_ORIGIN.strip())
        return origins
    
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
        
        if not settings.SUPABASE_URL:
            missing_vars.append("SUPABASE_URL")
        elif settings.SUPABASE_URL == "https://xxxx.supabase.co":
            invalid_vars.append("SUPABASE_URL (placeholder value detected)")
        
        if not settings.SUPABASE_KEY:
            missing_vars.append("SUPABASE_KEY")
        
        # 프로덕션 환경에서는 더 엄격한 검증
        if settings.APP_ENV == "prod":
            if not settings.SUPABASE_SERVICE_KEY:
                missing_vars.append("SUPABASE_SERVICE_KEY (recommended for production)")
        
        if missing_vars or invalid_vars:
            import sys
            print("=" * 60)
            print("ERROR: Environment Configuration Issues Detected")
            print("=" * 60)
            
            if missing_vars:
                print("\nMissing required environment variables:")
                for var in missing_vars:
                    print(f"  ❌ {var}")
            
            if invalid_vars:
                print("\nInvalid environment variable values:")
                for var in invalid_vars:
                    print(f"  ⚠️  {var}")
            
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
            print("  SUPABASE_URL=https://your-project.supabase.co")
            print("  SUPABASE_KEY=your-anon-key")
            print("  SUPABASE_SERVICE_KEY=your-service-role-key")
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
        print("  - SUPABASE_URL")
        print("  - SUPABASE_KEY")
        print("  - PPOP_AUTH_API_URL")
        print("  - PPOP_AUTH_CLIENT_URL")
        print("  - PPOP_AUTH_CLIENT_ID")
        print("  - PPOP_AUTH_CLIENT_SECRET")
        print("  - PPOP_AUTH_REDIRECT_URI")
        print("  - PPOP_AUTH_JWKS_URI")
        print()
        print("Please create a .env.local file in the project root with these variables.")
        print("Example:")
        print("  SUPABASE_URL=https://your-project.supabase.co")
        print("  SUPABASE_KEY=your-anon-key")
        print("  PPOP_AUTH_API_URL=https://auth-api.yourdomain.com")
        print("  PPOP_AUTH_CLIENT_ID=your-client-id")
        print("=" * 60)
        sys.exit(1)


settings = get_settings()

