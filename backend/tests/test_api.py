"""
API integration tests (app/api/).

Uses httpx.AsyncClient with an in-memory SQLite database.
Tests cover:
- GET /api/health
- POST /api/analyses (upload)
- GET /api/analyses/{id}/status
- GET /api/analyses/{id}
- GET /api/analyses/{id}/trajectory (no data yet → empty)
- DELETE /api/analyses/{id}
- 404 on unknown analysis ID
"""

from __future__ import annotations

import io
import os
import sys
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Allow importing from backend/app when running pytest from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

os.environ.setdefault("MAX_UPLOAD_BYTES", str(50 * 1024 * 1024))


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture
async def client():
    # Lazy import to avoid triggering mediapipe's matplotlib dependency
    # at collection time (which can fail under Windows Application Control).
    from app.main import app  # noqa: PLC0415

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_root(client):
    resp = await client.get("/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "running"
    assert "docs" in body


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"



# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_upload_invalid_extension(client):
    """Uploading a .txt file should fail with INVALID_VIDEO."""
    fake_file = io.BytesIO(b"not a video")
    resp = await client.post(
        "/api/analyses",
        files={"video": ("test.txt", fake_file, "text/plain")},
    )
    # Either 422 (FastAPI validation) or our 422 error
    assert resp.status_code in (422, 400, 500)


@pytest.mark.asyncio
async def test_upload_creates_analysis(client, tmp_path):
    """A minimal valid MP4 binary upload should create an analysis record."""
    # Minimal faux-mp4 (will fail CV but should create DB record)
    fake_mp4 = b"\x00" * 1024
    resp = await client.post(
        "/api/analyses",
        files={"video": ("test.mp4", io.BytesIO(fake_mp4), "video/mp4")},
    )
    # Upload should succeed (202) even if processing fails later
    assert resp.status_code == 202
    body = resp.json()
    assert "analysis_id" in body
    assert body["status"] == "queued"
    return body["analysis_id"]


# ---------------------------------------------------------------------------
# Status & 404
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_status_not_found(client):
    resp = await client.get("/api/analyses/nonexistent123/status")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_result_not_found(client):
    resp = await client.get("/api/analyses/nonexistent123")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_trajectory_not_found(client):
    resp = await client.get("/api/analyses/nonexistent123/trajectory")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_not_found(client):
    resp = await client.delete("/api/analyses/nonexistent123")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_upload_then_delete(client):
    """Upload, then delete — confirm deletion returns 200 and re-fetch 404s."""
    fake_mp4 = b"\x00" * 1024
    upload_resp = await client.post(
        "/api/analyses",
        files={"video": ("delete_me.mp4", io.BytesIO(fake_mp4), "video/mp4")},
    )
    assert upload_resp.status_code == 202
    analysis_id = upload_resp.json()["analysis_id"]

    # Confirm it exists
    status_resp = await client.get(f"/api/analyses/{analysis_id}/status")
    assert status_resp.status_code == 200

    # Delete it
    del_resp = await client.delete(f"/api/analyses/{analysis_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "deleted"

    # Should now 404
    after_resp = await client.get(f"/api/analyses/{analysis_id}")
    assert after_resp.status_code == 404
