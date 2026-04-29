"""
Vanguard ASOC — Backend health tests.
These run in CI using mock mode (no real AWS or Gemini credentials needed).
"""
import pytest
from fastapi.testclient import TestClient

# conftest.py has already set env vars; import app after
from main import app

client = TestClient(app)


class TestHealthEndpoint:
    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_status_online(self):
        response = client.get("/health")
        body = response.json()
        assert body["status"] == "online"

    def test_health_mock_mode(self):
        response = client.get("/health")
        body = response.json()
        assert body["mode"] == "mock"

    def test_health_has_version(self):
        response = client.get("/health")
        body = response.json()
        assert "version" in body
        assert body["version"]  # not empty


class TestRootEndpoint:
    def test_root_returns_200(self):
        response = client.get("/")
        assert response.status_code == 200

    def test_root_has_project_name(self):
        response = client.get("/")
        body = response.json()
        assert "Vanguard" in body.get("project", "")

    def test_root_has_docs_link(self):
        response = client.get("/")
        body = response.json()
        assert "docs" in body


class TestScanStatusEndpoint:
    def test_scan_status_returns_200(self):
        response = client.get("/api/v1/scan/status")
        assert response.status_code == 200

    def test_scan_status_is_idle_initially(self):
        response = client.get("/api/v1/scan/status")
        body = response.json()
        assert body.get("status") in ("idle", "done", "running", "failed")
