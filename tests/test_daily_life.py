import json
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

from world import MAX_SOCIAL_VALUE, World, starter_world
from town import destination_anchor, distance


class DailyLifeTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "world.json"
        self.world = World(self.path)

    def elapse(self, world, seconds):
        for _ in range(round(seconds*10)):
            world.step(0.1)

    def test_one_day_has_predictable_schedule_and_bounded_needs(self):
        self.world.start()
        # Isolate the ordinary schedule from the separately tested incident loop.
        with patch.object(self.world, "_incident_step"):
            self.elapse(self.world, 240)
            at_departure = self.world.snapshot()
            self.assertEqual(at_departure["clock"]["tick"], 8)
            self.assertTrue(all(c["destination_id"] == "shop" and c["activity"] == "travelling"
                                for c in at_departure["citizens"].values()))
            self.elapse(self.world, 15)
            self.assertTrue(all(c["location_id"] == "shop" and not c["route"]
                                for c in self.world.snapshot()["citizens"].values()))
            self.elapse(self.world, 465)
        after_day = self.world.snapshot()
        self.assertEqual(after_day["clock"]["tick"], 24)
        for citizen in after_day["citizens"].values():
            self.assertEqual(citizen["location_id"], citizen["home_id"])
            self.assertEqual(citizen["activity"], "sleeping")
            self.assertEqual(citizen["needs"]["hunger"], 24)
            self.assertTrue(0 <= citizen["needs"]["energy"] <= 100)

    def test_move_starts_a_physical_journey_to_any_reachable_place(self):
        before = self.world.snapshot()["citizens"]["citizen-1"]["position"]
        event = self.world.act("citizen-1", "move", "hospital")
        self.assertEqual(event["type"], "journey_started")
        self.assertEqual(event["details"], {"destination_id": "hospital"})
        citizen = self.world.snapshot()["citizens"]["citizen-1"]
        self.assertEqual(citizen["position"], before)
        self.assertEqual(citizen["location_id"], "home-1")
        self.assertTrue(citizen["route"])
        self.world.start()
        self.elapse(self.world, 15)
        arrived = self.world.snapshot()["citizens"]["citizen-1"]
        self.assertEqual(arrived["location_id"], "hospital")
        self.assertLess(distance(arrived["position"], destination_anchor("citizen-1", "hospital")), 1)
        before_file = self.path.read_bytes()
        with self.assertRaisesRegex(ValueError, "Unknown destination"):
            self.world.act("citizen-1", "move", "missing")
        self.assertEqual(self.path.read_bytes(), before_file)

    def test_failed_move_write_does_not_commit(self):
        before = self.world.snapshot()
        before_file = self.path.read_bytes()
        with patch("world.os.replace", side_effect=OSError("disk failure")):
            with self.assertRaises(OSError):
                self.world.act("citizen-1", "move", "street")
        self.assertEqual(self.world.snapshot(), before)
        self.assertEqual(self.path.read_bytes(), before_file)

    def test_legacy_paths_do_not_restrict_free_ground_movement(self):
        state = starter_world()
        state["paths"]["path-home-1"]["bidirectional"] = False
        self.path.write_text(json.dumps(state), encoding="utf-8")
        world = World(self.path)
        world.act("citizen-1", "move", "street")
        self.assertEqual(world.snapshot()["citizens"]["citizen-1"]["destination_id"], "street")

    def test_low_energy_citizen_returns_home_and_recovers(self):
        state = starter_world()
        citizen = state["citizens"]["citizen-1"]
        citizen["location_id"] = "shop"
        citizen["position"] = destination_anchor("citizen-1", "shop")
        citizen["activity"] = "at_regular_destination"
        citizen["needs"]["energy"] = 20
        self.path.write_text(json.dumps(state), encoding="utf-8")
        world = World(self.path)
        world.start()
        world.advance(1)
        self.assertEqual(world.snapshot()["citizens"]["citizen-1"]["destination_id"], "home-1")
        self.elapse(world, 15)
        home = world.snapshot()["citizens"]["citizen-1"]
        self.assertEqual(home["location_id"], home["home_id"])
        energy_at_home = home["needs"]["energy"]
        world.advance(1)
        resting = world.snapshot()["citizens"]["citizen-1"]
        self.assertGreater(resting["needs"]["energy"], energy_at_home)

    def test_unattended_day_runs_behavior_without_tick_events(self):
        self.world.start()
        self.elapse(self.world, 720)
        state = self.world.snapshot()
        self.assertEqual(state["clock"]["tick"], 24)
        self.assertTrue(any(event["type"] == "journey_arrived" for event in state["events"]))
        self.assertFalse(any(event["type"] == "time_advanced" for event in state["events"]))

    def test_rule_based_movement_calls_world_act(self):
        with patch.object(self.world, "act", wraps=self.world.act) as act:
            self.world.advance(8)
        self.assertEqual(act.call_count, 3)
        self.assertTrue(all(call.kwargs["action_name"] == "move" for call in act.call_args_list))

    def test_headless_server_runs_a_simulated_day(self):
        server_path = Path(self.directory.name) / "headless-day.json"
        root = Path(__file__).resolve().parents[1]
        process = subprocess.Popen(
            [
                sys.executable, str(root / "server.py"), "--headless", "--save", str(server_path),
                "--tick-seconds", "0.005",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
        try:
            deadline = time.monotonic() + 20  # 50 citizens now plan routes during this server test.
            while time.monotonic() < deadline:
                if process.poll() is not None:
                    self.fail(process.stderr.read().decode())
                try:
                    if json.loads(server_path.read_text())["clock"]["tick"] >= 24:
                        break
                except (FileNotFoundError, json.JSONDecodeError):
                    pass
                time.sleep(0.01)
            else:
                self.fail("Headless server did not complete a simulated day")
        finally:
            process.terminate()
            _, error = process.communicate(timeout=5)
        self.assertEqual(process.returncode, 0, error.decode())
        state = World(server_path).snapshot()
        self.assertGreaterEqual(state["clock"]["tick"], 24)
        self.assertTrue(all(
            0 <= need <= 100
            for citizen in state["citizens"].values()
            for need in citizen["needs"].values()
        ))

    def test_daily_state_and_private_social_state_survive_restart(self):
        for _ in range(MAX_SOCIAL_VALUE):
            self.world.act(
                "citizen-2", "talk", "citizen-1", "Stay away.", {"intent": "insult"}
            )
        self.world.advance(9)
        expected_public = self.world.snapshot()
        expected_private = self.world.citizen_context("citizen-1")

        restored = World(self.path)
        self.assertEqual(restored.snapshot(), expected_public)
        self.assertEqual(restored.citizen_context("citizen-1"), expected_private)
        self.assertNotIn("private_social", restored.snapshot())

    def test_schema_two_migration_preserves_private_social_state(self):
        self.world.act(
            "citizen-1", "talk", "citizen-2", "I trust you.", {"intent": "confide"}
        )
        old = json.loads(self.path.read_text())
        old["schema_version"] = 2
        for citizen in old["citizens"].values():
            citizen.pop("needs")
            citizen.pop("schedule")
            citizen.pop("activity")
        self.path.write_text(json.dumps(old), encoding="utf-8")

        migrated = World(self.path)
        self.assertEqual(migrated.snapshot()["schema_version"], 5)
        self.assertEqual(
            migrated.citizen_context("citizen-2")["relationships"]["citizen-1"]["trust"],
            1,
        )

    def test_strong_distrust_rule_is_explicit_and_private(self):
        state = self.world.snapshot()
        state["clock"]["tick"] = 9
        state["citizens"]["citizen-2"]["location_id"] = "shop"
        relationship = {
            "relationships": {
                "citizen-2": {"trust": 0, "friendship": 0, "anger": MAX_SOCIAL_VALUE}
            }
        }
        decision = World.choose_action(state, "citizen-1", relationship)
        self.assertIsNone(decision)
        self.assertNotIn("relationships", state["citizens"]["citizen-1"])

    def test_continuous_daily_life_commitments_and_lunch_breaks(self):
        from population import expand_population
        expand_population(self.world)
        state = self.world._state
        # Check that midday (hour 11, 12, 13) has staggered commitments (e.g. lunch/breaks)
        for hour in (8, 12, 19):
            destinations = set()
            for cid, c in state["citizens"].items():
                if cid == "player":
                    continue
                comm = next((entry for entry in c.get("commitments", []) if entry["start"] <= hour < entry["end"]), None)
                if comm:
                    destinations.add(comm["place_id"])
            self.assertGreater(len(destinations), 3, f"Hour {hour} should have varied destinations across town")

    def test_fast_citizen_brain_instant_dialogue_reply(self):
        from fast_brain import FastCitizenBrain
        from population import expand_population
        expand_population(self.world)
        self.world.ensure_player()
        brains = {cid: FastCitizenBrain(cid) for cid in self.world._state["citizens"] if cid != "player"}
        self.world._ai_brains = brains
        self.world._ai_gateway.brains = dict(brains)

        # Place player next to citizen-1
        ada_pos = self.world._state["citizens"]["citizen-1"]["position"]
        self.world._state["citizens"]["player"]["position"] = {"x": ada_pos["x"] + 10, "y": ada_pos["y"]}

        # Test first message
        self.world.act("player", "talk", "citizen-1", "Hello Ada!")
        conv = self.world.conversation("player", "citizen-1")
        self.assertEqual(len(conv), 2)
        self.assertEqual(conv[0]["speaker_id"], "player")
        self.assertEqual(conv[1]["speaker_id"], "citizen-1")
        self.assertTrue(len(conv[1]["message"]) > 0)

        # Test consecutive message in the same hour tick (no tick cooldown block for player)
        self.world.act("player", "talk", "citizen-1", "What are you doing today?")
        conv2 = self.world.conversation("player", "citizen-1")
        self.assertEqual(len(conv2), 4)
        self.assertEqual(conv2[3]["speaker_id"], "citizen-1")
        self.assertIn("Ada", conv2[3]["message"])


if __name__ == "__main__":
    unittest.main()
