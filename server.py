"""Local browser server and independent, authoritative town simulation."""

import argparse
import json
import math
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import secrets
import signal
import socket
import sys
import threading
import time
from urllib.parse import parse_qs, urlsplit

from world import World
from town import TOWN
from spatial import HOUR_SECONDS

ROOT = Path(__file__).resolve().parent
PUBLIC_FILES = {"/": "index.html", "/index.html": "index.html", "/app.js": "web/app.js",
                "/renderer.js": "web/renderer.js", "/physics.js": "web/physics.js",
                "/style.css": "web/style.css", "/favicon.svg": "web/favicon.svg"}
MIME = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml"}


def positive_seconds(value):
    seconds = float(value)
    if not math.isfinite(seconds) or seconds <= 0:
        raise argparse.ArgumentTypeError("tick interval must be finite and positive")
    return seconds


def make_server(world, host="127.0.0.1", port=8000):
    """Embedding entrypoint: callers can inject existing CitizenBrain providers."""
    world.ensure_player()
    token = secrets.token_urlsafe(32)

    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, format, *args):
            if len(args)>1 and str(args[1]).startswith("5"):
                super().log_message(format, *args)

        def reply(self, status, data, mime="application/json; charset=utf-8"):
            payload = json.dumps(data, allow_nan=False).encode() if isinstance(data,(dict,list)) else data
            self.send_response(status)
            self.send_header("Content-Type",mime)
            self.send_header("Content-Length",str(len(payload)))
            self.send_header("Cache-Control","no-store")
            self.send_header("X-Content-Type-Options","nosniff")
            self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'")
            self.end_headers()
            try:
                self.wfile.write(payload)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def do_GET(self):
            url = urlsplit(self.path)
            try:
                if url.path == "/api/bootstrap":
                    self.reply(200,{"token":token, "state":world.browser_snapshot()})
                elif url.path == "/api/state":
                    self.reply(200,world.browser_snapshot())
                elif url.path == "/api/map":
                    self.reply(200,TOWN)
                elif url.path == "/api/conversation":
                    target = parse_qs(url.query).get("citizen",[None])[0]
                    self.reply(200,{"messages":world.conversation("player",target),
                                    "pending": bool(world._scheduler and world._scheduler.conversation_pending(target))})
                elif url.path == "/api/llm/status":
                    self.reply(200, getattr(world, "_ai_info", {"connected": bool(world._ai_brains), "model": None, "base_url": None}))
                elif url.path in PUBLIC_FILES:
                    path = ROOT/PUBLIC_FILES[url.path]
                    self.reply(200,path.read_bytes(),MIME[path.suffix])
                else:
                    self.reply(404,{"error":"Not found"})
            except ValueError as error:
                self.reply(400,{"error":str(error)})
            except OSError:
                self.reply(503,{"error":"The town could not be loaded. Please retry."})

        def do_POST(self):
            # One local human actor. Request bodies cannot choose another identity.
            origin = self.headers.get("Origin")
            expected = f"http://{self.headers.get('Host')}"
            if self.headers.get("X-Town-Token") != token or (origin and origin != expected):
                self.close_connection = True
                return self.reply(403,{"error":"Refresh the town to reconnect"})
            try:
                size = int(self.headers.get("Content-Length","0"))
                if not 0 < size <= 4096:
                    raise ValueError("Invalid request size")
                body = json.loads(self.rfile.read(size))
                if not isinstance(body,dict):
                    raise ValueError("Invalid request")
                if self.path == "/api/input":
                    if set(body) != {"dx","dy","sequence"}:
                        raise ValueError("Invalid movement input")
                    result = world.act("player","steer",params=body)
                elif self.path == "/api/action":
                    if not set(body) <= {"action","target","message"} or body.get("action") not in {"talk","engage","disengage","assist","report"}:
                        raise ValueError("Unsupported player action")
                    result = world.act("player",body["action"],body.get("target"),body.get("message"))
                elif self.path == "/api/time":
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
                elif self.path == "/api/llm/connect":
                    from lm_studio import setup_brains
                    result = setup_brains(world, body.get("model"), body.get("base_url"),
                                          body.get("provider"), body.get("api_key"))
                else:
                    self.close_connection = True
                    return self.reply(404,{"error":"Not found"})
                self.reply(200,{"result":result})
            except (ValueError,TypeError) as error:
                self.reply(400,{"error":str(error)})
            except OSError:
                self.reply(503,{"error":"Saving failed. Your action was not committed. Please retry."})

    class ReusableServer(ThreadingHTTPServer):
        allow_reuse_address = True
        daemon_threads = True

        def server_bind(self):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            if hasattr(socket, "SO_REUSEPORT"):
                try:
                    self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
                except OSError:
                    pass
            super().server_bind()

    return ReusableServer((host,port),Handler)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--save",type=Path,default=Path("data/world.json"))
    parser.add_argument("--tick-seconds",type=positive_seconds,default=None,help="Real seconds per simulated hour")
    parser.add_argument("--port",type=int,default=8000)
    parser.add_argument("--headless",action="store_true",help="Run the same physical world without HTTP")
    parser.add_argument("--ai-model", default=os.environ.get("WILLOW_AI_MODEL", ""), help="LM Studio model identifier; omit for fast in-character simulation")
    parser.add_argument("--morning", action="store_true", help="Start or advance immediately to morning (08:00)")
    parser.add_argument("--fast", action="store_true", help="Fast simulation mode (5s per simulated hour)")
    args = parser.parse_args()
    tick_seconds = args.tick_seconds
    if tick_seconds is None:
        tick_seconds = 5.0 if args.fast else HOUR_SECONDS
    stop = threading.Event()
    for sig in (signal.SIGINT,signal.SIGTERM):
        signal.signal(sig,lambda *_:stop.set())
    is_new = not args.save.exists()

    world = World(args.save)
    from population import expand_population
    expand_population(world)
    if not args.headless:
        from lm_studio import setup_brains
        llm_info = setup_brains(world, args.ai_model or None)
        if llm_info["connected"]:
            print(f"✓ {llm_info.get('provider', 'AI').title()} connected: {llm_info['model']} ({llm_info['base_url']}) — Full AI reasoning enabled", flush=True)
        else:
            print(f"○ No AI provider connected — Citizen AI replies disabled until OpenAI is configured or a local LLM starts", flush=True)

    world.start()
    current_tick = world._state["clock"]["tick"]
    current_hour = current_tick % 24
    if args.morning or (not args.headless and (is_new or current_hour >= 22 or current_hour < 7)):
        target_tick = ((current_tick // 24) + (1 if current_hour >= 8 else 0)) * 24 + 8
        advance_ticks = target_tick - current_tick
        if advance_ticks > 0:
            world.advance(advance_ticks)
    world.sync_citizen_movements()
    server = None
    if not args.headless:
        server = make_server(world,port=args.port)
        threading.Thread(target=server.serve_forever,daemon=True).start()
        print(f"Willow town: http://127.0.0.1:{server.server_port}  |  save: {args.save}",flush=True)
    else:
        print(f"World loaded at tick {world.snapshot()['clock']['tick']}; save: {args.save}",flush=True)
    previous = time.monotonic()
    accumulator = 0.0
    try:
        while not stop.wait(0.01):
            now = time.monotonic()
            accumulator += min(now-previous,0.25)
            previous = now
            while accumulator >= 0.05 and not stop.is_set():
                world.step(0.05,clock_speed=HOUR_SECONDS/tick_seconds)
                accumulator -= 0.05
    except OSError as error:
        print(f"Simulation stopped because saving failed: {error}",file=sys.stderr,flush=True)
        raise
    finally:
        if world._scheduler:
            world._scheduler.close()
        if server:
            server.shutdown()
            server.server_close()
        world.save()


if __name__ == "__main__":
    main()
