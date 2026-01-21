"""
Pytest configuration and fixtures
"""

import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

# Test environment variables - Railway PostgreSQL
os.environ["DATABASE_URL"] = "postgresql://test:test@localhost:5432/test"
os.environ["DEBUG"] = "true"

# Storage test environment variables - Railway Buckets (S3 compatible)
os.environ["S3_ENDPOINT_URL"] = "https://test-bucket.storage.railway.app"
os.environ["S3_ACCESS_KEY_ID"] = "test-access-key"
os.environ["S3_SECRET_ACCESS_KEY"] = "test-secret-key"
os.environ["S3_BUCKET_NAME"] = "test-bucket"
os.environ["S3_REGION"] = "auto"

# PPOP Auth test environment variables
os.environ["PPOP_AUTH_API_URL"] = "https://test-auth-api.example.com"
os.environ["PPOP_AUTH_CLIENT_URL"] = "https://test-auth.example.com"
os.environ["PPOP_AUTH_CLIENT_ID"] = "test-client-id"
os.environ["PPOP_AUTH_CLIENT_SECRET"] = "test-client-secret"
os.environ["PPOP_AUTH_REDIRECT_URI"] = "http://localhost:3000/auth/callback"
os.environ["PPOP_AUTH_JWKS_URI"] = "https://test-auth-api.example.com/.well-known/jwks.json"


@pytest.fixture(scope="session")
def test_app():
    """Create test FastAPI application"""
    from backend.main import app
    return app


@pytest.fixture
def client(test_app) -> Generator:
    """Create test client"""
    with TestClient(test_app) as test_client:
        yield test_client


@pytest.fixture
def mock_db():
    """Mock PostgreSQL database client"""
    mock = MagicMock()
    
    # Mock execute method
    mock.execute.return_value = []
    mock.execute_returning.return_value = None
    mock.execute_many.return_value = None
    mock.count.return_value = 0
    
    return mock


@pytest.fixture
def mock_db_with_patch():
    """Mock database with patch context"""
    with patch("backend.core.database.db") as mock_db:
        mock_db.execute.return_value = []
        mock_db.execute_returning.return_value = None
        mock_db.count.return_value = 0
        yield mock_db


@pytest.fixture
def mock_storage():
    """Mock S3 storage client"""
    mock = MagicMock()
    mock.put_object.return_value = {}
    mock.delete_object.return_value = {}
    mock.generate_presigned_url.return_value = "https://test-presigned-url.com"
    return mock


@pytest.fixture
def mock_s3_client():
    """Mock boto3 S3 client with patch"""
    with patch("backend.files.service.get_s3_client") as mock:
        mock_client = MagicMock()
        mock_client.put_object.return_value = {}
        mock_client.delete_object.return_value = {}
        mock_client.generate_presigned_url.return_value = "https://test-presigned-url.com"
        mock.return_value = mock_client
        yield mock_client


@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "user_seq": 1,
        "public_link_id": "abc123",
        "username": "testuser",
        "email": "test@example.com",
        "display_name": "Test User",
        "bio": "Test bio",
        "profile_image_url": None,
        "background_image_url": None,
        "background_color": "#ffffff",
        "theme": "default",
        "button_style": "default",
        "is_active": True,
        "is_admin": False,
        "created_at": "2024-01-01T00:00:00",
        "updated_at": None,
    }


@pytest.fixture
def sample_link_data():
    """Sample link data for testing"""
    return {
        "id": "223e4567-e89b-12d3-a456-426614174000",
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Test Link",
        "url": "https://example.com",
        "order": 1,
        "is_active": True,
        "click_count": 0,
        "created_at": "2024-01-01T00:00:00",
    }


@pytest.fixture
def auth_headers():
    """
    Generate mock auth headers for testing
    Note: In real tests with PPOP Auth, you would need to mock the JWKS verification
    """
    # This is a placeholder token for testing
    # Real integration tests would need to mock verify_access_token
    return {"Authorization": "Bearer mock_test_token"}


@pytest.fixture
def mock_ppop_auth():
    """Mock PPOP Auth token verification"""
    with patch("backend.core.security.verify_ppop_token") as mock:
        mock.return_value = {
            "sub": "123e4567-e89b-12d3-a456-426614174000",
            "email": "test@example.com",
            "type": "access"
        }
        yield mock


@pytest.fixture
def mock_connection_pool():
    """Mock database connection pool"""
    with patch("backend.core.database.get_connection_pool") as mock:
        mock_pool = MagicMock()
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        
        mock_pool.getconn.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__ = MagicMock(return_value=mock_cursor)
        mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        mock_conn.__enter__ = MagicMock(return_value=mock_conn)
        mock_conn.__exit__ = MagicMock(return_value=False)
        
        mock.return_value = mock_pool
        yield mock_pool, mock_conn, mock_cursor
