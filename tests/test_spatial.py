import copy
import json
import math
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from world import World, starter_world, validate
from town import TOWN, RADIUS, SPEED, route, clear_segment, walkable, move_point, destination_anchor, distance


class SpatialTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name)/"world.json"
        self.world = World(self.path)
        self.world.ensure_player()

    def fixture(self, **positions):
        state = json.loads(self.path.read_text())
        for actor, position in positions.items():
            state["citizens"][actor]["position"] = dict(position)
            state["citizens"][actor]["route"] = []
        self.path.write_text(json.dumps(state))
        self.world = World(self.path)
        return self.world

    def elapse(self, seconds, world=None):
        for _ in range(round(seconds*10)):
            (world or self.world).step(.1)

    def test_town_scale_population_and_usable_entrances(self):
        self.assertEqual((TOWN["width"], TOWN["height"]), (12288,9216))
        self.assertGreaterEqual(len(TOWN["buildings"]),40)
        self.assertEqual(len(self.world.snapshot()["citizens"]),4)
        for place in TOWN["places"].values():
            self.assertTrue(walkable(**place["anchor"]), place["name"])
        for id in ("hospital","police","college","school","park","station"):
            self.assertTrue(route(TOWN["spawn"], TOWN["places"][id]["anchor"]))

    def test_free_ground_and_normalized_diagonal_speed(self):
        for dx,dy in ((1,0),(0,-1),(1,1),(-1,-1)):
            with self.subTest(direction=(dx,dy)):
                self.fixture(player={"x":11500,"y":8000})
                self.world.act("player","steer",params={"dx":dx,"dy":dy,"sequence":1})
                self.world.step(.1)
                actual=self.world.snapshot()["citizens"]["player"]["position"]
                self.assertAlmostEqual(distance(actual,{"x":11500,"y":8000}),SPEED*.1)

    def test_walls_slide_and_large_displacements_cannot_tunnel(self):
        b=next(b for b in TOWN["buildings"] if b["id"]=="shop")
        start={"x":b["x"]-RADIUS-1,"y":b["y"]+80}
        result=move_point(start,900,0)
        self.assertLessEqual(result["x"],b["x"]-RADIUS)
        sliding=move_point(start,15,30)
        self.assertGreater(sliding["y"],start["y"]+25)
        self.assertLessEqual(sliding["x"],b["x"]-RADIUS)
        self.assertFalse(walkable(b["x"]+20,b["y"]+20))

    def test_navigation_goes_around_building_and_checks_every_segment(self):
        b=next(b for b in TOWN["buildings"] if b["id"]=="shop")
        start={"x":b["x"]-40,"y":b["y"]+100}
        end={"x":b["x"]+b["w"]+40,"y":b["y"]+100}
        self.assertFalse(clear_segment(start,end))
        points=route(start,end)
        self.assertGreater(len(points),1)
        for a,b in zip([start]+points,points):
            self.assertTrue(clear_segment(a,b))

    def test_blocked_and_out_of_bounds_destinations_are_rejected(self):
        for end in ({"x":6300,"y":4100},{"x":-20,"y":2000},{"x":math.inf,"y":2000}):
            with self.assertRaises(ValueError): route(TOWN["spawn"],end)
        p=move_point({"x":RADIUS+1,"y":500},-1000,-1000)
        self.assertGreaterEqual(p["x"],RADIUS)
        self.assertGreaterEqual(p["y"],RADIUS)

    def test_coordinate_action_queues_movement_and_cannot_teleport(self):
        before=self.world.snapshot()["citizens"]["citizen-1"]["position"]
        self.world.act("citizen-1","move",params={"x":5400,"y":4800})
        citizen=self.world.snapshot()["citizens"]["citizen-1"]
        self.assertEqual(citizen["position"],before)
        self.assertEqual(citizen["route"][-1],{"x":5400,"y":4800})
        with self.assertRaises(ValueError):
            self.world.act("citizen-1","move",params={"x":6300,"y":4100})

    def test_shared_coordinate_move_also_works_for_player_and_yields_to_keyboard(self):
        self.fixture(player={"x":11000,"y":8500})
        self.world.act("player","move",params={"x":11500,"y":8500})
        self.world.step(.1)
        before=self.world.snapshot()["citizens"]["player"]
        self.assertGreater(before["position"]["x"],11000)
        self.world.act("player","steer",params={"dx":0,"dy":1,"sequence":1})
        self.world.step(.1)
        after=self.world.snapshot()["citizens"]["player"]
        self.assertEqual(after["route"],[])
        self.assertEqual(after["position"]["x"],before["position"]["x"])
        self.assertGreater(after["position"]["y"],before["position"]["y"])

    def test_corrupt_cross_wall_route_is_rejected_without_overwriting_save(self):
        state=json.loads(self.path.read_text())
        state["citizens"]["player"]["position"]={"x":6200,"y":4150}
        state["citizens"]["player"]["route"]=[{"x":6700,"y":4150}]
        self.path.write_text(json.dumps(state));before=self.path.read_bytes()
        with self.assertRaisesRegex(ValueError,"crosses an obstacle"):World(self.path)
        self.assertEqual(before,self.path.read_bytes())

    def test_player_and_npc_share_collision_and_move_at_bounded_speed(self):
        self.world.start()
        self.world.act("citizen-1","move","college")
        previous=self.world.snapshot()["citizens"]["citizen-1"]["position"]
        travelled=0
        for _ in range(250):
            self.world.step(.1)
            current=self.world.snapshot()["citizens"]["citizen-1"]["position"]
            self.assertTrue(walkable(**current))
            self.assertTrue(clear_segment(previous,current))
            delta=distance(previous,current)
            self.assertLessEqual(delta,SPEED*.1+.001)
            travelled+=delta;previous=current
        self.assertGreater(travelled,1000)

    def test_stale_invalid_and_expired_inputs(self):
        before=self.world.snapshot()
        for value in (True,math.inf,math.nan,2,"1"):
            with self.assertRaises(ValueError):
                self.world.act("player","steer",params={"dx":value,"dy":0,"sequence":1})
        self.assertEqual(before,self.world.snapshot())
        with patch("spatial.time.monotonic",return_value=10):
            self.world.act("player","steer",params={"dx":1,"dy":0,"sequence":5})
            result=self.world.act("player","steer",params={"dx":-1,"dy":0,"sequence":4})
            self.assertFalse(result["accepted"])
        with patch("spatial.time.monotonic",return_value=11):
            self.world.step(.1)
        self.assertEqual(before["citizens"]["player"]["position"],self.world.snapshot()["citizens"]["player"]["position"])

    def test_clock_rate_does_not_change_walking_speed(self):
        results=[]
        for speed in (1,10):
            self.fixture(player={"x":11500,"y":8000})
            self.world.start()
            self.world.act("player","steer",params={"dx":1,"dy":0,"sequence":1})
            self.world.step(.1,clock_speed=speed)
            results.append(self.world.snapshot()["citizens"]["player"]["position"])
        self.assertEqual(results[0],results[1])

    def test_stop_and_restart_preserve_positions_routes_and_social_state(self):
        self.world.act("citizen-1","talk","citizen-2","A private promise.",{"intent":"confide"})
        self.world.start();self.world.act("citizen-1","move","hospital")
        self.world.act("player","steer",params={"dx":1,"dy":0,"sequence":1})
        self.world.step(.1)
        self.world.act("player","steer",params={"dx":0,"dy":0,"sequence":2})
        restored=World(self.path)
        self.assertEqual(restored.snapshot(),self.world.snapshot())
        self.assertEqual(restored.citizen_context("citizen-2"),self.world.citizen_context("citizen-2"))
        p=restored.snapshot()["citizens"]["player"]["position"]
        restored.step(.1)
        self.assertEqual(p,restored.snapshot()["citizens"]["player"]["position"])
        self.assertNotEqual(restored.snapshot()["citizens"]["citizen-1"]["position"],self.world.snapshot()["citizens"]["citizen-1"]["position"])

    def test_failed_movement_checkpoint_does_not_publish_new_position(self):
        self.world._spatial_runtime();self.world._checkpoint_elapsed=1
        self.world.act("player","steer",params={"dx":1,"dy":0,"sequence":1})
        before=self.world.snapshot();disk=self.path.read_bytes()
        with patch("world.os.replace",side_effect=OSError("disk full")),self.assertRaises(OSError):
            self.world.step(.1)
        self.assertEqual(before,self.world.snapshot());self.assertEqual(disk,self.path.read_bytes())

    def test_talk_requires_distance_and_no_wall_between_participants(self):
        with self.assertRaisesRegex(ValueError,"closer"):
            self.world.act("player","talk","citizen-1","Hello")
        b=next(b for b in TOWN["buildings"] if b["id"]=="shop")
        # Opposite sides of a tree trunk, within range but without line of sight.
        t=TOWN["trees"][0]
        self.fixture(player={"x":t["x"]-35,"y":t["y"]},**{"citizen-1":{"x":t["x"]+35,"y":t["y"]}})
        with self.assertRaisesRegex(ValueError,"closer"):
            self.world.act("player","talk","citizen-1","Through a trunk")

    def test_conversation_holds_only_participants_and_releases_on_close(self):
        self.fixture(player={"x":4973,"y":4246})
        self.world.start();self.world.act("citizen-1","move","shop");self.world.act("citizen-3","move","shop")
        self.world.act("player","engage","citizen-1")
        before=self.world.snapshot()
        self.world.step(.1)
        after=self.world.snapshot()
        self.assertEqual(before["citizens"]["citizen-1"]["position"],after["citizens"]["citizen-1"]["position"])
        self.assertNotEqual(before["citizens"]["citizen-3"]["position"],after["citizens"]["citizen-3"]["position"])
        self.world.act("player","disengage");self.world.step(.1)
        self.assertNotEqual(after["citizens"]["citizen-1"]["position"],self.world.snapshot()["citizens"]["citizen-1"]["position"])

    def test_browser_transcript_is_pair_scoped_and_no_private_values_escape(self):
        p=destination_anchor("citizen-1","home-1")
        self.fixture(player=p,**{"citizen-3":p})
        self.world.act("citizen-1","talk","citizen-3","Someone else’s secret.")
        self.world.act("player","talk","citizen-1","Hello Ada.")
        self.world.act("citizen-1","talk","player","Hello traveller.")
        self.world.act("player","talk","citizen-2","Only Ben should see this.")
        messages=self.world.conversation("player","citizen-1")
        self.assertEqual([m["message"] for m in messages],["Hello Ada.","Hello traveller."])
        public=json.dumps(self.world.browser_snapshot())
        for forbidden in ("private_social","relationships","beliefs","personality_traits","personal_goal","cooldown","Someone else’s secret.","Hello Ada."):
            self.assertNotIn(forbidden,public)

    def test_version_four_migration_preserves_identity_memories_and_cooldowns(self):
        self.world.act("citizen-1","talk","citizen-2","Remember this.",{"intent":"confide"})
        old=json.loads(self.path.read_text());old["schema_version"]=4
        old.pop("spatial");old.pop("private_knowledge");old["citizens"].pop("player")
        old["locations"]={k:v for k,v in old["locations"].items() if k in {"home-1","home-2","shop","street"}}
        old["citizens"]["citizen-2"]["identity"]["personal_goal"]="Keep my own existing goal."
        old["private_ai"]={"citizen-2":{"last_reply_tick_by_actor":{"citizen-1":0}}}
        for c in old["citizens"].values():
            for field in ("position","facing","route","destination_id","control"):c.pop(field)
        self.path.write_text(json.dumps(old));restored=World(self.path)
        self.assertEqual(restored.snapshot()["schema_version"],5)
        self.assertEqual(restored.snapshot()["citizens"]["citizen-2"]["identity"]["personal_goal"],"Keep my own existing goal.")
        self.assertEqual(restored.citizen_context("citizen-2")["memories"][0]["message"],"Remember this.")
        self.assertEqual(json.loads(self.path.read_text())["private_ai"],old["private_ai"])

    def test_shared_javascript_collision_matches_python(self):
        b=next(b for b in TOWN["buildings"] if b["id"]=="shop")
        cases=[({"x":b["x"]-12,"y":b["y"]+80},200,25),({"x":11000,"y":8500},70,-90),
               ({"x":12,"y":12},-70,-90),({"x":5880,"y":5210},0,-200)]
        code="""import fs from 'node:fs';import {makePhysics} from './web/physics.js';
        const {map,cases}=JSON.parse(fs.readFileSync(0,'utf8'));const p=makePhysics(map);
        process.stdout.write(JSON.stringify(cases.map(([point,dx,dy])=>p.move(point,dx,dy))));"""
        result=subprocess.run(["node","--input-type=module","-e",code],input=json.dumps({"map":TOWN,"cases":cases}),text=True,capture_output=True,check=True,cwd=Path(__file__).resolve().parents[1])
        for actual,(point,dx,dy) in zip(json.loads(result.stdout),cases):
            expected=move_point(point,dx,dy)
            self.assertAlmostEqual(actual["x"],expected["x"]);self.assertAlmostEqual(actual["y"],expected["y"])


class InstitutionalTests(unittest.TestCase):
    def setUp(self):
        self.directory=tempfile.TemporaryDirectory();self.addCleanup(self.directory.cleanup)
        self.path=Path(self.directory.name)/"world.json";self.world=World(self.path)
        self.world.ensure_player();self.world.start();self.world.advance(8)
        for _ in range(200):self.world.step(.1)

    def place_player(self, position):
        self.world.save();state=json.loads(self.path.read_text());state["citizens"]["player"]["position"]=dict(position)
        self.path.write_text(json.dumps(state));self.world=World(self.path)

    def test_incident_requires_witnessing_and_can_be_helped_treated_and_reported(self):
        self.assertIsNone(self.world.browser_snapshot()["incident"])
        with self.assertRaises(ValueError):self.world.act("player","assist","citizen-3")
        patient=self.world.snapshot()["citizens"]["citizen-3"]
        self.place_player(patient["position"]);self.world.step(.1)
        self.assertEqual(self.world.browser_snapshot()["incident"]["status"],"needs_help")
        self.world.act("player","assist","citizen-3")
        self.assertEqual(self.world.citizen_context("citizen-3")["relationships"]["player"]["trust"],1)
        self.assertEqual(self.world.browser_snapshot()["incident"]["status"],"going_to_hospital")
        for _ in range(250):self.world.step(.1)
        self.assertEqual(self.world.browser_snapshot()["incident"]["status"],"recovered")
        self.assertTrue(any(e["type"]=="routine_interrupted" for e in self.world.snapshot()["events"]))
        with self.assertRaises(ValueError):self.world.act("player","report","police")
        self.place_player(TOWN["places"]["police"]["anchor"])
        self.world.act("player","report","police")
        self.assertTrue(self.world.browser_snapshot()["incident"]["reported"])
        with self.assertRaises(ValueError):self.world.act("player","report","police")
        restored=World(self.path)
        self.assertTrue(restored.browser_snapshot()["incident"]["reported"])
        self.assertEqual(len([e for e in restored.snapshot()["events"] if e["type"]=="citizen_fell"]),1)
        self.assertEqual(self.world.conversation("player","citizen-3"),[])

    def test_citizens_help_and_report_without_player_or_invented_dialogue(self):
        with patch.object(self.world,"act",wraps=self.world.act) as act:
            for _ in range(1100):self.world.step(.1)
        incident=self.world.snapshot()["spatial"]["incident"]
        self.assertEqual(incident["status"],"recovered")
        self.assertIn(incident["helper_id"],incident["reported_by"])
        actions=[c.kwargs.get("action_name") for c in act.call_args_list]
        self.assertIn("assist",actions);self.assertIn("report",actions)
        self.assertFalse(any(e["type"]=="citizen_talked" for e in self.world.snapshot()["events"]))
        self.assertIsNone(self.world.browser_snapshot()["incident"])

    def test_failure_to_save_help_does_not_start_treatment(self):
        self.place_player(self.world.snapshot()["citizens"]["citizen-3"]["position"])
        before=self.world.snapshot()
        with patch("world.os.replace",side_effect=OSError("disk failure")),self.assertRaises(OSError):
            self.world.act("player","assist","citizen-3")
        self.assertEqual(self.world.snapshot(),before)


if __name__ == "__main__":
    unittest.main()
