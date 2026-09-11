# Quantum Pen Flip Predictor — Backend

FastAPI + OpenCV + MediaPipe + NumPy + SQLite backend for pen-spin video analysis.

## Quick Start

```bash
# 1. Create virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # Linux/macOS

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the API server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

## Running Tests

```bash
pytest tests/ -v
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MAX_UPLOAD_BYTES` | 524288000 (500 MB) | Max video upload size |
| `D_MAX_PIXELS` | 100.0 | Center accuracy tolerance (pixels) |
| `MAX_OCCLUDED_FRAMES` | 30 | Frames before tracking_lost |
| `ROTATION_CENTER_LANDMARK` | 9 | MediaPipe Hand landmark index |
| `MAX_EXPECTED_RPM` | 1200.0 | RPM normalisation ceiling |
| `CORS_ORIGINS` | localhost:3000,localhost:5173 | Allowed CORS origins |

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/analyses` | Upload video, start analysis |
| `GET` | `/api/analyses/{id}/status` | Poll progress |
| `GET` | `/api/analyses/{id}` | Get full results |
| `GET` | `/api/analyses/{id}/trajectory` | Get trajectory points |
| `GET` | `/api/analyses/{id}/video` | Stream original video |
| `DELETE` | `/api/analyses/{id}` | Delete analysis |
| `GET` | `/api/health` | Health check |

## Architecture

```
backend/
├── app/
│   ├── main.py           FastAPI entrypoint
│   ├── config.py         Configuration & tuning constants
│   ├── api/              REST endpoints (analyses, health)
│   ├── services/         Business logic orchestration
│   ├── cv/               Computer vision (pen, hand, tracker, trajectory)
│   ├── metrics/          Pure metric calculations (RPM, wobble, accuracy, kinetics)
│   ├── schemas/          Pydantic request/response models
│   └── database/         SQLAlchemy models & engine
├── storage/
│   ├── uploads/          Uploaded videos (gitignored)
│   └── processed/        Trajectory JSON + overlay videos (gitignored)
└── tests/                pytest test suite
```

## Pen Marker Requirement

For best tracking results, place a clearly visible **neon-coloured** sticker or tape on the pen.
Default detection colour range: **neon green (HSV 35-85°, S>100, V>100)**.
Adjust `PEN_HSV_LOWER` / `PEN_HSV_UPPER` in `config.py` for other colours.
