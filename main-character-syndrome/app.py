from __future__ import annotations

import os
import random
import time
from pathlib import Path

from flask import Flask, jsonify, redirect, render_template, request, session
from dotenv import load_dotenv

from activity_detection.detector import ActivityDetector
from situation_engine.context_analyzer import ContextAnalyzer
from situation_engine.event_detector import EventDetector
from situation_engine.interaction_detector import InteractionDetector
from situation_engine.music_director import MusicDirector
from situation_engine.scene_manager import SceneManager
from situation_engine.situation_classifier import SituationClassifier
from spotify.auth import SpotifyAuth
from spotify.spotify_service import SpotifyService

load_dotenv(Path(__file__).resolve().parent / ".env")

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")
scene_manager = SceneManager()
spotify_auth = SpotifyAuth()
spotify_service = SpotifyService()


def build_response(payload: dict | None = None, demo_scenario: str | None = None):
    payload = payload or {}
    scenario_name = demo_scenario or payload.get("scenario")

    if scenario_name:
        activity = {"name": scenario_name, "confidence": 0.96}
        event = {
            "name": "rapid_movement" if "chase" in scenario_name else "dramatic_freeze" if "freeze" in scenario_name else "sudden_movement",
            "confidence": 0.92,
            "duration": 1.6,
        }
        context = {
            "movement_speed": 0.9,
            "movement_intensity": 0.92,
            "posture": "upright",
            "activity_duration": 4.2,
            "head_stability": 0.8,
            "sudden_velocity_change": 0.78,
            "time_context": "evening",
        }
        interaction = {"people_count": 1, "interaction": None, "experimental": True}
        universe = payload.get("universe", "Indian Cinema")
        situation = SituationClassifier().classify(
            activity=activity,
            context=context,
            event=event,
            interaction=interaction,
            universe=universe,
            scenario_name=scenario_name,
        )
        music = MusicDirector().decide_category(situation, context)
        narration = situation.get("narration", "The scene has become dramatically unnecessary.")
        return {
            "person_detected": True,
            "activity": activity,
            "event": event,
            "interaction": interaction,
            "context": context,
            "situation": situation,
            "music": music,
            "narration": narration,
        }

    activity = ActivityDetector().detect(payload)
    context = ContextAnalyzer().analyze(payload, activity)
    event = EventDetector().detect(activity, context)
    interaction = InteractionDetector().detect(payload)
    situation = SituationClassifier().classify(activity, context, event, interaction, payload.get("universe", "Indian Cinema"))
    music = MusicDirector().decide_category(situation, context)
    narration = situation.get("narration", "The protagonist has entered the scene. Nobody asked for this level of drama.")

    return {
        "person_detected": bool(payload.get("landmarks")) or True,
        "activity": activity,
        "event": event,
        "interaction": interaction,
        "context": context,
        "situation": situation,
        "music": music,
        "narration": narration,
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/login")
def login():
    try:
        authorize_url = spotify_auth.build_authorize_url()
        return redirect(authorize_url)
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@app.route("/callback")
def callback():
    code = request.args.get("code")
    error = request.args.get("error")
    if error:
        return jsonify({"success": False, "error": error}), 400

    if not code:
        return jsonify({"success": False, "error": "Authorization code missing"}), 400

    token_result = spotify_auth.exchange_code_for_token(code)
    if not token_result.get("success"):
        return jsonify(token_result), 400

    return redirect("/")


@app.route("/logout")
def logout():
    session.pop("spotify_access_token", None)
    session.pop("spotify_refresh_token", None)
    session.pop("spotify_token_expires_at", None)
    session.pop("spotify_authenticated", None)
    session.pop("spotify_device_id", None)
    return redirect("/")


@app.route("/api/spotify/token")
def spotify_token():
    if not spotify_service.is_authenticated():
        return jsonify({"success": False, "error": "Connect Spotify to enable AI Soundtrack"}), 401
    token_result = spotify_service.get_access_token()
    if not token_result.get("success"):
        return jsonify({"success": False, "error": token_result.get("error", "Spotify authentication expired")}), 401
    return jsonify({"success": True, "access_token": token_result["access_token"]})


@app.route("/api/spotify/status")
def spotify_status():
    return jsonify({
        "authenticated": spotify_service.is_authenticated(),
        "device_id": session.get("spotify_device_id"),
        "player_ready": bool(session.get("spotify_device_id")),
    })


@app.route("/api/spotify/device", methods=["POST"])
def spotify_device():
    payload = request.get_json(silent=True) or {}
    device_id = payload.get("device_id")
    if not device_id:
        return jsonify({"success": False, "error": "No device ID supplied"}), 400
    session["spotify_device_id"] = device_id
    return jsonify({"success": True, "device_id": device_id})


@app.route("/api/spotify/search", methods=["POST"])
def spotify_search():
    payload = request.get_json(silent=True) or {}
    category = payload.get("category") or "mass_entry"
    universe = payload.get("universe") or "Indian Cinema"
    query = payload.get("query") or spotify_service.build_query(category, universe)
    result = spotify_service.search_tracks(query, limit=10)
    if not result.get("success"):
        fallback = spotify_service.search_tracks(spotify_service.build_fallback_query(category), limit=10)
        if fallback.get("success") and fallback.get("tracks"):
            selected = fallback["tracks"][0]
            return jsonify({"success": True, "track": selected})
        return jsonify({"success": False, "error": result.get("error", "Spotify search failed")}), 400

    tracks = result.get("tracks", [])
    if not tracks:
        return jsonify({"success": False, "error": "No Spotify tracks matched the requested mood"}), 404

    recent = session.get("recently_played_tracks", [])
    candidates = [track for track in tracks if track.get("uri") not in recent]
    selected = random.choice(candidates[:5]) if candidates else random.choice(tracks[:5])
    session["recently_played_tracks"] = [*recent, selected.get("uri")][-5:]
    return jsonify({"success": True, "track": selected})


@app.route("/api/spotify/play", methods=["POST"])
def spotify_play():
    payload = request.get_json(silent=True) or {}
    uri = payload.get("uri")
    device_id = payload.get("device_id") or session.get("spotify_device_id")
    if not uri:
        return jsonify({"success": False, "error": "No Spotify track URI supplied"}), 400
    if not device_id:
        return jsonify({"success": False, "error": "Spotify device is not ready"}), 400

    result = spotify_service.start_playback(device_id, uri)
    if not result.get("success"):
        return jsonify(result), 400
    return jsonify({"success": True, "device_id": device_id, "track": uri})


@app.route("/api/spotify/pause", methods=["POST"])
def spotify_pause():
    result = spotify_service.pause_playback()
    if not result.get("success"):
        return jsonify(result), 400
    return jsonify(result)


@app.route("/api/spotify/next", methods=["POST"])
def spotify_next():
    result = spotify_service.skip_track()
    if not result.get("success"):
        return jsonify(result), 400
    return jsonify(result)


@app.route("/api/detect", methods=["GET", "POST"])
def api_detect():
    payload = request.get_json(silent=True) or {}
    response = build_response(payload)
    return jsonify(response)


@app.route("/api/demo", methods=["POST"])
def api_demo():
    payload = request.get_json(silent=True) or {}
    scenario = payload.get("scenario", "mass_entry")
    response = build_response({"scenario": scenario, "universe": payload.get("universe", "Indian Cinema")}, demo_scenario=scenario)
    return jsonify(response)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
