"""
Reconstruct the prepared file stream from corrected
Reed-Solomon blocks.
"""

from __future__ import annotations

import hashlib

from receiver.buffer.frame_buffer import FrameBuffer
from receiver.error_correction.reed_solomon import (
    ReedSolomonDecoder,
)
from receiver.protocol.metadata import TransferMetadata
from receiver.reconstruction.decompressor import Decompressor


class FileRebuilder:
    """Rebuild the original file from buffered DATA frames."""

    def __init__(
        self,
        rs_decoder: ReedSolomonDecoder | None = None,
    ) -> None:

        self.rs_decoder = (
            rs_decoder
            if rs_decoder is not None
            else ReedSolomonDecoder()
        )

    def rebuild_prepared_data(
        self,
        buffer: FrameBuffer,
    ) -> bytes:
        """
        Decode all RS blocks and reconstruct the prepared
        transmission stream.

        If compression was used by the Sender, this result
        is still GZIP-compressed.
        """

        if not buffer.is_complete():
            missing = buffer.missing_sequences()

            raise ValueError(
                "Cannot rebuild incomplete transmission. "
                f"Missing frames: {missing}"
            )

        prepared = bytearray()

        for frame in buffer.ordered_frames():

            corrected = self.rs_decoder.decode_payload(
                frame.data
            )

            prepared.extend(corrected)

        return bytes(prepared)

    def rebuild_original_data(
        self,
        prepared_data: bytes,
        metadata: TransferMetadata,
    ) -> bytes:
        """
        Convert the reconstructed prepared stream into the
        original file.

        Compressed:
            prepared → GZIP → original

        Uncompressed:
            prepared contains zero padding at the end.
            Since the Sender does not transmit original_size,
            use the Sender's SHA-256 to determine the exact
            original length.
        """

        prepared_data = bytes(prepared_data)

        # ----------------------------------------------------
        # Compressed transmission
        # ----------------------------------------------------

        if metadata.compressed:

            return Decompressor.process(
                prepared_data,
                compressed=True,
            )

        # ----------------------------------------------------
        # Uncompressed transmission
        # ----------------------------------------------------

        return self._remove_padding_using_hash(
            prepared_data,
            metadata.sha256,
        )

    @staticmethod
    def _remove_padding_using_hash(
        prepared_data: bytes,
        expected_sha256: str,
    ) -> bytes:
        """
        Recover the exact original size from the SHA-256.

        The Sender pads the final 230-byte data block with
        zeros. Therefore there can be at most 229 padding
        bytes.

        We test the possible endings until the calculated
        SHA-256 matches the metadata hash.
        """

        expected_sha256 = expected_sha256.lower()

        # No padding / exact multiple of 230.
        candidates = range(
            len(prepared_data),
            max(-1, len(prepared_data) - 230),
            -1,
        )

        for length in candidates:

            candidate = prepared_data[:length]

            digest = hashlib.sha256(
                candidate
            ).hexdigest()

            if digest == expected_sha256:
                return candidate

        raise ValueError(
            "Unable to recover original file length. "
            "The reconstructed data does not match the "
            "Sender's SHA-256."
        )