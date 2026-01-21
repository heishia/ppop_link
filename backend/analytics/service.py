"""
Analytics service logic
"""

from datetime import datetime, timedelta
from typing import List, Dict
from uuid import UUID
from collections import defaultdict

from backend.core.database import db
from backend.core.logger import get_logger
from backend.analytics.schemas import (
    LinkClickStats,
    DailyClickData,
    OverviewStats,
    AnalyticsSummary
)

logger = get_logger(__name__)


class AnalyticsService:
    TABLE_LINKS = "links"
    TABLE_CLICK_EVENTS = "click_events"
    
    async def get_analytics_summary(self, user_id: UUID) -> AnalyticsSummary:
        """Get complete analytics summary for user"""
        # 사용자의 모든 링크 조회
        links = db.execute(
            "SELECT * FROM links WHERE user_id = %s ORDER BY display_order",
            (str(user_id),)
        )
        
        # 날짜 범위 계산
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = today_start - timedelta(days=30)
        
        # 클릭 이벤트 테이블에서 상세 데이터 조회
        link_ids = [link["id"] for link in links]
        
        # 일별 클릭 데이터 조회 (최근 30일)
        daily_clicks_map = await self._get_daily_clicks(link_ids, month_start)
        
        # 기간별 클릭 수 계산
        today_clicks = await self._get_clicks_in_period(link_ids, today_start)
        week_clicks = await self._get_clicks_in_period(link_ids, week_start)
        month_clicks = await self._get_clicks_in_period(link_ids, month_start)
        
        # 링크별 상세 통계
        link_stats = []
        total_clicks = 0
        
        for link in links:
            link_id = link["id"]
            click_count = link.get("click_count", 0)
            total_clicks += click_count
            
            # 개별 링크의 기간별 클릭 수
            link_today = await self._get_link_clicks_in_period(link_id, today_start)
            link_week = await self._get_link_clicks_in_period(link_id, week_start)
            link_month = await self._get_link_clicks_in_period(link_id, month_start)
            
            link_stats.append(LinkClickStats(
                link_id=link_id,
                title=link["title"],
                url=link["url"],
                click_count=click_count,
                today_clicks=link_today,
                week_clicks=link_week,
                month_clicks=link_month
            ))
        
        # 일별 클릭 데이터 포맷팅
        daily_clicks = []
        for i in range(30):
            date = (today_start - timedelta(days=29-i)).strftime("%Y-%m-%d")
            daily_clicks.append(DailyClickData(
                date=date,
                clicks=daily_clicks_map.get(date, 0)
            ))
        
        overview = OverviewStats(
            total_clicks=total_clicks,
            total_links=len(links),
            today_clicks=today_clicks,
            week_clicks=week_clicks,
            month_clicks=month_clicks
        )
        
        return AnalyticsSummary(
            overview=overview,
            link_stats=link_stats,
            daily_clicks=daily_clicks
        )
    
    async def _get_daily_clicks(
        self, 
        link_ids: List[str], 
        start_date: datetime
    ) -> Dict[str, int]:
        """Get daily click counts for all links"""
        if not link_ids:
            return {}
        
        daily_map = defaultdict(int)
        
        try:
            # PostgreSQL에서 IN 절을 위한 플레이스홀더 생성
            placeholders = ','.join(['%s'] * len(link_ids))
            params = tuple(link_ids) + (start_date,)
            
            rows = db.execute(
                f"""
                SELECT * FROM click_events 
                WHERE link_id IN ({placeholders}) AND clicked_at >= %s
                """,
                params
            )
            
            for event in rows or []:
                clicked_at = event.get("clicked_at")
                if clicked_at:
                    if isinstance(clicked_at, str):
                        date_str = clicked_at[:10]  # YYYY-MM-DD
                    else:
                        date_str = clicked_at.strftime("%Y-%m-%d")
                    daily_map[date_str] += 1
        except Exception as e:
            # click_events 테이블이 없을 경우 빈 데이터 반환
            logger.warning(f"Failed to get daily clicks: {e}")
        
        return dict(daily_map)
    
    async def _get_clicks_in_period(
        self, 
        link_ids: List[str], 
        start_date: datetime
    ) -> int:
        """Get total clicks in a period for all links"""
        if not link_ids:
            return 0
        
        try:
            placeholders = ','.join(['%s'] * len(link_ids))
            params = tuple(link_ids) + (start_date,)
            
            result = db.execute(
                f"""
                SELECT COUNT(*) as count FROM click_events 
                WHERE link_id IN ({placeholders}) AND clicked_at >= %s
                """,
                params,
                fetch_one=True
            )
            return result["count"] if result else 0
        except Exception:
            # click_events 테이블이 없을 경우 0 반환
            return 0
    
    async def _get_link_clicks_in_period(
        self, 
        link_id: str, 
        start_date: datetime
    ) -> int:
        """Get clicks for a specific link in a period"""
        try:
            result = db.execute(
                "SELECT COUNT(*) as count FROM click_events WHERE link_id = %s AND clicked_at >= %s",
                (link_id, start_date),
                fetch_one=True
            )
            return result["count"] if result else 0
        except Exception:
            # click_events 테이블이 없을 경우 0 반환
            return 0
    
    async def record_click_event(self, link_id: UUID, user_agent: str = None, ip_address: str = None) -> None:
        """Record a click event with details"""
        try:
            db.execute(
                """
                INSERT INTO click_events (link_id, clicked_at, user_agent, ip_address)
                VALUES (%s, %s, %s, %s)
                """,
                (str(link_id), datetime.utcnow(), user_agent, ip_address)
            )
            logger.info(f"Click event recorded: link_id={link_id}")
        except Exception as e:
            # click_events 테이블이 없어도 기존 click_count는 증가됨
            logger.warning(f"Failed to record click event: {e}")


analytics_service = AnalyticsService()
