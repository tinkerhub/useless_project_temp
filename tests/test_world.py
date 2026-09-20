import json
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

from world import World, validate


class WorldTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "world.json"
        self.world = World(self.path)

    def test_starter_and_isolated_snapshot(self):
        state = self.world.snapshot()
        self.assertEqual(len(state["citizens"]), 3)
        self.assertEqual(len(state["locations"]), 44)
        self.assertEqual(len(state["paths"]), 3)
        validate(state)
        state["citizens"].clear()
        self.assertEqual(len(self.world.snapshot()["citizens"]), 3)

    def test_clock_pause_advance_and_exact_restore(self):
        self.world.start()
        self.world.tick_if_running()
        self.world.pause()
        self.world.tick_if_running()
        self.assertEqual(self.world.snapshot()["clock"]["tick"], 1)
        self.world.advance(12)
        expected = self.world.snapshot()
        self.assertEqual(expected["clock"], {"tick": 13, "running": False})
        restored = World(self.path)
        self.assertEqual(restored.snapshot(), expected)
        restored.start()
        self.assertEqual(restored.snapshot()["events"][-1]["id"], expected["events"][-1]["id"] + 1)
        for value in (-1, 1.5, True):
            with self.assertRaises(ValueError):
                restored.advance(value)

    def test_failed_save_does_not_commit(self):
        before = self.world.snapshot()
        with patch("world.os.replace", side_effect=OSError("disk failure")):
            with self.assertRaises(OSError):
                self.world.advance()
        self.assertEqual(self.world.snapshot(), before)
        self.assertEqual(World(self.path).snapshot(), before)

    def test_corrupt_save_is_not_overwritten(self):
        self.path.write_text('{"schema_version": 999}')
        with self.assertRaises(ValueError):
            World(self.path)
        self.assertEqual(self.path.read_text(), '{"schema_version": 999}')

    def test_headless_server_restart(self):
        path = Path(self.directory.name) / "server.json"
        root = Path(__file__).resolve().parents[1]

        def launch():
            process = subprocess.Popen(
                [sys.executable, str(root / "server.py"), "--headless", "--save", str(path), "--tick-seconds", "0.03"],
                stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
            )
            return process

        def wait_for_tick(process, target):
            deadline = time.monotonic() + 5
            while time.monotonic() < deadline:
                if process.poll() is not None:
                    self.fail(process.stderr.read().decode())
                if path.exists() and json.loads(path.read_text())["clock"]["tick"] >= target:
                    return
                time.sleep(0.01)
            self.fail("Headless server did not advance")

        def stop(process):
            process.terminate()
            try:
                _, error = process.communicate(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.communicate()
                raise
            self.assertEqual(process.returncode, 0, error.decode())

        first = launch()
        try:
            wait_for_tick(first, 3)
        finally:
            stop(first)
        saved = json.loads(path.read_text())
        saved.pop("private_knowledge", None)
        saved.pop("private_social", None)
        saved.pop("private_ai", None)
        self.assertEqual(World(path).snapshot(), saved)
        second = launch()
        try:
            wait_for_tick(second, saved["clock"]["tick"] + 2)
        finally:
            stop(second)
        after = World(path).snapshot()
        self.assertGreater(after["clock"]["tick"], saved["clock"]["tick"])
        self.assertEqual(World(path).snapshot(), after)
        self.assertEqual(after["events"][:len(saved["events"])], saved["events"])


if __name__ == "__main__":
    unittest.main()
