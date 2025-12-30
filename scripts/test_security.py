#!/usr/bin/env python3
"""
보안 기능 테스트 스크립트
"""

import httpx
import asyncio
import time
from typing import List

# 테스트할 서버 URL (환경에 맞게 변경)
BASE_URL = "http://localhost:8080"  # 또는 "https://ppoplink.site"

# 색상 코드
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_test(name: str):
    """테스트 이름 출력"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Testing: {name}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")


def print_pass(message: str):
    """성공 메시지"""
    print(f"{GREEN}✓ PASS:{RESET} {message}")


def print_fail(message: str):
    """실패 메시지"""
    print(f"{RED}✗ FAIL:{RESET} {message}")


def print_info(message: str):
    """정보 메시지"""
    print(f"{YELLOW}ℹ INFO:{RESET} {message}")


async def test_malicious_patterns():
    """악의적인 패턴 차단 테스트"""
    print_test("Malicious Pattern Blocking")
    
    malicious_paths = [
        "/api/public/.env",
        "/api/public/backup.sql",
        "/api/public/database.sql",
        "/api/public/.bash_history",
        "/api/public/phpinfo.php",
        "/api/public/config.ini",
        "/api/public/.DS_Store",
    ]
    
    async with httpx.AsyncClient() as client:
        for path in malicious_paths:
            try:
                response = await client.get(f"{BASE_URL}{path}")
                if response.status_code == 403:
                    print_pass(f"{path} → 403 Forbidden (Blocked)")
                else:
                    print_fail(f"{path} → {response.status_code} (Expected 403)")
            except Exception as e:
                print_fail(f"{path} → Error: {e}")
    
    print_info("All malicious patterns should return 403 Forbidden")


async def test_rate_limiting():
    """Rate Limiting 테스트"""
    print_test("Rate Limiting")
    
    print_info("Sending 201 requests to /health endpoint...")
    print_info("First 200 should succeed, 201st should fail with 429")
    
    async with httpx.AsyncClient() as client:
        success_count = 0
        rate_limited = False
        
        for i in range(1, 202):
            try:
                response = await client.get(f"{BASE_URL}/health")
                if response.status_code == 200:
                    success_count += 1
                    if i % 50 == 0:
                        print_info(f"  {i}/201 requests completed...")
                elif response.status_code == 429:
                    print_pass(f"Rate limited at request #{i}")
                    rate_limited = True
                    break
            except Exception as e:
                print_fail(f"Request #{i} failed: {e}")
                break
        
        if rate_limited:
            print_pass(f"Successfully rate limited after {success_count} requests")
        else:
            print_fail("Rate limiting did not trigger")
    
    print_info("Waiting 60 seconds for rate limit to reset...")


async def test_security_headers():
    """보안 헤더 테스트"""
    print_test("Security Headers")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/health")
            headers = response.headers
            
            required_headers = {
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "1; mode=block",
                "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
                "Content-Security-Policy": None,  # Just check existence
                "Referrer-Policy": "strict-origin-when-cross-origin",
            }
            
            for header, expected_value in required_headers.items():
                if header in headers:
                    if expected_value is None or headers[header] == expected_value:
                        print_pass(f"{header}: {headers[header]}")
                    else:
                        print_fail(f"{header}: {headers[header]} (Expected: {expected_value})")
                else:
                    print_fail(f"{header}: Missing")
        
        except Exception as e:
            print_fail(f"Failed to test headers: {e}")


async def test_request_size_limit():
    """요청 크기 제한 테스트"""
    print_test("Request Size Limit")
    
    print_info("Sending 11MB request (should be rejected)...")
    
    # 11MB 데이터 생성
    large_data = "x" * (11 * 1024 * 1024)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{BASE_URL}/api/public/test",  # 존재하지 않는 엔드포인트도 괜찮음
                content=large_data,
                timeout=10.0
            )
            if response.status_code == 413:
                print_pass("Large request rejected with 413")
            else:
                print_fail(f"Large request returned {response.status_code} (Expected 413)")
        except httpx.RequestError as e:
            print_info(f"Request failed (this might be expected): {e}")


async def test_admin_security_endpoints():
    """관리자 보안 엔드포인트 테스트"""
    print_test("Admin Security Endpoints (Authorization Required)")
    
    print_info("Testing without authentication (should fail)...")
    
    async with httpx.AsyncClient() as client:
        endpoints = [
            "/api/admin/security/blacklist",
            "/api/admin/security/stats",
        ]
        
        for endpoint in endpoints:
            try:
                response = await client.get(f"{BASE_URL}{endpoint}")
                if response.status_code in [401, 403]:
                    print_pass(f"{endpoint} → {response.status_code} (Protected)")
                else:
                    print_fail(f"{endpoint} → {response.status_code} (Should require auth)")
            except Exception as e:
                print_fail(f"{endpoint} → Error: {e}")


async def main():
    """메인 테스트 실행"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}PPOPLINK Security Test Suite{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    print(f"Target: {BASE_URL}")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 서버 연결 확인
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/health", timeout=5.0)
            if response.status_code == 200:
                print_pass("Server is reachable")
            else:
                print_fail(f"Server returned {response.status_code}")
                return
    except Exception as e:
        print_fail(f"Cannot connect to server: {e}")
        print_info("Make sure the server is running!")
        return
    
    # 테스트 실행
    await test_security_headers()
    await test_malicious_patterns()
    await test_admin_security_endpoints()
    await test_request_size_limit()
    
    # Rate limiting은 마지막에 (다른 테스트에 영향)
    print_info("\nRate limiting test can affect other tests.")
    response = input("Run rate limiting test? (y/N): ")
    if response.lower() == 'y':
        await test_rate_limiting()
    
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Test Suite Complete{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    print_info("Check your Sentry dashboard for security events!")
    print_info("Check server logs for detailed information.")


if __name__ == "__main__":
    asyncio.run(main())

