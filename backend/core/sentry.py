"""
Sentry configuration for error tracking and monitoring
"""

import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

from backend.core.logger import get_logger

logger = get_logger(__name__)


def init_sentry():
    """Initialize Sentry SDK"""
    sentry_dsn = os.getenv("SENTRY_DSN")
    environment = os.getenv("ENVIRONMENT", "development")
    
    if not sentry_dsn:
        logger.info("Sentry DSN not configured, skipping initialization")
        return
    
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=environment,
        integrations=[
            FastApiIntegration(
                transaction_style="endpoint",
            ),
            LoggingIntegration(
                level=None,  # Capture all logs
                event_level=None,  # Send errors as events
            ),
        ],
        # Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring
        traces_sample_rate=1.0 if environment == "development" else 0.1,
        
        # Set profiles_sample_rate to 1.0 to profile 100% of sampled transactions
        profiles_sample_rate=1.0 if environment == "development" else 0.1,
        
        # Send default PII (Personally Identifiable Information)
        send_default_pii=False,
        
        # Release tracking
        release=os.getenv("SENTRY_RELEASE", "unknown"),
        
        # Before send callback to filter events
        before_send=before_send_callback,
    )
    
    logger.info(f"Sentry initialized for environment: {environment}")


def before_send_callback(event, hint):
    """
    Filter or modify events before sending to Sentry
    """
    # Filter out health check errors
    if "request" in event and event["request"].get("url", "").endswith("/health"):
        return None
    
    # Add custom tags
    event.setdefault("tags", {})
    event["tags"]["service"] = "backend"
    
    return event


def capture_exception(error: Exception, context: dict = None):
    """
    Manually capture an exception with additional context
    
    Args:
        error: Exception to capture
        context: Additional context dictionary
    """
    if context:
        sentry_sdk.set_context("custom", context)
    
    sentry_sdk.capture_exception(error)


def set_user(user_id: str, email: str = None, username: str = None):
    """
    Set user context for Sentry events
    
    Args:
        user_id: User ID
        email: User email (optional)
        username: Username (optional)
    """
    sentry_sdk.set_user({
        "id": user_id,
        "email": email,
        "username": username,
    })


def add_breadcrumb(message: str, category: str = "custom", level: str = "info", data: dict = None):
    """
    Add a breadcrumb for better error context
    
    Args:
        message: Breadcrumb message
        category: Category (e.g., 'auth', 'database', 'custom')
        level: Log level (debug, info, warning, error, fatal)
        data: Additional data dictionary
    """
    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        level=level,
        data=data or {},
    )


def capture_security_event(
    event_type: str,
    ip_address: str,
    path: str,
    severity: str = "warning",
    **kwargs
):
    """
    보안 이벤트를 Sentry에 기록
    
    Args:
        event_type: 이벤트 유형 (malicious_pattern_blocked, rate_limit_exceeded, etc.)
        ip_address: 클라이언트 IP 주소
        path: 요청 경로
        severity: 심각도 (info, warning, error, fatal)
        **kwargs: 추가 컨텍스트 데이터
    """
    # Sentry가 초기화되지 않았으면 무시
    if not sentry_sdk.Hub.current.client:
        return
    
    # 보안 이벤트를 message로 기록
    with sentry_sdk.push_scope() as scope:
        # 태그 추가
        scope.set_tag("security_event", event_type)
        scope.set_tag("ip_address", ip_address)
        scope.set_level(severity)
        
        # 컨텍스트 추가
        scope.set_context("security", {
            "event_type": event_type,
            "ip_address": ip_address,
            "path": path,
            **kwargs
        })
        
        # 메시지 캡처
        message = f"Security Event: {event_type} from {ip_address} on {path}"
        sentry_sdk.capture_message(message, level=severity)
        
        logger.debug(f"Security event sent to Sentry: {event_type}")


def capture_rate_limit_exceeded(ip_address: str, path: str, limit: str):
    """Rate limit 초과 이벤트 기록"""
    capture_security_event(
        event_type="rate_limit_exceeded",
        ip_address=ip_address,
        path=path,
        severity="warning",
        limit=limit
    )


def capture_auto_blacklist(ip_address: str, reason: str, violation_count: int):
    """자동 블랙리스트 추가 이벤트 기록"""
    capture_security_event(
        event_type="auto_blacklist_triggered",
        ip_address=ip_address,
        path="N/A",
        severity="error",
        reason=reason,
        violation_count=violation_count
    )
