"""
Session frame buffer.

Responsibilities:

- reject duplicate DATA frames
- keep frames associated with one session
- preserve sequence IDs
- determine when all DATA frames have arrived
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class BufferedFrame:
    sequence_id: int
    data: bytes


class FrameBuffer:
    """Ordered DATA-frame storage."""

    def __init__(
        self,
        session_id: int,
        expected_frames: int,
    ) -> None:

        self.session_id = session_id
        self.expected_frames = expected_frames

        self._frames: dict[int, bytes] = {}

    def add(
        self,
        sequence_id: int,
        data: bytes,
    ) -> bool:
        """
        Add a frame.

        Returns:
            True if this was a new frame.
            False if it was a duplicate.
        """

        if sequence_id < 0:
            raise ValueError(
                "Sequence ID cannot be negative."
            )

        if sequence_id >= self.expected_frames:
            raise ValueError(
                f"Sequence ID {sequence_id} is outside expected "
                f"range 0..{self.expected_frames - 1}."
            )

        if sequence_id in self._frames:
            return False

        self._frames[sequence_id] = bytes(data)

        return True

    def contains(self, sequence_id: int) -> bool:
        return sequence_id in self._frames

    def received_count(self) -> int:
        return len(self._frames)

    def is_complete(self) -> bool:
        return (
            len(self._frames)
            == self.expected_frames
        )

    def missing_sequences(self) -> list[int]:
        return [
            sequence
            for sequence in range(self.expected_frames)
            if sequence not in self._frames
        ]

    def ordered_frames(self) -> list[BufferedFrame]:
        """Return frames sorted by sequence ID."""

        return [
            BufferedFrame(
                sequence_id=sequence_id,
                data=self._frames[sequence_id],
            )
            for sequence_id in sorted(self._frames)
        ]

    def clear(self) -> None:
        self._frames.clear()