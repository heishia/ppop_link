"""
Analytics API Router
"""

from fastapi import APIRouter, Depends

from backend.core.models import User
from backend.core.logger import get_logger
from backend.auth.router import get_current_user
from backend.analytics.schemas import AnalyticsResponse
from backend.analytics.service import analytics_service

logger = get_logger(__name__)

router = APIRouter()


@router.get("", response_model=AnalyticsResponse)
async def get_analytics(
    current_user: User = Depends(get_current_user),
):
    """Get analytics summary for current user"""
    analytics = await analytics_service.get_analytics_summary(current_user.id)
    return AnalyticsResponse(data=analytics)

