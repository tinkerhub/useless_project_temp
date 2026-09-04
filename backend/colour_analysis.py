import cv2
import numpy as np


def extract_tooth_colour(
    mouth_roi_bgr: np.ndarray,
    teeth_mask: np.ndarray
):
    """
    Extracts a robust representative LAB colour from the
    detected tooth pixels.

    Uses OpenCV for RGB -> LAB conversion instead of scikit-image.

    Returns:
        (L, a, b), (std_L, std_a, std_b)
        or (None, None) if extraction failed.

    This is intended for the ToothCheck demo and is NOT
    a clinical dental colour measurement.
    """

    if (
        mouth_roi_bgr is None
        or mouth_roi_bgr.size == 0
        or teeth_mask is None
    ):
        return None, None

    # ---------------------------------------------------------
    # MAKE SURE MASK SIZE MATCHES IMAGE
    # ---------------------------------------------------------

    if teeth_mask.shape[:2] != mouth_roi_bgr.shape[:2]:
        teeth_mask = cv2.resize(
            teeth_mask,
            (
                mouth_roi_bgr.shape[1],
                mouth_roi_bgr.shape[0]
            ),
            interpolation=cv2.INTER_NEAREST
        )

    # ---------------------------------------------------------
    # GET MASKED PIXELS
    # ---------------------------------------------------------

    mask = teeth_mask > 0

    pixels = mouth_roi_bgr[mask]

    if len(pixels) < 20:
        return None, None

    # ---------------------------------------------------------
    # REMOVE EXTREME CAMERA VALUES
    # ---------------------------------------------------------

    brightness = np.mean(
        pixels.astype(np.float32),
        axis=1
    )

    lower_brightness = np.percentile(
        brightness,
        5
    )

    upper_brightness = np.percentile(
        brightness,
        95
    )

    valid = (
        (brightness >= lower_brightness)
        &
        (brightness <= upper_brightness)
    )

    pixels = pixels[valid]

    if len(pixels) < 20:
        return None, None

    # ---------------------------------------------------------
    # BGR -> RGB
    # ---------------------------------------------------------

    rgb_pixels = pixels[:, ::-1]

    # ---------------------------------------------------------
    # RGB -> LAB
    #
    # OpenCV stores:
    #   L = 0..255
    #   a = 0..255 with 128 as zero
    #   b = 0..255 with 128 as zero
    #
    # Convert to standard CIE Lab:
    #   L = 0..100
    #   a approximately -128..127
    #   b approximately -128..127
    # ---------------------------------------------------------

    rgb_image = rgb_pixels.reshape(-1, 1, 3)

    lab_opencv = cv2.cvtColor(
        rgb_image,
        cv2.COLOR_RGB2LAB
    ).reshape(-1, 3)

    lab_pixels = np.empty(
        lab_opencv.shape,
        dtype=np.float64
    )

    lab_pixels[:, 0] = (
        lab_opencv[:, 0].astype(np.float64)
        * 100.0
        / 255.0
    )

    lab_pixels[:, 1] = (
        lab_opencv[:, 1].astype(np.float64)
        - 128.0
    )

    lab_pixels[:, 2] = (
        lab_opencv[:, 2].astype(np.float64)
        - 128.0
    )

    # ---------------------------------------------------------
    # REMOVE LAB OUTLIERS
    # ---------------------------------------------------------

    lab_median = np.median(
        lab_pixels,
        axis=0
    )

    distances = np.linalg.norm(
        lab_pixels - lab_median,
        axis=1
    )

    distance_limit = np.percentile(
        distances,
        80
    )

    stable_pixels = lab_pixels[
        distances <= distance_limit
    ]

    if len(stable_pixels) < 10:
        stable_pixels = lab_pixels

    # ---------------------------------------------------------
    # FINAL ROBUST COLOUR
    # ---------------------------------------------------------

    representative_lab = np.median(
        stable_pixels,
        axis=0
    )

    L = float(representative_lab[0])
    a = float(representative_lab[1])
    b = float(representative_lab[2])

    # ---------------------------------------------------------
    # REAL PIXEL SPREAD
    # ---------------------------------------------------------

    std_lab = np.std(
        stable_pixels,
        axis=0
    )

    std_L = float(std_lab[0])
    std_a = float(std_lab[1])
    std_b = float(std_lab[2])

    return (L, a, b), (std_L, std_a, std_b)
