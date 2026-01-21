"""
Railway Bucket CORS 설정 스크립트
이 스크립트를 실행하면 Railway Bucket에 CORS 설정이 적용됩니다.
"""

import boto3
from botocore.config import Config

# Railway Bucket 설정
BUCKET_NAME = "optimized-cart-1xd8hmoxm4"
ENDPOINT_URL = f"https://{BUCKET_NAME}.storage.railway.app"
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
]

def main():
    print("Railway Bucket CORS 설정 시작...")
    print(f"Bucket: {BUCKET_NAME}")
    print(f"Endpoint: {ENDPOINT_URL}")
    
    # S3 클라이언트 생성
    s3 = boto3.client(
        's3',
        endpoint_url=ENDPOINT_URL,
        aws_access_key_id=ACCESS_KEY_ID,
        aws_secret_access_key=SECRET_ACCESS_KEY,
        region_name=REGION,
        config=Config(signature_version='s3v4')
    )
    
    # CORS 설정
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
        print("\n✅ CORS 설정 완료!")
        print(f"\n허용된 도메인:")
        for origin in ALLOWED_ORIGINS:
            print(f"  - {origin}")
    except Exception as e:
        print(f"\n❌ CORS 설정 실패: {e}")
        return 1
    
    # 설정 확인
    try:
        response = s3.get_bucket_cors(Bucket=BUCKET_NAME)
        print("\n현재 CORS 설정:")
        print(response)
    except Exception as e:
        print(f"\nCORS 설정 확인 실패 (설정은 성공했을 수 있음): {e}")
    
    return 0

if __name__ == "__main__":
    exit(main())
