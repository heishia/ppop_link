"""
파일 업로드 서비스 (Supabase Storage)
"""

from typing import Optional
from uuid import UUID, uuid4
import mimetypes

from fastapi import UploadFile

from backend.core.config import settings
from backend.core.database import db
from backend.core.exceptions import (
    FileUploadError,
    FileSizeExceededError,
    InvalidFileTypeError
)
from backend.core.logger import get_logger

logger = get_logger(__name__)

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]


class FileService:
    async def upload_profile_image(
        self,
        user_id: UUID,
        file: UploadFile
    ) -> str:
        return await self._upload_image(
            bucket=settings.STORAGE_BUCKET_PROFILES,
            user_id=user_id,
            file=file,
            prefix="profile"
        )
    
    async def upload_background_image(
        self,
        user_id: UUID,
        file: UploadFile
    ) -> str:
        return await self._upload_image(
            bucket=settings.STORAGE_BUCKET_BACKGROUNDS,
            user_id=user_id,
            file=file,
            prefix="background"
        )
    
    async def upload_content_image(
        self,
        user_id: UUID,
        file: UploadFile
    ) -> tuple[str, str]:
        """
        컨텐츠 이미지 업로드
        
        Args:
            user_id: 업로드하는 사용자 ID
            file: 업로드할 파일
            
        Returns:
            (public_url, file_path): 공개 URL과 파일 경로
        """
        self._validate_file_type(file)
        await self._validate_file_size(file)
        
        extension = self._get_file_extension(file.filename)
        file_name = f"content_{uuid4().hex}{extension}"
        file_path = f"content/{user_id}/{file_name}"
        
        try:
            content = await file.read()
            
            db.storage.from_(settings.STORAGE_BUCKET_CONTENT_IMAGES).upload(
                path=file_path,
                file=content,
                file_options={"content-type": file.content_type}
            )
            
            public_url = db.storage.from_(settings.STORAGE_BUCKET_CONTENT_IMAGES).get_public_url(file_path)
            
            logger.info(f"Content image uploaded: {file_path}")
            return public_url, file_path
            
        except Exception as e:
            logger.error(f"Content image upload failed: {e}")
            raise FileUploadError(detail=str(e))
    
    async def _upload_image(
        self,
        bucket: str,
        user_id: UUID,
        file: UploadFile,
        prefix: str
    ) -> str:
        self._validate_file_type(file)
        await self._validate_file_size(file)
        
        extension = self._get_file_extension(file.filename)
        file_name = f"{prefix}_{user_id}_{uuid4().hex[:8]}{extension}"
        file_path = f"{user_id}/{file_name}"
        
        try:
            content = await file.read()
            
            db.storage.from_(bucket).upload(
                path=file_path,
                file=content,
                file_options={"content-type": file.content_type}
            )
            
            public_url = db.storage.from_(bucket).get_public_url(file_path)
            
            logger.info(f"File uploaded: {file_path}")
            return public_url
            
        except Exception as e:
            logger.error(f"File upload failed: {e}")
            raise FileUploadError(detail=str(e))
    
    async def delete_file(self, bucket: str, file_path: str) -> bool:
        try:
            db.storage.from_(bucket).remove([file_path])
            logger.info(f"File deleted: {file_path}")
            return True
        except Exception as e:
            logger.error(f"File delete failed: {e}")
            return False
    
    def _validate_file_type(self, file: UploadFile) -> None:
        content_type = file.content_type
        
        if not content_type:
            content_type, _ = mimetypes.guess_type(file.filename or "")
        
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise InvalidFileTypeError(
                detail=f"Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )
    
    async def _validate_file_size(self, file: UploadFile) -> None:
        content = await file.read()
        await file.seek(0)
        
        if len(content) > settings.max_file_size_bytes:
            raise FileSizeExceededError(
                detail=f"Max file size: {settings.MAX_FILE_SIZE_MB}MB"
            )
    
    def _get_file_extension(self, filename: Optional[str]) -> str:
        if not filename:
            return ".jpg"
        
        parts = filename.rsplit(".", 1)
        if len(parts) > 1:
            return f".{parts[1].lower()}"
        return ".jpg"


file_service = FileService()

