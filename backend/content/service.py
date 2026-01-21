"""
컨텐츠 서비스 로직
"""

from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from backend.core.database import db
from backend.core.exceptions import NotFoundError, DatabaseError
from backend.core.logger import get_logger
from backend.content.schemas import Content, ContentCreate, ContentUpdate

logger = get_logger(__name__)


class ContentService:
    TABLE_CONTENT = "content"
    
    async def get_all_content(
        self,
        published_only: bool = True,
        category: Optional[str] = None
    ) -> List[Content]:
        """
        모든 컨텐츠 조회
        
        Args:
            published_only: 발행된 컨텐츠만 조회 (기본값: True)
            category: 카테고리 필터 (선택사항)
        """
        # 동적 쿼리 생성
        conditions = []
        params = []
        
        if published_only:
            conditions.append("is_published = %s")
            params.append(True)
        
        if category:
            conditions.append("category = %s")
            params.append(category)
        
        query = "SELECT * FROM content"
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY published_at DESC"
        
        rows = db.execute(query, tuple(params) if params else None)
        
        return [self._map_to_content(item) for item in rows]
    
    async def get_content_by_slug(self, slug: str, published_only: bool = True) -> Content:
        """
        slug로 컨텐츠 조회
        
        Args:
            slug: 컨텐츠 slug
            published_only: 발행된 컨텐츠만 조회 (기본값: True)
        """
        if published_only:
            result = db.execute(
                "SELECT * FROM content WHERE slug = %s AND is_published = %s",
                (slug, True),
                fetch_one=True
            )
        else:
            result = db.execute(
                "SELECT * FROM content WHERE slug = %s",
                (slug,),
                fetch_one=True
            )
        
        if not result:
            raise NotFoundError(detail=f"Content not found: {slug}")
        
        return self._map_to_content(result)
    
    async def create_content(
        self,
        content_data: ContentCreate,
        author_id: UUID
    ) -> Content:
        """
        새 컨텐츠 생성
        
        Args:
            content_data: 컨텐츠 데이터
            author_id: 작성자 ID
        """
        now = datetime.utcnow()
        
        # slug 중복 확인
        existing = db.execute(
            "SELECT id FROM content WHERE slug = %s",
            (content_data.slug,),
            fetch_one=True
        )
        
        if existing:
            raise DatabaseError(detail=f"Content with slug '{content_data.slug}' already exists")
        
        result = db.execute_returning(
            """
            INSERT INTO content (slug, title, description, content, category, author_id, is_published, published_at, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (content_data.slug, content_data.title, content_data.description,
             content_data.content, content_data.category, str(author_id),
             content_data.is_published, now if content_data.is_published else None, now)
        )
        
        if not result:
            raise DatabaseError(detail="Failed to create content")
        
        logger.info(f"Content created: {content_data.slug} by {author_id}")
        return self._map_to_content(result)
    
    async def update_content(
        self,
        slug: str,
        content_data: ContentUpdate
    ) -> Content:
        """
        컨텐츠 업데이트
        
        Args:
            slug: 컨텐츠 slug
            content_data: 업데이트할 데이터
        """
        # 기존 컨텐츠 확인
        existing = db.execute(
            "SELECT * FROM content WHERE slug = %s",
            (slug,),
            fetch_one=True
        )
        
        if not existing:
            raise NotFoundError(detail=f"Content not found: {slug}")
        
        # 업데이트할 데이터 준비
        update_data = {}
        
        if content_data.slug is not None and content_data.slug != slug:
            # slug 변경 시 중복 확인
            slug_check = db.execute(
                "SELECT id FROM content WHERE slug = %s",
                (content_data.slug,),
                fetch_one=True
            )
            if slug_check:
                raise DatabaseError(detail=f"Content with slug '{content_data.slug}' already exists")
            update_data["slug"] = content_data.slug
        
        if content_data.title is not None:
            update_data["title"] = content_data.title
        
        if content_data.description is not None:
            update_data["description"] = content_data.description
        
        if content_data.content is not None:
            update_data["content"] = content_data.content
        
        if content_data.category is not None:
            update_data["category"] = content_data.category
        
        if content_data.is_published is not None:
            update_data["is_published"] = content_data.is_published
            # 발행 상태가 변경되면 published_at 업데이트
            if content_data.is_published and not existing.get("is_published"):
                update_data["published_at"] = datetime.utcnow()
        
        if not update_data:
            # 변경사항 없음
            return self._map_to_content(existing)
        
        update_data["updated_at"] = datetime.utcnow()
        
        # 동적 UPDATE 쿼리 생성
        set_clause = ", ".join([f"{key} = %s" for key in update_data.keys()])
        values = list(update_data.values()) + [slug]
        
        result = db.execute_returning(
            f"UPDATE content SET {set_clause} WHERE slug = %s RETURNING *",
            tuple(values)
        )
        
        if not result:
            raise DatabaseError(detail="Failed to update content")
        
        logger.info(f"Content updated: {slug}")
        return self._map_to_content(result)
    
    async def delete_content(self, slug: str) -> None:
        """
        컨텐츠 삭제
        
        Args:
            slug: 컨텐츠 slug
        """
        # 먼저 존재 여부 확인
        existing = db.execute(
            "SELECT id FROM content WHERE slug = %s",
            (slug,),
            fetch_one=True
        )
        
        if not existing:
            raise NotFoundError(detail=f"Content not found: {slug}")
        
        db.execute(
            "DELETE FROM content WHERE slug = %s",
            (slug,)
        )
        
        logger.info(f"Content deleted: {slug}")
    
    def _map_to_content(self, data: dict) -> Content:
        """DB 데이터를 Content 모델로 변환"""
        return Content(
            id=data["id"],
            slug=data["slug"],
            title=data["title"],
            description=data["description"],
            content=data["content"],
            category=data["category"],
            author_id=data.get("author_id"),
            is_published=data.get("is_published", False),
            published_at=data.get("published_at"),
            created_at=data["created_at"],
            updated_at=data.get("updated_at")
        )


content_service = ContentService()
