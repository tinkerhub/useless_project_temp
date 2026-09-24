"""
Protocol V1 frame structures.

Matches src/Protocol.js in the JavaScript Sender.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from receiver.config.settings import (
    DATA_HEADER_SIZE,
    FRAME_DATA,
    FRAME_END,
    FRAME_METADATA,
)


class ProtocolError(ValueError):
    """Raised when a Protocol V1 frame is malformed."""


@dataclass(frozen=True)
class MetadataFrame:
    metadata: dict[str, Any]


@dataclass(frozen=True)
class DataFrame:
    session_id: int
    sequence_id: int
    payload: bytes


@dataclass(frozen=True)
class EndFrame:
    session_id: int
    total_data_frames: int


def read_uint32_be(data: bytes, offset: int) -> int:
    """Read a big-endian uint32."""

    if offset < 0 or offset + 4 > len(data):
        raise ProtocolError("Not enough bytes for uint32.")

    return int.from_bytes(
        data[offset : offset + 4],
        byteorder="big",
        signed=False,
    )


def parse_data_frame(data: bytes) -> DataFrame:
    """Parse a DATA frame."""

    if len(data) < DATA_HEADER_SIZE:
        raise ProtocolError(
            f"DATA frame too short: {len(data)} bytes."
        )

    if data[0] != FRAME_DATA:
        raise ProtocolError("Frame is not DATA.")

    session_id = read_uint32_be(data, 1)
    sequence_id = read_uint32_be(data, 5)

    payload = bytes(data[DATA_HEADER_SIZE:])

    if not payload:
        raise ProtocolError("DATA frame contains no payload.")

    return DataFrame(
        session_id=session_id,
        sequence_id=sequence_id,
        payload=payload,
    )


def parse_end_frame(data: bytes) -> EndFrame:
    """Parse an END frame."""

    if len(data) != 9:
        raise ProtocolError(
            f"END frame must contain 9 bytes; got {len(data)}."
        )

    if data[0] != FRAME_END:
        raise ProtocolError("Frame is not END.")

    session_id = read_uint32_be(data, 1)
    total_data_frames = read_uint32_be(data, 5)

    return EndFrame(
        session_id=session_id,
        total_data_frames=total_data_frames,
    )


def parse_metadata_frame(data: bytes) -> MetadataFrame:
    """Parse a METADATA frame."""

    if len(data) < 2:
        raise ProtocolError("Metadata frame is too short.")

    if data[0] != FRAME_METADATA:
        raise ProtocolError("Frame is not METADATA.")

    try:
        import json

        metadata = json.loads(data[1:].decode("utf-8"))

    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ProtocolError(
            f"Invalid metadata JSON: {exc}"
        ) from exc

    if not isinstance(metadata, dict):
        raise ProtocolError("Metadata JSON must be an object.")

    return MetadataFrame(metadata=metadata)