"""
Unit tests for PPOP Auth authentication service
"""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from uuid import UUID
from backend.auth.service import AuthService


@pytest.mark.unit
class TestAuthService:
    """Test AuthService methods"""
    
    @pytest.fixture
    def auth_service(self):
        """Create AuthService instance"""
        return AuthService()
    
    def test_generate_oauth_state(self, auth_service):
        """Test OAuth state generation"""
        state1 = auth_service.generate_oauth_state()
        state2 = auth_service.generate_oauth_state()
        
        # States should be unique
        assert state1 != state2
        # States should be non-empty strings
        assert len(state1) > 0
        assert len(state2) > 0
    
    def test_get_oauth_login_url(self, auth_service):
        """Test OAuth login URL generation"""
        state = "test_state_123"
        login_url = auth_service.get_oauth_login_url(state)
        
        # URL should contain required parameters
        assert "client_id=" in login_url
        assert "redirect_uri=" in login_url
        assert "response_type=code" in login_url
        assert f"state={state}" in login_url
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_returns_user_when_exists(
        self, auth_service, sample_user_data
    ):
        """Test getting user by ID when user exists"""
        mock_db = MagicMock()
        mock_db.execute.return_value = sample_user_data
        
        with patch("backend.auth.service.db", mock_db):
            user_id = UUID(sample_user_data["id"])
            user = await auth_service.get_user_by_id(user_id)
            
            assert user is not None
            assert user.username == sample_user_data["username"]
            assert user.email == sample_user_data["email"]
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_returns_none_when_not_exists(
        self, auth_service
    ):
        """Test getting user by ID when user doesn't exist"""
        mock_db = MagicMock()
        mock_db.execute.return_value = None
        
        with patch("backend.auth.service.db", mock_db):
            user_id = UUID("123e4567-e89b-12d3-a456-426614174000")
            user = await auth_service.get_user_by_id(user_id)
            
            assert user is None
    
    @pytest.mark.asyncio
    async def test_generate_unique_username(self, auth_service):
        """Test unique username generation"""
        mock_db = MagicMock()
        # No existing user found
        mock_db.execute.return_value = None
        
        with patch("backend.auth.service.db", mock_db):
            username = await auth_service._generate_unique_username("testuser")
            
            assert username == "testuser"
    
    @pytest.mark.asyncio
    async def test_generate_unique_username_with_collision(self, auth_service):
        """Test unique username generation when base username exists"""
        mock_db = MagicMock()
        # Mock to return existing user for first call, None for second
        mock_db.execute.side_effect = [
            {"id": "123"},  # First call - username exists
            None,  # Second call - username_1 available
        ]
        
        with patch("backend.auth.service.db", mock_db):
            username = await auth_service._generate_unique_username("testuser")
            
            assert username == "testuser_1"
