"""Presence-based services and observable commitment consequences."""
from town import TOWN, distance

SERVICES = {
    "hospital": (7, 22), "police": (7, 22), "school": (8, 17),
    "college": (8, 19), "college-hall": (8, 19), "library": (8, 21),
    "shop": (7, 20), "market": (7, 20), "cafe": (7, 21),
    "bakery": (7, 19), "restaurant": (9, 22), "pharmacy": (8, 19),
}


def update_institutions(world, state):
    if not state.get("population_version"):
        return
    tick = state["clock"]["tick"]
    hour, day = tick%24, tick//24
    registry = state.setdefault("institutions", {})
    for place, (opens, closes) in SERVICES.items():
        staff = [cid for cid,c in state["citizens"].items()
                 if c.get("control") != "human" and c["schedule"]["regular_destination_id"]==place
                 and c.get("occupation") != "adult student" and not c.get("route")
                 and distance(c["position"], TOWN["places"][place]["anchor"])<220]
        old = registry.get(place)
        available = opens <= hour < closes and bool(staff)
        registry[place] = {"available": available, "staff_count": len(staff), "opens": opens, "closes": closes}
        if old and old["available"] != available:
            world._event(state, "service_availability_changed", [], {"place_id": place, "available": available})
    incident = state["spatial"].get("incident")
    if incident and incident.get("reported_by") and not incident.get("reviewed") and registry["police"]["available"]:
        incident["reviewed"] = True
        world._event(state, "report_reviewed", incident["reported_by"], {"place_id": "police", "crime_established": False})
        for cid in incident["reported_by"]:
            world._observe(state, cid, "Police staff reviewed your witnessed account. No crime was established.", "police")
    for cid,c in state["citizens"].items():
        if c.get("control") == "human":
            continue
        attendance = c.setdefault("attendance", {})
        # Keep only today's bounded commitment ledger.
        if attendance.get("day") != day:
            attendance.clear()
            attendance.update(day=day, arrived=[], missed=[])
        for index, entry in enumerate(c.get("commitments", [])):
            if entry["start"] <= hour < entry["end"] and not c.get("route") and distance(c["position"],TOWN["places"][entry["place_id"]]["anchor"])<220:
                if index not in attendance["arrived"]:
                    attendance["arrived"].append(index)
                    world._event(state, "commitment_attended", [cid], {"place_id": entry["place_id"], "activity": entry["activity"]})
                    world._observe(state, cid, f"You attended your {entry['activity']} commitment at {TOWN['places'][entry['place_id']]['name']}.", entry["place_id"])
            if hour >= entry["end"] and index not in attendance["arrived"] and index not in attendance["missed"]:
                attendance["missed"].append(index)
                world._event(state, "commitment_missed", [cid], {"place_id": entry["place_id"]})
                world._observe(state, cid, f"You missed your {entry['activity']} commitment at {TOWN['places'][entry['place_id']]['name']}.", entry["place_id"])


def validate_institutions(state):
    registry = state.get("institutions", {})
    if not isinstance(registry, dict):
        raise ValueError("Invalid institutions")
    for place, service in registry.items():
        if place not in SERVICES or type(service.get("available")) is not bool or type(service.get("staff_count")) is not int or not 0 <= service["staff_count"]<=50:
            raise ValueError("Invalid service state")
