# Quantum Pen Flip Predictor
# Team Shared Contract

**Document Type:** Team Collaboration & Integration Contract  
**Purpose:** Shared source of truth for the two-person development team and Antigravity agents.

---

## 1. Purpose of This Document

This document defines the parts of the project that both team members and both Antigravity agents must agree on before implementing the application.

The project has two main ownership areas:

- **Frontend:** web interface, user flow, visualization, and API integration.
- **Backend/CV:** API, video processing, computer vision, tracking, metrics, database, and analysis results.

The purpose of this contract is to prevent both sides from independently changing endpoint names, response fields, metric terminology, or other integration details.

---

# 2. Shared Source of Truth

The project documentation is organized as follows:

```text
docs/
│
├── PRD.md
├── APP_FLOW.md
├── FRONTEND_GUIDELINES.md
└── BACKEND.md
```

Each document has a specific role.

| Document | Frontend | Backend/CV | Purpose |
|---|---|---|---|
| `PRD.md` | Read fully | Read fully | Product requirements and metrics |
| `APP_FLOW.md` | Primary | Read | User journey and application states |
| `FRONTEND_GUIDELINES.md` | Primary | Read as needed | UI, layout, visual system |
| `BACKEND.md` | API sections | Primary | Backend architecture, CV, database, API |
| `TEAM_SHARED_CONTRACT.md` | Read fully | Read fully | Integration rules and shared contracts |

All agents must read the relevant project documentation before making major changes.

---

# 3. Team Ownership

## 3.1 Frontend Owner

The frontend owner is responsible for:

- React application
- TypeScript code
- Upload interface
- Analysis interface
- Results dashboard
- HUD and telemetry presentation
- Charts and trajectory visualization
- Replay interface
- Loading and progress states
- Error presentation
- REST API client/integration

The frontend owner must not independently redesign or modify backend architecture.

## 3.2 Backend / Computer Vision Owner

The backend owner is responsible for:

- FastAPI
- Video upload handling
- Video validation
- OpenCV processing
- MediaPipe hand/finger detection
- Pen detection
- Bounding-box tracking
- Frame-by-frame tracking
- RPM calculation
- Center accuracy calculation
- Wobble calculation
- Kinematic calculations
- Trajectory generation
- SQLite persistence
- Processing status
- Backend error handling

The backend owner must not independently redesign the frontend architecture.

---

# 4. Shared API Contract

The frontend communicates with the backend through REST endpoints.

The initial API is intentionally small.

## 4.1 Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/analyses` | Upload video and create analysis |
| `GET` | `/api/analyses/{id}` | Get complete analysis |
| `GET` | `/api/analyses/{id}/status` | Get processing status |
| `GET` | `/api/analyses/{id}/trajectory` | Get trajectory data |
| `GET` | `/api/analyses/{id}/video` | Retrieve processed/replay video |
| `DELETE` | `/api/analyses/{id}` | Delete an analysis |
| `GET` | `/api/health` | Backend health check |

These endpoint names must not be changed by one side without updating this document and `BACKEND.md` first.

---

# 5. Upload Contract

## Request

```http
POST /api/analyses
Content-Type: multipart/form-data
```

Form field:

```text
video: <video file>
```

## Initial Response

```json
{
  "analysis_id": "a8f31c",
  "status": "queued"
}
```

The frontend stores `analysis_id` and uses it for subsequent status and results requests.

---

# 6. Analysis Status Contract

## Endpoint

```http
GET /api/analyses/{analysis_id}/status
```

## Processing Response

```json
{
  "analysis_id": "a8f31c",
  "status": "processing",
  "progress": 64,
  "current_frame": 15360,
  "total_frames": 24000
}
```

## Allowed Status Values

```text
queued
processing
completed
failed
tracking_lost
```

The frontend must use these canonical values.

The backend must not introduce alternate versions such as `in_progress`, `done`, or `lost` without changing the shared contract first.

---

# 7. Completed Result Contract

## Endpoint

```http
GET /api/analyses/{analysis_id}
```

## Canonical Result Structure

```json
{
  "analysis_id": "a8f31c",
  "status": "completed",
  "video": {
    "fps": 240,
    "duration": 2.4,
    "total_frames": 576
  },
  "results": {
    "rpm": 742.4,
    "center_accuracy": 94.2,
    "wobble_percent": 3.8,
    "average_velocity": 2.4,
    "peak_acceleration": 8.1,
    "tracking_confidence": 97.0,
    "rotations": 12
  },
  "files": {
    "trajectory": "/api/analyses/a8f31c/trajectory",
    "overlay_video": "/api/analyses/a8f31c/video"
  }
}
```

The backend owns calculation of these values. The frontend owns how they are displayed.

---

# 8. Canonical Metric Names

These names must be used consistently in:

- Backend Python code
- API responses
- Frontend TypeScript types
- Database fields
- JSON files
- Charts
- Documentation

| Canonical Name | Meaning |
|---|---|
| `rpm` | Rotational speed in revolutions per minute |
| `center_accuracy` | Accuracy of the pen's rotation relative to the intended rotation center |
| `wobble_percent` | Normalized deviation representing spin instability |
| `average_velocity` | Average tracked pen velocity |
| `peak_velocity` | Maximum tracked pen velocity |
| `average_acceleration` | Average tracked pen acceleration |
| `peak_acceleration` | Maximum tracked pen acceleration |
| `tracking_confidence` | Overall confidence in pen tracking |
| `rotations` | Number of detected complete rotations |

Do not create alternate names such as:

```text
finger_position_score
spin_stability
rotation_speed
tracking_score
```

when the canonical API fields already exist.

---

# 9. Meaning of the Three Primary Metrics

The primary user-facing metrics are:

### RPM

Measures how quickly the pen rotates around the rotation center.

### Center Accuracy

Measures how closely the pen's tracked movement corresponds to the intended finger/rotation center.

### Wobble

Measures deviation from a stable rotational path. Lower wobble indicates a more stable spin.

These are the three main performance outputs defined by the product requirements.

---

# 10. Trajectory Contract

## Endpoint

```http
GET /api/analyses/{analysis_id}/trajectory
```

## Response

```json
{
  "points": [
    {
      "frame": 1,
      "x": 412,
      "y": 260
    },
    {
      "frame": 2,
      "x": 416,
      "y": 257
    },
    {
      "frame": 3,
      "x": 420,
      "y": 254
    }
  ]
}
```

The backend supplies trajectory points.

The frontend is responsible for visualizing them.

The frontend must not invent a second trajectory format without agreement.

---

# 11. API Ownership Rules

### Backend owns

- Endpoint implementation
- Validation
- API response values
- Metric calculations
- Status transitions
- Database state
- Error codes

### Frontend owns

- HTTP requests
- API client functions
- Loading states
- Display formatting
- Charts
- Visual status indicators
- User-facing error messages

Neither side should silently change the contract.

---

# 12. Database Ownership Rules

The backend owns the database schema.

The initial database is SQLite.

The main table is:

```text
analyses
```

Important fields include:

```text
id
filename
video_path
fps
duration
width
height
total_frames
status
progress
rpm
center_accuracy
wobble_percent
avg_velocity
peak_velocity
avg_acceleration
peak_acceleration
tracking_confidence
rotations
failure_reason
created_at
completed_at
```

The frontend must not access SQLite directly.

All database information required by the web application must be exposed through the API.

---

# 13. File Storage Ownership

The backend manages uploaded and processed files.

```text
storage/
│
├── uploads/
│   └── <analysis_id>/
│       └── original.mp4
│
└── processed/
    └── <analysis_id>/
        ├── results.json
        ├── trajectory.json
        └── overlay.mp4
```

The frontend must not depend on internal filesystem paths.

It should use API endpoints returned by the backend.

---

# 14. Frontend Development With Mock Data

The frontend can be developed before the computer-vision engine is complete.

Use the shared response structure as mock data:

```json
{
  "analysis_id": "demo-001",
  "status": "completed",
  "results": {
    "rpm": 742.4,
    "center_accuracy": 94.2,
    "wobble_percent": 3.8,
    "average_velocity": 2.4,
    "peak_acceleration": 8.1,
    "tracking_confidence": 97.0,
    "rotations": 12
  }
}
```

This allows the frontend owner to build the dashboard without waiting for the CV pipeline.

The mock data must follow the same field names and structure as the real API.

---

# 15. Antigravity Instructions: Frontend Agent

Use the following instruction when starting frontend work:

> Read `docs/PRD.md`, `docs/APP_FLOW.md`, `docs/FRONTEND_GUIDELINES.md`, and the API sections of `docs/BACKEND.md` plus `docs/TEAM_SHARED_CONTRACT.md` before modifying code.
>
> Own the frontend only. Build the React/TypeScript interface, upload flow, analysis view, results dashboard, replay interface, charts, trajectory visualization, loading states, and API client integration.
>
> Treat `TEAM_SHARED_CONTRACT.md` as the source of truth for endpoint names, API status values, metric field names, and response structures.
>
> Do not change backend architecture, database schema, endpoint names, API field names, or metric definitions.

---

# 16. Antigravity Instructions: Backend Agent

Use the following instruction when starting backend work:

> Read `docs/PRD.md`, `docs/APP_FLOW.md`, `docs/BACKEND.md`, and `docs/TEAM_SHARED_CONTRACT.md` before modifying code.
>
> Own the backend and computer-vision implementation. Build FastAPI endpoints, video validation, OpenCV processing, MediaPipe hand/finger detection, tracking, RPM, center accuracy, wobble, kinetics, trajectory generation, SQLite persistence, processing status, and backend error handling.
>
> Treat `TEAM_SHARED_CONTRACT.md` as the source of truth for endpoint names, API status values, metric field names, and response structures.
>
> Do not change frontend architecture, UI requirements, endpoint names, API field names, or metric definitions without first updating the shared documentation and informing the frontend owner.

---

# 17. Shared Instructions for Both Agents

Use the following instruction for both Antigravity agents:

> Before implementing a feature, read the relevant documents in `/docs`.
>
> Follow the documented architecture and shared API contract.
>
> Do not rename API endpoints, response fields, database fields, or canonical metric names independently.
>
> Do not silently change the mathematical definition of RPM, center accuracy, or wobble.
>
> If a requirement is unclear or a change is necessary, update the appropriate documentation first and clearly identify the change.
>
> Keep frontend and backend responsibilities separated.
>
> Prefer small, testable changes rather than rewriting unrelated parts of the project.

---

# 18. Change Control

Any change affecting integration must follow this process:

```text
Proposed Change
      ↓
Check Current Documentation
      ↓
Identify Frontend + Backend Impact
      ↓
Update Shared Documentation
      ↓
Update Backend and/or Frontend
      ↓
Test Integration
      ↓
Merge
```

Examples of changes requiring agreement:

- Renaming an API endpoint
- Renaming a JSON field
- Changing an API response shape
- Changing the meaning of a metric
- Changing the processing states
- Changing how trajectory data is represented
- Changing how center accuracy is calculated
- Changing how wobble is calculated

---

# 19. Git Collaboration Rules

Recommended branches:

```text
main
frontend-dev
backend-dev
```

For larger features, use feature branches:

```text
frontend/upload
frontend/results
frontend/hud

backend/upload
backend/tracking
backend/metrics
```

Rules:

1. Do not commit unfinished experimental work directly to `main`.
2. Keep frontend and backend commits focused.
3. Pull/rebase from the latest `main` before major integration work.
4. Test the affected side before opening a merge.
5. Test the full frontend/backend flow before final merge.

---

# 20. Integration Checklist

Before declaring the system integrated, verify:

### Upload

- Video can be uploaded from the web interface.
- `POST /api/analyses` returns an `analysis_id`.

### Processing

- Status changes from `queued` to `processing`.
- Progress is returned correctly.
- Invalid videos return documented errors.

### Analysis

- Pen detection works.
- Finger/rotation center detection works.
- Tracking produces trajectory points.
- RPM is calculated.
- Center accuracy is calculated.
- Wobble is calculated.

### Results

- `GET /api/analyses/{id}` returns the agreed structure.
- Frontend renders the three primary metrics.
- Trajectory endpoint renders correctly.
- Replay video endpoint works if enabled.

### Failure handling

- Failed analysis displays a useful error.
- Tracking failure is represented by `tracking_lost`.
- Temporary occlusion does not immediately terminate the analysis.

---

# 21. Definition of Done

The feature is considered complete only when:

```text
Implementation
      ↓
API Contract Matches
      ↓
Frontend Consumes It
      ↓
Backend Produces It
      ↓
Integration Test Passes
      ↓
Documentation Matches Reality
```

Code that works only on one side of the application is not considered complete.

---

# 22. Final Team Rule

The two development streams are:

```text
FRONTEND
User
 ↓
Web Interface
 ↓
API Client
 ↓
Visualization

BACKEND / CV
Video
 ↓
Computer Vision
 ↓
Tracking
 ↓
Metrics
 ↓
API
```

The REST API is the boundary between them.

**Frontend decides how data is presented.**  
**Backend decides how data is calculated.**  
**The shared contract decides how the two sides communicate.**

Neither side should redefine the contract alone.
