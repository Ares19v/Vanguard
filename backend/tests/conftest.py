"""
conftest.py — Set CI/test environment variables BEFORE any app module is imported.
This ensures pydantic-settings picks up the test values instead of requiring a real .env.
"""
import os

os.environ.setdefault("MOCK_MODE", "true")
os.environ.setdefault("DRY_RUN", "true")
os.environ.setdefault("GEMINI_API_KEY", "ci-placeholder-not-a-real-key")
os.environ.setdefault("JWT_SECRET", "ci-test-secret-must-be-long-enough-32chars")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_vanguard.db")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "ci-placeholder")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "ci-placeholder")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
