"""
중복 가입 방지 기능 테스트
이메일 및 전화번호 중복 검증 로직 테스트
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from backend.auth.service import auth_service
from backend.core.exceptions import EmailAlreadyExistsError, PhoneAlreadyExistsError


class TestDuplicateValidation:
    """중복 검증 테스트"""
    
    @pytest.mark.asyncio
    async def test_check_duplicate_email_not_exists(self):
        """이메일 중복 체크 - 중복 없음"""
        with patch('backend.auth.service.db') as mock_db:
            # 중복 없음 (빈 결과)
            mock_table = MagicMock()
            mock_table.select.return_value.eq.return_value.execute.return_value.data = []
            mock_db.table.return_value = mock_table
            
            # 예외가 발생하지 않아야 함
            await auth_service._check_duplicate_email_and_phone(
                email="new@example.com",
                phone_number=None
            )
    
    @pytest.mark.asyncio
    async def test_check_duplicate_email_exists(self):
        """이메일 중복 체크 - 중복 있음"""
        with patch('backend.auth.service.db') as mock_db:
            # 중복 있음 (기존 사용자 존재)
            mock_table = MagicMock()
            mock_table.select.return_value.eq.return_value.execute.return_value.data = [
                {"id": str(uuid4())}
            ]
            mock_db.table.return_value = mock_table
            
            # EmailAlreadyExistsError 예외가 발생해야 함
            with pytest.raises(EmailAlreadyExistsError) as exc_info:
                await auth_service._check_duplicate_email_and_phone(
                    email="existing@example.com",
                    phone_number=None
                )
            
            assert "이미 가입된 이메일입니다" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_check_duplicate_phone_not_exists(self):
        """전화번호 중복 체크 - 중복 없음"""
        with patch('backend.auth.service.db') as mock_db:
            # 중복 없음 (빈 결과)
            mock_table = MagicMock()
            mock_table.select.return_value.eq.return_value.execute.return_value.data = []
            mock_db.table.return_value = mock_table
            
            # 예외가 발생하지 않아야 함
            await auth_service._check_duplicate_email_and_phone(
                email=None,
                phone_number="+821012345678"
            )
    
    @pytest.mark.asyncio
    async def test_check_duplicate_phone_exists(self):
        """전화번호 중복 체크 - 중복 있음"""
        with patch('backend.auth.service.db') as mock_db:
            # 중복 있음 (기존 사용자 존재)
            mock_table = MagicMock()
            mock_table.select.return_value.eq.return_value.execute.return_value.data = [
                {"id": str(uuid4())}
            ]
            mock_db.table.return_value = mock_table
            
            # PhoneAlreadyExistsError 예외가 발생해야 함
            with pytest.raises(PhoneAlreadyExistsError) as exc_info:
                await auth_service._check_duplicate_email_and_phone(
                    email=None,
                    phone_number="+821012345678"
                )
            
            assert "이미 가입된 전화번호입니다" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_check_duplicate_both_not_exists(self):
        """이메일 및 전화번호 중복 체크 - 둘 다 중복 없음"""
        with patch('backend.auth.service.db') as mock_db:
            # 중복 없음 (빈 결과)
            mock_table = MagicMock()
            mock_table.select.return_value.eq.return_value.execute.return_value.data = []
            mock_db.table.return_value = mock_table
            
            # 예외가 발생하지 않아야 함
            await auth_service._check_duplicate_email_and_phone(
                email="new@example.com",
                phone_number="+821012345678"
            )
    
    @pytest.mark.asyncio
    async def test_check_duplicate_email_exists_first(self):
        """이메일 중복이 먼저 체크됨 (이메일 중복 시 전화번호는 체크 안 함)"""
        with patch('backend.auth.service.db') as mock_db:
            # 이메일 중복 있음
            mock_table = MagicMock()
            mock_table.select.return_value.eq.return_value.execute.return_value.data = [
                {"id": str(uuid4())}
            ]
            mock_db.table.return_value = mock_table
            
            # EmailAlreadyExistsError 예외가 발생해야 함
            with pytest.raises(EmailAlreadyExistsError):
                await auth_service._check_duplicate_email_and_phone(
                    email="existing@example.com",
                    phone_number="+821012345678"
                )
    
    @pytest.mark.asyncio
    async def test_check_duplicate_with_none_values(self):
        """None 값으로 중복 체크 - 예외 없음"""
        with patch('backend.auth.service.db') as mock_db:
            mock_table = MagicMock()
            mock_db.table.return_value = mock_table
            
            # None 값은 체크하지 않으므로 예외가 발생하지 않아야 함
            await auth_service._check_duplicate_email_and_phone(
                email=None,
                phone_number=None
            )
            
            # DB 호출이 없어야 함
            mock_table.select.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_get_or_create_user_with_duplicate_email(self):
        """토큰에서 사용자 생성 시 이메일 중복 체크"""
        with patch('backend.auth.service.get_token_payload') as mock_get_payload, \
             patch('backend.auth.service.auth_service.get_user_by_id') as mock_get_user, \
             patch('backend.auth.service.db') as mock_db:
            
            # 토큰 페이로드 설정
            mock_get_payload.return_value = {
                "sub": str(uuid4()),
                "email": "existing@example.com",
                "phone_number": "+821012345678"
            }
            
            # 기존 사용자 없음
            mock_get_user.return_value = None
            
            # 이메일 중복 있음
            mock_table = MagicMock()
            mock_table.select.return_value.eq.return_value.execute.return_value.data = [
                {"id": str(uuid4())}
            ]
            mock_db.table.return_value = mock_table
            
            # EmailAlreadyExistsError 예외가 발생해야 함
            with pytest.raises(EmailAlreadyExistsError):
                await auth_service.get_or_create_user_from_token("fake_token")
    
    @pytest.mark.asyncio
    async def test_get_or_create_user_with_duplicate_phone(self):
        """토큰에서 사용자 생성 시 전화번호 중복 체크"""
        with patch('backend.auth.service.get_token_payload') as mock_get_payload, \
             patch('backend.auth.service.auth_service.get_user_by_id') as mock_get_user, \
             patch('backend.auth.service.db') as mock_db:
            
            # 토큰 페이로드 설정
            mock_get_payload.return_value = {
                "sub": str(uuid4()),
                "email": "new@example.com",
                "phone_number": "+821012345678"
            }
            
            # 기존 사용자 없음
            mock_get_user.return_value = None
            
            # Mock DB 설정
            mock_table = MagicMock()
            
            # 첫 번째 호출 (이메일 체크) - 중복 없음
            # 두 번째 호출 (전화번호 체크) - 중복 있음
            mock_table.select.return_value.eq.return_value.execute.return_value.data = []
            first_call = MagicMock()
            first_call.data = []
            second_call = MagicMock()
            second_call.data = [{"id": str(uuid4())}]
            
            mock_table.select.return_value.eq.return_value.execute.side_effect = [
                first_call,  # 이메일 체크 - 중복 없음
                second_call  # 전화번호 체크 - 중복 있음
            ]
            mock_db.table.return_value = mock_table
            
            # PhoneAlreadyExistsError 예외가 발생해야 함
            with pytest.raises(PhoneAlreadyExistsError):
                await auth_service.get_or_create_user_from_token("fake_token")


class TestUserCreation:
    """사용자 생성 테스트"""
    
    @pytest.mark.asyncio
    async def test_create_user_with_phone_number(self):
        """전화번호를 포함한 사용자 생성"""
        with patch('backend.auth.service.db') as mock_db, \
             patch('backend.auth.service.auth_service._generate_unique_username') as mock_username, \
             patch('backend.auth.service.auth_service.activate_basic_subscription') as mock_activate:
            
            mock_username.return_value = "testuser"
            mock_activate.return_value = None
            
            # Mock DB insert
            user_id = uuid4()
            mock_table = MagicMock()
            mock_table.insert.return_value.execute.return_value.data = [{
                "id": str(user_id),
                "user_seq": 1,
                "username": "testuser",
                "email": "test@example.com",
                "phone_number": "+821012345678",
                "display_name": "testuser",
                "theme": "default",
                "is_active": True,
                "is_admin": False,
                "created_at": "2024-01-01T00:00:00"
            }]
            
            # Mock update for public_link_id
            mock_table.update.return_value.eq.return_value.execute.return_value = None
            mock_db.table.return_value = mock_table
            
            # 사용자 생성
            user = await auth_service._create_user_from_ppop(
                ppop_user_id=user_id,
                email="test@example.com",
                phone_number="+821012345678"
            )
            
            # 검증
            assert user.email == "test@example.com"
            assert user.phone_number == "+821012345678"
    
    @pytest.mark.asyncio
    async def test_create_user_without_phone_number(self):
        """전화번호 없이 사용자 생성 (선택적)"""
        with patch('backend.auth.service.db') as mock_db, \
             patch('backend.auth.service.auth_service._generate_unique_username') as mock_username, \
             patch('backend.auth.service.auth_service.activate_basic_subscription') as mock_activate:
            
            mock_username.return_value = "testuser"
            mock_activate.return_value = None
            
            # Mock DB insert
            user_id = uuid4()
            mock_table = MagicMock()
            mock_table.insert.return_value.execute.return_value.data = [{
                "id": str(user_id),
                "user_seq": 1,
                "username": "testuser",
                "email": "test@example.com",
                "phone_number": None,
                "display_name": "testuser",
                "theme": "default",
                "is_active": True,
                "is_admin": False,
                "created_at": "2024-01-01T00:00:00"
            }]
            
            # Mock update for public_link_id
            mock_table.update.return_value.eq.return_value.execute.return_value = None
            mock_db.table.return_value = mock_table
            
            # 사용자 생성 (전화번호 없음)
            user = await auth_service._create_user_from_ppop(
                ppop_user_id=user_id,
                email="test@example.com",
                phone_number=None
            )
            
            # 검증
            assert user.email == "test@example.com"
            assert user.phone_number is None

