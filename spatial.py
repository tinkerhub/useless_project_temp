"""Continuous, authoritative movement and the first institutional event loop."""

import copy
import math
import time

from town import TOWN, MAP_VERSION, SPEED, distance, place_at, route, move_point, clear_segment, walkable, destination_anchor

HOUR_SECONDS = 30.0
TALK_RANGE = 90


def initialize_spatial(state):
    for id, place in TOWN["places"].items():
        state["locations"][id] = {**copy.deepcopy(place), **state["locations"].get(id, {})}
    for citizen_id, citizen in state["citizens"].items():
        anchor = TOWN["places"].get(citizen["location_id"], TOWN["places"]["street"])["anchor"]
        citizen.setdefault("position", destination_anchor(citizen_id, citizen["location_id"]) if citizen["location_id"] in TOWN["places"] else dict(anchor))
        citizen.setdefault("facing", "down")
        citizen.setdefault("route", [])
        citizen.setdefault("destination_id", None)
        citizen.setdefault("control", "npc")
    state.setdefault("spatial", {"map_version": MAP_VERSION, "elapsed": 0.0, "hour_elapsed": 0.0,
                                 "incident": None})
    state.setdefault("private_knowledge", {})
    return state


def validate_spatial(state):
    spatial = state.get("spatial", {})
    if spatial.get("map_version") != MAP_VERSION:
        raise ValueError("Unsupported town map version")
    for field in ("elapsed", "hour_elapsed"):
        v = spatial.get(field)
        if type(v) not in (int, float) or not math.isfinite(v) or v < 0:
            raise ValueError("Invalid spatial clock")
    for citizen in state["citizens"].values():
        path = citizen.get("route")
        if not isinstance(path,list) or len(path)>2048:
            raise ValueError("Invalid actor route")
        points = [citizen.get("position")] + path
        for p in points:
            if not isinstance(p, dict) or set(p) != {"x", "y"} or any(type(v) not in (int, float) for v in p.values()) or not walkable(p["x"], p["y"]):
                raise ValueError("Invalid or blocked actor position")
        if citizen.get("control") not in {"npc", "human"}:
            raise ValueError("Invalid actor control")
        if citizen.get("facing") not in {"up","down","left","right"}:
            raise ValueError("Invalid actor facing")
        if any(not clear_segment(a,b) for a,b in zip(points,points[1:])):
            raise ValueError("Saved route crosses an obstacle")
        if citizen.get("destination_id") is not None and citizen["destination_id"] not in state["locations"]:
            raise ValueError("Invalid spatial destination")
    knowledge = state.get("private_knowledge", {})
    if not isinstance(knowledge, dict) or any(k not in state["citizens"] or not isinstance(v, list) for k,v in knowledge.items()):
        raise ValueError("Invalid private observations")
    for observations in knowledge.values():
        for item in observations:
            if (not isinstance(item,dict) or set(item)!={"tick","text","place_id"}
                or type(item["tick"]) is not int or not 0<=item["tick"]<=state["clock"]["tick"]
                or not isinstance(item["text"],str) or not 0<len(item["text"])<=500
                or item["place_id"] not in state["locations"]):
                raise ValueError("Invalid private observation")
    incident = spatial.get("incident")
    if incident is not None:
        if not isinstance(incident, dict) or incident.get("citizen_id") not in state["citizens"] or incident.get("status") not in {"needs_help", "going_to_hospital", "receiving_care", "recovered"}:
            raise ValueError("Invalid incident")
        for field in ("witnesses","reported_by"):
            ids=incident.get(field)
            if not isinstance(ids,list) or any(not isinstance(id,str) or id not in state["citizens"] for id in ids) or len(ids)!=len(set(ids)):
                raise ValueError("Invalid incident participants")
        if not set(incident["reported_by"])<=set(incident["witnesses"]):
            raise ValueError("Report must come from a witness")
        if incident.get("helper_id") is not None and incident["helper_id"] not in state["citizens"]:
            raise ValueError("Invalid incident helper")
        care=incident.get("care_seconds")
        if type(care) not in (int,float) or not math.isfinite(care) or care<0 or type(incident.get("missed_commitment")) is not bool:
            raise ValueError("Invalid incident progress")


class SpatialWorldMixin:
    def _spatial_runtime(self):
        if not hasattr(self, "_inputs"):
            self._inputs = {}
            self._conversations = {}
            self._checkpoint_elapsed = 0.0
            self._revision = 0

    def _publish_candidate(self, candidate, persist=True):
        from world import validate, write_snapshot
        if persist:
            validate(candidate, require_private_events=True)
            write_snapshot(self._path, candidate)
        self._state = candidate
        self._revision = getattr(self, "_revision", 0) + 1

    @staticmethod
    def _event(state, kind, actors, details=None):
        event = {"id": state["events"][-1]["id"]+1, "tick": state["clock"]["tick"],
                 "type": kind, "entity_ids": actors, "details": details or {}}
        state["events"].append(event)
        return event

    def ensure_player(self):
        from world import default_identity
        with self._lock:
            if "player" in self._state["citizens"]:
                return
            candidate = copy.deepcopy(self._state)
            template = copy.deepcopy(candidate["citizens"]["citizen-1"])
            template.update(name="You", control="human", position=dict(TOWN["spawn"]), facing="down",
                            location_id="street", destination_id=None, route=[], activity="resting",
                            identity=default_identity("player"))
            candidate["citizens"]["player"] = template
            self._publish_candidate(candidate)

    def _spatial_action(self, actor_id, action_name, target_id, message, params):
        self._spatial_runtime()
        if message is not None:
            raise ValueError("This action does not accept a message")
        if params is None:
            params = {}
        if not isinstance(params, dict):
            raise ValueError("Action parameters must be a dictionary")
        actor = self._state["citizens"][actor_id]
        if action_name == "steer":
            if actor["control"] != "human" or target_id is not None or set(params) != {"dx", "dy", "sequence"}:
                raise ValueError("Invalid movement input")
            dx, dy, sequence = params["dx"], params["dy"], params["sequence"]
            if any(type(v) not in (int,float) or not math.isfinite(v) or abs(v)>1 for v in (dx,dy)) or type(sequence) is not int or sequence < 0:
                raise ValueError("Invalid movement input")
            old = self._inputs.get(actor_id)
            if old and sequence <= old["sequence"]:
                return {"accepted": False, "sequence": old["sequence"]}
            length = max(1, math.hypot(dx,dy))
            self._inputs[actor_id] = {"dx": dx/length, "dy": dy/length, "sequence": sequence, "until": time.monotonic()+0.45}
            if dx == dy == 0:
                self.save()
            return {"accepted": True, "sequence": sequence}
        if params and action_name != "move":
            raise ValueError("Unsupported action parameter")
        if action_name == "disengage":
            self._conversations.pop(actor_id, None)
            return {"accepted": True}
        if action_name == "engage":
            target = self._state["citizens"].get(target_id)
            if not target or actor_id == target_id or not self._near(actor, target):
                raise ValueError("Walk closer to speak to this citizen")
            self._inputs.pop(actor_id, None)
            self._conversations[actor_id] = {"target": target_id, "until": time.monotonic()+8}
            return {"accepted": True}
        candidate = copy.deepcopy(self._state)
        actor = candidate["citizens"][actor_id]
        if action_name == "move":
            if actor["activity"] in {"needs_help", "receiving_care"}:
                raise ValueError("Citizen needs assistance or care before travelling")
            if params:
                if target_id is not None or set(params) != {"x", "y"} or any(type(v) not in (int,float) or not math.isfinite(v) for v in params.values()):
                    raise ValueError("Invalid coordinate destination")
                endpoint = dict(params)
                target_id = place_at(endpoint)
            else:
                if not isinstance(target_id,str) or target_id not in candidate["locations"] or target_id not in TOWN["places"]:
                    raise ValueError("Unknown destination")
                endpoint = destination_anchor(actor_id,target_id)
            if distance(actor["position"], endpoint) < 2:
                raise ValueError("Citizen is already at destination")
            actor["route"] = route(actor["position"], endpoint)
            actor["destination_id"], actor["activity"] = target_id, "travelling"
            actor["plan_generation"] = actor.get("plan_generation", 0)+1
            event = self._event(candidate, "journey_started", [actor_id], {"destination_id": target_id})
        elif action_name in {"wait", "rest", "eat", "work"}:
            if target_id is not None or params:
                raise ValueError("Activity accepts no target or parameters")
            if action_name == "eat":
                if actor["food"] < 1:
                    raise ValueError("No food available")
                actor["food"] -= 1
                actor["needs"]["hunger"] = max(0, actor["needs"]["hunger"]-20)
            if action_name == "work" and actor["location_id"] != actor["schedule"]["regular_destination_id"]:
                raise ValueError("Not at workplace")
            actor["route"], actor["destination_id"] = [], None
            actor["activity"] = "at_regular_destination" if action_name == "work" else "resting"
            actor["plan_generation"] = actor.get("plan_generation", 0)+1
            event = self._event(candidate, "activity_started", [actor_id], {"activity": action_name})
        elif action_name == "assist":
            incident = candidate["spatial"]["incident"]
            if not incident or incident["citizen_id"] != target_id or incident["status"] != "needs_help":
                raise ValueError("There is no citizen needing help here")
            patient = candidate["citizens"][target_id]
            if actor_id == target_id or not self._near(actor, patient):
                raise ValueError("Walk closer to offer help")
            patient["route"] = route(patient["position"], destination_anchor(target_id,"hospital"))
            patient["destination_id"], patient["activity"] = "hospital", "travelling"
            incident.update(status="going_to_hospital", helper_id=actor_id)
            event = self._event(candidate, "help_offered", [actor_id,target_id])
            self._observe(candidate, actor_id, "You helped Cleo get to Willow Hospital after a fall.", "street")
            helper_name = "The player" if actor["control"] == "human" else actor["name"]
            self._observe(candidate, target_id, f"{helper_name} helped you get to Willow Hospital after your fall.", "street")
            from world import MAX_SOCIAL_VALUE
            social=candidate.setdefault("private_social",{}).setdefault(target_id,{"memories":[],"beliefs":{},"relationships":{}})
            relationship=social["relationships"].setdefault(actor_id,{"trust":0,"friendship":0,"anger":0})
            for field in ("trust","friendship"):
                relationship[field]=min(MAX_SOCIAL_VALUE,relationship[field]+1)
        elif action_name == "report":
            incident = candidate["spatial"]["incident"]
            if target_id != "police" or distance(actor["position"], TOWN["places"]["police"]["anchor"]) > 110:
                raise ValueError("Visit the police station entrance to file a report")
            if not incident or actor_id not in incident["witnesses"] or actor_id in incident["reported_by"]:
                raise ValueError("You have no new witnessed incident to report")
            incident["reported_by"].append(actor_id)
            event = self._event(candidate, "incident_reported", [actor_id], {"location_id": "police"})
            self._observe(candidate, actor_id, "You filed your witnessed account of Cleo’s fall at Town Police. No crime was established.", "police")
        else:
            raise ValueError("Unsupported action")
        self._publish_candidate(candidate)
        if action_name == "move":
            self._inputs.pop(actor_id,None)
        return copy.deepcopy(event)

    @staticmethod
    def _near(actor, target):
        return distance(actor["position"], target["position"]) <= TALK_RANGE and clear_segment(actor["position"], target["position"])

    def _check_talk_range(self, actor_id, target_id):
        actor, target = self._state["citizens"][actor_id], self._state["citizens"][target_id]
        if not self._near(actor, target):
            raise ValueError("Walk closer to speak to this citizen")

    def conversation(self, actor_id, target_id):
        """Explicit projection: messages exchanged by this pair, never private context."""
        with self._lock:
            if actor_id not in self._state["citizens"] or target_id not in self._state["citizens"] or actor_id == target_id:
                raise ValueError("Unknown conversation")
            messages = []
            for owner, sender in ((actor_id,target_id),(target_id,actor_id)):
                social = self._state.get("private_social", {}).get(owner, {})
                for m in social.get("memories", []):
                    if m["actor_id"] == sender:
                        messages.append({"id": m["id"], "tick": m["tick"], "speaker_id": sender, "message": m["message"]})
            return sorted(messages, key=lambda m:m["id"])[-100:]

    def browser_snapshot(self, player_id="player"):
        with self._lock:
            self._spatial_runtime()
            now = time.monotonic()
            held=set()
            for actor,session in self._conversations.items():
                if session["until"]>now:
                    held.update((actor,session["target"]))
            actors = []
            for id,c in self._state["citizens"].items():
                actors.append({"id": id, "name": c["name"], "position": dict(c["position"]),
                               "facing": c["facing"], "activity": c["activity"], "location_id": c["location_id"],
                               "moving": id not in held and ((bool(c["route"]) and (self._state["clock"]["running"] or c["control"]=="human")) or bool(id in self._inputs and self._inputs[id]["until"]>now and (self._inputs[id]["dx"] or self._inputs[id]["dy"])))})
            player = self._state["citizens"].get(player_id)
            incident = self._state["spatial"]["incident"]
            visible_incident = None
            if incident and player and player_id in incident["witnesses"]:
                visible_incident = {key: copy.deepcopy(incident[key]) for key in ("citizen_id","status")}
                visible_incident["reported"] = player_id in incident["reported_by"]
            return {"revision": self._revision, "server_time": now, "clock": dict(self._state["clock"]),
                    "hour_fraction": self._state["spatial"]["hour_elapsed"]/HOUR_SECONDS,
                    "actors": actors, "player_id": player_id,
                    "ack": self._inputs.get(player_id,{}).get("sequence",-1),
                    "incident": visible_incident,
                    "services": copy.deepcopy(self._state.get("institutions", {})),
                    "observations": copy.deepcopy(self._state.get("private_knowledge",{}).get(player_id,[])[-8:]),
                    "ai_available": sorted(self._ai_brains),
                    "llm": getattr(self, "_ai_info", {"connected": bool(self._ai_brains), "model": None, "base_url": None})}

    @staticmethod
    def _observe(state, citizen_id, text, place):
        state.setdefault("private_knowledge",{}).setdefault(citizen_id,[]).append(
            {"tick": state["clock"]["tick"], "text": text, "place_id": place})
        state["private_knowledge"][citizen_id] = state["private_knowledge"][citizen_id][-200:]

    def _incident_step(self, state, dt):
        incident = state["spatial"]["incident"]
        # One finite, persisted event; it is never reseeded on restart.
        cleo = state["citizens"].get("citizen-3")
        if incident is None and cleo and state["spatial"]["elapsed"] >= 18 and cleo["location_id"] == "shop":
            incident = {"citizen_id": "citizen-3", "status": "needs_help", "witnesses": ["citizen-3"],
                        "reported_by": [], "care_seconds": 0.0, "missed_commitment": False}
            state["spatial"]["incident"] = incident
            cleo["route"], cleo["destination_id"], cleo["activity"] = [], None, "needs_help"
            self._event(state, "citizen_fell", ["citizen-3"])
            self._observe(state, "citizen-3", "You fell outside Corner Grocer and need help reaching the hospital.", "shop")
        if not incident:
            return
        patient = state["citizens"][incident["citizen_id"]]
        if incident["status"] == "needs_help":
            for id,c in state["citizens"].items():
                if id not in incident["witnesses"] and distance(c["position"],patient["position"]) < 220 and clear_segment(c["position"],patient["position"]):
                    incident["witnesses"].append(id)
                    self._observe(state,id,"You saw Cleo outside Corner Grocer needing help after a fall.","shop")
        if incident["status"] == "going_to_hospital" and not patient["route"] and patient["location_id"] == "hospital":
            if state.get("population_version") and not state.get("institutions", {}).get("hospital", {}).get("available"):
                return
            incident["status"], patient["activity"] = "receiving_care", "receiving_care"
            self._observe(state,incident["citizen_id"],"You arrived at Willow Hospital for care.","hospital")
            self._event(state,"care_started",[incident["citizen_id"]])
        if incident["status"] == "receiving_care":
            if state.get("population_version") and not state.get("institutions", {}).get("hospital", {}).get("available"):
                return
            incident["care_seconds"] += dt
            if incident["care_seconds"] >= 8:
                incident["status"], patient["activity"] = "recovered", "resting"
                self._observe(state,incident["citizen_id"],"You received care at Willow Hospital and can walk normally again.","hospital")
                self._event(state,"care_completed",[incident["citizen_id"]])
        if incident["status"] in {"going_to_hospital","receiving_care"} and not incident["missed_commitment"] and patient["schedule"]["leave_home_hour"] <= state["clock"]["tick"] % 24 < patient["schedule"]["return_home_hour"]:
            incident["missed_commitment"] = True
            self._observe(state,incident["citizen_id"],"Your fall interrupted your planned morning at Corner Grocer.","shop")
            self._event(state,"routine_interrupted",[incident["citizen_id"]])

    def step(self, dt, *, clock_speed=1.0):
        """A bounded physical step; game hours and browser frames are independent."""
        if type(dt) not in (int,float) or not math.isfinite(dt) or not 0 < dt <= 0.1:
            raise ValueError("Physical step must be between 0 and 0.1 seconds")
        if type(clock_speed) not in (int,float) or not math.isfinite(clock_speed) or clock_speed <= 0:
            raise ValueError("Clock speed must be finite and positive")
        if getattr(self, "_scheduler", None):
            self._scheduler.drain()
        with self._lock:
            self._spatial_runtime()
            candidate = copy.deepcopy(self._state)
            candidate["spatial"]["elapsed"] += dt
            now = time.monotonic()
            self._conversations = {a:s for a,s in self._conversations.items() if s["until"]>now}
            held = set(self._conversations) | {s["target"] for s in self._conversations.values()}
            for id,c in candidate["citizens"].items():
                if id in held:
                    continue
                before = dict(c["position"])
                command = self._inputs.get(id) if c["control"] == "human" else None
                if command and command["until"] > now:
                    c["route"],c["destination_id"]=[],None
                    c["position"] = move_point(c["position"],command["dx"]*SPEED*dt,command["dy"]*SPEED*dt)
                elif (candidate["clock"]["running"] or c["control"]=="human") and c["route"]:
                    remaining = c.get("walking_speed", SPEED*0.82)*dt
                    while c["route"] and remaining > 0:
                        target = c["route"][0]
                        gap = distance(c["position"],target)
                        if gap < 0.01:
                            c["route"].pop(0)
                            continue
                        length = min(remaining,gap)
                        c["position"] = move_point(c["position"],(target["x"]-c["position"]["x"])*length/gap,(target["y"]-c["position"]["y"])*length/gap)
                        remaining -= length
                        if distance(c["position"], target) < 0.1:
                            c["route"].pop(0)
                        else:
                            break
                    if not c["route"]:
                        c["activity"] = "resting" if c["destination_id"]==c["home_id"] else "at_regular_destination"
                        self._event(candidate,"journey_arrived",[id],{"location_id":c["destination_id"]})
                        c["destination_id"] = None
                delta_x, delta_y = c["position"]["x"]-before["x"], c["position"]["y"]-before["y"]
                if abs(delta_x)+abs(delta_y) > 0.001:
                    c["facing"] = ("right" if delta_x>0 else "left") if abs(delta_x)>abs(delta_y) else ("down" if delta_y>0 else "up")
                    c["location_id"] = place_at(c["position"])
            if candidate["clock"]["running"]:
                self._incident_step(candidate,dt)
                candidate["spatial"]["hour_elapsed"] += dt*clock_speed
            self._checkpoint_elapsed += dt
            persist = self._checkpoint_elapsed >= 1 or len(candidate["events"]) != len(self._state["events"])
            self._publish_candidate(candidate,persist=persist)
            if persist:
                self._checkpoint_elapsed = 0
            while self._state["clock"]["running"] and self._state["spatial"]["hour_elapsed"] >= HOUR_SECONDS:
                self._advance_one_tick(only_if_running=True, spatial_hour=True)
