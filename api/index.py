"""Vercel Serverless Function entrypoint for Willow Living Town."""

import copy
import json
import os
from pathlib import Path
import secrets
import shutil
import sys
import threading
import time
from urllib.parse import parse_qs, urlsplit
from http.server import BaseHTTPRequestHandler

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from world import World
from town import TOWN
from spatial import HOUR_SECONDS
from population import expand_population
from lm_studio import setup_brains

_lock = threading.Lock()
_world = None
_last_step = None
_token = secrets.token_urlsafe(32)


def get_world():
    global _world, _last_step
    with _lock:
        if _world is not None:
            now = time.monotonic()
            elapsed = min(now - _last_step, 2.0)
            while elapsed >= 0.05:
                _world.step(0.05, clock_speed=HOUR_SECONDS / 5.0)
                elapsed -= 0.05
            _last_step = now
            return _world

        # Vercel serverless environment uses /tmp for writeable storage
        save_dir = Path(os.environ.get("VERCEL_STORAGE_DIR", "/tmp"))
        save_path = save_dir / "world.json"
        seed_path = ROOT / "data" / "world.json"

        if not save_path.exists():
            if seed_path.exists():
                shutil.copyfile(seed_path, save_path)

        _world = World(save_path)
        expand_population(_world)
        setup_brains(_world)
        _world.start()

        # Guarantee daytime start
        tick = _world._state["clock"]["tick"]
        hour = tick % 24
        if hour >= 22 or hour < 7:
            target = ((tick // 24) + (1 if hour >= 8 else 0)) * 24 + 8
            adv = target - tick
            if adv > 0:
                _world.advance(adv)
        _world.sync_citizen_movements()

        _last_step = time.monotonic()
        return _world


class handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, format, *args):
        pass

    def reply(self, status, data, mime="application/json; charset=utf-8"):
        payload = json.dumps(data, allow_nan=False).encode() if isinstance(data, (dict, list)) else data
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Town-Token")
        self.end_headers()
        try:
            self.wfile.write(payload)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Town-Token")
        self.end_headers()

    def do_GET(self):
        url = urlsplit(self.path)
        world = get_world()
        path = url.path.rstrip("/")
        if not path:
            path = "/api/bootstrap"

        try:
            if path == "/api/bootstrap":
                self.reply(200, {"token": _token, "state": world.browser_snapshot()})
            elif path == "/api/state":
                self.reply(200, world.browser_snapshot())
            elif path == "/api/map":
                self.reply(200, TOWN)
            elif path == "/api/conversation":
                target = parse_qs(url.query).get("citizen", [None])[0]
                self.reply(200, {
                    "messages": world.conversation("player", target),
                    "pending": bool(world._scheduler and world._scheduler.conversation_pending(target))
                })
            elif path == "/api/llm/status":
                self.reply(200, getattr(world, "_ai_info", {"connected": bool(world._ai_brains), "model": None, "base_url": None}))
            else:
                self.reply(404, {"error": "Not found"})
        except ValueError as error:
            self.reply(400, {"error": str(error)})
        except OSError as error:
            self.reply(503, {"error": f"Town error: {error}"})

    def do_POST(self):
        url = urlsplit(self.path)
        world = get_world()
        path = url.path.rstrip("/")
        try:
            size = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(size)) if size > 0 else {}
            if not isinstance(body, dict):
                raise ValueError("Invalid request body")

            if path == "/api/input":
                if set(body) != {"dx", "dy", "sequence"}:
                    raise ValueError("Invalid movement input")
                result = world.act("player", "steer", params=body)
            elif path == "/api/action":
                if not set(body) <= {"action", "target", "message"} or body.get("action") not in {"talk", "engage", "disengage", "assist", "report"}:
                    raise ValueError("Unsupported player action")
                result = world.act("player", body["action"], body.get("target"), body.get("message"))
            elif path == "/api/time":
                if body.get("action") == "morning":
                    current_tick = world._state["clock"]["tick"]
                    target_tick = ((current_tick // 24) + (1 if current_tick % 24 >= 8 else 0)) * 24 + 8
                    advance_ticks = target_tick - current_tick
                    if advance_ticks > 0:
                        world.advance(advance_ticks)
                    world.sync_citizen_movements()
                    result = {"advanced_to_hour": 8, "ticks": advance_ticks, "clock": world.snapshot()["clock"]}
                elif body.get("action") == "advance":
                    ticks = int(body.get("ticks", 1))
                    world.advance(ticks)
                    world.sync_citizen_movements()
                    result = {"ticks": ticks, "clock": world.snapshot()["clock"]}
                else:
                    raise ValueError("Unsupported time action")
            elif path == "/api/llm/connect":
                result = setup_brains(world, body.get("model"), body.get("base_url"),
                                      body.get("provider"), body.get("api_key"))
            else:
                return self.reply(404, {"error": "Not found"})

            self.reply(200, {"result": result})
        except (ValueError, TypeError) as error:
            self.reply(400, {"error": str(error)})
        except OSError as error:
            self.reply(503, {"error": f"Saving failed: {error}"})
