"""
PostgreSQL 데이터베이스 연결 관리 (Railway PostgreSQL)
"""

from typing import Optional, List, Dict, Any, Tuple
from contextlib import contextmanager

import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool

from backend.core.config import settings
from backend.core.logger import get_logger

logger = get_logger(__name__)

_connection_pool: Optional[ThreadedConnectionPool] = None


def get_connection_pool() -> ThreadedConnectionPool:
    """커넥션 풀 가져오기 (싱글톤)"""
    global _connection_pool
    
    if _connection_pool is None:
        if not settings.DATABASE_URL:
            error_msg = "DATABASE_URL is not configured. Please set this environment variable."
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        try:
            _connection_pool = ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                dsn=settings.DATABASE_URL
            )
            logger.info("PostgreSQL connection pool initialized")
        except Exception as e:
            logger.error(f"Failed to create PostgreSQL connection pool: {e}")
            raise
    
    return _connection_pool


@contextmanager
def get_connection():
    """커넥션 컨텍스트 매니저"""
    pool = get_connection_pool()
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


class Database:
    """PostgreSQL 데이터베이스 클라이언트"""
    
    def execute(
        self,
        query: str,
        params: Optional[Tuple] = None,
        fetch_one: bool = False
    ) -> Optional[List[Dict[str, Any]] | Dict[str, Any]]:
        """
        SQL 쿼리 실행
        
        Args:
            query: SQL 쿼리문
            params: 쿼리 파라미터 (튜플)
            fetch_one: True면 단일 결과 반환, False면 리스트 반환
            
        Returns:
            쿼리 결과 (dict 또는 list of dict)
        """
        with get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                
                if cur.description is None:
                    # INSERT, UPDATE, DELETE 등 반환값 없는 쿼리
                    return None
                
                if fetch_one:
                    result = cur.fetchone()
                    return dict(result) if result else None
                else:
                    results = cur.fetchall()
                    return [dict(row) for row in results]
    
    def execute_returning(
        self,
        query: str,
        params: Optional[Tuple] = None
    ) -> Optional[Dict[str, Any]]:
        """
        RETURNING 절이 있는 쿼리 실행 (INSERT, UPDATE, DELETE)
        
        Args:
            query: SQL 쿼리문 (RETURNING 절 포함)
            params: 쿼리 파라미터
            
        Returns:
            반환된 행 (dict)
        """
        return self.execute(query, params, fetch_one=True)
    
    def execute_many(
        self,
        query: str,
        params_list: List[Tuple]
    ) -> None:
        """
        여러 행에 대해 쿼리 실행
        
        Args:
            query: SQL 쿼리문
            params_list: 파라미터 튜플의 리스트
        """
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.executemany(query, params_list)
    
    def count(
        self,
        table: str,
        where_clause: str = "",
        params: Optional[Tuple] = None
    ) -> int:
        """
        테이블 행 수 조회
        
        Args:
            table: 테이블명
            where_clause: WHERE 절 (WHERE 키워드 제외)
            params: 쿼리 파라미터
            
        Returns:
            행 수
        """
        query = f"SELECT COUNT(*) as count FROM {table}"
        if where_clause:
            query += f" WHERE {where_clause}"
        
        result = self.execute(query, params, fetch_one=True)
        return result["count"] if result else 0


# 싱글톤 인스턴스
db = Database()
