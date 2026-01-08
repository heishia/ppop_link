"""
FastAPI 앱 진입점
라우터 등록, 예외 핸들러 등록, 미들웨어 설정
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from backend.core.config import settings
from backend.core.exceptions import BaseAppException
from backend.core.logger import logger
from backend.core.sentry import init_sentry

# 보안 미들웨어 import
from backend.core.security_middleware import (
    SecurityHeadersMiddleware,
    MaliciousPatternMiddleware,
    IPBlacklistMiddleware,
    RequestSizeLimitMiddleware
)

# 라우터 import
from backend.auth.router import router as auth_router
from backend.profiles.router import router as profile_router
from backend.links.router import router as links_router, social_router
from backend.public.router import router as public_router
from backend.admin.router import router as admin_router
from backend.analytics.router import router as analytics_router
from backend.content.router import router as content_router


def create_app() -> FastAPI:
    try:
        logger.info("Creating FastAPI application...")
        # Initialize Sentry
        init_sentry()
        app = FastAPI(
            title="PPOPLINK API",
            description="Link in bio SaaS service API",
            version="0.1.0",
            docs_url=f"{settings.API_PREFIX}/docs" if settings.DEBUG else None,
            redoc_url=f"{settings.API_PREFIX}/redoc" if settings.DEBUG else None,
        )
        
        # Rate Limiting 설정
        limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
        app.state.limiter = limiter
        
        @app.exception_handler(RateLimitExceeded)
        async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
            ip = get_remote_address(request)
            path = request.url.path
            
            try:
                from backend.core.discord_service import discord_service
                await discord_service.send_rate_limit_alert(
                    ip_address=ip,
                    path=path,
                    limit_info=str(exc.detail)
                )
            except Exception as e:
                logger.debug(f"Failed to send Discord alert: {e}")
            
            try:
                from backend.core.security_service import security_service
                await security_service.check_and_auto_blacklist(
                    ip, 
                    security_service.VIOLATION_RATE_LIMIT
                )
            except Exception as e:
                logger.error(f"Failed to check auto-blacklist: {e}")
            
            return _rate_limit_exceeded_handler(request, exc)
        
        logger.info("Rate limiting configured: 200 requests/minute per IP")
        
        logger.info("Setting up middlewares...")
        setup_middlewares(app)
        
        logger.info("Setting up exception handlers...")
        setup_exception_handlers(app)
        
        logger.info("Setting up routers...")
        setup_routers(app)
        
        logger.info("FastAPI application created successfully")
        return app
    except Exception as e:
        logger.error(f"Failed to create FastAPI application: {e}", exc_info=True)
        raise


def setup_middlewares(app: FastAPI) -> None:
    """
    미들웨어 설정
    
    주의: 미들웨어는 역순으로 실행됩니다.
    마지막에 추가한 것이 가장 먼저 실행됩니다.
    """
    # CORS (가장 마지막에 추가 = 가장 먼저 실행)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 요청 크기 제한 (10MB)
    app.add_middleware(RequestSizeLimitMiddleware, max_size=10 * 1024 * 1024)
    logger.info("Request size limit configured: 10MB")
    
    # 악의적인 패턴 차단
    app.add_middleware(MaliciousPatternMiddleware)
    logger.info("Malicious pattern blocking enabled")
    
    # IP 블랙리스트 확인
    app.add_middleware(IPBlacklistMiddleware)
    logger.info("IP blacklist checking enabled")
    
    # 보안 헤더 추가 (가장 먼저 추가 = 가장 나중에 실행, 응답에 헤더 추가)
    app.add_middleware(SecurityHeadersMiddleware)
    logger.info("Security headers enabled")


def setup_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(BaseAppException)
    async def app_exception_handler(request: Request, exc: BaseAppException):
        logger.warning(f"AppException: {exc.detail} (status={exc.status_code})")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "message": exc.detail,
                    "data": exc.data
                }
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "message": "Internal server error"
                }
            }
        )


def setup_routers(app: FastAPI) -> None:
    logger.info(f"Setting up routers with API_PREFIX: {settings.API_PREFIX}")
    
    # 인증
    app.include_router(
        auth_router,
        prefix=f"{settings.API_PREFIX}/auth",
        tags=["Auth"]
    )
    logger.info(f"Auth router registered at {settings.API_PREFIX}/auth")
    
    # 프로필 (로그인 필요)
    app.include_router(
        profile_router,
        prefix=f"{settings.API_PREFIX}/profile",
        tags=["Profile"]
    )
    
    # 링크 관리 (로그인 필요)
    app.include_router(
        links_router,
        prefix=f"{settings.API_PREFIX}/links",
        tags=["Links"]
    )
    
    # 소셜 링크 관리 (로그인 필요)
    app.include_router(
        social_router,
        prefix=f"{settings.API_PREFIX}/social-links",
        tags=["Social Links"]
    )
    
    # 공개 프로필 페이지 (인증 불필요)
    app.include_router(
        public_router,
        prefix=f"{settings.API_PREFIX}/public",
        tags=["Public"]
    )
    
    # 관리자 (관리자 권한 필요)
    app.include_router(
        admin_router,
        prefix=f"{settings.API_PREFIX}/admin",
        tags=["Admin"]
    )
    
    # 분석 (로그인 필요)
    app.include_router(
        analytics_router,
        prefix=f"{settings.API_PREFIX}/analytics",
        tags=["Analytics"]
    )
    
    # 컨텐츠 (공개 API, 관리는 관리자 권한 필요)
    app.include_router(
        content_router,
        prefix=f"{settings.API_PREFIX}/content",
        tags=["Content"]
    )
    
    @app.get("/health")
    async def health_check():
        return {"status": "ok"}
    
    @app.get("/")
    async def root():
        return {
            "message": "PPOPLINK API",
            "version": "0.1.0",
            "docs": f"{settings.API_PREFIX}/docs" if settings.DEBUG else None
        }
    
    logger.info("Routers setup complete")


app = create_app()
