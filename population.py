"""Versioned authored residents and commitments for the inhabited district."""
import copy
from town import TOWN, destination_anchor

# Original residents retain their names, identities, homes and histories.
ROSTER = [
    ("Ada", "resident", "library", "Collect the neighborhood's oral history"),
    ("Ben", "maintenance coordinator", "workshop", "Repair the community's neglected equipment"),
    ("Cleo", "community volunteer", "community", "Build a reliable neighborhood support group"),
    ("Mira Shah", "nurse", "hospital", "Protect time for patients and her family"),
    ("Jonah Reed", "doctor", "hospital", "Improve continuity of patient care"),
    ("Leila Noor", "paramedic", "hospital", "Make emergency help easier to access"),
    ("Oscar Chen", "care coordinator", "hospital", "Reduce missed care appointments"),
    ("Ruth Bell", "nurse", "hospital", "Mentor a new colleague without burning out"),
    ("Samir Patel", "pharmacist", "pharmacy", "Help residents understand their care plans"),
    ("Nadia Brooks", "police officer", "police", "Earn trust by listening before judging"),
    ("Evan Cole", "police officer", "police", "Resolve recurring neighborhood disputes"),
    ("Iris Park", "report clerk", "police", "Keep reports accurate and fairly attributed"),
    ("Theo Moss", "civic coordinator", "town-hall", "Organize a town meeting people attend"),
    ("Anika Rao", "teacher", "school", "Prepare a collaborative arts lesson"),
    ("Daniel Finch", "teacher", "school", "Rebuild enthusiasm for science"),
    ("Grace Liu", "school librarian", "school", "Open a welcoming reading club"),
    ("Hugo Ellis", "school caretaker", "school", "Keep the grounds ready for community use"),
    ("Sofia Vega", "lecturer", "college", "Support students who are falling behind"),
    ("Arun Das", "lecturer", "college-hall", "Bring local history into his teaching"),
    ("Florence Webb", "college advisor", "college", "Help students balance study and work"),
    ("Miles Grant", "lab technician", "college-hall", "Finish a practical workshop"),
    ("Yuna Kim", "college librarian", "library", "Connect students with local residents"),
    ("Zara Ali", "adult student", "college", "Finish a community design project"),
    ("Leo Martin", "adult student", "college-hall", "Find confidence presenting his research"),
    ("Priya Sen", "adult student", "college", "Balance coursework and a busy household"),
    ("Felix Wood", "adult student", "college-hall", "Repair a strained friendship"),
    ("Amara Okafor", "adult student", "college", "Start a small study group"),
    ("Noah Diaz", "adult student", "college-hall", "Find a meaningful volunteer placement"),
    ("Esme Hart", "adult student", "college", "Complete a portrait of the neighborhood"),
    ("Kai Tan", "adult student", "college-hall", "Learn to ask classmates for help"),
    ("Elena Cruz", "grocer", "shop", "Keep food available through busy periods"),
    ("Owen Price", "grocer", "market", "Know his regular customers better"),
    ("Aisha Khan", "baker", "bakery", "Share a family recipe with the town"),
    ("Luca Rossi", "baker", "bakery", "Improve the early shift's teamwork"),
    ("Mae Johnson", "barista", "cafe", "Make the cafe a welcoming meeting place"),
    ("Victor Lin", "barista", "grove-cafe", "Build a dependable circle of friends"),
    ("Nora James", "cook", "restaurant", "Make enough time for a college course"),
    ("Idris Ahmed", "server", "restaurant", "Save time for evening community events"),
    ("Poppy Green", "market assistant", "market", "Develop confidence with customers"),
    ("Tomas Silva", "cafe manager", "cafe", "Resolve tension about staff schedules"),
    ("June Walker", "station attendant", "station", "Help new arrivals feel at home"),
    ("Malik Brown", "mechanic", "workshop", "Train a careful apprentice"),
    ("Clara Stone", "gardener", "park", "Create a shared garden gathering"),
    ("Finn Murphy", "postal worker", "post-office", "Reconnect with an old neighbor"),
    ("Beatrice Hall", "retired teacher", "library", "Record memories of the town's school"),
    ("Ravi Mehta", "carer", "community", "Build a dependable support network"),
    ("Sienna Fox", "artist", "square", "Finish a public sketch series"),
    ("Gabriel King", "writer", "park", "Listen to people outside his usual circle"),
    ("Ines Costa", "community organizer", "community", "Bring disconnected households together"),
    ("Arthur Lane", "retired gardener", "park", "Pass on his gardening knowledge"),
]


def expand_population(world):
    from world import default_profile, validate
    with world._lock:
        needs_upgrade = (
            world._state.get("population_version") != 1
            or any(len(c.get("commitments", [])) <= 2 for cid, c in world._state.get("citizens", {}).items() if cid != "player")
        )
        if not needs_upgrade:
            return
        state = copy.deepcopy(world._state)
        original = copy.deepcopy(state["citizens"]["citizen-1"])
        traits = [("patient", "observant"), ("direct", "loyal"), ("curious", "reserved"),
                  ("sociable", "determined"), ("practical", "sensitive")]
        styles = ["Warm and specific", "Brief and candid", "Reflective and careful", "Lively and inquisitive", "Calm and practical"]
        lunch_places = ["cafe", "grove-cafe", "bakery", "shop", "market", "restaurant", "square", "park"]
        evening_places = ["park", "square", "library", "cafe", "community", "sports"]
        for i, (name, occupation, workplace, goal) in enumerate(ROSTER, 1):
            cid = f"citizen-{i}"
            home = f"house-{1+(i-4)%18}"
            if cid not in state["citizens"]:
                c = copy.deepcopy(original)
                c.update(name=name, home_id=home, location_id=home, position=destination_anchor(cid, home),
                         route=[], destination_id=None, current_plan=None, control="npc", activity="resting",
                         food=3, money=100, needs={"hunger": 0, "energy": 100},
                         identity={"personality_traits": list(traits[i%5]), "personal_goal": goal+".",
                                   "speaking_style": styles[i%5]+"."},
                         **default_profile(cid, goal))
                c["values"] = ["community" if i%2 else "independence", "reliability"]
                c["habits"] = [f"Visits {TOWN['places'][workplace]['name']}", "Takes an evening walk"]
                state["citizens"][cid] = c
            c = state["citizens"][cid]
            c.setdefault("occupation", occupation)
            c.setdefault("walking_speed", 120.0+(i*17)%56)
            c.setdefault("plan_generation", 0)
            start = 7+(i%3)
            if i > 3:
                c["schedule"] = dict(regular_destination_id=workplace, leave_home_hour=start,
                                     return_home_hour=17+i%3, sleep_hour=22, wake_hour=6)
            start_hour = c["schedule"]["leave_home_hour"]
            lunch_hour = 11 + (i % 3)
            lunch_place = lunch_places[i % len(lunch_places)]
            afternoon_end = 17 + (i % 2)
            evening_place = evening_places[i % len(evening_places)]
            work_place = c["schedule"]["regular_destination_id"]
            c["commitments"] = [
                {"start": start_hour, "end": lunch_hour, "place_id": work_place,
                 "activity": "study" if occupation == "adult student" else "work"},
                {"start": lunch_hour, "end": lunch_hour + 1, "place_id": lunch_place,
                 "activity": "leisure"},
                {"start": lunch_hour + 1, "end": afternoon_end, "place_id": work_place,
                 "activity": "study" if occupation == "adult student" else "work"},
                {"start": 19, "end": 21 + (i % 2), "place_id": evening_place,
                 "activity": "leisure"},
            ]
        for i in range(1, 51):
            cid, other = f"citizen-{i}", f"citizen-{i%50+1}"
            social = state.setdefault("private_social", {}).setdefault(cid, {"memories": [], "relationships": {}, "beliefs": {}})
            social["relationships"].setdefault(other, {"trust": 1, "friendship": 1 if i%3 else 0, "anger": 0})
            world._observe(state, cid, f"Background: you are acquainted with {state["citizens"][other]["name"]}.", state["citizens"][cid]["home_id"])
        state["population_version"] = 1
        state["schema_version"] = 6
        validate(state, require_private_events=True)
        world._publish_candidate(state)


def validate_population(state):
    if state.get("population_version") != 1:
        raise ValueError("Unsupported population version")
    npcs = [c for c in state["citizens"].values() if c.get("control") != "human"]
    if len(npcs) != 50:
        raise ValueError("Population must contain 50 NPCs")
    for c in npcs:
        if type(c.get("plan_generation")) is not int or c["plan_generation"] < 0:
            raise ValueError("Invalid plan generation")
        if "plan_until_tick" in c and (type(c["plan_until_tick"]) is not int or c["plan_until_tick"]<0):
            raise ValueError("Invalid plan expiry")
        if type(c.get("walking_speed")) not in (int, float) or not 100 <= c["walking_speed"] <= 190:
            raise ValueError("Invalid walking speed")
        if not isinstance(c.get("occupation"), str) or not c["occupation"]:
            raise ValueError("Missing occupation")
        for entry in c.get("commitments", []):
            if (entry.get("place_id") not in state["locations"] or
                type(entry.get("start")) is not int or type(entry.get("end")) is not int or
                not 0 <= entry["start"] < entry["end"] <= 24 or entry.get("activity") not in {"work", "study", "leisure"}):
                raise ValueError("Invalid commitment")
