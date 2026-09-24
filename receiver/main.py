"""
Useless Project 3.0 - Python Receiver Server

Phase 3:
LAN-accessible receiver backend + Receiver webpage.

Run:
    python -m receiver.main

Endpoints:
    GET  /
    GET  /receiver.css
    GET  /receiver.js
    GET  /status
    POST /frame
    POST /reset
"""

from __future__ import annotations

import base64
import json
import mimetypes
import threading

from http.server import (
    BaseHTTPRequestHandler,
    ThreadingHTTPServer,
)

from pathlib import Path
from typing import Any

from receiver.buffer.frame_buffer import FrameBuffer
from receiver.protocol.frames import (
    DataFrame,
    EndFrame,
    MetadataFrame,
    ProtocolError,
)
from receiver.protocol.parser import ProtocolParser
from receiver.reconstruction.file_rebuilder import (
    FileRebuilder,
)
from receiver.reconstruction.verifier import (
    verify_and_write,
)


# ============================================================
# Configuration
# ============================================================

import os

HOST = "0.0.0.0"
PORT = int(os.environ.get("PORT", 8000))

MAX_FRAME_SIZE = 1_000_000

BASE_DIR = Path(__file__).resolve().parent

WEB_DIR = BASE_DIR / "web"

OUTPUT_DIR = BASE_DIR / "output"


# ============================================================
# Receiver Engine
# ============================================================


class ReceiverEngine:
    """Maintains the state of one file transmission."""

    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.reset()

    def reset(self) -> None:
        """Reset the current transfer."""

        with getattr(
            self,
            "lock",
            threading.Lock(),
        ):
            self.parser = ProtocolParser()

            self.buffer: FrameBuffer | None = None

            self.metadata = None

            self.received_frames = 0

            self.duplicate_frames = 0

            self.completed = False

            self.verified = False

            self.filename: str | None = None

            self.output_path: str | None = None

            self.error: str | None = None

    def process_frame(
        self,
        payload: bytes,
    ) -> dict[str, Any]:
        """Process one raw QR payload."""

        if not payload:
            raise ProtocolError(
                "Empty frame."
            )

        if len(payload) > MAX_FRAME_SIZE:
            raise ProtocolError(
                "Frame exceeds maximum allowed size."
            )

        with self.lock:

            if self.completed:
                return {
                    "ok": False,
                    "error": (
                        "Transfer already completed. "
                        "Call /reset before starting "
                        "another transfer."
                    ),
                }

            try:

                frame = self.parser.parse(
                    payload
                )

                # ==================================================
                # METADATA
                # ==================================================

                if isinstance(
                    frame,
                    MetadataFrame,
                ):

                    self.metadata = (
                        self.parser.metadata
                    )

                    if self.metadata is None:
                        raise ProtocolError(
                            "Metadata parsing failed."
                        )

                    self.buffer = FrameBuffer(
                        session_id=(
                            self.metadata.session_id
                        ),
                        expected_frames=(
                            self.metadata.total_frames
                        ),
                    )

                    self.filename = (
                        self.metadata.filename
                    )

                    self.received_frames = 0

                    self.duplicate_frames = 0

                    self.completed = False

                    self.verified = False

                    self.output_path = None

                    self.error = None

                    return {
                        "ok": True,
                        "type": "METADATA",
                        "session_id": (
                            self.metadata.session_id
                        ),
                        "filename": (
                            self.metadata.filename
                        ),
                        "total_frames": (
                            self.metadata.total_frames
                        ),
                        "compressed": (
                            self.metadata.compressed
                        ),
                    }

                # ==================================================
                # DATA
                # ==================================================

                if isinstance(
                    frame,
                    DataFrame,
                ):

                    if self.buffer is None:
                        raise ProtocolError(
                            "DATA received before "
                            "METADATA."
                        )

                    is_new = self.buffer.add(
                        sequence_id=(
                            frame.sequence_id
                        ),
                        data=frame.payload,
                    )

                    if is_new:
                        self.received_frames += 1
                    else:
                        self.duplicate_frames += 1

                    total = (
                        self.buffer.expected_frames
                    )

                    return {
                        "ok": True,
                        "type": "DATA",
                        "session_id": (
                            frame.session_id
                        ),
                        "sequence_id": (
                            frame.sequence_id
                        ),
                        "new_frame": is_new,
                        "received_frames": (
                            self.received_frames
                        ),
                        "duplicate_frames": (
                            self.duplicate_frames
                        ),
                        "total_frames": total,
                        "complete": (
                            self.buffer.is_complete()
                        ),
                    }

                # ==================================================
                # END
                # ==================================================

                if isinstance(
                    frame,
                    EndFrame,
                ):

                    if self.buffer is None:
                        raise ProtocolError(
                            "END received before "
                            "METADATA."
                        )

                    if self.metadata is None:
                        raise ProtocolError(
                            "Missing transfer metadata."
                        )

                    if (
                        frame.total_data_frames
                        != self.metadata.total_frames
                    ):
                        raise ProtocolError(
                            "END frame total does not "
                            "match metadata total."
                        )

                    if not self.buffer.is_complete():

                        missing = (
                            self.buffer
                            .missing_sequences()
                        )

                        return {
                            "ok": False,
                            "type": "END",
                            "complete": False,
                            "received_frames": (
                                self.received_frames
                            ),
                            "total_frames": (
                                self.buffer.expected_frames
                            ),
                            "missing_frames": missing,
                            "error": (
                                "END received before "
                                "all DATA frames."
                            ),
                        }

                    # ==================================================
                    # Reconstruct
                    # ==================================================

                    rebuilder = FileRebuilder()

                    prepared_data = (
                        rebuilder
                        .rebuild_prepared_data(
                            self.buffer
                        )
                    )

                    original_data = (
                        rebuilder
                        .rebuild_original_data(
                            prepared_data,
                            self.metadata,
                        )
                    )

                    # ==================================================
                    # Verify + write
                    # ==================================================

                    OUTPUT_DIR.mkdir(
                        parents=True,
                        exist_ok=True,
                    )

                    output_path = verify_and_write(
                        data=original_data,
                        expected_sha256=(
                            self.metadata.sha256
                        ),
                        filename=(
                            self.metadata.filename
                        ),
                        output_dir=OUTPUT_DIR,
                    )

                    self.completed = True

                    self.verified = True

                    self.output_path = str(
                        output_path
                    )

                    return {
                        "ok": True,
                        "type": "END",
                        "complete": True,
                        "verified": True,
                        "filename": (
                            self.metadata.filename
                        ),
                        "received_frames": (
                            self.received_frames
                        ),
                        "total_frames": (
                            self.metadata.total_frames
                        ),
                        "output": str(
                            output_path
                        ),
                    }

                raise ProtocolError(
                    "Unsupported frame type."
                )

            except Exception as exc:

                self.error = str(exc)

                return {
                    "ok": False,
                    "error": str(exc),
                }

    def status(self) -> dict[str, Any]:
        """Return current receiver status."""

        with self.lock:

            if self.buffer is None:

                return {
                    "running": True,
                    "session_active": False,
                    "completed": False,
                    "verified": False,
                }

            total = (
                self.buffer.expected_frames
            )

            progress = (
                self.received_frames / total
                if total > 0
                else 0
            )

            return {
                "running": True,
                "session_active": True,
                "session_id": (
                    self.metadata.session_id
                    if self.metadata
                    else None
                ),
                "filename": self.filename,
                "received_frames": (
                    self.received_frames
                ),
                "duplicate_frames": (
                    self.duplicate_frames
                ),
                "total_frames": total,
                "progress": progress,
                "completed": self.completed,
                "verified": self.verified,
                "output": self.output_path,
                "error": self.error,
            }


# ============================================================
# Global engine
# ============================================================

ENGINE = ReceiverEngine()


# ============================================================
# HTTP Handler
# ============================================================


class ReceiverRequestHandler(
    BaseHTTPRequestHandler
):
    """HTTP API + Receiver webpage handler."""

    server_version = "UselessReceiver/1.0"

    def _send_cors_headers(self) -> None:

        self.send_header(
            "Access-Control-Allow-Origin",
            "*",
        )

        self.send_header(
            "Access-Control-Allow-Methods",
            "GET, POST, OPTIONS",
        )

        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type",
        )

    def _send_json(
        self,
        status_code: int,
        data: dict[str, Any],
    ) -> None:

        body = json.dumps(
            data,
            indent=2,
        ).encode("utf-8")

        self.send_response(
            status_code
        )

        self.send_header(
            "Content-Type",
            "application/json",
        )

        self.send_header(
            "Content-Length",
            str(len(body)),
        )

        self._send_cors_headers()

        self.end_headers()

        self.wfile.write(body)

    def _send_file(
        self,
        file_path: Path,
    ) -> None:

        if not file_path.exists():
            self._send_json(
                404,
                {
                    "ok": False,
                    "error": "File not found.",
                },
            )
            return

        try:
            body = file_path.read_bytes()

        except OSError as exc:

            self._send_json(
                500,
                {
                    "ok": False,
                    "error": str(exc),
                },
            )
            return

        content_type, _ = (
            mimetypes.guess_type(
                str(file_path)
            )
        )

        if content_type is None:

            content_type = (
                "application/octet-stream"
            )

        self.send_response(200)

        self.send_header(
            "Content-Type",
            content_type,
        )

        self.send_header(
            "Content-Length",
            str(len(body)),
        )

        self._send_cors_headers()

        self.end_headers()

        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        """Handle browser CORS preflight."""

        self._send_json(
            200,
            {"ok": True},
        )

    def do_GET(self) -> None:

        # ==================================================
        # RECEIVER WEBPAGE
        # ==================================================

        if self.path == "/":

            self._send_file(
                WEB_DIR / "index.html"
            )

            return

        # ==================================================
        # CSS
        # ==================================================

        if self.path == "/receiver.css":

            self._send_file(
                WEB_DIR / "receiver.css"
            )

            return

        # ==================================================
        # JavaScript
        # ==================================================

        if self.path == "/receiver.js":

            self._send_file(
                WEB_DIR / "receiver.js"
            )

            return

        # ==================================================
        # STATUS
        # ==================================================

        if self.path == "/status":

            self._send_json(
                200,
                ENGINE.status(),
            )

            return

        # ==================================================
        # 404
        # ==================================================

        self._send_json(
            404,
            {
                "ok": False,
                "error": "Endpoint not found.",
            },
        )

    def do_POST(self) -> None:

        # ==================================================
        # RESET
        # ==================================================

        if self.path == "/reset":

            ENGINE.reset()

            self._send_json(
                200,
                {
                    "ok": True,
                    "message": (
                        "Receiver reset."
                    ),
                },
            )

            return

        # ==================================================
        # FRAME
        # ==================================================

        if self.path == "/frame":

            content_length = (
                self.headers.get(
                    "Content-Length"
                )
            )

            if content_length is None:

                self._send_json(
                    400,
                    {
                        "ok": False,
                        "error": (
                            "Content-Length header "
                            "is required."
                        ),
                    },
                )

                return

            try:

                length = int(
                    content_length
                )

            except ValueError:

                self._send_json(
                    400,
                    {
                        "ok": False,
                        "error": (
                            "Invalid Content-Length."
                        ),
                    },
                )

                return

            if length <= 0:

                self._send_json(
                    400,
                    {
                        "ok": False,
                        "error": (
                            "Empty request body."
                        ),
                    },
                )

                return

            if length > MAX_FRAME_SIZE:

                self._send_json(
                    413,
                    {
                        "ok": False,
                        "error": (
                            "Frame is too large."
                        ),
                    },
                )

                return

            payload = self.rfile.read(
                length
            )

            content_type = (
                self.headers.get(
                    "Content-Type",
                    "",
                )
            )

            # ------------------------------------------------
            # Optional JSON/base64 support
            # ------------------------------------------------

            if (
                "application/json"
                in content_type.lower()
            ):

                try:

                    request = json.loads(
                        payload.decode("utf-8")
                    )

                    encoded = request.get(
                        "payload"
                    )

                    if not isinstance(
                        encoded,
                        str,
                    ):

                        raise ValueError(
                            "JSON body must contain "
                            "'payload'."
                        )

                    payload = (
                        base64.b64decode(
                            encoded,
                            validate=True,
                        )
                    )

                except Exception as exc:

                    self._send_json(
                        400,
                        {
                            "ok": False,
                            "error": (
                                "Invalid JSON "
                                f"payload: {exc}"
                            ),
                        },
                    )

                    return

            result = (
                ENGINE.process_frame(
                    payload
                )
            )

            status_code = (
                200
                if result.get("ok")
                else 400
            )

            self._send_json(
                status_code,
                result,
            )

            return

        # ==================================================
        # 404
        # ==================================================

        self._send_json(
            404,
            {
                "ok": False,
                "error": (
                    "Endpoint not found."
                ),
            },
        )

    def log_message(
        self,
        format: str,
        *args: Any,
    ) -> None:

        print(
            f"[Receiver] "
            f"{format % args}"
        )


# ============================================================
# Server
# ============================================================


def run_server() -> None:
    """Start the Receiver HTTP server."""

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    if not WEB_DIR.exists():

        raise RuntimeError(
            f"Receiver web directory does not exist: "
            f"{WEB_DIR}"
        )

    index_file = (
        WEB_DIR / "index.html"
    )

    if not index_file.exists():

        raise RuntimeError(
            f"Receiver webpage does not exist: "
            f"{index_file}"
        )

    server = ThreadingHTTPServer(
        (HOST, PORT),
        ReceiverRequestHandler,
    )

    print()
    print("=" * 50)
    print("       USELESS PROJECT 3.0")
    print("          RECEIVER SERVER")
    print("=" * 50)
    print()

    print(
        f"Listening on: "
        f"http://0.0.0.0:{PORT}"
    )

    print()

    print("Receiver webpage:")

    print(
        f"  http://127.0.0.1:{PORT}/"
    )

    print()

    print("Phone:")

    print(
        "  http://<YOUR-PC-IP>:8000/"
    )

    print()

    print("API:")

    print("  GET  /status")
    print("  POST /frame")
    print("  POST /reset")

    print()

    print(
        "Waiting for Receiver webpage..."
    )

    print()

    print("Press CTRL+C to stop.")
    print()

    try:

        server.serve_forever()

    except KeyboardInterrupt:

        print()
        print(
            "Stopping Receiver..."
        )

    finally:

        server.server_close()


# ============================================================
# Entry point
# ============================================================


if __name__ == "__main__":
    run_server()