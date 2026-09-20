import json
from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import patch

from world import MAX_MESSAGE_LENGTH, World, starter_world, validate


class FakeBrain:
    def __init__(self, response=None, error=None, delay=0):
        self.response = response if response is not None else {"action": "none"}
        self.error = error
        self.delay = delay
        self.requests = []

    def decide(self, request):
        self.requests.append(request)
        if self.delay:
            time.sleep(self.delay)
        if self.error:
            raise self.error
        return self.response


class AIConversationTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "world.json"

    def world_with(self, citizen_id, brain, **kwargs):
        return World(self.path, ai_brains={citizen_id: brain}, **kwargs)

    def test_configured_brain_replies_once_through_normal_talk_rules(self):
        brain = FakeBrain({
            "action": "talk",
            "message": "That was kind of Cleo.",
            "intent": "encourage",
        })
        world = self.world_with("citizen-2", brain)

        incoming = world.act(
            "citizen-1",
            "talk",
            "citizen-2",
            "Cleo helped me yesterday.",
            {"intent": "report_help", "subject_id": "citizen-3"},
        )

        self.assertEqual(incoming["entity_ids"], ["citizen-1", "citizen-2"])
        self.assertEqual(len(brain.requests), 1)
        reply = world.citizen_context("citizen-1")["memories"][-1]
        self.assertEqual(reply["actor_id"], "citizen-2")
        self.assertEqual(reply["message"], "That was kind of Cleo.")
        self.assertEqual(reply["intent"], "encourage")
        self.assertEqual(
            world.citizen_context("citizen-1")["relationships"]["citizen-2"]["friendship"],
            1,
        )
        public = world.snapshot()
        self.assertEqual(public["events"][-1]["details"], {})
        self.assertNotIn("That was kind of Cleo.", json.dumps(public))

    def test_unconfigured_citizen_continues_without_a_reply(self):
        world = World(self.path)
        before_events = len(world.snapshot()["events"])
        world.act("citizen-1", "talk", "citizen-2", "Hello.")
        self.assertEqual(len(world.snapshot()["events"]), before_events + 1)
        self.assertEqual(world.citizen_context("citizen-1")["memories"], [])

    def test_brain_receives_only_recipient_scoped_detached_context(self):
        brain = FakeBrain()
        world = self.world_with("citizen-2", brain)
        secret = "The spare key is beneath Cleo's flowerpot."
        # Conversations now require physical proximity; keep this privacy test scoped
        # to dialogue by arranging its three participants at the same outdoor place.
        fixture = json.loads(self.path.read_text())
        for citizen in fixture["citizens"].values():
            citizen["position"] = dict(fixture["citizens"]["citizen-1"]["position"])
            citizen["location_id"] = "home-1"
        self.path.write_text(json.dumps(fixture))
        world = self.world_with("citizen-2", brain)
        world.act("citizen-1", "talk", "citizen-3", secret)
        world.act(
            "citizen-1",
            "talk",
            "citizen-2",
            "Cleo helped me yesterday.",
            {"intent": "report_help", "subject_id": "citizen-3"},
        )

        request = brain.requests[0]
        self.assertEqual(
            set(request),
            {"citizen", "world", "incoming", "private_context", "allowed_actions"},
        )
        self.assertEqual(request["citizen"]["id"], "citizen-2")
        self.assertEqual(request["incoming"]["speaker"]["id"], "citizen-1")
        self.assertNotIn(secret, json.dumps(request))
        self.assertNotIn("citizens", request["world"])
        self.assertNotIn("events", request["world"])
        self.assertNotIn("paths", request["world"])
        request["private_context"]["memories"].clear()
        self.assertEqual(len(world.citizen_context("citizen-2")["memories"]), 1)

    def test_invalid_outputs_deterministically_become_none(self):
        invalid_outputs = (
            None,
            [],
            {"action": "move"},
            {"action": "none", "message": "extra"},
            {"action": "talk", "message": "Hello", "intent": "invented"},
            {"action": "talk", "message": "x" * (MAX_MESSAGE_LENGTH + 1), "intent": "neutral"},
            {"action": "talk", "message": "Hello", "intent": "neutral", "extra": True},
            {
                "action": "talk",
                "message": "I heard something.",
                "intent": "report_help",
                "subject_id": "citizen-3",
            },
        )
        for index, response in enumerate(invalid_outputs):
            with self.subTest(response=response):
                path = Path(self.directory.name) / f"invalid-{index}.json"
                brain = FakeBrain(response)
                world = World(path, ai_brains={"citizen-2": brain})
                before_events = len(world.snapshot()["events"])
                world.act("citizen-1", "talk", "citizen-2", "Hello.")
                self.assertEqual(len(world.snapshot()["events"]), before_events + 1)
                self.assertEqual(world.citizen_context("citizen-1")["memories"], [])

    def test_provider_error_and_timeout_do_not_interrupt_talk(self):
        cases = (
            (FakeBrain(error=RuntimeError("provider unavailable")), {}),
            (FakeBrain(delay=0.2), {"ai_timeout_seconds": 0.01}),
        )
        for index, (brain, options) in enumerate(cases):
            with self.subTest(index=index):
                path = Path(self.directory.name) / f"failure-{index}.json"
                world = World(path, ai_brains={"citizen-2": brain}, **options)
                started = time.monotonic()
                event = world.act("citizen-1", "talk", "citizen-2", "Are you there?")
                elapsed = time.monotonic() - started
                self.assertEqual(event["type"], "citizen_talked")
                self.assertEqual(len(world.citizen_context("citizen-2")["memories"]), 1)
                self.assertEqual(world.citizen_context("citizen-1")["memories"], [])
                self.assertLess(elapsed, 0.15)
                validate(json.loads(path.read_text()), require_private_events=True)

    def test_failed_reply_save_preserves_the_committed_incoming_talk(self):
        brain = FakeBrain({"action": "talk", "message": "I hear you.", "intent": "neutral"})
        world = self.world_with("citizen-2", brain)
        real_replace = __import__("os").replace
        replace_calls = 0

        def fail_second_replace(source, destination):
            nonlocal replace_calls
            replace_calls += 1
            if replace_calls == 2:
                raise OSError("reply save failed")
            return real_replace(source, destination)

        with patch("world.os.replace", side_effect=fail_second_replace):
            event = world.act("citizen-1", "talk", "citizen-2", "Please remember this.")

        self.assertEqual(event["type"], "citizen_talked")
        self.assertEqual(len(world.citizen_context("citizen-2")["memories"]), 1)
        self.assertEqual(world.citizen_context("citizen-1")["memories"], [])
        self.assertEqual(World(self.path).snapshot(), world.snapshot())

    def test_cooldown_persists_and_ai_replies_do_not_trigger_other_brains(self):
        speaker_brain = FakeBrain({
            "action": "talk", "message": "This must not run.", "intent": "neutral"
        })
        recipient_brain = FakeBrain({
            "action": "talk", "message": "One reply.", "intent": "neutral"
        })
        world = World(
            self.path,
            ai_brains={"citizen-1": speaker_brain, "citizen-2": recipient_brain},
        )
        world.act("citizen-1", "talk", "citizen-2", "First.")
        world.act("citizen-1", "talk", "citizen-2", "Second, same tick.")

        self.assertEqual(len(recipient_brain.requests), 1)
        self.assertEqual(len(speaker_brain.requests), 0)
        self.assertNotIn("private_ai", world.snapshot())
        persisted = json.loads(self.path.read_text())
        self.assertEqual(
            persisted["private_ai"]["citizen-2"]["last_reply_tick_by_actor"]["citizen-1"],
            0,
        )

        restored_brain = FakeBrain({
            "action": "talk", "message": "A later reply.", "intent": "neutral"
        })
        restored = World(self.path, ai_brains={"citizen-2": restored_brain})
        restored.act("citizen-1", "talk", "citizen-2", "Still the same tick.")
        self.assertEqual(len(restored_brain.requests), 0)
        restored.advance(1)
        restored.act("citizen-1", "talk", "citizen-2", "A tick later.")
        self.assertEqual(len(restored_brain.requests), 1)

    def test_schema_three_migrates_identity_and_runtime_config_is_not_saved(self):
        old = starter_world()
        old["schema_version"] = 3
        for citizen in old["citizens"].values():
            citizen.pop("identity")
        self.path.write_text(json.dumps(old), encoding="utf-8")
        brain = FakeBrain()

        world = World(self.path, ai_brains={"citizen-2": brain}, ai_timeout_seconds=0.25)

        public = world.snapshot()
        self.assertEqual(public["schema_version"], 5)
        self.assertEqual(
            set(public["citizens"]["citizen-2"]["identity"]),
            {"personality_traits", "personal_goal", "speaking_style"},
        )
        saved = self.path.read_text()
        self.assertNotIn("FakeBrain", saved)
        self.assertNotIn("ai_timeout_seconds", saved)
        restored = World(self.path)
        restored.act("citizen-1", "talk", "citizen-2", "No configured brain now.")
        self.assertEqual(restored.citizen_context("citizen-1")["memories"], [])


if __name__ == "__main__":
    unittest.main()
