"""
Camera abstraction for the Receiver.
"""

from __future__ import annotations

from typing import Optional

import cv2
import numpy as np

from receiver.config.settings import (
    DEFAULT_CAMERA_HEIGHT,
    DEFAULT_CAMERA_INDEX,
    DEFAULT_CAMERA_WIDTH,
)


class Camera:
    """OpenCV webcam wrapper."""

    def __init__(
        self,
        camera_index: int = DEFAULT_CAMERA_INDEX,
        width: int = DEFAULT_CAMERA_WIDTH,
        height: int = DEFAULT_CAMERA_HEIGHT,
    ) -> None:
        self.camera_index = camera_index
        self.width = width
        self.height = height
        self._capture: Optional[cv2.VideoCapture] = None

    def open(self) -> bool:
        """Open the configured webcam."""

        if self._capture is not None:
            return self._capture.isOpened()

        capture = cv2.VideoCapture(self.camera_index)

        if not capture.isOpened():
            capture.release()
            return False

        capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)

        self._capture = capture
        return True

    def read(self) -> tuple[bool, Optional[np.ndarray]]:
        """Read one frame from the webcam."""

        if self._capture is None or not self._capture.isOpened():
            return False, None

        success, frame = self._capture.read()

        if not success:
            return False, None

        return True, frame

    def release(self) -> None:
        """Release the webcam."""

        if self._capture is not None:
            self._capture.release()
            self._capture = None

    def is_open(self) -> bool:
        """Return whether the webcam is currently open."""

        return (
            self._capture is not None
            and self._capture.isOpened()
        )

    def __enter__(self) -> "Camera":
        if not self.open():
            raise RuntimeError(
                f"Unable to open camera index {self.camera_index}."
            )

        return self

    def __exit__(self, exc_type, exc_value, traceback) -> None:
        self.release()