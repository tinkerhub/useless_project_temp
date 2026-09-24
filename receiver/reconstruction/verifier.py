"""
Final file verification and safe output.
"""

from __future__ import annotations

import hashlib
import re
from pathlib import Path


class VerificationError(ValueError):
    """Raised when reconstructed data fails verification."""


def calculate_sha256(data: bytes) -> str:
    """Calculate SHA-256 of file data."""

    return hashlib.sha256(data).hexdigest()


def verify_sha256(
    data: bytes,
    expected_sha256: str,
) -> bool:
    """Return True when the SHA-256 matches."""

    actual = calculate_sha256(data)

    return (
        actual.lower()
        == expected_sha256.lower()
    )


def safe_filename(filename: str) -> str:
    """
    Prevent directory traversal and invalid output paths.
    """

    filename = Path(filename).name

    if not filename:
        filename = "received_file"

    # Remove characters that are unsafe on Windows/Linux.
    filename = re.sub(
        r'[<>:"/\\|?*\x00-\x1F]',
        "_",
        filename,
    )

    return filename


def verify_and_write(
    data: bytes,
    expected_sha256: str,
    filename: str,
    output_dir: Path,
) -> Path:
    """
    Verify reconstructed data against the Sender SHA-256
    and write the file only if verification succeeds.
    """

    data = bytes(data)

    actual_sha256 = calculate_sha256(data)

    if actual_sha256.lower() != expected_sha256.lower():

        raise VerificationError(
            "SHA-256 verification failed.\n"
            f"Expected: {expected_sha256}\n"
            f"Actual:   {actual_sha256}"
        )

    output_dir = Path(output_dir)

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    filename = safe_filename(filename)

    output_path = output_dir / filename

    output_path.write_bytes(data)

    return output_path