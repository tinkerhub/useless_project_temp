import argparse
import base64
import logging
import secrets
import time
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import ValidationError
import uvicorn

from .protocol import (
    Hello, HelloAck, Frame, FrameState, ErrorMsg,
    UNAUTHORIZED, UNSUPPORTED_VERSION, INVALID_MESSAGE, INVALID_FRAME,
    SERVER_UNAVAILABLE,
)
from .pipeline import InvalidFrameError, ModelUnavailableError, VisionPipeline
from .aura import AuraEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SESSION_TOKEN = secrets.token_urlsafe(32)
pipeline = VisionPipeline()
aura_engine = AuraEngine()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Server starting. Session token: {SESSION_TOKEN}")
    try:
        pipeline.load_model()
        pipeline.warmup()
    except Exception:
        # Keep /health and the transport endpoint available so the client can
        # show a useful failure instead of getting a connection-refused error.
        logger.exception("Vision model is unavailable; server will stay online")
    yield
    logger.info("Server shutting down.")

app = FastAPI(lifespan=lifespan)
start_time = time.time()

active_client: Optional[WebSocket] = None

@app.get("/health")
async def health():
    return {
        "status": "ok" if pipeline.model_ready else "starting",
        "model_ready": pipeline.model_ready,
        "version": 1,
        "uptime_s": time.time() - start_time,
        "protocol_version": 1
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global active_client
    await websocket.accept()

    if active_client is not None:
        await websocket.send_text(ErrorMsg(
            code="SERVER_UNAVAILABLE",
            message="Another client is already connected",
            recoverable=False
        ).model_dump_json())
        await websocket.close()
        return

    active_client = websocket
    session_id = secrets.token_hex(16)
    last_frame_id = -1

    try:
        # Wait for Hello
        hello_text = await websocket.receive_text()
        try:
            hello = Hello.model_validate_json(hello_text)
            if hello.token != SESSION_TOKEN:
                await websocket.send_text(ErrorMsg(
                    code=UNAUTHORIZED,
                    message="Invalid token",
                    recoverable=False
                ).model_dump_json())
                await websocket.close()
                active_client = None
                return
            
            await websocket.send_text(HelloAck(
                sessionId=session_id,
                serverTimeMs=int(time.time() * 1000)
            ).model_dump_json())
            
        except ValidationError as e:
            await websocket.send_text(ErrorMsg(
                code=INVALID_MESSAGE if "version" not in str(e) else UNSUPPORTED_VERSION,
                message=str(e),
                recoverable=False
            ).model_dump_json())
            await websocket.close()
            active_client = None
            return

        # Main Loop
        while True:
            text = await websocket.receive_text()
            server_received_at = int(time.time() * 1000)
            inference_start = time.time()
            
            try:
                frame = Frame.model_validate_json(text)
                if frame.frameId <= last_frame_id:
                    raise ValueError("Frame ID must be strictly increasing")
                last_frame_id = frame.frameId
                
                jpeg_bytes = base64.b64decode(frame.jpeg)
                subjects = pipeline.process_frame(jpeg_bytes, frame.width, frame.height)
                
                # Apply aura profile to subjects
                for sub in subjects:
                    sub.profile = aura_engine.generate_profile(sub.id)
                
                inference_ms = (time.time() - inference_start) * 1000
                await websocket.send_text(FrameState(
                    frameId=frame.frameId,
                    serverReceivedAtMs=server_received_at,
                    inferenceMs=inference_ms,
                    subjects=subjects
                ).model_dump_json())
                
            except ValidationError as e:
                await websocket.send_text(ErrorMsg(
                    code=INVALID_FRAME,
                    message=str(e),
                    recoverable=True
                ).model_dump_json())
            except InvalidFrameError as e:
                await websocket.send_text(ErrorMsg(
                    code=INVALID_FRAME,
                    message=str(e),
                    recoverable=True
                ).model_dump_json())
            except ModelUnavailableError as e:
                await websocket.send_text(ErrorMsg(
                    code=SERVER_UNAVAILABLE,
                    message=f"Vision model unavailable: {e}",
                    recoverable=True
                ).model_dump_json())
            except Exception as e:
                await websocket.send_text(ErrorMsg(
                    code=INVALID_MESSAGE,
                    message=str(e),
                    recoverable=True
                ).model_dump_json())

    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if active_client == websocket:
            active_client = None

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    
    uvicorn.run("server.app:app", host=args.host, port=args.port)
