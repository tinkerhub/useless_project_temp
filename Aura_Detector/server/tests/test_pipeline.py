"""Unit tests for the YOLO adapter without loading a real checkpoint."""

import cv2
import numpy as np
import pytest

from server.pipeline import VisionPipeline


class FakeBoxes:
    xyxy = np.array(
        [
            [64, 36, 320, 180],
            [320, 180, 640, 360],
            [10, 10, 50, 50],
        ],
        dtype=np.float32,
    )
    conf = np.array([0.70, 0.90, 0.99], dtype=np.float32)
    cls = np.array([0, 0, 1], dtype=np.float32)
    id = np.array([5, 9, 44], dtype=np.float32)


class FakeMasks:
    xy = [
        np.array([[64, 36], [320, 36], [320, 180], [64, 180]], dtype=np.float32),
        np.array([[320, 180], [640, 180], [640, 360], [320, 360]], dtype=np.float32),
        np.array([[10, 10], [50, 10], [50, 50], [10, 50]], dtype=np.float32),
    ]


class FakeResult:
    boxes = FakeBoxes()
    masks = FakeMasks()


class FakeModel:
    task = "segment"

    def __init__(self):
        self.calls = []

    def track(self, image, **kwargs):
        self.calls.append((image, kwargs))
        return [FakeResult()]


def jpeg_bytes(width=640, height=360):
    ok, encoded = cv2.imencode(".jpg", np.zeros((height, width, 3), dtype=np.uint8))
    assert ok
    return encoded.tobytes()


def test_process_frame_filters_people_normalises_and_ranks():
    model = FakeModel()
    pipeline = VisionPipeline(model=model, device="cpu", max_subjects=2)

    subjects = pipeline.process_frame(jpeg_bytes(), width=640, height=360)

    assert [subject.id for subject in subjects] == [9, 5]
    assert [subject.confidence for subject in subjects] == pytest.approx([0.90, 0.70], abs=1e-5)
    assert subjects[0].box == pytest.approx([0.5, 0.5, 0.5, 0.5])
    assert subjects[0].contour is not None
    assert all(0.0 <= value <= 1.0 for point in subjects[0].contour for value in point)

    kwargs = model.calls[-1][1]
    assert kwargs["classes"] == [0]
    assert kwargs["tracker"] == "botsort.yaml"
    assert kwargs["persist"] is True
    assert kwargs["device"] == "cpu"


def test_process_frame_uses_fallback_id_when_tracker_does_not_return_one():
    model = FakeModel()
    model_result = FakeResult()
    model_result.boxes.id = None
    model.track = lambda image, **kwargs: [model_result]
    pipeline = VisionPipeline(model=model, device="cpu")

    subjects = pipeline.process_frame(jpeg_bytes(), width=640, height=360)

    assert {subject.id for subject in subjects} == {1, 2}


def test_process_frame_rejects_invalid_jpeg():
    pipeline = VisionPipeline(model=FakeModel(), device="cpu")

    with pytest.raises(ValueError, match="could not be decoded"):
        pipeline.process_frame(b"not-a-jpeg", width=640, height=360)


def test_unloaded_pipeline_keeps_transport_response_empty_until_startup_finishes():
    pipeline = VisionPipeline(device="cpu")

    assert pipeline.process_frame(jpeg_bytes(), width=640, height=360) == []
