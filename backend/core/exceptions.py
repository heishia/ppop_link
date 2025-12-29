"""
커스텀 예외 클래스 정의
"""

from typing import Any, Optional


class BaseAppException(Exception):
    status_code: int = 500
    detail: str = "Internal server error"
    
    def __init__(
        self,
        detail: Optional[str] = None,
        status_code: Optional[int] = None,
        data: Optional[Any] = None
    ):
        self.detail = detail or self.detail
        self.status_code = status_code or self.status_code
        self.data = data
        super().__init__(self.detail)


# 인증 관련 예외
class AuthenticationError(BaseAppException):
    status_code = 401
    detail = "Authentication failed"


class InvalidCredentialsError(AuthenticationError):
    detail = "Invalid email or password"


class TokenExpiredError(AuthenticationError):
    detail = "Token has expired"


class InvalidTokenError(AuthenticationError):
    detail = "Invalid token"


# 권한 관련 예외
class AuthorizationError(BaseAppException):
    status_code = 403
    detail = "Permission denied"


class AdminRequiredError(AuthorizationError):
    detail = "Admin privileges required"


# 리소스 관련 예외
class NotFoundError(BaseAppException):
    status_code = 404
    detail = "Resource not found"


class UserNotFoundError(NotFoundError):
    detail = "User not found"


class LinkNotFoundError(NotFoundError):
    detail = "Link not found"


# 유효성 검증 예외
class ValidationError(BaseAppException):
    status_code = 422
    detail = "Validation error"


class DuplicateError(BaseAppException):
    status_code = 409
    detail = "Resource already exists"


class UsernameAlreadyExistsError(DuplicateError):
    detail = "Username already exists"


class EmailAlreadyExistsError(DuplicateError):
    detail = "Email already registered"


class PhoneAlreadyExistsError(DuplicateError):
    detail = "Phone number already registered"


# 플랜 제한 예외
class PlanLimitError(BaseAppException):
    status_code = 403
    detail = "Plan limit exceeded"


class LinkLimitExceededError(PlanLimitError):
    detail = "Link limit exceeded for your plan"


class SocialLinkLimitExceededError(PlanLimitError):
    detail = "Social link limit exceeded for your plan"


class FeatureNotAvailableError(PlanLimitError):
    detail = "This feature is not available for your plan"


# OAuth 관련 예외
class OAuthError(BaseAppException):
    """OAuth 관련 오류 (인가 코드 교환 실패 등)"""
    status_code = 400
    detail = "OAuth error occurred"


class OAuthCodeExchangeError(OAuthError):
    """인가 코드를 토큰으로 교환 실패"""
    detail = "Failed to exchange authorization code"


class OAuthTokenRefreshError(OAuthError):
    """토큰 갱신 실패"""
    detail = "Failed to refresh token"


# 파일 관련 예외
class FileUploadError(BaseAppException):
    status_code = 400
    detail = "File upload failed"


class FileSizeExceededError(FileUploadError):
    detail = "File size exceeds the limit"


class InvalidFileTypeError(FileUploadError):
    detail = "Invalid file type"


# 서버 예외
class DatabaseError(BaseAppException):
    status_code = 500
    detail = "Database error occurred"


class ExternalServiceError(BaseAppException):
    status_code = 502
    detail = "External service error"


class ServiceNotFoundError(BaseAppException):
    status_code = 404
    detail = "Service code not found"


class SubscriptionError(BaseAppException):
    status_code = 502
    detail = "Failed to check subscription status"
