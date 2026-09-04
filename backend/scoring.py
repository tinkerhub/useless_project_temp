import numpy as np


def compute_whiteness_score(
    L,
    a,
    b,
    lab_std=None,
):
    """
    Project-defined whiteness index for the ToothCheck demo.
    NOT a clinical dental measurement.

    Calibration notes:
    - Real, unedited human teeth (not veneers/whitening-strip extremes)
      typically fall in L* ~= 58-82 and b* ~= 9-24.
    - Most natural, healthy-but-average teeth cluster around
      L*~70-74, b*~15-18, which this formula intentionally maps
      to the middle of the scale (~55-65) rather than near the top,
      since "very white" should be the exception, not the default.

    lab_std: optional (std_L, std_a, std_b) describing how spread out
             the sampled tooth pixels were for this scan. Used only to
             report an honest measurement confidence - it never alters
             the score itself. Real variation between separate scans
             (lighting, angle, camera auto-exposure) already produces
             different L/a/b readings on its own, so scores differ
             from scan to scan without needing any artificial noise.
    """

    # ---------------------------------------------------------
    # LIGHTNESS COMPONENT
    # ---------------------------------------------------------

    l_component = (L - 55) / (88 - 55) * 100
    l_component = max(0, min(100, l_component))

    # ---------------------------------------------------------
    # YELLOWNESS COMPONENT (b*)
    # ---------------------------------------------------------

    b_component = (24 - b) / (24 - 8) * 100
    b_component = max(0, min(100, b_component))

    # ---------------------------------------------------------
    # WEIGHTED BLEND
    # ---------------------------------------------------------

    raw_score = (
        0.55 * l_component
        + 0.45 * b_component
    )

    # ---------------------------------------------------------
    # COMPRESS TOWARD THE MIDDLE OF THE SCALE
    # ---------------------------------------------------------
    #
    # Keeps ordinary teeth landing roughly in the 45-75 band,
    # with genuinely bright teeth pushing into the 80s and
    # heavily stained/yellowed teeth pulling into the 20s,
    # instead of every reading clustering at the extremes.
    #

    score = 50 + (raw_score - 50) * 0.75
    score = round(max(0, min(100, score)))

    if score <= 20:
        category = "Very yellow"
    elif score <= 40:
        category = "Yellow"
    elif score <= 60:
        category = "Moderate"
    elif score <= 80:
        category = "Light"
    else:
        category = "Very light"

    # ---------------------------------------------------------
    # MEASUREMENT CONFIDENCE (real signal, optional)
    # ---------------------------------------------------------

    measurement_confidence = None

    if lab_std is not None:

        std_l, std_a, std_b = lab_std

        variability = (std_l + std_b) / 2

        measurement_confidence = max(
            0.4,
            min(
                0.98,
                1 - (variability / 15)
            )
        )

        measurement_confidence = round(
            measurement_confidence,
            2
        )

    return score, category, measurement_confidence