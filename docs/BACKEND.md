Backend Technical Design Document
Quantum Pen Flip Predictor

Document Type: Backend Architecture & Technical Specification
Version: 1.0
Backend Stack: Python + FastAPI + OpenCV + MediaPipe + NumPy + SQLite

1. Backend Purpose

The backend is responsible for receiving uploaded pen-spinning videos, processing them frame-by-frame using computer vision, calculating performance metrics, storing the analysis results, and providing those results to the web frontend through a REST API.

The system's core outputs are:

RPM
Finger / Rotation Center Accuracy
Wobble / Spin Stability
Bounding-box kinetics
Trajectory data
Tracking confidence
Analysis status

The original PRD defines high-frame-rate video processing, HSV-based marker detection, frame-based angular velocity, trajectory visualization, occlusion handling, and tracking-failure handling.

2. Architecture

The application follows a simple client-server architecture.

                    USER
                      │
                      ▼
             ┌─────────────────┐
             │   React Web App │
             └────────┬────────┘
                      │
                  REST API
                      │
                      ▼
             ┌─────────────────┐
             │     FastAPI     │
             │   Backend API   │
             └────────┬────────┘
                      │
              ┌───────┴────────┐
              │                │
              ▼                ▼
       ┌─────────────┐   ┌─────────────┐
       │  Analysis   │   │   SQLite    │
       │   Engine    │   │  Database   │
       └──────┬──────┘   └─────────────┘
              │
      ┌───────┼─────────┐
      ▼       ▼         ▼
    OpenCV  MediaPipe  NumPy
      │
      ▼
 Video Processing
      │
      ▼
 Analysis Results
Responsibilities

Frontend

Video upload
Analysis progress
Results visualization
Trajectory visualization
Analysis replay

FastAPI

Upload handling
Analysis lifecycle
API communication
Validation
Result delivery

Analysis Engine

Video decoding
Pen detection
Finger/rotation-center detection
Tracking
Kinematic calculations
RPM calculation
Wobble calculation

SQLite

Analysis metadata
Processing status
Final metrics
File references

Filesystem

Uploaded videos
Trajectory data
Optional processed overlay video
3. Technology Stack
Component	Technology
Language	Python 3.x
API Framework	FastAPI
Computer Vision	OpenCV
Hand / Finger Detection	MediaPipe Hands
Numerical Processing	NumPy
Database	SQLite
ORM	SQLAlchemy
Data Validation	Pydantic
Video Processing	OpenCV
API Documentation	FastAPI / OpenAPI
Storage	Local filesystem
Why this stack

Python is used because the core product is fundamentally a computer-vision and numerical-analysis application.

FastAPI provides a lightweight REST layer between the web frontend and processing engine.

OpenCV handles video and frame processing, MediaPipe provides hand/finger landmarks, and NumPy handles numerical calculations.

SQLite is sufficient for the initial application because the system does not require multi-user enterprise-scale persistence.

4. Backend Scope

The backend will:

Accept uploaded videos.
Validate video files.
Read FPS and video metadata.
Process video frames.
Detect the pen.
Detect the finger/rotation center.
Track the pen.
Calculate position, velocity, and acceleration.
Calculate RPM.
Calculate center accuracy.
Calculate wobble.
Generate trajectory data.
Track processing progress.
Handle temporary occlusion.
Detect complete tracking failure.
Store analysis results.
Return results through an API.

The backend will not initially:

Provide user authentication.
Manage user profiles.
Record video from the camera.
Provide social features.
Provide subscriptions.
Use microservices.
Require cloud storage.
Require Redis/Kafka.
Provide real-time multi-user processing.

This keeps the implementation aligned with the current product scope: upload a video, analyze it, and present the results.

5. High-Level Processing Pipeline
Video Upload
     │
     ▼
File Validation
     │
     ▼
Video Metadata Extraction
     │
     ▼
Frame Extraction
     │
     ▼
Pen Detection
     │
     ▼
Finger / Rotation Center Detection
     │
     ▼
Frame-by-Frame Tracking
     │
     ▼
Trajectory Generation
     │
     ├──────────────┬───────────────┬──────────────┐
     ▼              ▼               ▼              ▼
   RPM        Center Accuracy     Wobble       Kinetics
     │              │               │              │
     └──────────────┴───────────────┴──────────────┘
                           │
                           ▼
                   Result Aggregation
                           │
                           ▼
                    Save Analysis
                           │
                           ▼
                    API Response
6. Video Upload
Endpoint
POST /api/analyses
Request

Multipart form-data:

video: <video file>
Supported input

Recommended:

120 FPS
240 FPS

The original PRD specifically requires high-frame-rate video processing and identifies 120/240 FPS as target input.

Response
{
  "analysis_id": "a8f31c",
  "status": "queued"
}

The frontend uses the returned analysis_id for all subsequent requests.

7. Video Validation

When the file is uploaded, the backend validates:

File-level validation
File exists.
File is readable.
File extension is supported.
File size is within configured limits.
Video-level validation
FPS can be determined.
At least one valid frame can be decoded.
Width and height are valid.
Duration is greater than zero.
Recommended validation warning

If FPS is lower than the recommended range:

{
  "warning": "Low frame rate detected",
  "fps": 30,
  "recommended_fps": 120
}

The backend should warn rather than automatically reject unless the implementation explicitly requires high FPS.

8. Analysis Lifecycle

Each analysis has a state.

QUEUED
   ↓
PROCESSING
   ↓
COMPLETED

Failure path:

QUEUED
   ↓
PROCESSING
   ↓
FAILED

Tracking-specific failure:

PROCESSING
   ↓
TRACKING_LOST
Status values
queued
processing
completed
failed
tracking_lost
9. Progress Tracking

The backend should expose processing progress.

Endpoint
GET /api/analyses/{analysis_id}/status
Response
{
  "analysis_id": "a8f31c",
  "status": "processing",
  "progress": 64,
  "current_frame": 15360,
  "total_frames": 24000
}

The frontend can use this to display:

Analyzing video... 64%

10. Pen Detection

The first computer-vision stage detects the pen.

The existing PRD specifies HSV color thresholding for tracking a highly saturated neon marker on the pen.

Processing
Frame
 ↓
Convert BGR → HSV
 ↓
Color Threshold
 ↓
Mask
 ↓
Noise Removal
 ↓
Contour Detection
 ↓
Candidate Selection
 ↓
Pen Bounding Box
Bounding box

For each frame:

$$ B_i=(x_i,y_i,w_i,h_i) $$

where:

\(x_i\) = x position
\(y_i\) = y position
\(w_i\) = width
\(h_i\) = height
11. Pen Center

The system calculates the center of the bounding box:

$$ x_p=x_i+\frac{w_i}{2} $$ $$ y_p=y_i+\frac{h_i}{2} $$

Therefore:

$$ P_i=(x_p,y_p) $$

This point becomes the primary tracked pen coordinate.

12. Finger / Rotation Center

The system identifies a reference point on the finger using hand landmarks.

Recommended implementation:

MediaPipe Hands
       ↓
Hand Landmarks
       ↓
Relevant Finger Landmark(s)
       ↓
Rotation Center

The result is:

$$ C=(x_c,y_c) $$

This center is used as the reference point for RPM, center positioning, and wobble calculations.

Important implementation note

The original PRD establishes the need for a finger/rotation reference, but it does not specify which exact MediaPipe landmark or geometric rule should define the center. Therefore, this is an implementation decision rather than a source-defined requirement.

13. Frame Tracking

For each frame, the backend records:

{
  "frame": 120,
  "timestamp": 0.5,
  "x": 412,
  "y": 263,
  "width": 84,
  "height": 18,
  "center_x": 454,
  "center_y": 272,
  "tracking_confidence": 0.98
}

This data forms the basis for all subsequent metrics.

14. Bounding-Box Kinetics

The backend calculates motion characteristics from consecutive frames.

Position
$$ P_i=(x_i,y_i) $$
Velocity
$$ v_i=\frac{P_i-P_{i-1}}{\Delta t} $$
Acceleration
$$ a_i=\frac{v_i-v_{i-1}}{\Delta t} $$

The system can derive:

Average velocity
Maximum velocity
Average acceleration
Peak acceleration

These are supporting metrics rather than the primary user-facing measurements.

15. RPM Calculation

For each frame, determine the angle of the pen relative to the rotation center:

$$ \theta_i = \operatorname{atan2}(y_i-y_c,\;x_i-x_c) $$

Calculate angular displacement:

$$ \Delta\theta=\theta_i-\theta_{i-1} $$

Angle wrapping must be handled so that transitions such as:

$$ 359^\circ\rightarrow0^\circ $$

are treated as a \(1^\circ\) change instead of a \(-359^\circ\) change.

Angular velocity:

$$ \omega=\frac{\Delta\theta}{\Delta t} $$

RPM:

$$ \boxed{ RPM=\frac{\omega}{2\pi}\times60 } $$

The original PRD specifically requires angular velocity to be calculated from frame-by-frame coordinate tracking rather than relying on real-time system clocks.

16. Center Accuracy

For each frame, calculate the distance between the tracked pen point and the rotation center:

$$ D_i= \sqrt{ (x_i-x_c)^2+(y_i-y_c)^2 } $$

Average radius:

$$ \bar r= \frac{1}{N} \sum_{i=1}^{N}D_i $$

The normalized accuracy score can be calculated using an allowed tolerance \(D_{max}\):

$$ Accuracy= \max \left( 0, 1-\frac{D}{D_{max}} \right)\times100 $$
Important distinction

For implementation, the exact definition of "correct finger position" must be fixed during calibration or configuration. The PRD does not specify the numerical tolerance.

Therefore the backend should make D_max configurable rather than hard-code an arbitrary value.

17. Wobble Calculation

For every tracked frame:

$$ r_i= \sqrt{ (x_i-x_c)^2+ (y_i-y_c)^2 } $$

Average radius:

$$ \bar r= \frac{1}{N} \sum_{i=1}^{N}r_i $$

RMS wobble:

$$ \boxed{ W= \sqrt{ \frac{1}{N} \sum_{i=1}^{N} (r_i-\bar r)^2 } } $$

Normalized wobble:

$$ \boxed{ Wobble\%= \frac{W}{\bar r}\times100 } $$

Lower values indicate a more stable rotational path.

The trajectory itself should also be retained because the original PRD requires a coordinate trail to visually verify gyroscopic stability.

18. Tracking Confidence

Every frame should have a confidence value.

Example:

0.0 → No reliable detection
1.0 → Strong detection

The overall tracking confidence can be calculated as:

$$ Confidence = \frac{\sum c_i}{N}\times100 $$

where \(c_i\) is the tracking confidence for each valid frame.

This distinguishes poor technique from poor video quality or failed detection.

19. Occlusion Handling

The original PRD requires the system to bridge temporary occlusion when the user's fingers block the tracking marker.

Recommended flow:

Marker detected
      ↓
Normal tracking
      ↓
Marker temporarily lost
      ↓
Short-term prediction / interpolation
      ↓
Marker detected again
      ↓
Resume normal tracking

Each interpolated frame should be marked:

{
  "frame": 842,
  "tracking_state": "estimated"
}

This prevents estimated coordinates from being confused with directly detected coordinates.

20. Complete Tracking Failure

If the system cannot recover tracking after the configured threshold:

tracking_state = lost

The analysis should terminate safely.

Example:

{
  "analysis_id": "a8f31c",
  "status": "tracking_lost",
  "failure_reason": "Pen could not be detected"
}

The original PRD calls for a visible failure alert when complete tracking failure occurs.

21. Result Aggregation

At the end of processing, the backend generates a single analysis result.

{
  "rpm": 742.4,
  "center_accuracy": 94.2,
  "wobble_percent": 3.8,
  "average_velocity": 2.4,
  "peak_velocity": 4.8,
  "average_acceleration": 5.1,
  "peak_acceleration": 8.1,
  "tracking_confidence": 97.0,
  "rotations": 12
}
22. Overall Technique Score

An optional aggregate score can be generated from the three primary metrics:

Speed
Control
Stability
       ↓
Overall Technique Score

For example:

$$ Score= w_1S_{RPM} +w_2S_{Center} +w_3S_{Stability} $$

where:

$$ w_1+w_2+w_3=1 $$

The weights should be configurable.

This score is a product-layer recommendation, not a metric specified in the original PRD.

23. Results API
Endpoint
GET /api/analyses/{analysis_id}
Completed response
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
24. Trajectory API
Endpoint
GET /api/analyses/{analysis_id}/trajectory

Response:

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

The frontend uses these points to render the trajectory visualization.

25. Database Schema
Table: analyses
Column	Type	Description
id	UUID/String	Unique analysis ID
filename	String	Original filename
video_path	String	Uploaded video path
fps	Float	Video FPS
duration	Float	Video duration
width	Integer	Video width
height	Integer	Video height
total_frames	Integer	Total video frames
status	String	Processing status
progress	Integer	0–100
rpm	Float	Calculated RPM
center_accuracy	Float	Center accuracy %
wobble_percent	Float	Wobble %
avg_velocity	Float	Average velocity
peak_velocity	Float	Peak velocity
avg_acceleration	Float	Average acceleration
peak_acceleration	Float	Peak acceleration
tracking_confidence	Float	Confidence %
rotations	Integer	Number of rotations
failure_reason	String/NULL	Failure information
created_at	DateTime	Analysis creation time
completed_at	DateTime/NULL	Completion time
26. File Storage Structure

The backend should separate uploaded videos from generated analysis files.

storage/
│
├── uploads/
│   └── a8f31c/
│       └── original.mp4
│
└── processed/
    └── a8f31c/
        ├── results.json
        ├── trajectory.json
        └── overlay.mp4
Database vs files

The database should store metadata and summarized results.

Large datasets such as trajectory points should be stored as files.

This avoids filling SQLite with thousands of frame-level coordinate records.

27. Backend Project Structure
backend/
│
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── analyses.py
│   │   └── health.py
│   │
│   ├── services/
│   │   ├── analysis_service.py
│   │   ├── video_service.py
│   │   └── result_service.py
│   │
│   ├── cv/
│   │   ├── pen_detector.py
│   │   ├── hand_detector.py
│   │   ├── tracker.py
│   │   └── trajectory.py
│   │
│   ├── metrics/
│   │   ├── rpm.py
│   │   ├── center_accuracy.py
│   │   ├── wobble.py
│   │   └── kinetics.py
│   │
│   ├── models/
│   │   └── analysis.py
│   │
│   ├── schemas/
│   │   └── analysis.py
│   │
│   ├── database/
│   │   ├── database.py
│   │   └── models.py
│   │
│   └── config.py
│
├── storage/
│   ├── uploads/
│   └── processed/
│
├── tests/
│   ├── test_rpm.py
│   ├── test_wobble.py
│   ├── test_center_accuracy.py
│   └── test_api.py
│
├── requirements.txt
└── README.md
28. API Specification

The initial API should remain small.

Method	Endpoint	Purpose
POST	/api/analyses	Upload video and create analysis
GET	/api/analyses/{id}	Get analysis
GET	/api/analyses/{id}/status	Get processing status
GET	/api/analyses/{id}/trajectory	Get trajectory
GET	/api/analyses/{id}/video	Retrieve processed/replay video
DELETE	/api/analyses/{id}	Delete analysis
GET	/api/health	Backend health check

There is no need for a sprawling API at this stage.

29. Error Handling

The API should return consistent errors.

Invalid file
{
  "error": "INVALID_VIDEO",
  "message": "The uploaded file is not a supported video."
}
Unsupported video
{
  "error": "INVALID_VIDEO_METADATA",
  "message": "Unable to read video metadata."
}
Tracking failure
{
  "error": "TRACKING_LOST",
  "message": "The pen could not be tracked reliably."
}
Processing failure
{
  "error": "ANALYSIS_FAILED",
  "message": "An unexpected error occurred during analysis."
}

The backend should log the actual technical exception internally rather than exposing stack traces to the frontend.

30. Processing Strategy

For the initial implementation:

FastAPI
   │
   ├── Receive upload
   │
   ├── Create database record
   │
   └── Start background analysis
              │
              ▼
        OpenCV processing
              │
              ▼
        Save results
              │
              ▼
       Update database

A lightweight background task is sufficient for the MVP.

For a later production deployment, this can evolve into:

FastAPI
   ↓
Job Queue
   ↓
Analysis Worker
   ↓
Database + Object Storage

Do not add the queue until processing volume actually justifies it.

31. Security and File Handling

The backend should:

Generate its own analysis ID.
Never trust the original filename as a storage path.
Validate file extensions and MIME type.
Restrict upload size.
Store uploaded files outside publicly writable directories.
Sanitize filenames.
Prevent path traversal.
Delete files when an analysis is explicitly deleted.
Avoid exposing internal filesystem paths through the API.

Authentication is intentionally excluded from the current MVP.

32. Frontend-Backend Communication Flow
USER
 │
 │ Upload video
 ▼
React
 │
 │ POST /api/analyses
 ▼
FastAPI
 │
 │ Save video
 │ Create analysis
 ▼
SQLite
 │
 │ Start processing
 ▼
Analysis Engine
 │
 ├── Detect pen
 ├── Detect hand/finger
 ├── Track
 ├── Calculate RPM
 ├── Calculate center accuracy
 ├── Calculate wobble
 └── Generate trajectory
 │
 ▼
SQLite + Processed Files
 │
 │ GET /api/analyses/{id}
 ▼
React
 │
 ▼
RESULTS DASHBOARD
33. Complete Backend Flow
                VIDEO UPLOAD
                      │
                      ▼
              FILE VALIDATION
                      │
                      ▼
              CREATE ANALYSIS
                      │
                      ▼
                   QUEUED
                      │
                      ▼
                 PROCESSING
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
    VIDEO METADATA            FRAME LOOP
                                  │
                                  ▼
                           PEN DETECTION
                                  │
                                  ▼
                       FINGER CENTER DETECTION
                                  │
                                  ▼
                             TRACKING
                                  │
                         ┌────────┴─────────┐
                         ▼                  ▼
                     DETECTED            OCCLUDED
                         │                  │
                         │          ESTIMATE / INTERPOLATE
                         └────────┬─────────┘
                                  ▼
                           TRAJECTORY DATA
                                  │
             ┌────────────────────┼───────────────────┐
             ▼                    ▼                   ▼
            RPM             CENTER ACCURACY         WOBBLE
             │                    │                   │
             └────────────────────┼───────────────────┘
                                  ▼
                            KINETIC DATA
                                  │
                                  ▼
                          RESULT AGGREGATION
                                  │
                                  ▼
                            SAVE RESULTS
                                  │
                                  ▼
                             COMPLETED
                                  │
                                  ▼
                           RESULTS API
                                  │
                                  ▼
                         WEB DASHBOARD
34. MVP Definition

The first working backend should contain only these capabilities:

Required

1. Video upload

2. Video validation

3. Pen detection

4. Finger/rotation-center detection

5. Frame-by-frame tracking

6. RPM calculation

7. Center accuracy calculation

8. Wobble calculation

9. Trajectory generation

10. Results API

11. SQLite analysis history

12. Processing status

Secondary
Velocity
Acceleration
Tracking confidence
Overlay video
Overall technique score
Performance timeline
Not required for MVP
Authentication
Cloud storage
Redis
Kubernetes
Microservices
Real-time camera streaming
Mobile application
Social features
35. Final Backend Architecture
┌───────────────────────────────────────────────────────────┐
│                      REACT FRONTEND                       │
│                                                           │
│ Upload → Progress → Analysis → Results → Replay          │
└──────────────────────────┬────────────────────────────────┘
                           │
                       REST / JSON
                           │
┌──────────────────────────▼────────────────────────────────┐
│                         FASTAPI                           │
│                                                           │
│ Upload API │ Status API │ Results API │ Trajectory API    │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────┐
│                    ANALYSIS SERVICE                        │
│                                                           │
│ OpenCV │ MediaPipe │ NumPy │ Tracking │ Metrics           │
└──────────────────────────┬────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       ┌──────────────┐          ┌──────────────┐
       │    SQLite    │          │   Filesystem │
       │              │          │              │
       │ Metadata     │          │ Videos       │
       │ Metrics      │          │ Trajectory   │
       │ Status       │          │ Overlay      │
       └──────────────┘          └──────────────┘
Backend principle

The backend should have one clear responsibility:

Turn an uploaded pen-spinning video into trustworthy, structured motion-analysis data.

Everything else exists to support that pipeline.

The most important implementation distinction is that the API manages the analysis, while the computer-vision engine performs the analysis. The database remembers what happened, and the filesystem holds the heavier artifacts. Keeping those responsibilities separate will make the project much easier to develop, debug, and demonstrate.