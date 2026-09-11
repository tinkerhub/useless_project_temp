from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import analyses, health
from app.config import CORS_ORIGINS
from app.database.database import Base, engine

# Create all tables on startup (safe no-op if they already exist)
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Application lifespan: startup and shutdown hooks."""
    yield
    # Shutdown: release MediaPipe resources
    from app.cv.hand_detector import close_detector
    close_detector()


app = FastAPI(
    title="Quantum Pen Flip Predictor — Backend API",
    description=(
        "Computer-vision-powered pen-spin analysis. "
        "Upload a video, receive RPM, center accuracy, and wobble metrics."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health.router)
app.include_router(analyses.router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "Quantum Pen Flip Predictor API",
        "status": "running",
        "docs": "/docs",
        "health": "/api/health",
    }



# ---------------------------------------------------------------------------
# Global exception handler — never expose stack traces to clients
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred. Please try again.",
        },
    )
