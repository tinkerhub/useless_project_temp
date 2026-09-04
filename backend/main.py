from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import base64
import numpy as np
import cv2

from quality_check import run_quality_checks

from detector import (
    get_mouth_roi,
    get_inner_mouth_mask,
)

from segmentation import segment_teeth

from colour_analysis import extract_tooth_colour

from shade_matching import find_closest_shade

from scoring import compute_whiteness_score

from database import (
    initialize_database,
    save_scan,
    get_leaderboard,
    get_scan,
)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="ToothCheck API"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://useless-project-1-6wi2.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# INITIALIZE DATABASE
# =========================================================

initialize_database()


# =========================================================
# REQUEST MODEL
# =========================================================

class ImagePayload(BaseModel):
    image: str
    name: str


# =========================================================
# IMAGE DECODER
# =========================================================

def decode_base64_image(
    data_url: str,
) -> np.ndarray:

    try:

        header, encoded = data_url.split(
            ",",
            1
        )

        img_bytes = base64.b64decode(
            encoded
        )

        np_arr = np.frombuffer(
            img_bytes,
            np.uint8
        )

        image = cv2.imdecode(
            np_arr,
            cv2.IMREAD_COLOR
        )

        return image

    except Exception as error:

        print(
            "Image decoding error:",
            error
        )

        return None


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "status": "ToothCheck backend is running"
    }


# =========================================================
# ANALYZE
# =========================================================

@app.post("/api/analyze")
def analyze(
    payload: ImagePayload
):

    # -----------------------------------------------------
    # Validate name
    # -----------------------------------------------------

    name = payload.name.strip()

    if not name:

        return {
            "error": True,
            "messages": [
                "Please enter your name."
            ]
        }

    # -----------------------------------------------------
    # Decode image
    # -----------------------------------------------------

    image = decode_base64_image(
        payload.image
    )

    if image is None:

        return {
            "error": True,
            "messages": [
                "Could not read the camera image."
            ]
        }

    # -----------------------------------------------------
    # Quality checks
    # -----------------------------------------------------

    quality = run_quality_checks(
        image
    )

    if not quality["passed"]:

        problems = []

        if not quality[
            "brightness"
        ]["ok"]:

            problems.append(
                quality[
                    "brightness"
                ]["message"]
            )

        if not quality[
            "blur"
        ]["ok"]:

            problems.append(
                quality[
                    "blur"
                ]["message"]
            )

        return {
            "error": True,
            "messages": problems
        }

    # -----------------------------------------------------
    # Detect mouth
    # -----------------------------------------------------

    mouth_roi, bbox = get_mouth_roi(
        image
    )

    if (
        mouth_roi is None
        or mouth_roi.size == 0
        or bbox is None
    ):

        return {
            "error": True,
            "messages": [
                "No face detected. "
                "Please face the camera directly."
            ]
        }

    # -----------------------------------------------------
    # Inner mouth mask
    # -----------------------------------------------------

    inner_mask_full = get_inner_mouth_mask(
        image,
        bbox
    )

    x_min, y_min, x_max, y_max = bbox

    inner_mask = inner_mask_full[
        y_min:y_max,
        x_min:x_max
    ]

    # Make sure dimensions match
    if (
        inner_mask.shape[:2]
        != mouth_roi.shape[:2]
    ):

        inner_mask = cv2.resize(
            inner_mask,
            (
                mouth_roi.shape[1],
                mouth_roi.shape[0]
            ),
            interpolation=cv2.INTER_NEAREST
        )

    # -----------------------------------------------------
    # Segment teeth
    # -----------------------------------------------------

    teeth_mask = segment_teeth(
        mouth_roi,
        inner_mask
    )

    tooth_pixel_count = np.count_nonzero(
        teeth_mask
    )

    if tooth_pixel_count < 50:

        return {
            "error": True,
            "messages": [
                "Could not detect teeth clearly. "
                "Try smiling with your teeth visible "
                "and make sure there is enough light."
            ]
        }

    # -----------------------------------------------------
    # Extract tooth colour (+ real pixel spread)
    # -----------------------------------------------------

    lab, lab_std = extract_tooth_colour(
        mouth_roi,
        teeth_mask
    )

    if lab is None:

        return {
            "error": True,
            "messages": [
                "Colour extraction failed."
            ]
        }

    L, a, b = lab

    # -----------------------------------------------------
    # Find closest shade
    # -----------------------------------------------------

    shade, delta_e, all_distances = (
        find_closest_shade(
            (L, a, b)
        )
    )

    # -----------------------------------------------------
    # Calculate whiteness
    # -----------------------------------------------------

    score, category, measurement_confidence = (
        compute_whiteness_score(
            L,
            a,
            b,
            lab_std=lab_std,
        )
    )

    # -----------------------------------------------------
    # Confidence
    # -----------------------------------------------------
    #
    # Blend of shade-match closeness (delta_e) and measured
    # pixel consistency (measurement_confidence) - both real
    # signals, no artificial randomness involved.
    #

    delta_e_confidence = max(
        0.0,
        min(
            1.0,
            1 - (delta_e / 20)
        )
    )

    if measurement_confidence is not None:

        confidence = (
            (delta_e_confidence * 0.6)
            + (measurement_confidence * 0.4)
        )

    else:

        confidence = delta_e_confidence

    # -----------------------------------------------------
    # Save scan to database
    # -----------------------------------------------------

    scan_id = save_scan(
        name=name,
        whiteness_score=score,
        shade=shade,
        yellowing=category,
        staining="Low",
        confidence=round(
            confidence,
            2
        ),
        delta_e=round(
            delta_e,
            2
        ),
        lab_L=round(
            L,
            1
        ),
        lab_a=round(
            a,
            1
        ),
        lab_b=round(
            b,
            1
        ),
    )

    # -----------------------------------------------------
    # Return result
    # -----------------------------------------------------

    return {

        "id": scan_id,

        "name": name,

        "shade": shade,

        "whiteness_score": score,

        "yellowing": category,

        "staining": "Low",

        "confidence": round(
            confidence,
            2
        ),

        "delta_e": round(
            delta_e,
            2
        ),

        "lab": {
            "L": round(
                L,
                1
            ),

            "a": round(
                a,
                1
            ),

            "b": round(
                b,
                1
            ),
        },

        "tooth_pixels": int(
            tooth_pixel_count
        ),
    }


# =========================================================
# LEADERBOARD
# =========================================================

@app.get("/api/leaderboard")
def leaderboard():

    return {
        "leaderboard": get_leaderboard()
    }


# =========================================================
# GET INDIVIDUAL SCAN
# =========================================================

@app.get("/api/scans/{scan_id}")
def scan_result(
    scan_id: int
):

    result = get_scan(
        scan_id
    )

    if result is None:

        return {
            "error": True,
            "message": "Scan not found."
        }

    return result