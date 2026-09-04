import base64
import os
import random
import time
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv
from flask import session

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class SpotifyService:
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        self.redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:5000/callback")
        self.base_url = "https://api.spotify.com/v1"

    def is_authenticated(self):
        return bool(session.get("spotify_access_token")) and bool(session.get("spotify_authenticated"))

    def get_access_token(self):
        if not self.is_authenticated():
            return {"success": False, "error": "Spotify user is not authenticated"}

        expires_at = float(session.get("spotify_token_expires_at", 0) or 0)
        if time.time() >= expires_at - 60:
            refresh_result = self.refresh_access_token()
            if not refresh_result.get("success"):
                return refresh_result
        return {"success": True, "access_token": session.get("spotify_access_token")}

    def refresh_access_token(self):
        refresh_token = session.get("spotify_refresh_token")
        if not refresh_token:
            return {"success": False, "error": "Spotify refresh token is missing"}

        if not self.client_id or not self.client_secret:
            return {"success": False, "error": "Spotify credentials are missing"}

        auth_header = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode("utf-8")).decode("ascii")
        response = requests.post(
            "https://accounts.spotify.com/api/token",
            data={"grant_type": "refresh_token", "refresh_token": refresh_token},
            headers={
                "Authorization": f"Basic {auth_header}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout=20,
        )

        if response.status_code != 200:
            payload = response.json() if response.content else {}
            return {"success": False, "error": payload.get("error_description") or "Spotify authentication expired"}

        data = response.json()
        session["spotify_access_token"] = data.get("access_token")
        session["spotify_token_expires_at"] = time.time() + int(data.get("expires_in", 3600))
        session["spotify_authenticated"] = True
        return {"success": True, "access_token": data.get("access_token")}

    def _auth_headers(self):
        token_result = self.get_access_token()
        if not token_result.get("success"):
            return {"success": False, "error": token_result.get("error", "Spotify authentication expired")}
        return {
            "success": True,
            "headers": {"Authorization": f"Bearer {token_result['access_token']}"},
        }

    def search_tracks(self, query, limit=10):
        if not query:
            return {"success": False, "error": "Spotify search query is empty"}

        auth = self._auth_headers()
        if not auth.get("success"):
            return auth

        response = requests.get(
            f"{self.base_url}/search",
            headers=auth["headers"],
            params={"q": query, "type": "track", "limit": min(limit, 10)},
            timeout=20,
        )

        if response.status_code != 200:
            payload = response.json() if response.content else {}
            return {"success": False, "error": payload.get("error", {}).get("message", "Spotify search failed")}

        items = response.json().get("tracks", {}).get("items", [])
        tracks = []
        for item in items:
            if not item or not item.get("uri"):
                continue
            artists = ", ".join(artist.get("name", "") for artist in item.get("artists", []))
            tracks.append({
                "id": item.get("id"),
                "name": item.get("name"),
                "artist": artists,
                "uri": item.get("uri"),
                "image": (item.get("album") or {}).get("images", [{}])[0].get("url"),
            })
        return {"success": True, "tracks": tracks}

    def get_recommended_track(self, category, universe):
        query = self.build_query(category, universe)
        result = self.search_tracks(query, limit=10)
        if not result.get("success"):
            return {"success": False, "error": result.get("error", "Spotify search failed")}

        tracks = result.get("tracks", [])
        if not tracks:
            fallback_result = self.search_tracks(self.build_fallback_query(category), limit=10)
            if not fallback_result.get("success"):
                return fallback_result
            tracks = fallback_result.get("tracks", [])

        if not tracks:
            return {"success": False, "error": "No suitable Spotify tracks found for this mood"}

        recent = session.get("recently_played_tracks", [])
        candidates = [track for track in tracks if track.get("uri") not in recent]
        if not candidates:
            candidates = tracks
        selected = random.choice(candidates[: min(len(candidates), 5)])
        session["recently_played_tracks"] = [*recent, selected.get("uri")][-5:]
        return {"success": True, "track": selected}

    def build_query(self, category, universe):
        base_map = {
            "mass_entry": ["Indian mass hero entry instrumental", "epic Indian cinematic instrumental", "Malayalam cinematic heroic BGM"],
            "hero_entry": ["hero entry cinematic instrumental", "Indian action BGM", "dramatic mass hero theme"],
            "action": ["high energy action soundtrack", "Indian action BGM", "fast cinematic instrumental"],
            "cartoon_chase": ["funny chase cartoon music", "comedy chase soundtrack", "fast funny instrumental"],
            "comedy_thinking": ["funny thinking background music", "confused comedy soundtrack"],
            "comedy_confusion": ["confused funny soundtrack", "comedy reaction music"],
            "dreamy": ["dreamy mellow instrumental", "soft cinematic ambient"],
            "royal": ["royal entry cinematic", "king coronation soundtrack", "Indian royal instrumental"],
            "victory": ["victory cinematic soundtrack", "triumph Indian instrumental"],
            "chaos": ["chaotic funny soundtrack", "crazy fast cinematic music"],
            "dramatic_reveal": ["dramatic reveal cinematic", "shocking plot twist soundtrack"],
            "emotional": ["emotional Indian instrumental", "melancholic movie soundtrack"],
            "horror": ["horror cinematic soundtrack", "creepy thriller instrumental"],
            "mystery": ["mystery thriller soundtrack", "Indian suspense background music"],
            "suspense": ["suspense cinematic soundtrack", "thriller background score"],
        }

        queries = base_map.get(category, [f"{category} cinematic instrumental", "movie background score", "epic instrumental"])
        universe_keywords = {
            "Indian Cinema": ["Indian", "Malayalam", "Tamil", "epic"],
            "Indian Comedy": ["funny Indian", "comedy", "Bollywood", "Malayalam comedy"],
            "College / Campus": ["college funny", "campus chaos", "Bollywood college"],
            "Default Cinematic": ["cinematic", "orchestral"],
            "Anime Protagonist": ["anime epic", "battle soundtrack"],
            "Horror Thriller": ["horror thriller", "creepy"],
            "Meme Mode": ["viral funny", "meme soundtrack"],
        }

        universe_specific = universe_keywords.get(universe, ["cinematic"])
        query_candidates = []
        for query in queries:
            for extra in universe_specific:
                query_candidates.append(f"{query} {extra}")
        return random.choice(query_candidates) if query_candidates else random.choice(queries)

    def build_fallback_query(self, category):
        fallback = {
            "cartoon_chase": "funny fast comedy instrumental",
            "chaos": "crazy chaotic upbeat soundtrack",
            "dreamy": "soft ambient instrumental",
            "royal": "royal orchestral epic",
            "victory": "triumph cinematic instrumental",
        }
        return fallback.get(category, f"{category} cinematic instrumental")

    def start_playback(self, device_id, track_uri):
        if not device_id or not track_uri:
            return {"success": False, "error": "Spotify device or track URI is missing"}

        auth = self._auth_headers()
        if not auth.get("success"):
            return auth

        response = requests.put(
            f"{self.base_url}/me/player/play?device_id={device_id}",
            headers=auth["headers"],
            json={"uris": [track_uri]},
            timeout=20,
        )

        if response.status_code in {200, 204}:
            session["spotify_device_id"] = device_id
            return {"success": True, "status": "playing"}

        payload = response.json() if response.content else {}
        return {"success": False, "error": payload.get("error", {}).get("message", "Spotify playback failed")}

    def pause_playback(self):
        auth = self._auth_headers()
        if not auth.get("success"):
            return auth
        response = requests.put(f"{self.base_url}/me/player/pause", headers=auth["headers"], timeout=20)
        if response.status_code in {200, 204}:
            return {"success": True, "status": "paused"}
        payload = response.json() if response.content else {}
        return {"success": False, "error": payload.get("error", {}).get("message", "Spotify pause failed")}

    def resume_playback(self):
        auth = self._auth_headers()
        if not auth.get("success"):
            return auth
        response = requests.put(f"{self.base_url}/me/player/play", headers=auth["headers"], timeout=20)
        if response.status_code in {200, 204}:
            return {"success": True, "status": "resumed"}
        payload = response.json() if response.content else {}
        return {"success": False, "error": payload.get("error", {}).get("message", "Spotify resume failed")}

    def skip_track(self):
        auth = self._auth_headers()
        if not auth.get("success"):
            return auth
        response = requests.post(f"{self.base_url}/me/player/next", headers=auth["headers"], timeout=20)
        if response.status_code in {200, 204}:
            return {"success": True, "status": "skipped"}
        payload = response.json() if response.content else {}
        return {"success": False, "error": payload.get("error", {}).get("message", "Spotify skip failed")}

    def get_available_devices(self):
        auth = self._auth_headers()
        if not auth.get("success"):
            return auth
        response = requests.get(f"{self.base_url}/me/player/devices", headers=auth["headers"], timeout=20)
        if response.status_code != 200:
            payload = response.json() if response.content else {}
            return {"success": False, "error": payload.get("error", {}).get("message", "Unable to list Spotify devices")}
        devices = response.json().get("devices", [])
        return {"success": True, "devices": devices}

    def get_current_playback(self):
        auth = self._auth_headers()
        if not auth.get("success"):
            return auth
        response = requests.get(f"{self.base_url}/me/player/currently-playing", headers=auth["headers"], timeout=20)
        if response.status_code in {200, 204}:
            if response.status_code == 204:
                return {"success": True, "item": None}
            return {"success": True, "item": response.json()}
        payload = response.json() if response.content else {}
        return {"success": False, "error": payload.get("error", {}).get("message", "Unable to fetch current playback")}
