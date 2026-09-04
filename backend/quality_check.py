import cv2
import numpy as np


def check_brightness(gray_image: np.ndarray) -> dict:
    mean_brightness = float(np.mean(gray_image))

    if mean_brightness < 60:
        return {
            "ok": False,
            "message": "Insufficient lighting. Move to a brighter area."
        }

    if mean_brightness > 200:
        return {
            "ok": False,
            "message": "Too much light / overexposed."
        }

    return {
        "ok": True,
        "message": "Lighting OK",
        "value": mean_brightness
    }


def check_blur(gray_image: np.ndarray, threshold: float = 100.0) -> dict:
    blur_score = cv2.Laplacian(gray_image, cv2.CV_64F).var()

    if blur_score < threshold:
        return {
            "ok": False,
            "message": "Image is blurry. Hold still.",
            "value": blur_score
        }

    return {
        "ok": True,
        "message": "Sharpness OK",
        "value": blur_score
    }


def run_quality_checks(bgr_image: np.ndarray) -> dict:
    gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)

    brightness = check_brightness(gray)
    blur = check_blur(gray)

    return {
        "passed": brightness["ok"] and blur["ok"],
        "brightness": brightness,
        "blur": blur,
    }