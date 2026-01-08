"""
Discord 웹훅 알림 서비스
보안 이벤트, 에러 등을 Discord로 알림
"""

import asyncio
from datetime import datetime
from typing import Optional
import httpx

from backend.core.config import settings
from backend.core.logger import get_logger

logger = get_logger(__name__)


class DiscordService:
    
    COLORS = {
        "info": 0x3498DB,
        "warning": 0xF39C12,
        "error": 0xE74C3C,
        "success": 0x2ECC71,
    }
    
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
    
    @property
    def webhook_url(self) -> str:
        return settings.DISCORD_WEBHOOK_URL
    
    @property
    def is_enabled(self) -> bool:
        return bool(self.webhook_url)
    
    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=10.0)
        return self._client
    
    async def send_embed(
        self,
        title: str,
        description: str,
        color: str = "info",
        fields: Optional[list] = None,
    ):
        if not self.is_enabled:
            logger.debug("Discord webhook not configured, skipping notification")
            return
        
        embed = {
            "title": title,
            "description": description,
            "color": self.COLORS.get(color, self.COLORS["info"]),
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {"text": "PPOPLINK Security"},
        }
        
        if fields:
            embed["fields"] = fields
        
        payload = {"embeds": [embed]}
        
        try:
            client = await self._get_client()
            response = await client.post(self.webhook_url, json=payload)
            
            if response.status_code == 429:
                retry_after = response.json().get("retry_after", 1)
                logger.warning(f"Discord rate limited, retry after {retry_after}s")
                await asyncio.sleep(retry_after)
                await client.post(self.webhook_url, json=payload)
            elif response.status_code >= 400:
                logger.error(f"Discord webhook failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Failed to send Discord notification: {e}")
    
    async def send_security_alert(
        self,
        event_type: str,
        ip_address: str,
        path: str,
        user_agent: Optional[str] = None,
        reason: Optional[str] = None,
    ):
        title = f"🚨 보안 알림: {event_type}"
        description = f"의심스러운 활동이 감지되었습니다."
        
        fields = [
            {"name": "IP 주소", "value": f"`{ip_address}`", "inline": True},
            {"name": "경로", "value": f"`{path}`", "inline": True},
        ]
        
        if user_agent:
            ua_short = user_agent[:100] + "..." if len(user_agent) > 100 else user_agent
            fields.append({"name": "User-Agent", "value": f"`{ua_short}`", "inline": False})
        
        if reason:
            fields.append({"name": "이유", "value": reason, "inline": False})
        
        await self.send_embed(title, description, "warning", fields)
    
    async def send_rate_limit_alert(
        self,
        ip_address: str,
        path: str,
        limit_info: str,
    ):
        title = "⚠️ Rate Limit 초과"
        description = "API 요청 한도를 초과했습니다."
        
        fields = [
            {"name": "IP 주소", "value": f"`{ip_address}`", "inline": True},
            {"name": "경로", "value": f"`{path}`", "inline": True},
            {"name": "제한", "value": limit_info, "inline": False},
        ]
        
        await self.send_embed(title, description, "warning", fields)
    
    async def send_error_alert(
        self,
        error_type: str,
        message: str,
        details: Optional[str] = None,
    ):
        title = f"❌ 에러 발생: {error_type}"
        description = message
        
        fields = []
        if details:
            detail_short = details[:500] + "..." if len(details) > 500 else details
            fields.append({"name": "상세", "value": f"```{detail_short}```", "inline": False})
        
        await self.send_embed(title, description, "error", fields)
    
    async def send_info(self, title: str, message: str):
        await self.send_embed(f"ℹ️ {title}", message, "info")


discord_service = DiscordService()
