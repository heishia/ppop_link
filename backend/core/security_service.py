"""
보안 서비스
IP 블랙리스트 관리 및 위반 추적
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, List
from collections import defaultdict
import time

from backend.core.database import db
from backend.core.logger import get_logger

logger = get_logger(__name__)


class ViolationTracker:
    """메모리 기반 위반 추적 (Redis 대용)"""
    
    def __init__(self):
        # {ip_address: [(timestamp, violation_type), ...]}
        self._violations: Dict[str, List[tuple]] = defaultdict(list)
        self._cleanup_interval = 300  # 5분마다 청소
        self._last_cleanup = time.time()
    
    def add_violation(self, ip: str, violation_type: str):
        """위반 기록 추가"""
        current_time = time.time()
        
        # 주기적 청소
        if current_time - self._last_cleanup > self._cleanup_interval:
            self._cleanup_old_violations()
        
        self._violations[ip].append((current_time, violation_type))
        logger.debug(f"Violation recorded: {ip} - {violation_type}")
    
    def get_violation_count(self, ip: str, violation_type: str, window_seconds: int = 300) -> int:
        """특정 시간 창 내의 위반 횟수 조회"""
        current_time = time.time()
        cutoff_time = current_time - window_seconds
        
        violations = self._violations.get(ip, [])
        count = sum(1 for ts, vtype in violations 
                   if ts > cutoff_time and vtype == violation_type)
        return count
    
    def get_total_violations(self, ip: str, window_seconds: int = 300) -> int:
        """특정 시간 창 내의 총 위반 횟수"""
        current_time = time.time()
        cutoff_time = current_time - window_seconds
        
        violations = self._violations.get(ip, [])
        return sum(1 for ts, _ in violations if ts > cutoff_time)
    
    def _cleanup_old_violations(self):
        """5분 이상 된 위반 기록 삭제"""
        current_time = time.time()
        cutoff_time = current_time - 300
        
        for ip in list(self._violations.keys()):
            self._violations[ip] = [
                (ts, vtype) for ts, vtype in self._violations[ip]
                if ts > cutoff_time
            ]
            if not self._violations[ip]:
                del self._violations[ip]
        
        self._last_cleanup = current_time


class SecurityService:
    """보안 서비스 - IP 블랙리스트 및 위반 관리"""
    
    TABLE_BLACKLIST = "ip_blacklist"
    
    # 위반 유형 상수
    VIOLATION_RATE_LIMIT = "rate_limit"
    VIOLATION_MALICIOUS_PATTERN = "malicious_pattern"
    VIOLATION_SUSPICIOUS_ACTIVITY = "suspicious_activity"
    
    # 자동 차단 임계값
    AUTO_BLOCK_THRESHOLDS = {
        VIOLATION_RATE_LIMIT: (10, 300, 1),  # (횟수, 시간창(초), 차단시간(시간))
        VIOLATION_MALICIOUS_PATTERN: (3, 300, 24),  # 3번 이상이면 24시간 차단
        VIOLATION_SUSPICIOUS_ACTIVITY: (5, 300, 6),
    }
    
    def __init__(self):
        self._tracker = ViolationTracker()
        # 캐시: {ip: (is_blacklisted, cached_at)}
        self._cache: Dict[str, tuple] = {}
        self._cache_ttl = 60  # 60초 캐시
    
    async def is_blacklisted(self, ip: str) -> tuple[bool, Optional[str]]:
        """
        IP가 블랙리스트에 있는지 확인
        
        Returns:
            (is_blocked, reason) 튜플
        """
        # 캐시 확인
        if ip in self._cache:
            cached_result, cached_at = self._cache[ip]
            if time.time() - cached_at < self._cache_ttl:
                return cached_result
        
        try:
            # DB 조회
            result = db.table(self.TABLE_BLACKLIST).select("*").eq("ip_address", ip).execute()
            
            if not result.data:
                self._cache[ip] = ((False, None), time.time())
                return False, None
            
            record = result.data[0]
            
            # 만료 확인
            if not record["is_permanent"] and record["expires_at"]:
                expires_at = datetime.fromisoformat(record["expires_at"].replace("Z", "+00:00"))
                if datetime.now(expires_at.tzinfo) > expires_at:
                    # 만료됨 - 삭제
                    await self.remove_from_blacklist(ip)
                    self._cache[ip] = ((False, None), time.time())
                    return False, None
            
            reason = record["reason"]
            self._cache[ip] = ((True, reason), time.time())
            return True, reason
            
        except Exception as e:
            logger.error(f"Error checking blacklist for {ip}: {e}")
            # 에러 시 차단하지 않음 (서비스 가용성 우선)
            return False, None
    
    async def add_to_blacklist(
        self, 
        ip: str, 
        reason: str, 
        duration_hours: Optional[int] = 24,
        is_permanent: bool = False
    ) -> bool:
        """
        IP를 블랙리스트에 추가
        
        Args:
            ip: IP 주소
            reason: 차단 이유
            duration_hours: 차단 시간 (None이면 영구)
            is_permanent: 영구 차단 여부
        
        Returns:
            성공 여부
        """
        try:
            expires_at = None
            if not is_permanent and duration_hours:
                expires_at = (datetime.utcnow() + timedelta(hours=duration_hours)).isoformat()
            
            # 기존 레코드 확인
            existing = db.table(self.TABLE_BLACKLIST).select("*").eq("ip_address", ip).execute()
            
            if existing.data:
                # 업데이트
                db.table(self.TABLE_BLACKLIST).update({
                    "reason": reason,
                    "expires_at": expires_at,
                    "is_permanent": is_permanent,
                    "violation_count": existing.data[0]["violation_count"] + 1,
                    "last_violation_at": datetime.utcnow().isoformat()
                }).eq("ip_address", ip).execute()
                
                logger.warning(f"Updated blacklist entry for {ip}: {reason}")
            else:
                # 새로 추가
                db.table(self.TABLE_BLACKLIST).insert({
                    "ip_address": ip,
                    "reason": reason,
                    "expires_at": expires_at,
                    "is_permanent": is_permanent,
                    "violation_count": 1,
                    "last_violation_at": datetime.utcnow().isoformat()
                }).execute()
                
                logger.warning(f"Added {ip} to blacklist: {reason} (duration: {duration_hours}h)")
            
            # 캐시 무효화
            if ip in self._cache:
                del self._cache[ip]
            
            return True
            
        except Exception as e:
            logger.error(f"Error adding {ip} to blacklist: {e}")
            return False
    
    async def remove_from_blacklist(self, ip: str) -> bool:
        """IP를 블랙리스트에서 제거"""
        try:
            db.table(self.TABLE_BLACKLIST).delete().eq("ip_address", ip).execute()
            
            # 캐시 무효화
            if ip in self._cache:
                del self._cache[ip]
            
            logger.info(f"Removed {ip} from blacklist")
            return True
            
        except Exception as e:
            logger.error(f"Error removing {ip} from blacklist: {e}")
            return False
    
    def record_violation(self, ip: str, violation_type: str):
        """위반 기록"""
        self._tracker.add_violation(ip, violation_type)
    
    async def check_and_auto_blacklist(self, ip: str, violation_type: str) -> bool:
        """
        위반 횟수를 확인하고 임계값 초과 시 자동 차단
        
        Returns:
            차단 여부
        """
        if violation_type not in self.AUTO_BLOCK_THRESHOLDS:
            return False
        
        threshold, window, block_hours = self.AUTO_BLOCK_THRESHOLDS[violation_type]
        
        # 위반 기록
        self.record_violation(ip, violation_type)
        
        # 위반 횟수 확인
        violation_count = self._tracker.get_violation_count(ip, violation_type, window)
        
        if violation_count >= threshold:
            reason = f"Auto-blocked: {violation_count} {violation_type} violations in {window}s"
            success = await self.add_to_blacklist(ip, reason, block_hours)
            
            if success:
                logger.warning(f"Auto-blacklisted {ip}: {reason}")
                return True
        
        return False
    
    async def get_blacklist(self, limit: int = 100, offset: int = 0) -> List[dict]:
        """블랙리스트 조회"""
        try:
            result = db.table(self.TABLE_BLACKLIST).select("*").order(
                "blocked_at", desc=True
            ).limit(limit).offset(offset).execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error fetching blacklist: {e}")
            return []
    
    async def get_violation_stats(self) -> dict:
        """위반 통계 조회"""
        try:
            result = db.table(self.TABLE_BLACKLIST).select(
                "violation_count, reason"
            ).execute()
            
            total_blocked = len(result.data) if result.data else 0
            total_violations = sum(r["violation_count"] for r in result.data) if result.data else 0
            
            # 현재 메모리의 위반 통계
            active_ips = len(self._tracker._violations)
            
            return {
                "total_blocked_ips": total_blocked,
                "total_violations": total_violations,
                "active_monitoring_ips": active_ips,
                "cache_size": len(self._cache)
            }
            
        except Exception as e:
            logger.error(f"Error fetching violation stats: {e}")
            return {
                "total_blocked_ips": 0,
                "total_violations": 0,
                "active_monitoring_ips": 0,
                "cache_size": 0
            }


# 싱글톤 인스턴스
security_service = SecurityService()

