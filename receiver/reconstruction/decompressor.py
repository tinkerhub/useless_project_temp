"""
Decompression layer.

The Sender uses GZIP compression.
"""

from __future__ import annotations

import zlib


class DecompressionError(ValueError):
    """Raised when GZIP decompression fails."""


class Decompressor:
    """Decode Sender-compressed byte streams."""

    @staticmethod
    def gzip(data: bytes) -> bytes:
        """
        Decompress a GZIP stream.

        Padding zeros may exist because the Sender pads the final
        RS block to 230 bytes. We therefore allow unused trailing
        bytes only when they are all zero.
        """

        data = bytes(data)

        if not data:
            raise DecompressionError(
                "Cannot decompress empty data."
            )

        decompressor = zlib.decompressobj(
            wbits=16 + zlib.MAX_WBITS
        )

        try:
            output = (
                decompressor.decompress(data)
                + decompressor.flush()
            )
        except zlib.error as exc:
            raise DecompressionError(
                f"GZIP decompression failed: {exc}"
            ) from exc

        if not decompressor.eof:
            raise DecompressionError(
                "GZIP stream ended before reaching its end marker."
            )

        trailing = decompressor.unused_data

        if trailing and any(byte != 0 for byte in trailing):
            raise DecompressionError(
                "Non-zero bytes found after GZIP stream."
            )

        return output

    @staticmethod
    def process(
        data: bytes,
        compressed: bool,
    ) -> bytes:
        """Decompress when metadata says the file was compressed."""

        if not compressed:
            return bytes(data)

        return Decompressor.gzip(data)