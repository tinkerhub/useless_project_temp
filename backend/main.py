from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import os
import uuid
import shutil

from .tracker import analyze_video


app = FastAPI(
    title="ANTRA",
    description="Strava for Ants 🐜",
    version="0.1.0"
)


UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(
    video: UploadFile = File(...)
):
    allowed_types = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm"
    ]

    if video.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a video file."
        )

    extension = os.path.splitext(video.filename)[1]
    filename = f"{uuid.uuid4()}{extension}"
    video_path = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save video: {str(e)}"
        )

    try:
        statistics = analyze_video(video_path)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )
    finally:
        if os.path.exists(video_path):
            os.remove(video_path)

    return statistics


# Serve frontend — must come after API routes
app.mount("/", StaticFiles(directory="static", html=True), name="static")