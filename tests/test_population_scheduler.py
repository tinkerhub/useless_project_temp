import copy
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import patch

from world import World
from population import expand_population
from citizen_scheduler import CitizenScheduler
from town import clear_segment, destination_anchor, walkable


class PopulationSchedulerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name)/"world.json"
        self.world = World(self.path)

    def test_population_upgrade_is_idempotent_and_preserves_history(self):
        before = copy.deepcopy(self.world._state["citizens"]["citizen-1"])
        expand_population(self.world)
        self.world.ensure_player()
        state = self.world.snapshot()
        self.assertEqual(len(state["citizens"]), 51)
        self.assertEqual(state["schema_version"], 6)
        for field in ("identity", "position", "home_id", "needs", "schedule"):
            self.assertEqual(state["citizens"]["citizen-1"][field], before[field])
        loaded = World(self.path)
        expand_population(loaded)
        self.assertEqual(loaded.snapshot(), state)
        self.assertEqual(len({c["name"] for c in state["citizens"].values()}), 51)
        for cid,c in state["citizens"].items():
            if cid == "player":continue
            for entry in c["commitments"]:
                p=destination_anchor(cid,entry["place_id"])
                self.assertTrue(walkable(p["x"],p["y"]))

    def test_failed_ai_action_and_failed_save_have_no_private_effects(self):
        before = copy.deepcopy(self.world._state)
        with self.assertRaises(ValueError):
            self.world._ai_gateway.execute_decision(self.world,"citizen-1",{
                "decision":"eat", "plan_summary":"Eat", "emotional_state":"happy"})
        self.assertEqual(before,self.world._state)
        with patch("world.write_snapshot",side_effect=OSError("disk full")):
            with self.assertRaises(OSError):
                self.world._ai_gateway.execute_decision(self.world,"citizen-1",{
                    "decision":"wait", "plan_summary":"Wait", "memory_candidate":"A reflection"})
        self.assertEqual(before,self.world._state)

    def test_slow_inference_never_holds_world_lock_or_adds_workers(self):
        entered,release = threading.Event(),threading.Event()
        class Slow:
            def decide(self,request):
                entered.set();release.wait(3)
                return {"decision":"wait"}
        self.world._ai_brains={"citizen-1":Slow()}
        scheduler=CitizenScheduler(self.world,capacity=2)
        self.addCleanup(release.set);self.addCleanup(scheduler.close)
        scheduler.submit("citizen-1")
        self.assertTrue(entered.wait(1))
        started=time.monotonic()
        for _ in range(20):self.world.step(.05)
        self.assertLess(time.monotonic()-started,1)
        for _ in range(100):scheduler.submit("citizen-1")
        self.assertEqual(len(scheduler.pending),0)
        self.assertTrue(scheduler.thread.is_alive())
        release.set();scheduler.thread.join(.05)

    def test_stale_result_cannot_cancel_new_journey(self):
        scheduler=CitizenScheduler(self.world)
        self.addCleanup(scheduler.close)
        self.world.act("citizen-1","move","shop")
        scheduler.results.append(({"citizen":"citizen-1","incoming":None},0,{"decision":"wait"}))
        scheduler.drain()
        self.assertEqual(self.world.snapshot()["citizens"]["citizen-1"]["destination_id"],"shop")
        self.assertEqual(scheduler.counts["stale"],1)

    def test_route_remains_clear_after_fractional_progress(self):
        a={"x":8604.,"y":4460.};b={"x":7344.,"y":4208.}
        self.assertTrue(clear_segment(a,b))
        self.assertTrue(clear_segment({"x":8596.351470729613,"y":4458.470294145922},b))

    def test_50_citizen_simulation_performance(self):
        expand_population(self.world)
        self.world.ensure_player()
        self.world.start()
        # Measure 50 steps
        durations = []
        for _ in range(50):
            t0 = time.perf_counter()
            self.world.step(0.05)
            durations.append((time.perf_counter() - t0) * 1000)
        durations.sort()
        p95 = durations[int(len(durations) * 0.95)]
        self.assertLess(p95, 50.0, f"p95 step duration {p95:.2f} ms exceeded 50 ms budget")

    def test_institution_services_depend_on_staff_presence_and_track_attendance(self):
        expand_population(self.world)
        self.world.ensure_player()
        self.world.start()
        state = self.world._state
        state["clock"]["tick"] = 10 # 10:00 AM (during opening hours)
        # Place police officer at police station anchor
        from town import TOWN
        police_anchor = TOWN["places"]["police"]["anchor"]
        state["citizens"]["citizen-10"]["position"] = dict(police_anchor)
        state["citizens"]["citizen-10"]["route"] = []
        # Update institutions
        from institutions import update_institutions
        update_institutions(self.world, state)
        self.assertTrue(state["institutions"]["police"]["available"])
        self.assertGreaterEqual(state["institutions"]["police"]["staff_count"], 1)

        # File a report and verify police staff reviews it
        state["spatial"]["incident"] = {
            "citizen_id": "citizen-3", "status": "recovered",
            "witnesses": ["citizen-10", "player"], "reported_by": ["player"],
            "reviewed": False, "care_seconds": 10, "missed_commitment": True
        }
        update_institutions(self.world, state)
        self.assertTrue(state["spatial"]["incident"]["reviewed"])
        self.assertTrue(any(e["type"] == "report_reviewed" for e in state["events"]))
        self.assertIn("No crime was established", state["private_knowledge"]["player"][-1]["text"])


if __name__ == "__main__": unittest.main()
