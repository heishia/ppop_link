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
        query = db.table(self.TABLE_CONTENT).select("*")
        
        if published_only:
            query = query.eq("is_published", True)
        
        if category:
            query = query.eq("category", category)
        
        result = query.order("published_at", desc=True).execute()
        
        return [self._map_to_content(item) for item in result.data]
    
    async def get_content_by_slug(self, slug: str, published_only: bool = True) -> Content:
        """
        slug로 컨텐츠 조회
        
        Args:
            slug: 컨텐츠 slug
            published_only: 발행된 컨텐츠만 조회 (기본값: True)
        """
        query = db.table(self.TABLE_CONTENT).select("*").eq("slug", slug)
        
        if published_only:
            query = query.eq("is_published", True)
        
        result = query.execute()
        
        if not result.data:
            raise NotFoundError(detail=f"Content not found: {slug}")
        
        return self._map_to_content(result.data[0])
    
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
        now = datetime.utcnow().isoformat()
        
        # slug 중복 확인
        existing = db.table(self.TABLE_CONTENT).select("id").eq(
            "slug", content_data.slug
        ).execute()
        
        if existing.data:
            raise DatabaseError(detail=f"Content with slug '{content_data.slug}' already exists")
        
        data = {
            "slug": content_data.slug,
            "title": content_data.title,
            "description": content_data.description,
            "content": content_data.content,
            "category": content_data.category,
            "author_id": str(author_id),
            "is_published": content_data.is_published,
            "published_at": now if content_data.is_published else None,
            "created_at": now,
        }
        
        result = db.table(self.TABLE_CONTENT).insert(data).execute()
        
        if not result.data:
            raise DatabaseError(detail="Failed to create content")
        
        logger.info(f"Content created: {content_data.slug} by {author_id}")
        return self._map_to_content(result.data[0])
    
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
        existing_result = db.table(self.TABLE_CONTENT).select("*").eq("slug", slug).execute()
        
        if not existing_result.data:
            raise NotFoundError(detail=f"Content not found: {slug}")
        
        existing = existing_result.data[0]
        
        # 업데이트할 데이터 준비
        update_data = {}
        
        if content_data.slug is not None and content_data.slug != slug:
            # slug 변경 시 중복 확인
            slug_check = db.table(self.TABLE_CONTENT).select("id").eq(
                "slug", content_data.slug
            ).execute()
            if slug_check.data:
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
                update_data["published_at"] = datetime.utcnow().isoformat()
        
        if not update_data:
            # 변경사항 없음
            return self._map_to_content(existing)
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = db.table(self.TABLE_CONTENT).update(update_data).eq("slug", slug).execute()
        
        if not result.data:
            raise DatabaseError(detail="Failed to update content")
        
        logger.info(f"Content updated: {slug}")
        return self._map_to_content(result.data[0])
    
    async def delete_content(self, slug: str) -> None:
        """
        컨텐츠 삭제
        
        Args:
            slug: 컨텐츠 slug
        """
        result = db.table(self.TABLE_CONTENT).delete().eq("slug", slug).execute()
        
        if not result.data:
            raise NotFoundError(detail=f"Content not found: {slug}")
        
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

