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
        """파일의 공개 URL 생성"""
        # CDN (public-buckets webserver)을 통한 공개 URL
        # https://cdn-domain/bucket-alias/file_path
        if settings.CDN_BASE_URL:
            cdn_base = settings.CDN_BASE_URL.rstrip('/')
            bucket_alias = settings.CDN_BUCKET_ALIAS
            return f"{cdn_base}/{bucket_alias}/{file_path}"
        
        # CDN이 설정되지 않은 경우 기존 방식 (private bucket이라 403 에러 발생 가능)
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
            
            # #region agent log - Hypothesis A: Check S3 upload params
            import json, time
            debug_log_path = "debug_upload.log"
            with open(debug_log_path, "a") as f:
                f.write(json.dumps({"hypothesisId":"A","location":"files/service.py:_upload_image","message":"S3 upload params","data":{"bucket_name":bucket_name,"file_path":file_path,"content_length":len(content),"s3_endpoint":settings.S3_ENDPOINT_URL,"s3_access_key_prefix":settings.S3_ACCESS_KEY_ID[:20] if settings.S3_ACCESS_KEY_ID else None},"timestamp":int(time.time()*1000)}) + "\n")
            # #endregion
            
            self.s3.put_object(
                Bucket=bucket_name,
                Key=file_path,
                Body=content,
                ContentType=file.content_type or 'image/jpeg',
                ACL='public-read'  # 공개 읽기 권한 설정
            )
            
            # #region agent log - Hypothesis A: S3 upload success
            with open(debug_log_path, "a") as f:
                f.write(json.dumps({"hypothesisId":"A","location":"files/service.py:_upload_image","message":"S3 upload SUCCESS","data":{"bucket_name":bucket_name,"file_path":file_path},"timestamp":int(time.time()*1000)}) + "\n")
            # #endregion
            
            public_url = self._get_public_url(file_path)
            
            # #region agent log - Hypothesis B,D: Check generated URL
            with open(debug_log_path, "a") as f:
                f.write(json.dumps({"hypothesisId":"B,D","location":"files/service.py:_upload_image","message":"Generated public URL","data":{"file_path":file_path,"public_url":public_url,"cdn_base_url":settings.CDN_BASE_URL,"cdn_bucket_alias":settings.CDN_BUCKET_ALIAS},"timestamp":int(time.time()*1000)}) + "\n")
            # #endregion
            
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
