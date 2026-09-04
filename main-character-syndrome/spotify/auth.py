import base64
import os
from pathlib import Path
from urllib.parse import urlencode

import requests
from dotenv import load_dotenv
from flask import session

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class SpotifyAuth:
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        self.redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:5000/callback")

    def build_authorize_url(self):
        if not self.client_id:
            raise ValueError("Spotify client ID is missing")

        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "scope": " ".join([
                "streaming",
                "user-read-email",
                "user-read-private",
                "user-modify-playback-state",
                "user-read-playback-state",
            ]),
            "show_dialog": "false",
        }
        return f"https://accounts.spotify.com/authorize?{urlencode(params)}"

    def exchange_code_for_token(self, code):
        if not self.client_id or not self.client_secret:
            return {"success": False, "error": "Spotify credentials are not configured"}

        auth_header = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode("utf-8")).decode("ascii")
        response = requests.post(
            "https://accounts.spotify.com/api/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": self.redirect_uri,
            },
            headers={
                "Authorization": f"Basic {auth_header}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout=20,
        )

        if response.status_code != 200:
            payload = response.json() if response.content else {}
            return {"success": False, "error": payload.get("error_description") or "Spotify token exchange failed"}

        data = response.json()
        session["spotify_access_token"] = data.get("access_token")
        session["spotify_refresh_token"] = data.get("refresh_token")
        session["spotify_token_expires_at"] = data.get("expires_in", 3600) + __import__("time").time()
        session["spotify_authenticated"] = True

        return {"success": True, "access_token": data.get("access_token")}
