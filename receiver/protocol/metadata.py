"""
Metadata validation for Protocol V1.
"""

from __future__ import annotations

from dataclasses import dataclass

from receiver.config.settings import (
    BLOCKS_PER_FRAME,
    RS_DATA_BYTES,
    RS_PARITY_BYTES,
)
from receiver.protocol.frames import ProtocolError


@dataclass(frozen=True)
class TransferMetadata:
    version: int
    session_id: int
    filename: str
    mime_type: str
    sha256: str
    compressed: bool
    transfer_mode: str
    coding_method: str
    source_block_size: int
    ecc_per_block: int
    blocks_per_frame: int
    total_frames: int


def _require(metadata: dict, key: str):
    if key not in metadata:
        raise ProtocolError(
            f"Metadata is missing required field '{key}'."
        )

    return metadata[key]


def parse_metadata(metadata: dict) -> TransferMetadata:
    """Validate Sender metadata and convert it to a typed object."""

    version = _require(metadata, "v")
    session_id = _require(metadata, "sid")
    filename = _require(metadata, "fn")
    mime_type = _require(metadata, "mt")
    sha256 = _require(metadata, "sh")
    compressed = _require(metadata, "cp")
    transfer_mode = _require(metadata, "tm")
    coding_method = _require(metadata, "cm")
    source_block_size = _require(metadata, "sb")
    ecc_per_block = _require(metadata, "eb")
    blocks_per_frame = _require(metadata, "bpf")
    total_frames = _require(metadata, "tf")

    if version != 1:
        raise ProtocolError(
            f"Unsupported protocol version: {version}"
        )

    if not isinstance(session_id, int):
        raise ProtocolError("sid must be an integer.")

    if not isinstance(filename, str) or not filename:
        raise ProtocolError("fn must be a non-empty string.")

    if not isinstance(mime_type, str):
        raise ProtocolError("mt must be a string.")

    if not isinstance(sha256, str):
        raise ProtocolError("sh must be a string.")

    if len(sha256) != 64:
        raise ProtocolError(
            "SHA-256 must contain exactly 64 hexadecimal characters."
        )

    try:
        int(sha256, 16)
    except ValueError as exc:
        raise ProtocolError(
            "SHA-256 contains invalid hexadecimal characters."
        ) from exc

    if not isinstance(compressed, bool):
        raise ProtocolError("cp must be boolean.")

    if coding_method != "rs":
        raise ProtocolError(
            f"Unsupported coding method: {coding_method}"
        )

    if source_block_size != RS_DATA_BYTES:
        raise ProtocolError(
            f"Unexpected source block size: {source_block_size}"
        )

    if ecc_per_block != RS_PARITY_BYTES:
        raise ProtocolError(
            f"Unexpected ECC size: {ecc_per_block}"
        )

    if blocks_per_frame != BLOCKS_PER_FRAME:
        raise ProtocolError(
            f"Unexpected blocks per frame: {blocks_per_frame}"
        )

    if not isinstance(total_frames, int) or total_frames < 0:
        raise ProtocolError(
            "tf must be a non-negative integer."
        )

    return TransferMetadata(
        version=version,
        session_id=session_id,
        filename=filename,
        mime_type=mime_type,
        sha256=sha256.lower(),
        compressed=compressed,
        transfer_mode=str(transfer_mode),
        coding_method=coding_method,
        source_block_size=source_block_size,
        ecc_per_block=ecc_per_block,
        blocks_per_frame=blocks_per_frame,
        total_frames=total_frames,
    )