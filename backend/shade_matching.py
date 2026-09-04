import json
import os
import numpy as np


SHADES_PATH = os.path.join(
    os.path.dirname(__file__),
    "data",
    "shades.json"
)

with open(SHADES_PATH) as f:
    SHADE_DB = json.load(f)


def ciede2000(lab1, lab2):
    """
    Calculate CIEDE2000 colour difference between two
    CIE Lab colours.

    lab format:
        (L, a, b)
    """

    L1, a1, b1 = map(float, lab1)
    L2, a2, b2 = map(float, lab2)

    C1 = np.sqrt(a1 ** 2 + b1 ** 2)
    C2 = np.sqrt(a2 ** 2 + b2 ** 2)

    C_bar = (C1 + C2) / 2.0

    G = 0.5 * (
        1.0
        - np.sqrt(
            C_bar ** 7
            / (C_bar ** 7 + 25.0 ** 7)
        )
    )

    a1_prime = (1.0 + G) * a1
    a2_prime = (1.0 + G) * a2

    C1_prime = np.sqrt(
        a1_prime ** 2 + b1 ** 2
    )

    C2_prime = np.sqrt(
        a2_prime ** 2 + b2 ** 2
    )

    h1_prime = np.degrees(
        np.arctan2(b1, a1_prime)
    ) % 360.0

    h2_prime = np.degrees(
        np.arctan2(b2, a2_prime)
    ) % 360.0

    delta_L_prime = L2 - L1
    delta_C_prime = C2_prime - C1_prime

    if C1_prime * C2_prime == 0:
        delta_h_prime = 0.0
    elif abs(h2_prime - h1_prime) <= 180.0:
        delta_h_prime = h2_prime - h1_prime
    elif h2_prime - h1_prime > 180.0:
        delta_h_prime = h2_prime - h1_prime - 360.0
    else:
        delta_h_prime = h2_prime - h1_prime + 360.0

    delta_H_prime = (
        2.0
        * np.sqrt(C1_prime * C2_prime)
        * np.sin(np.radians(delta_h_prime / 2.0))
    )

    L_bar_prime = (L1 + L2) / 2.0
    C_bar_prime = (C1_prime + C2_prime) / 2.0

    if C1_prime * C2_prime == 0:
        h_bar_prime = h1_prime + h2_prime
    elif abs(h1_prime - h2_prime) <= 180.0:
        h_bar_prime = (h1_prime + h2_prime) / 2.0
    elif h1_prime + h2_prime < 360.0:
        h_bar_prime = (
            h1_prime + h2_prime + 360.0
        ) / 2.0
    else:
        h_bar_prime = (
            h1_prime + h2_prime - 360.0
        ) / 2.0

    T = (
        1.0
        - 0.17 * np.cos(
            np.radians(h_bar_prime - 30.0)
        )
        + 0.24 * np.cos(
            np.radians(2.0 * h_bar_prime)
        )
        + 0.32 * np.cos(
            np.radians(3.0 * h_bar_prime + 6.0)
        )
        - 0.20 * np.cos(
            np.radians(4.0 * h_bar_prime - 63.0)
        )
    )

    delta_theta = 30.0 * np.exp(
        -(
            (h_bar_prime - 275.0) / 25.0
        ) ** 2
    )

    R_C = 2.0 * np.sqrt(
        C_bar_prime ** 7
        / (C_bar_prime ** 7 + 25.0 ** 7)
    )

    S_L = 1.0 + (
        0.015
        * (L_bar_prime - 50.0) ** 2
        / np.sqrt(
            20.0
            + (L_bar_prime - 50.0) ** 2
        )
    )

    S_C = 1.0 + 0.045 * C_bar_prime

    S_H = 1.0 + 0.015 * C_bar_prime * T

    R_T = (
        -np.sin(
            np.radians(2.0 * delta_theta)
        )
        * R_C
    )

    delta_E = np.sqrt(
        (delta_L_prime / S_L) ** 2
        + (delta_C_prime / S_C) ** 2
        + (delta_H_prime / S_H) ** 2
        + R_T
        * (delta_C_prime / S_C)
        * (delta_H_prime / S_H)
    )

    return float(delta_E)


def find_closest_shade(user_lab):
    """
    user_lab: (L, a, b) tuple

    Returns:
        (
            best_shade_name,
            delta_e,
            all_distances_dict
        )
    """

    distances = {}

    for shade_name, lab in SHADE_DB.items():

        reference_lab = (
            lab["L"],
            lab["a"],
            lab["b"]
        )

        delta_e = ciede2000(
            user_lab,
            reference_lab
        )

        distances[shade_name] = delta_e

    best_shade = min(
        distances,
        key=distances.get
    )

    return (
        best_shade,
        distances[best_shade],
        distances
    )
