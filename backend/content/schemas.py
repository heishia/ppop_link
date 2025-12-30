"""
컨텐츠 관련 Pydantic 스키마
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ContentBase(BaseModel):
    slug: str = Field(..., min_length=1, max_length=255)
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1, max_length=100)
    is_published: bool = False


class ContentCreate(ContentBase):
    pass


class ContentUpdate(BaseModel):
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    content: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    is_published: Optional[bool] = None


class Content(ContentBase):
    id: str
    author_id: Optional[str]
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ContentListResponse(BaseModel):
    success: bool = True
    data: List[Content]
    total: int


class ContentResponse(BaseModel):
    success: bool = True
    data: Content


class MessageResponse(BaseModel):
    success: bool = True
    message: str

