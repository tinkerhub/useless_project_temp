"""YOLO-backed person segmentation and tracking pipeline.

The pipeline deliberately owns only vision concerns. Aura profiles and live
values are assigned outside this module so a model failure cannot silently
turn into a fictional measurement.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, List, Optional, Sequence

import cv2
import numpy as np

from .protocol import Subject

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MODEL_NAME = "yolo26n-seg.pt"
PERSON_CLASS_ID = 0


class ModelUnavailableError(RuntimeError):
    """Raised when inference was requested but the model is unavailable."""


class InvalidFrameError(ValueError):
    """Raised when a frame payload cannot be decoded for inference."""


class VisionPipeline:
    """Decode frames and return up to six tracked person subjects."""

    def __init__(
        self,
        model_path: str | Path | None = None,
        device: str | int | None = None,
        confidence: float = 0.35,
        image_size: int = 640,
        tracker: str = "botsort.yaml",
        max_subjects: int = 6,
        model: Any | None = None,
    ) -> None:
        configured_path = model_path or os.getenv("AURA_MODEL_PATH", DEFAULT_MODEL_NAME)
        self.model_path = Path(configured_path).expanduser()
        self.device = device if device is not None else os.getenv("AURA_DEVICE", "auto")
        self.confidence = confidence
        self.image_size = image_size
        self.tracker = tracker
        self.max_subjects = max_subjects
        self.model = model
        self.model_ready = model is not None
        self.last_error: Optional[str] = None
        self._fallback_track_id = 1

    def _resolved_model_path(self) -> Path:
        """Resolve relative checkpoints from the repository root when needed."""
        if self.model_path.is_absolute():
            return self.model_path
        if self.model_path.exists():
            return self.model_path.resolve()
        return (PROJECT_ROOT / self.model_path).resolve()

    def _resolved_device(self) -> str | int:
        """Use CUDA device 0 when available, otherwise keep the baseline usable."""
        configured = self.device
        if configured != "auto":
            return configured

        try:
            import torch

            return 0 if torch.cuda.is_available() else "cpu"
        except Exception:
            return "cpu"

    def load_model(self) -> None:
        """Load the configured segmentation checkpoint once."""
        if self.model is not None:
            self.model_ready = True
            self.last_error = None
            self.device = self._resolved_device()
            return

        try:
            from ultralytics import YOLO

            path = self._resolved_model_path()
            logger.info("Loading YOLO segmentation model from %s", path)
            model = YOLO(str(path))
            task = getattr(model, "task", None)
            if task not in (None, "segment"):
                raise RuntimeError(
                    f"Configured model must be an instance-segmentation model, got task={task!r}"
                )

            self.model = model
            self.device = self._resolved_device()
            self.model_ready = True
            self.last_error = None
            logger.info(
                "YOLO model ready: path=%s device=%s confidence=%.2f image_size=%d tracker=%s",
                path,
                self.device,
                self.confidence,
                self.image_size,
                self.tracker,
            )
        except Exception as exc:
            self.model = None
            self.model_ready = False
            self.last_error = str(exc)
            logger.exception("Unable to load YOLO model")
            raise

    def warmup(self) -> None:
        """Run one inference so the first real frame does not pay setup cost."""
        if self.model is None:
            logger.warning("Warmup skipped because the YOLO model is not loaded")
            return

        try:
            blank = np.zeros((self.image_size, self.image_size, 3), dtype=np.uint8)
            self._run_model(blank, persist=False)
            logger.info("YOLO warmup complete")
        except Exception as exc:
            self.model_ready = False
            self.last_error = str(exc)
            logger.exception("YOLO warmup failed")
            raise

    def _run_model(self, image: np.ndarray, *, persist: bool) -> Any:
        if self.model is None or not self.model_ready:
            if self.last_error:
                raise ModelUnavailableError(self.last_error)
            return []

        return self.model.track(
            image,
            persist=persist,
            tracker=self.tracker,
            classes=[PERSON_CLASS_ID],
            imgsz=self.image_size,
            conf=self.confidence,
            device=self.device,
            verbose=False,
        )

    @staticmethod
    def _to_numpy(value: Any) -> Optional[np.ndarray]:
        if value is None:
            return None
        if hasattr(value, "detach"):
            value = value.detach()
        if hasattr(value, "cpu"):
            value = value.cpu()
        if hasattr(value, "numpy"):
            value = value.numpy()
        return np.asarray(value)

    @staticmethod
    def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
        return max(low, min(high, float(value)))

    def _normalise_box(
        self,
        xyxy: Sequence[float],
        width: int,
        height: int,
    ) -> Optional[List[float]]:
        x1, y1, x2, y2 = (float(value) for value in xyxy[:4])
        if not all(np.isfinite((x1, y1, x2, y2))):
            return None

        left = self._clamp(x1 / width)
        top = self._clamp(y1 / height)
        right = self._clamp(x2 / width)
        bottom = self._clamp(y2 / height)
        if right <= left or bottom <= top:
            return None
        return [left, top, right - left, bottom - top]

    def _normalise_contour(
        self,
        result: Any,
        index: int,
        width: int,
        height: int,
    ) -> Optional[List[List[float]]]:
        masks = getattr(result, "masks", None)
        if masks is None:
            return None

        contours = getattr(masks, "xy", None)
        if contours is None or index >= len(contours):
            contours = getattr(masks, "xyn", None)
            if contours is None or index >= len(contours):
                return None
            points = np.asarray(contours[index], dtype=np.float32)
        else:
            points = np.asarray(contours[index], dtype=np.float32)
            if len(points) >= 3:
                perimeter = cv2.arcLength(points.reshape(-1, 1, 2), True)
                epsilon = max(1.0, perimeter * 0.01)
                simplified = cv2.approxPolyDP(
                    points.reshape(-1, 1, 2), epsilon, True
                ).reshape(-1, 2)
                if len(simplified) >= 3:
                    points = simplified
            points[:, 0] /= width
            points[:, 1] /= height

        if len(points) < 3:
            return None
        if len(points) > 96:
            stride = int(np.ceil(len(points) / 96))
            points = points[::stride]
        if len(points) < 3:
            return None

        normalised = [
            [
                round(self._clamp(point[0]), 4),
                round(self._clamp(point[1]), 4),
            ]
            for point in points
            if np.isfinite(point[0]) and np.isfinite(point[1])
        ]
        return normalised if len(normalised) >= 3 else None

    def process_frame(self, jpeg_bytes: bytes, width: int, height: int) -> List[Subject]:
        """Decode and infer one JPEG, returning normalized person metadata."""
        if width <= 0 or height <= 0:
            raise InvalidFrameError("Frame dimensions must be positive")
        if not jpeg_bytes:
            raise InvalidFrameError("JPEG payload is empty")

        encoded = np.frombuffer(jpeg_bytes, dtype=np.uint8)
        image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
        if image is None:
            raise InvalidFrameError("JPEG could not be decoded")

        actual_height, actual_width = image.shape[:2]
        results = self._run_model(image, persist=True)
        if not results:
            return []

        result = results[0]
        boxes = getattr(result, "boxes", None)
        if boxes is None:
            return []

        xyxy = self._to_numpy(getattr(boxes, "xyxy", None))
        confidence = self._to_numpy(getattr(boxes, "conf", None))
        class_ids = self._to_numpy(getattr(boxes, "cls", None))
        track_ids = self._to_numpy(getattr(boxes, "id", None))
        if xyxy is None or confidence is None:
            return []

        detections: list[tuple[float, int, List[float], Optional[List[List[float]]]]] = []
        count = min(len(xyxy), len(confidence))
        for index in range(count):
            if class_ids is not None and index < len(class_ids):
                if int(class_ids[index]) != PERSON_CLASS_ID:
                    continue

            box = self._normalise_box(xyxy[index], actual_width, actual_height)
            if box is None:
                continue

            score = float(confidence[index])
            if not np.isfinite(score):
                continue

            if track_ids is not None and index < len(track_ids) and np.isfinite(track_ids[index]):
                track_id = int(track_ids[index])
            else:
                track_id = self._fallback_track_id
                self._fallback_track_id += 1
                logger.debug("Tracker returned no ID; using fallback ID %d", track_id)

            contour = self._normalise_contour(result, index, actual_width, actual_height)
            detections.append((score, track_id, box, contour))

        detections.sort(key=lambda detection: detection[0], reverse=True)
        return [
            Subject(
                id=track_id,
                confidence=score,
                box=box,
                contour=contour,
            )
            for score, track_id, box, contour in detections[: self.max_subjects]
        ]
