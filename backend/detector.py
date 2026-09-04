import mediapipe as mp
import numpy as np
import cv2


mp_face_mesh = mp.solutions.face_mesh


# ---------------------------------------------------------
# MediaPipe landmarks for the INNER mouth / teeth region
# ---------------------------------------------------------
#
# These landmarks describe the inside of the mouth rather
# than the entire face.
#

INNER_MOUTH_IDS = [
    78, 95, 88, 178, 87, 14,
    317, 402, 318, 324, 308,
    415, 310, 311, 312, 13,
    82, 81, 80, 191, 78
]


# Outer mouth landmarks used to establish the mouth area
OUTER_MOUTH_IDS = [
    61, 146, 91, 181, 84, 17,
    314, 405, 321, 375, 291,
    308, 324, 318, 402, 317,
    14, 87, 178, 88, 95,
    185, 40, 39, 37, 0,
    267, 269, 270, 409
]


face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
)


def get_mouth_roi(bgr_image: np.ndarray):
    """
    Detects a face using MediaPipe Face Mesh and returns
    a cropped mouth ROI.

    Returns:
        mouth_roi:
            Cropped mouth image.

        bbox:
            (x_min, y_min, x_max, y_max)

    Returns (None, None) if no face is detected.
    """

    if bgr_image is None or bgr_image.size == 0:
        return None, None

    rgb = cv2.cvtColor(
        bgr_image,
        cv2.COLOR_BGR2RGB
    )

    results = face_mesh.process(rgb)

    if not results.multi_face_landmarks:
        return None, None

    h, w = bgr_image.shape[:2]

    landmarks = results.multi_face_landmarks[0].landmark

    # -----------------------------------------------------
    # Get outer mouth coordinates
    # -----------------------------------------------------

    xs = []
    ys = []

    for idx in OUTER_MOUTH_IDS:

        lm = landmarks[idx]

        x = int(lm.x * w)
        y = int(lm.y * h)

        xs.append(x)
        ys.append(y)

    x_min = max(min(xs) - 15, 0)
    x_max = min(max(xs) + 15, w)

    y_min = max(min(ys) - 15, 0)
    y_max = min(max(ys) + 15, h)

    if x_max <= x_min or y_max <= y_min:
        return None, None

    mouth_roi = bgr_image[
        y_min:y_max,
        x_min:x_max
    ]

    bbox = (
        x_min,
        y_min,
        x_max,
        y_max
    )

    return mouth_roi, bbox


def get_inner_mouth_mask(
    bgr_image: np.ndarray,
    bbox
) -> np.ndarray:
    """
    Creates a mask corresponding to the inner mouth region.

    This prevents the segmentation stage from considering
    the entire rectangular mouth ROI as possible teeth.
    """

    if bgr_image is None or bbox is None:
        return np.zeros(
            bgr_image.shape[:2],
            dtype=np.uint8
        )

    x_min, y_min, x_max, y_max = bbox

    rgb = cv2.cvtColor(
        bgr_image,
        cv2.COLOR_BGR2RGB
    )

    results = face_mesh.process(rgb)

    if not results.multi_face_landmarks:
        return np.zeros(
            bgr_image.shape[:2],
            dtype=np.uint8
        )

    h, w = bgr_image.shape[:2]

    landmarks = results.multi_face_landmarks[0].landmark

    points = []

    for idx in INNER_MOUTH_IDS:

        lm = landmarks[idx]

        x = int(lm.x * w)
        y = int(lm.y * h)

        # Only use points that actually lie inside
        # the detected mouth bounding box.
        if (
            x_min <= x < x_max
            and y_min <= y < y_max
        ):
            points.append([x, y])

    mask = np.zeros(
        (h, w),
        dtype=np.uint8
    )

    if len(points) >= 3:

        points = np.array(
            points,
            dtype=np.int32
        )

        cv2.fillPoly(
            mask,
            [points],
            255
        )

    return mask