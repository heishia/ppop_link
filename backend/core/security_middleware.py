"""
보안 미들웨어
- 보안 헤더 추가
- 악의적인 패턴 차단
- IP 블랙리스트 확인
"""

import re
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from backend.core.logger import get_logger
from backend.core.security_service import security_service
from backend.core.config import settings

logger = get_logger(__name__)


def format_ip_for_log(ip: str) -> str:
    """로그용 IP 포맷 (개발자 IP는 [DEV] 태그 추가)"""
    if ip in settings.developer_ips_list:
        return f"[DEV] {ip}"
    return ip


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """보안 헤더를 모든 응답에 추가"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # 보안 헤더 추가
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # CSP (Content Security Policy) - 개발 환경에서는 완화
        # 프로덕션에서는 더 엄격하게 설정
        response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:;"
        
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions Policy (구 Feature-Policy)
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        return response


class MaliciousPatternMiddleware(BaseHTTPMiddleware):
    """악의적인 URL 패턴을 차단"""
    
    # 차단할 패턴들
    MALICIOUS_PATTERNS = [
        r'\.sql$',           # SQL 파일
        r'\.env',            # 환경 변수 파일
        r'\.php$',           # PHP 파일
        r'\.bak$',           # 백업 파일
        r'\.old$',           # 구 파일
        r'\.zip$',           # 압축 파일
        r'\.tar',            # 압축 파일
        r'\.gz$',            # 압축 파일
        r'\.log$',           # 로그 파일
        r'\.ini$',           # 설정 파일
        r'\.conf$',          # 설정 파일
        r'phpinfo',          # phpinfo 함수
        r'\.history$',       # 히스토리 파일
        r'\.bash_history',   # Bash 히스토리
        r'\.zsh_history',    # Zsh 히스토리
        r'\.mysql_history',  # MySQL 히스토리
        r'\.psql_history',   # PostgreSQL 히스토리
        r'\.DS_Store',       # macOS 시스템 파일
        r'\.git/',           # Git 디렉토리
        r'\.svn/',           # SVN 디렉토리
        r'\.htaccess',       # Apache 설정
        r'\.htpasswd',       # Apache 비밀번호
        r'web\.config',      # IIS 설정
        r'/database[/_]',    # 데이터베이스 관련 (경로 구분자 포함)
        r'/db_config',       # DB 설정
        r'/credentials',     # 자격증명
        r'/api_keys',        # API 키
        r'swagger\.json',    # API 스펙 (선택적)
        r'swagger\.yaml',    # API 스펙 (선택적)
    ]
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        # 패턴 컴파일
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.MALICIOUS_PATTERNS]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        
        # 패턴 매칭
        for pattern in self.compiled_patterns:
            if pattern.search(path):
                # 클라이언트 IP 가져오기
                ip = self._get_client_ip(request)
                
                # 로그 및 Sentry 기록
                logger.warning(
                    f"Malicious pattern blocked: {path} from {format_ip_for_log(ip)}",
                    extra={
                        "ip": ip,
                        "path": path,
                        "user_agent": request.headers.get("user-agent", "unknown")
                    }
                )
                
                # 위반 기록 및 자동 차단 확인
                await security_service.check_and_auto_blacklist(
                    ip, 
                    security_service.VIOLATION_MALICIOUS_PATTERN
                )
                
                # Sentry에 보안 이벤트 기록
                try:
                    from backend.core.sentry import capture_security_event
                    capture_security_event(
                        event_type="malicious_pattern_blocked",
                        ip_address=ip,
                        path=path,
                        user_agent=request.headers.get("user-agent", "unknown"),
                        severity="warning"
                    )
                except Exception as e:
                    logger.debug(f"Failed to send to Sentry: {e}")
                
                # 403 Forbidden 반환
                return JSONResponse(
                    status_code=403,
                    content={
                        "success": False,
                        "error": {
                            "message": "Forbidden"
                        }
                    }
                )
        
        return await call_next(request)
    
    def _get_client_ip(self, request: Request) -> str:
        """클라이언트 IP 주소 추출"""
        # X-Forwarded-For 헤더 확인 (프록시/로드밸런서 뒤에 있을 때)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        # X-Real-IP 헤더 확인
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # 직접 연결된 클라이언트 IP
        if request.client:
            return request.client.host
        
        return "unknown"


class IPBlacklistMiddleware(BaseHTTPMiddleware):
    """IP 블랙리스트 확인 및 차단"""
    
    # 체크하지 않을 경로들 (헬스체크 등)
    WHITELIST_PATHS = ["/health", "/"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        
        # 화이트리스트 경로는 통과
        if path in self.WHITELIST_PATHS:
            return await call_next(request)
        
        # 클라이언트 IP 가져오기
        ip = self._get_client_ip(request)
        
        # 블랙리스트 확인
        is_blocked, reason = await security_service.is_blacklisted(ip)
        
        if is_blocked:
            logger.warning(
                f"Blacklisted IP blocked: {format_ip_for_log(ip)} tried to access {path}",
                extra={
                    "ip": ip,
                    "path": path,
                    "reason": reason
                }
            )
            
            # Sentry에 보안 이벤트 기록
            try:
                from backend.core.sentry import capture_security_event
                capture_security_event(
                    event_type="ip_blacklisted_access_attempt",
                    ip_address=ip,
                    path=path,
                    reason=reason or "unknown",
                    severity="warning"
                )
            except Exception as e:
                logger.debug(f"Failed to send to Sentry: {e}")
            
            # 403 Forbidden 반환
            return JSONResponse(
                status_code=403,
                content={
                    "success": False,
                    "error": {
                        "message": "Access denied"
                    }
                }
            )
        
        return await call_next(request)
    
    def _get_client_ip(self, request: Request) -> str:
        """클라이언트 IP 주소 추출"""
        # X-Forwarded-For 헤더 확인 (프록시/로드밸런서 뒤에 있을 때)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        # X-Real-IP 헤더 확인
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # 직접 연결된 클라이언트 IP
        if request.client:
            return request.client.host
        
        return "unknown"


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """요청 크기 제한 (DoS 방지)"""
    
    def __init__(self, app: ASGIApp, max_size: int = 10 * 1024 * 1024):  # 10MB
        super().__init__(app)
        self.max_size = max_size
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Content-Length 헤더 확인
        content_length = request.headers.get("content-length")
        
        if content_length and int(content_length) > self.max_size:
            ip = request.client.host if request.client else 'unknown'
            logger.warning(
                f"Request too large: {content_length} bytes from {format_ip_for_log(ip)}"
            )
            
            return JSONResponse(
                status_code=413,
                content={
                    "success": False,
                    "error": {
                        "message": "Request entity too large",
                        "max_size_mb": self.max_size / (1024 * 1024)
                    }
                }
            )
        
        return await call_next(request)

