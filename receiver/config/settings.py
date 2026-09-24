"""
Receiver-wide configuration.

All protocol values here match the current JavaScript Sender.
"""

from pathlib import Path


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

RECEIVER_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = RECEIVER_ROOT / "output"


# ---------------------------------------------------------
# Protocol V1
# ---------------------------------------------------------

PROTOCOL_VERSION = 1

FRAME_METADATA = 0x00
FRAME_DATA = 0x01
FRAME_END = 0x02


# ---------------------------------------------------------
# DATA frame
# ---------------------------------------------------------

DATA_HEADER_SIZE = 9

SESSION_ID_OFFSET = 1
SEQUENCE_ID_OFFSET = 5


# ---------------------------------------------------------
# Reed-Solomon
# ---------------------------------------------------------

RS_DATA_BYTES = 230
RS_PARITY_BYTES = 25
RS_BLOCK_SIZE = RS_DATA_BYTES + RS_PARITY_BYTES

RS_PRIMITIVE_POLY = 0x11D
RS_FIELD_SIZE = 256

BLOCKS_PER_FRAME = 8

PACKED_PAYLOAD_SIZE = RS_BLOCK_SIZE * BLOCKS_PER_FRAME

EXPECTED_DATA_FRAME_SIZE = DATA_HEADER_SIZE + PACKED_PAYLOAD_SIZE


# ---------------------------------------------------------
# QR
# ---------------------------------------------------------

QR_VERSION = 40
QR_ERROR_CORRECTION = "L"


# ---------------------------------------------------------
# Receiver defaults
# ---------------------------------------------------------

DEFAULT_CAMERA_INDEX = 0
DEFAULT_CAMERA_WIDTH = 1280
DEFAULT_CAMERA_HEIGHT = 720


# ---------------------------------------------------------
# Safety
# ---------------------------------------------------------

MAX_FILENAME_LENGTH = 255