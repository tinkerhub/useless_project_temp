import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from world import MAX_MESSAGE_LENGTH, MAX_SOCIAL_VALUE, World, starter_world, validate


class SocialActionTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "world.json"
        self.world = World(self.path)

    def test_plain_talk_is_primary_and_has_no_social_rating_effect(self):
        event = self.world.act("citizen-1", "talk", "citizen-2", "Meet me at the shop.")

        self.assertEqual(event["type"], "citizen_talked")
        self.assertEqual(event["entity_ids"], ["citizen-1", "citizen-2"])
        self.assertEqual(event["details"], {})
        context = self.world.citizen_context("citizen-2")
        self.assertEqual(context["relationships"], {})
        self.assertEqual(context["beliefs"], {})
        self.assertEqual(context["memories"][0]["message"], "Meet me at the shop.")
        self.assertEqual(context["memories"][0]["intent"], "neutral")

    def test_explicit_talk_tags_have_small_deterministic_side_effects(self):
        cases = (
            ("confide", "trust"),
            ("encourage", "friendship"),
            ("insult", "anger"),
        )
        for intent, changed_value in cases:
            with self.subTest(intent=intent):
                path = Path(self.directory.name) / f"{intent}.json"
                world = World(path)
                world.act(
                    "citizen-1", "talk", "citizen-2", "A private message.",
                    {"intent": intent},
                )
                relationship = world.citizen_context("citizen-2")["relationships"]["citizen-1"]
                expected = {"trust": 0, "friendship": 0, "anger": 0}
                expected[changed_value] = 1
                self.assertEqual(relationship, expected)

    def test_told_information_changes_only_the_recipient(self):
        self.world.act(
            "citizen-1",
            "talk",
            "citizen-2",
            "Cleo helped me carry a parcel.",
            {"intent": "report_help", "subject_id": "citizen-3"},
        )

        recipient = self.world.citizen_context("citizen-2")
        self.assertEqual(recipient["beliefs"], {"citizen-3": {"helpful": True}})
        self.assertEqual(
            recipient["relationships"]["citizen-3"],
            {"trust": 1, "friendship": 0, "anger": 0},
        )
        self.assertEqual(self.world.citizen_context("citizen-1")["memories"], [])
        self.assertEqual(self.world.citizen_context("citizen-3")["memories"], [])

    def test_private_content_is_absent_from_public_snapshot_and_event_log(self):
        secret = "Cleo keeps the spare key under the flowerpot."
        self.world.act(
            "citizen-1", "talk", "citizen-2", secret,
            {"intent": "report_help", "subject_id": "citizen-3"},
        )

        public = self.world.snapshot()
        validate(public)
        serialized = json.dumps(public)
        self.assertNotIn("private_social", public)
        self.assertNotIn(secret, serialized)
        self.assertNotIn("message_received", serialized)
        self.assertEqual(public["events"][-1]["details"], {})

    def test_private_state_survives_restart_and_returned_context_is_detached(self):
        self.world.act(
            "citizen-1", "talk", "citizen-2", "I trust you with this.",
            {"intent": "confide"},
        )
        expected = self.world.citizen_context("citizen-2")
        expected["memories"].clear()
        self.assertEqual(len(self.world.citizen_context("citizen-2")["memories"]), 1)

        restored = World(self.path)
        context = restored.citizen_context("citizen-2")
        self.assertEqual(context["memories"][0]["message"], "I trust you with this.")
        self.assertEqual(context["relationships"]["citizen-1"]["trust"], 1)

    def test_social_values_are_bounded_side_effects(self):
        for _ in range(MAX_SOCIAL_VALUE + 3):
            self.world.act(
                "citizen-1", "talk", "citizen-2", "I need to tell you something.",
                {"intent": "confide"},
            )
        trust = self.world.citizen_context("citizen-2")["relationships"]["citizen-1"]["trust"]
        self.assertEqual(trust, MAX_SOCIAL_VALUE)

    def test_invalid_actions_change_neither_memory_nor_disk(self):
        before_public = self.world.snapshot()
        before_contexts = {
            citizen_id: self.world.citizen_context(citizen_id)
            for citizen_id in before_public["citizens"]
        }
        before_file = self.path.read_bytes()
        invalid_calls = (
            ("missing", "talk", "citizen-2", "Hello", None),
            ("citizen-1", "talk", "missing", "Hello", None),
            ("citizen-1", "talk", "citizen-1", "Hello", None),
            ("citizen-1", "dance", "citizen-2", "Hello", None),
            ("citizen-1", "talk", "citizen-2", "", None),
            ("citizen-1", "talk", "citizen-2", " " * 3, None),
            ("citizen-1", "talk", "citizen-2", "x" * (MAX_MESSAGE_LENGTH + 1), None),
            ("citizen-1", "talk", "citizen-2", "Hello", {"intent": "guess"}),
            ("citizen-1", "talk", "citizen-2", "Hello", {"unknown": True}),
            ("citizen-1", "talk", "citizen-2", "Hello", {"intent": "report_help"}),
            (
                "citizen-1", "talk", "citizen-2", "Hello",
                {"intent": "report_help", "subject_id": "citizen-2"},
            ),
        )
        for args in invalid_calls:
            with self.subTest(args=args), self.assertRaises(ValueError):
                self.world.act(*args)

        self.assertEqual(self.world.snapshot(), before_public)
        self.assertEqual(
            {citizen_id: self.world.citizen_context(citizen_id) for citizen_id in before_contexts},
            before_contexts,
        )
        self.assertEqual(self.path.read_bytes(), before_file)

    def test_failed_atomic_write_does_not_commit_social_state(self):
        before_public = self.world.snapshot()
        before_context = self.world.citizen_context("citizen-2")
        before_file = self.path.read_bytes()
        with patch("world.os.replace", side_effect=OSError("disk failure")):
            with self.assertRaises(OSError):
                self.world.act("citizen-1", "talk", "citizen-2", "Do you hear me?")
        self.assertEqual(self.world.snapshot(), before_public)
        self.assertEqual(self.world.citizen_context("citizen-2"), before_context)
        self.assertEqual(self.path.read_bytes(), before_file)

    def test_persisted_talk_event_requires_its_private_memory(self):
        self.world.act("citizen-1", "talk", "citizen-2", "Remember this.")
        damaged = json.loads(self.path.read_text())
        damaged.pop("private_social")
        self.path.write_text(json.dumps(damaged), encoding="utf-8")

        with self.assertRaisesRegex(ValueError, "missing its private recipient memory"):
            World(self.path)

    def test_schema_one_save_migrates_without_losing_world_data(self):
        old = starter_world()
        old["schema_version"] = 1
        old["clock"]["tick"] = 7
        old["citizens"]["citizen-1"]["money"] = 73
        migration_path = Path(self.directory.name) / "old.json"
        migration_path.write_text(json.dumps(old), encoding="utf-8")

        migrated = World(migration_path)
        public = migrated.snapshot()
        self.assertEqual(public["schema_version"], 5)
        self.assertEqual(public["clock"]["tick"], 7)
        self.assertEqual(public["citizens"]["citizen-1"]["money"], 73)
        self.assertEqual(migrated.citizen_context("citizen-1")["memories"], [])
        self.assertEqual(json.loads(migration_path.read_text())["schema_version"], 5)


if __name__ == "__main__":
    unittest.main()
