"""Bounded asynchronous inference; workers never mutate the world."""
import collections
import threading
import time


class CitizenScheduler:
    def __init__(self, world, capacity=50, deadline=90):
        self.world = world
        self.capacity = capacity
        self.deadline = deadline
        self.pending = {}
        self.results = collections.deque(maxlen=capacity)
        self.active = None
        self.closed = False
        self.condition = threading.Condition()
        self.counts = collections.Counter()
        self.last_requested = {}
        self.thread = threading.Thread(target=self._run, daemon=True, name="willow-inference")
        self.thread.start()

    def submit(self, citizen, incoming=None):
        now = time.monotonic()
        with self.condition:
            cadence = 45 + sum(map(ord, citizen)) % 46
            if self.closed or (not incoming and now-self.last_requested.get(citizen, -1e9)<cadence):
                return False
            if self.active and self.active["citizen"] == citizen:
                # A new conversational turn can supersede the in-flight result.
                if not incoming:
                    return False
            old = self.pending.get(citizen)
            if old and old["incoming"] and not incoming:
                return False
            if not old and len(self.pending)>=self.capacity:
                self.counts["overflow"] += 1
                return False
            self.pending[citizen] = {"citizen": citizen, "incoming": incoming,
                                     "queued": old["queued"] if old else now}
            self.last_requested[citizen] = now
            self.condition.notify()
            return True

    def _run(self):
        from ai_reasoning import build_reasoning_request, validate_reasoning_response
        while True:
            with self.condition:
                self.condition.wait_for(lambda: self.closed or self.pending)
                if self.closed:
                    return
                now = time.monotonic()
                # Age eventually outranks new dialogue; no fixed-ID starvation.
                job = min(self.pending.values(), key=lambda j: j["queued"]-(45 if j["incoming"] else 0))
                del self.pending[job["citizen"]]
                self.active = job
            try:
                with self.world._lock:
                    import copy
                    state = copy.deepcopy(self.world._state)
                    cid = job["citizen"]
                    brain = self.world._ai_brains.get(cid)
                    generation = state["citizens"][cid].get("plan_generation", 0)
                if (job["incoming"] and now-job["queued"] > self.deadline) or brain is None:
                    self.counts["expired"] += 1
                    continue
                req = build_reasoning_request(state, cid,
                    "respond_to_conversation" if job["incoming"] else "perceive_and_decide",
                    "conversation" if job["incoming"] else "Review your current commitment", job["incoming"])
                started = time.monotonic()
                try:
                    raw = brain.decide(req)  # Exactly one real call; transport owns its timeout.
                except Exception:
                    if hasattr(brain, "fallback_brain"):
                        raw = brain.fallback_brain.decide(req)
                    else:
                        raise
                decision = validate_reasoning_response(raw, req)
                with self.condition:
                    if time.monotonic()-started <= self.deadline:
                        self.results.append((job, generation, decision))
                    self.counts["completed"] += 1
            except Exception:
                self.counts["failed"] += 1
            finally:
                with self.condition:
                    self.active = None

    def drain(self):
        with self.condition:
            ready = list(self.results)
            self.results.clear()
        for job, generation, decision in ready:
            with self.world._lock:
                c = self.world._state["citizens"].get(job["citizen"])
                if not c or c.get("plan_generation", 0) != generation:
                    self.counts["stale"] += 1
                    continue
                incoming = job["incoming"]
                if incoming:
                    speaker = incoming["speaker"]["id"]
                    memories = self.world._state.get("private_social", {}).get(job["citizen"], {}).get("memories", [])
                    latest = next((m for m in reversed(memories) if m.get("actor_id") == speaker), None)
                    # Pair proximity and the original event must still be valid.
                    if latest and latest["id"] != incoming.get("event_id"):
                        continue
                    self.world._spatial_runtime()
                    if speaker == "player" and self.world._conversations.get(speaker, {}).get("target") != job["citizen"]:
                        continue
                    if decision.get("decision") != "talk":
                        continue
                    decision["target_id"] = speaker
                try:
                    self.world._ai_gateway.execute_decision(self.world, job["citizen"], decision, reply_to=incoming["speaker"]["id"] if incoming else None)
                except (ValueError, OSError):
                    self.counts["rejected"] += 1

    def close(self):
        with self.condition:
            self.closed = True
            self.pending.clear()
            self.condition.notify()

    def conversation_pending(self, citizen, speaker="player"):
        with self.condition:
            jobs = [self.pending.get(citizen), self.active]
            jobs.extend(result[0] for result in self.results)
            return any(j and j["citizen"] == citizen and j["incoming"] and
                       j["incoming"]["speaker"]["id"] == speaker for j in jobs)
