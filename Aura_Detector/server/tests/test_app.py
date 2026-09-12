"""Integration tests for the AUR/S server app."""
import base64
import json

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

import server.app as app_module
from server.app import app, SESSION_TOKEN
from server.protocol import (
    Hello, HelloAck, Frame, FrameState, ErrorMsg,
    INVALID_FRAME, UNAUTHORIZED
)


def make_jpeg() -> bytes:
    """Return a valid small image so integration tests exercise decode paths."""
    ok, encoded = cv2.imencode(".jpg", np.zeros((360, 640, 3), dtype=np.uint8))
    assert ok
    return encoded.tobytes()


@pytest.fixture(autouse=True)
def reset_active_client():
    """Reset the global active_client between tests to avoid state leakage."""
    app_module.active_client = None
    yield
    app_module.active_client = None


@pytest.fixture
def client():
    return TestClient(app)


# --- Health endpoint ---

def test_health_returns_200(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == 1
    assert data["protocol_version"] == 1
    assert "status" in data
    assert "model_ready" in data
    assert "uptime_s" in data


def test_health_without_lifespan(client):
    """Without lifespan (test client default), model_ready is False."""
    response = client.get("/health")
    data = response.json()
    # TestClient doesn't trigger lifespan, so model is not loaded
    assert data["model_ready"] is False
    assert data["status"] == "starting"


def test_health_with_lifespan():
    """With lifespan context, model_ready becomes True after startup."""
    with TestClient(app, raise_server_exceptions=False) as c:
        # When using context manager, lifespan runs
        response = c.get("/health")
        data = response.json()
        assert data["model_ready"] is True
        assert data["status"] == "ok"


# --- WebSocket hello/ack flow ---

def test_ws_hello_ack(client):
    """Valid hello produces a hello_ack response."""
    with client.websocket_connect("/ws") as ws:
        hello = Hello(
            version=1, token=SESSION_TOKEN, clientId="test-client"
        ).model_dump_json()
        ws.send_text(hello)

        response = ws.receive_text()
        ack = HelloAck.model_validate_json(response)
        assert ack.type == "hello_ack"
        assert ack.version == 1
        assert ack.maxSubjects == 6
        assert ack.sessionId  # non-empty


# --- WebSocket frame flow ---

def test_ws_frame_round_trip(client):
    """A valid frame returns a frame_state with the same frameId."""
    with client.websocket_connect("/ws") as ws:
        # Handshake
        ws.send_text(Hello(
            version=1, token=SESSION_TOKEN, clientId="t"
        ).model_dump_json())
        ws.receive_text()  # hello_ack

        # Send a frame
        jpeg_b64 = base64.b64encode(make_jpeg()).decode()
        ws.send_text(Frame(
            frameId=1, capturedAtMs=1000,
            width=640, height=360, jpeg=jpeg_b64
        ).model_dump_json())

        response = ws.receive_text()
        state = FrameState.model_validate_json(response)
        assert state.type == "frame_state"
        assert state.frameId == 1
        assert state.subjects == []  # blank image contains no people


def test_ws_frame_ordering(client):
    """Sending a frame with a non-increasing frameId returns an error."""
    with client.websocket_connect("/ws") as ws:
        ws.send_text(Hello(
            version=1, token=SESSION_TOKEN, clientId="t"
        ).model_dump_json())
        ws.receive_text()  # hello_ack

        jpeg_b64 = base64.b64encode(make_jpeg()).decode()
        # Send frame 5
        ws.send_text(Frame(
            frameId=5, capturedAtMs=1000,
            width=640, height=360, jpeg=jpeg_b64
        ).model_dump_json())
        ws.receive_text()  # frame_state for 5

        # Send frame 3 (out of order, should error)
        ws.send_text(Frame(
            frameId=3, capturedAtMs=1001,
            width=640, height=360, jpeg=jpeg_b64
        ).model_dump_json())
        response = ws.receive_text()
        err = ErrorMsg.model_validate_json(response)
        assert err.recoverable is True


def test_ws_invalid_jpeg_is_recoverable(client):
    """A base64-valid but undecodable JPEG gets the frame-specific error."""
    with client.websocket_connect("/ws") as ws:
        ws.send_text(Hello(
            version=1, token=SESSION_TOKEN, clientId="t"
        ).model_dump_json())
        ws.receive_text()  # hello_ack

        ws.send_text(Frame(
            frameId=1,
            capturedAtMs=1000,
            width=640,
            height=360,
            jpeg=base64.b64encode(b"not-a-jpeg").decode(),
        ).model_dump_json())
        err = ErrorMsg.model_validate_json(ws.receive_text())
        assert err.code == INVALID_FRAME
        assert err.recoverable is True


# --- WebSocket authentication errors ---

def test_ws_wrong_token(client):
    """Invalid token produces an UNAUTHORIZED error and closes the socket."""
    with client.websocket_connect("/ws") as ws:
        ws.send_text(Hello(
            version=1, token="wrong-token", clientId="t"
        ).model_dump_json())

        response = ws.receive_text()
        err = ErrorMsg.model_validate_json(response)
        assert err.code == UNAUTHORIZED
        assert err.recoverable is False


def test_ws_unsupported_version(client):
    """A hello with version != 1 is rejected (raw JSON since model validates)."""
    with client.websocket_connect("/ws") as ws:
        raw = json.dumps({
            "type": "hello", "version": 2,
            "token": SESSION_TOKEN, "clientId": "t"
        })
        ws.send_text(raw)

        response = ws.receive_text()
        err = ErrorMsg.model_validate_json(response)
        assert err.recoverable is False


def test_ws_invalid_json(client):
    """Sending invalid JSON produces an error."""
    with client.websocket_connect("/ws") as ws:
        ws.send_text("this is not json")

        response = ws.receive_text()
        err = ErrorMsg.model_validate_json(response)
        assert err.recoverable is False
