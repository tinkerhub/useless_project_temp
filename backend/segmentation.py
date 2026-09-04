import cv2
import numpy as np


def segment_teeth(
    mouth_roi_bgr: np.ndarray,
    inner_mask: np.ndarray = None
) -> np.ndarray:
    """
    Detect likely human tooth pixels.

    The detector is intentionally strict:
    - Only pixels inside the detected mouth are considered.
    - Teeth must be bright.
    - Teeth must have relatively low saturation.
    - Red/pink tongue and lips are rejected.
    - Very large / arbitrary regions are rejected.
    """

    if (
        mouth_roi_bgr is None
        or mouth_roi_bgr.size == 0
        or inner_mask is None
    ):
        return np.zeros(
            (1, 1),
            dtype=np.uint8
        )

    height, width = mouth_roi_bgr.shape[:2]

    # Make sure mask is binary.
    inner_mask = np.where(
        inner_mask > 0,
        255,
        0
    ).astype(np.uint8)

    # ---------------------------------------------------------
    # 1. Work ONLY inside the mouth
    # ---------------------------------------------------------

    hsv = cv2.cvtColor(
        mouth_roi_bgr,
        cv2.COLOR_BGR2HSV
    )

    lab = cv2.cvtColor(
        mouth_roi_bgr,
        cv2.COLOR_BGR2LAB
    )

    h, s, v = cv2.split(hsv)
    L, A, B = cv2.split(lab)

    # ---------------------------------------------------------
    # 2. Teeth are relatively bright
    # ---------------------------------------------------------

    bright = v >= 125
    light = L >= 125

    # Teeth normally have considerably less saturation
    # than lips and tongue.
    low_saturation = s <= 85

    # ---------------------------------------------------------
    # 3. Explicitly reject tongue / lips
    # ---------------------------------------------------------

    red_or_pink = (
        (
            (h <= 15) |
            (h >= 160)
        )
        &
        (s >= 35)
        &
        (v >= 55)
    )

    # LAB A channel tends to increase for reddish/pink areas.
    pink_lab = A >= 145

    not_tongue_or_lips = (
        ~red_or_pink
        &
        ~pink_lab
    )

    # ---------------------------------------------------------
    # 4. Combine tooth characteristics
    # ---------------------------------------------------------

    candidate = (
        inner_mask > 0
    ) & (
        bright
    ) & (
        light
    ) & (
        low_saturation
    ) & (
        not_tongue_or_lips
    )

    mask = (
        candidate.astype(np.uint8)
        * 255
    )

    # ---------------------------------------------------------
    # 5. Restrict to the central mouth area
    #
    # Objects outside the central mouth region should not
    # become teeth even if they are white.
    # ---------------------------------------------------------

    central_mask = np.zeros_like(mask)

    x_start = int(width * 0.08)
    x_end = int(width * 0.92)

    y_start = int(height * 0.12)
    y_end = int(height * 0.78)

    central_mask[
        y_start:y_end,
        x_start:x_end
    ] = 255

    mask = cv2.bitwise_and(
        mask,
        central_mask
    )

    # ---------------------------------------------------------
    # 6. Remove tiny noise
    # ---------------------------------------------------------

    kernel_small = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE,
        (3, 3)
    )

    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_OPEN,
        kernel_small,
        iterations=1
    )

    # ---------------------------------------------------------
    # 7. Join nearby tooth pixels
    # ---------------------------------------------------------

    kernel_medium = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE,
        (5, 3)
    )

    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_CLOSE,
        kernel_medium,
        iterations=2
    )

    # ---------------------------------------------------------
    # 8. Connected component filtering
    # ---------------------------------------------------------

    num_labels, labels, stats, _ = (
        cv2.connectedComponentsWithStats(
            mask,
            connectivity=8
        )
    )

    cleaned_mask = np.zeros_like(mask)

    roi_area = height * width

    # Need a meaningful amount of tooth pixels.
    min_area = max(
        12,
        int(roi_area * 0.0008)
    )

    for label in range(
        1,
        num_labels
    ):
        area = stats[
            label,
            cv2.CC_STAT_AREA
        ]

        component_width = stats[
            label,
            cv2.CC_STAT_WIDTH
        ]

        component_height = stats[
            label,
            cv2.CC_STAT_HEIGHT
        ]

        if area < min_area:
            continue

        if component_width < 3:
            continue

        if component_height < 2:
            continue

        # Reject extremely large regions.
        # A white wall/object filling the mouth area should
        # not automatically become a tooth region.
        if area > roi_area * 0.45:
            continue

        component_ratio = (
            component_width /
            max(component_height, 1)
        )

        # Reject extremely thin horizontal/vertical noise.
        if component_ratio > 15:
            continue

        if component_ratio < 0.08:
            continue

        cleaned_mask[
            labels == label
        ] = 255

    # ---------------------------------------------------------
    # 9. Final cleanup
    # ---------------------------------------------------------

    cleaned_mask = cv2.morphologyEx(
        cleaned_mask,
        cv2.MORPH_CLOSE,
        kernel_small,
        iterations=1
    )

    return cleaned_mask