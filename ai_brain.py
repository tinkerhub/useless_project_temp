"""Provider-independent boundary for optional citizen conversation brains."""

from typing import Any, Mapping, Protocol


class CitizenBrain(Protocol):
    """Runtime-only AI provider interface.

    Implementations receive a detached, citizen-scoped request and return
    untrusted data. They never receive a World instance.
    """

    def decide(self, request: Mapping[str, Any]) -> object:
        """Return ``{"action": "none"}`` or a structured ``talk`` decision."""
