"""
Reed-Solomon decoder compatible with the Sender.

Sender configuration:

    GF(2^8)
    primitive polynomial = 0x11D
    data symbols = 230
    parity symbols = 25
    total symbols = 255
"""

from __future__ import annotations

from reedsolo import RSCodec, ReedSolomonError

from receiver.config.settings import (
    RS_BLOCK_SIZE,
    RS_DATA_BYTES,
    RS_PARITY_BYTES,
)


class ReedSolomonDecoder:
    """Decode one or more Sender RS blocks."""

    def __init__(
        self,
        parity_bytes: int = RS_PARITY_BYTES,
    ) -> None:

        if parity_bytes != RS_PARITY_BYTES:
            raise ValueError(
                "This receiver is configured for 25 parity bytes."
            )

        self.parity_bytes = parity_bytes

        self.codec = RSCodec(
            nsym=parity_bytes,
            nsize=RS_BLOCK_SIZE,
            fcr=0,
            prim=0x11D,
            generator=2,
            c_exp=8,
        )

    def decode_block(self, block: bytes) -> bytes:
        """
        Decode one 255-byte RS block.

        Returns exactly 230 corrected data bytes.
        """

        block = bytes(block)

        if len(block) != RS_BLOCK_SIZE:
            raise ValueError(
                f"RS block must be {RS_BLOCK_SIZE} bytes; "
                f"got {len(block)}."
            )

        try:
            result = self.codec.decode(block)
        except ReedSolomonError as exc:
            raise ValueError(
                f"Reed-Solomon correction failed: {exc}"
            ) from exc

        # reedsolo versions return either:
        #
        #   decoded_message
        #
        # or:
        #
        #   (decoded_message, corrected_codeword, errata_positions)
        #
        if isinstance(result, tuple):
            message = result[0]
        else:
            message = result

        message = bytes(message)

        if len(message) != RS_DATA_BYTES:
            raise ValueError(
                f"Decoded block should contain "
                f"{RS_DATA_BYTES} bytes; got {len(message)}."
            )

        return message

    def decode_payload(
        self,
        payload: bytes,
    ) -> bytes:
        """
        Decode all complete RS blocks contained in a DATA payload.
        """

        payload = bytes(payload)

        if len(payload) == 0:
            raise ValueError("Empty RS payload.")

        if len(payload) % RS_BLOCK_SIZE != 0:
            raise ValueError(
                "DATA payload length must be a multiple of "
                f"{RS_BLOCK_SIZE}; got {len(payload)}."
            )

        output = bytearray()

        for offset in range(
            0,
            len(payload),
            RS_BLOCK_SIZE,
        ):
            block = payload[
                offset : offset + RS_BLOCK_SIZE
            ]

            output.extend(
                self.decode_block(block)
            )

        return bytes(output)