"""
Railway Bucket 설정 스크립트
CORS 및 공개 접근 정책을 설정합니다.
"""

import json
import boto3
from botocore.config import Config

# Railway Bucket 설정 (virtual-hosted-style)
BUCKET_NAME = "optimized-cart-1xd8hmoxm4"
# boto3는 base endpoint + virtual addressing style 사용
ENDPOINT_URL = "https://storage.railway.app"
ACCESS_KEY_ID = "tid_pHVlgchXTldbtCRYQnSTVgfGFZqKu_bmOEBHwbNyuJmMgrPvEO"
SECRET_ACCESS_KEY = "tsec_EVz4jOR8wL5-+oANW5u5zwpqXOdrQOs5P3A+cU+ANbuS7k3dOWs3hyjBg3H6BUyywY9CI6"
REGION = "auto"

# 허용할 도메인들
ALLOWED_ORIGINS = [
    "https://ppoplink.site",
    "https://www.ppoplink.site",
    "https://api.ppoplink.site",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "*",  # 모든 도메인 허용 (이미지 로드용)
]

def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=ENDPOINT_URL,
        aws_access_key_id=ACCESS_KEY_ID,
        aws_secret_access_key=SECRET_ACCESS_KEY,
        region_name=REGION,
        config=Config(signature_version='s3v4')
    )

def set_cors(s3):
    """CORS 설정"""
    print("\n📝 CORS 설정 중...")
    
    cors_config = {
        'CORSRules': [{
            'AllowedHeaders': ['*'],
            'AllowedMethods': ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            'AllowedOrigins': ALLOWED_ORIGINS,
            'ExposeHeaders': ['ETag', 'Content-Length', 'Content-Type'],
            'MaxAgeSeconds': 3600
        }]
    }
    
    try:
        s3.put_bucket_cors(Bucket=BUCKET_NAME, CORSConfiguration=cors_config)
        print("✅ CORS 설정 완료!")
        return True
    except Exception as e:
        print(f"❌ CORS 설정 실패: {e}")
        return False

def set_public_policy(s3):
    """버킷 공개 읽기 정책 설정"""
    print("\n📝 버킷 공개 읽기 정책 설정 중...")
    
    # 공개 읽기 정책
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{BUCKET_NAME}/*"]
            }
        ]
    }
    
    try:
        s3.put_bucket_policy(Bucket=BUCKET_NAME, Policy=json.dumps(policy))
        print("✅ 공개 읽기 정책 설정 완료!")
        return True
    except Exception as e:
        print(f"❌ 공개 읽기 정책 설정 실패: {e}")
        print("   Tigris는 버킷 정책을 지원하지 않을 수 있습니다.")
        return False

def check_bucket_acl(s3):
    """버킷 ACL 확인 및 설정"""
    print("\n📝 버킷 ACL 확인 중...")
    
    try:
        # 버킷 ACL을 public-read로 설정
        s3.put_bucket_acl(Bucket=BUCKET_NAME, ACL='public-read')
        print("✅ 버킷 ACL을 public-read로 설정 완료!")
        return True
    except Exception as e:
        print(f"❌ 버킷 ACL 설정 실패: {e}")
        return False

def test_object_access(s3):
    """테스트 객체 업로드 및 접근 테스트"""
    print("\n📝 테스트 객체 업로드 중...")
    
    test_key = "test_public_access.txt"
    test_content = b"Public access test"
    
    try:
        # ACL과 함께 객체 업로드
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=test_key,
            Body=test_content,
            ContentType='text/plain',
            ACL='public-read'
        )
        print(f"✅ 테스트 객체 업로드 완료!")
        
        public_url = f"https://{BUCKET_NAME}.storage.railway.app/{test_key}"
        print(f"   공개 URL: {public_url}")
        print(f"   브라우저에서 이 URL에 접근해보세요.")
        
        return True
    except Exception as e:
        print(f"❌ 테스트 객체 업로드 실패: {e}")
        return False

def main():
    print("=" * 50)
    print("Railway Bucket (Tigris) 설정 스크립트")
    print("=" * 50)
    print(f"Bucket: {BUCKET_NAME}")
    print(f"Endpoint: {ENDPOINT_URL}")
    
    s3 = get_s3_client()
    
    # 1. CORS 설정
    set_cors(s3)
    
    # 2. 버킷 ACL 설정 시도
    check_bucket_acl(s3)
    
    # 3. 버킷 정책 설정 시도
    set_public_policy(s3)
    
    # 4. 테스트 객체 업로드
    test_object_access(s3)
    
    print("\n" + "=" * 50)
    print("설정 완료!")
    print("=" * 50)
    
    return 0

if __name__ == "__main__":
    exit(main())
