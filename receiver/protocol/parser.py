"""
Protocol V1 parser.

Converts raw QR bytes into typed frame objects.
"""

from __future__ import annotations

from receiver.config.settings import (
    FRAME_DATA,
    FRAME_END,
    FRAME_METADATA,
)
from receiver.protocol.frames import (
    DataFrame,
    EndFrame,
    MetadataFrame,
    ProtocolError,
    parse_data_frame,
    parse_end_frame,
    parse_metadata_frame,
)
from receiver.protocol.metadata import (
    TransferMetadata,
    parse_metadata,
)


class ProtocolParser:
    """Parse and validate Sender Protocol V1 frames."""

    def __init__(self) -> None:
        self.metadata: TransferMetadata | None = None
        self.session_id: int | None = None

    def parse(
        self,
        payload: bytes,
    ) -> MetadataFrame | DataFrame | EndFrame:
        """Parse one raw QR payload."""

        if not isinstance(payload, (bytes, bytearray)):
            raise ProtocolError(
                "QR payload must be bytes."
            )

        payload = bytes(payload)

        if not payload:
            raise ProtocolError("Empty QR payload.")

        frame_type = payload[0]

        if frame_type == FRAME_METADATA:
            frame = parse_metadata_frame(payload)

            metadata = parse_metadata(frame.metadata)

            if self.metadata is not None:
                if metadata.session_id != self.metadata.session_id:
                    raise ProtocolError(
                        "A second metadata frame belongs to another session."
                    )

            self.metadata = metadata
            self.session_id = metadata.session_id

            return frame

        if frame_type == FRAME_DATA:
            frame = parse_data_frame(payload)

            self._validate_session(frame.session_id)

            return frame

        if frame_type == FRAME_END:
            frame = parse_end_frame(payload)

            self._validate_session(frame.session_id)

            return frame

        raise ProtocolError(
            f"Unknown frame type: 0x{frame_type:02X}"
        )

    def _validate_session(self, session_id: int) -> None:
        if self.session_id is None:
            raise ProtocolError(
                "Received DATA/END before METADATA."
            )

        if session_id != self.session_id:
            raise ProtocolError(
                "Frame belongs to a different session."
            )