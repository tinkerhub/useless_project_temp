import base64
import pytest
from pydantic import ValidationError
from server.protocol import (
    Hello, Frame, FrameState, ErrorMsg, Subject, Profile,
    UNAUTHORIZED, UNSUPPORTED_VERSION
)

def test_hello_valid():
    h = Hello(version=1, token="abc", clientId="123")
    assert h.version == 1
    assert h.token == "abc"

def test_hello_invalid_version():
    with pytest.raises(ValidationError):
        Hello(version=2, token="abc", clientId="123")

def test_hello_missing_token():
    with pytest.raises(ValidationError):
        Hello(version=1, token="", clientId="123")

def test_frame_valid():
    b64_jpeg = base64.b64encode(b"fake_jpeg_data").decode()
    f = Frame(frameId=1, capturedAtMs=1000, width=640, height=480, jpeg=b64_jpeg)
    assert f.frameId == 1
    assert f.width == 640

def test_frame_invalid_dimensions():
    b64_jpeg = base64.b64encode(b"fake_jpeg_data").decode()
    with pytest.raises(ValidationError):
        Frame(frameId=1, capturedAtMs=1000, width=2000, height=1080, jpeg=b64_jpeg)

def test_frame_invalid_size():
    big_jpeg = base64.b64encode(b"a" * (2 * 1024 * 1024 + 1)).decode()
    with pytest.raises(ValidationError):
        Frame(frameId=1, capturedAtMs=1000, width=640, height=480, jpeg=big_jpeg)

def test_frame_invalid_base64():
    with pytest.raises(ValidationError):
        Frame(frameId=1, capturedAtMs=1000, width=640, height=480, jpeg="not-base64!")

def test_frame_state_serialization():
    fs = FrameState(
        frameId=1,
        serverReceivedAtMs=1000,
        inferenceMs=10.5,
        subjects=[
            Subject(
                id=1,
                confidence=0.9,
                box=[0.0, 0.0, 100.0, 100.0],
                profile=Profile(band="Quiet", min="0", max="100", palette="cyan")
            )
        ]
    )
    json_data = fs.model_dump_json()
    assert "frame_state" in json_data
    assert "Quiet" in json_data

def test_error_msg():
    e = ErrorMsg(code=UNAUTHORIZED, message="msg", recoverable=False)
    assert e.code == UNAUTHORIZED

def test_subject_models():
    s = Subject(id=1, confidence=0.9, box=[0,0,10,10])
    assert s.contour is None
    assert s.profile is None
