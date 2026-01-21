"""
기존 사용자들의 public_link_id를 생성하는 마이그레이션 스크립트

이 스크립트는 user_seq 값이 있지만 public_link_id가 없는 사용자들에게
암호화된 공개 링크 ID를 생성합니다.

사용법:
    python scripts/migrate_public_link_ids.py

환경변수:
    DATABASE_URL: PostgreSQL 연결 URL (Railway)
"""

import os
import sys

# 프로젝트 루트를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# backend 유틸리티 import
from backend.utils.linkid_utils import encode_user_seq

# 환경변수 로드 (.env.local 파일 우선)
load_dotenv(".env.local")
load_dotenv()  # .env 파일도 fallback으로 로드


def get_db_connection():
    """PostgreSQL 연결 생성"""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        raise ValueError("DATABASE_URL must be set")
    
    return psycopg2.connect(database_url)


def migrate_public_link_ids():
    """
    public_link_id가 없는 모든 사용자에게 public_link_id 생성
    """
    print("Starting migration of public_link_ids...")
    
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # public_link_id가 없는 사용자들 조회
            cur.execute(
                "SELECT id, user_seq, username FROM users WHERE public_link_id IS NULL"
            )
            users = cur.fetchall()
        
        if not users:
            print("No users need migration.")
            return
        
        print(f"Found {len(users)} users to migrate.")
        
        success_count = 0
        error_count = 0
        
        for user in users:
            user_id = user["id"]
            user_seq = user.get("user_seq")
            username = user.get("username", "unknown")
            
            if not user_seq:
                print(f"  [SKIP] User {username} (id={user_id}) has no user_seq")
                continue
            
            try:
                # public_link_id 생성
                public_link_id = encode_user_seq(user_seq)
                
                # 업데이트
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE users SET public_link_id = %s WHERE id = %s",
                        (public_link_id, user_id)
                    )
                conn.commit()
                
                print(f"  [OK] User {username}: user_seq={user_seq} -> public_link_id={public_link_id}")
                success_count += 1
                
            except Exception as e:
                print(f"  [ERROR] User {username} (id={user_id}): {e}")
                conn.rollback()
                error_count += 1
        
        print(f"\nMigration complete!")
        print(f"  Success: {success_count}")
        print(f"  Errors: {error_count}")
        print(f"  Skipped: {len(users) - success_count - error_count}")
    
    finally:
        conn.close()


def verify_migration():
    """
    마이그레이션 결과 확인
    """
    print("\nVerifying migration...")
    
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 전체 사용자 수
            cur.execute("SELECT COUNT(*) as count FROM users")
            total_count = cur.fetchone()["count"]
            
            # public_link_id가 있는 사용자 수
            cur.execute("SELECT COUNT(*) as count FROM users WHERE public_link_id IS NOT NULL")
            with_link_id_count = cur.fetchone()["count"]
            
            # public_link_id가 없는 사용자 수
            cur.execute("SELECT COUNT(*) as count FROM users WHERE public_link_id IS NULL")
            without_link_id_count = cur.fetchone()["count"]
        
        print(f"  Total users: {total_count}")
        print(f"  With public_link_id: {with_link_id_count}")
        print(f"  Without public_link_id: {without_link_id_count}")
    
    finally:
        conn.close()


if __name__ == "__main__":
    try:
        migrate_public_link_ids()
        verify_migration()
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)
