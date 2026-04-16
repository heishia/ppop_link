"""
파일 업로드 서비스 (Railway Buckets - S3 호환)
"""

from typing import Optional
from uuid import UUID, uuid4
import mimetypes

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from fastapi import UploadFile

from backend.core.config import settings
from backend.core.exceptions import (
    FileUploadError,
    FileSizeExceededError,
    InvalidFileTypeError
)
from backend.core.logger import get_logger

logger = get_logger(__name__)

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]


def get_s3_client():
    """S3 클라이언트 생성 (Railway Buckets용 - virtual-hosted-style)"""
    if not settings.S3_ENDPOINT_URL:
        raise ValueError("S3_ENDPOINT_URL is not configured")
    
    # Railway Buckets uses virtual-hosted-style URLs
    # Use base endpoint and let boto3 construct virtual-hosted URLs
    return boto3.client(
        's3',
        endpoint_url=settings.S3_ENDPOINT_URL,  # https://storage.railway.app
        aws_access_key_id=settings.S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
        region_name=settings.S3_REGION,
        config=Config(
            signature_version='s3v4',
            s3={'addressing_style': 'virtual'}  # virtual-hosted-style 사용
        )
    )


class FileService:
    def __init__(self):
        self._s3_client = None
    
    @property
    def s3(self):
        """Lazy loading S3 client"""
        if self._s3_client is None:
            self._s3_client = get_s3_client()
        return self._s3_client
    
    def _get_bucket_name(self, bucket_type: str) -> str:
        """버킷 이름 반환 (Railway Buckets는 단일 버킷 사용)"""
        # Railway Buckets는 보통 단일 버킷을 사용하고, prefix로 구분
        return settings.S3_BUCKET_NAME
    
    def _get_public_url(self, file_path: str) -> str:
        """파일의 공개 URL 생성 (Presigned URL 사용)"""
        # Presigned URL 생성 (7일 유효) - CDN 없이 직접 접근 가능
        try:
            presigned_url = self.s3.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': settings.S3_BUCKET_NAME,
                    'Key': file_path,
                },
                ExpiresIn=604800  # 7일 (7 * 24 * 60 * 60)
            )
            return presigned_url
        except Exception as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            # 실패 시 기본 URL 반환
            bucket = settings.S3_BUCKET_NAME
            return f"https://{bucket}.storage.railway.app/{file_path}"
    
    def create_presigned_upload_url(
        self,
        bucket: str,
        user_id: UUID,
        prefix: str,
        extension: str = ".jpg"
    ) -> dict:
        """Presigned URL 생성 (업로드용)"""
        file_name = f"{prefix}_{user_id}_{uuid4().hex[:8]}{extension}"
        file_path = f"{bucket}/{user_id}/{file_name}"
        
        try:
            bucket_name = self._get_bucket_name(bucket)
            
            # Presigned URL 생성 (PUT용)
            presigned_url = self.s3.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': bucket_name,
                    'Key': file_path,
                    'ContentType': 'image/jpeg',
                    'ACL': 'public-read'  # 공개 읽기 권한 설정
                },
                ExpiresIn=3600  # 1시간
            )
            
            public_url = self._get_public_url(file_path)
            
            logger.info(f"Presigned URL created: {file_path}")
            return {
                "signed_url": presigned_url,
                "token": None,
                "path": file_path,
                "file_path": file_path,
                "public_url": public_url
            }
        except ClientError as e:
            logger.error(f"Failed to create presigned URL: {e}")
            raise FileUploadError(detail=str(e))
        except Exception as e:
            logger.error(f"Failed to create presigned URL: {e}")
            raise FileUploadError(detail=str(e))
    
    def create_profile_image_presigned_url(self, user_id: UUID) -> dict:
        return self.create_presigned_upload_url(
            bucket=settings.STORAGE_BUCKET_PROFILES,
            user_id=user_id,
            prefix="profile"
        )
    
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
        file_path = f"{settings.STORAGE_BUCKET_CONTENT_IMAGES}/content/{user_id}/{file_name}"
        
        try:
            content = await file.read()
            bucket_name = self._get_bucket_name(settings.STORAGE_BUCKET_CONTENT_IMAGES)
            
            self.s3.put_object(
                Bucket=bucket_name,
                Key=file_path,
                Body=content,
                ContentType=file.content_type or 'image/jpeg',
                ACL='public-read'  # 공개 읽기 권한 설정
            )
            
            public_url = self._get_public_url(file_path)
            
            logger.info(f"Content image uploaded: {file_path}")
            return public_url, file_path
            
        except ClientError as e:
            logger.error(f"Content image upload failed: {e}")
            raise FileUploadError(detail=str(e))
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
        file_path = f"{bucket}/{user_id}/{file_name}"
        
        try:
            content = await file.read()
            bucket_name = self._get_bucket_name(bucket)
            
            self.s3.put_object(
                Bucket=bucket_name,
                Key=file_path,
                Body=content,
                ContentType=file.content_type or 'image/jpeg',
                ACL='public-read'
            )
            
            public_url = self._get_public_url(file_path)
            
            logger.info(f"File uploaded: {file_path}")
            return public_url
            
        except ClientError as e:
            logger.error(f"File upload failed: {e}")
            raise FileUploadError(detail=str(e))
        except Exception as e:
            logger.error(f"File upload failed: {e}")
            raise FileUploadError(detail=str(e))
    
    async def delete_file(self, bucket: str, file_path: str) -> bool:
        """파일 삭제"""
        try:
            bucket_name = self._get_bucket_name(bucket)
            self.s3.delete_object(Bucket=bucket_name, Key=file_path)
            logger.info(f"File deleted: {file_path}")
            return True
        except ClientError as e:
            logger.error(f"File delete failed: {e}")
            return False
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
