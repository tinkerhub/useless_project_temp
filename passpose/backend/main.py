import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .auth_service import create_password, authenticate

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@app.get("/")
def home():
    index_path = os.path.join(BASE_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Welcome to PassPose!"}

@app.get("/style.css")
def get_style():
    style_path = os.path.join(BASE_DIR, "style.css")
    if os.path.exists(style_path):
        return FileResponse(style_path, media_type="text/css")
    return {"error": "style.css not found"}

@app.get("/script.js")
def get_script():
    script_path = os.path.join(BASE_DIR, "script.js")
    if os.path.exists(script_path):
        return FileResponse(script_path, media_type="application/javascript")
    return {"error": "script.js not found"}

app.mount("/static", StaticFiles(directory=BASE_DIR), name="static")


class PasswordSequence(BaseModel):
    email: str | None = None
    sequence: list[str]


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }


@app.post("/password/create")
def create_password_endpoint(data: PasswordSequence):
    if not data.sequence:
        return {
            "success": False,
            "message": "Password sequence cannot be empty."
        }

    success = create_password(data.sequence, email=data.email)

    if success:
        return {
            "success": True,
            "message": "Password created successfully!"
        }

    return {
        "success": False,
        "message": "Could not create password."
    }


@app.post("/password/verify")
def verify_password_endpoint(data: PasswordSequence):
    if not data.sequence:
        return {
            "authenticated": False,
            "message": "Password sequence cannot be empty."
        }

    authenticated = authenticate(data.sequence, email=data.email)

    if authenticated:
        return {
            "authenticated": True,
            "message": "ACCESS GRANTED!"
        }

    return {
        "authenticated": False,
        "message": "ACCESS DENIED!"
    }