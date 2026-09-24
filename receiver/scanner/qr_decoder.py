"""
Binary QR decoder.

The Sender generates QR codes using QR byte mode. Therefore this
module MUST return raw bytes instead of assuming UTF-8 text.

zxing-cpp exposes Barcode.bytes for this purpose.
"""

from __future__ import annotations

from typing import Optional

import numpy as np
import zxingcpp


class QRDecoder:
    """Decode raw QR byte payloads from OpenCV images."""

    def decode(self, frame: np.ndarray) -> Optional[bytes]:
        """
        Decode the first QR code in a camera frame.

        Returns:
            Raw QR payload bytes, or None if no QR is readable.
        """

        if frame is None:
            return None

        if not isinstance(frame, np.ndarray):
            return None

        if frame.size == 0:
            return None

        try:
            results = zxingcpp.read_barcodes(
                frame,
                formats=zxingcpp.BarcodeFormat.QRCode,
            )
        except Exception:
            return None

        for result in results:
            if not result.valid:
                continue

            payload = bytes(result.bytes)

            if payload:
                return payload

        return None

    def decode_all(self, frame: np.ndarray) -> list[bytes]:
        """Decode every readable QR payload in a frame."""

        if frame is None:
            return []

        if not isinstance(frame, np.ndarray):
            return []

        if frame.size == 0:
            return []

        try:
            results = zxingcpp.read_barcodes(
                frame,
                formats=zxingcpp.BarcodeFormat.QRCode,
            )
        except Exception:
            return []

        payloads: list[bytes] = []

        for result in results:
            if not result.valid:
                continue

            payload = bytes(result.bytes)

            if payload:
                payloads.append(payload)

        return payloads