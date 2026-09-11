/**
 * Canonical Types for Quantum Pen Flip Predictor
 * Based strictly on docs/TEAM_SHARED_CONTRACT.md and docs/BACKEND.md
 */

export type AnalysisStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'tracking_lost';

export interface VideoMetadata {
  fps: number;
  duration: number;
  total_frames: number;
  width?: number;
  height?: number;
}

export interface AnalysisResults {
  rpm: number;
  center_accuracy: number;
  wobble_percent: number;
  average_velocity: number;
  peak_velocity?: number;
  average_acceleration?: number;
  peak_acceleration: number;
  tracking_confidence: number;
  rotations: number;
  overall_score?: number; // Optional technique score if returned by backend
}

export interface AnalysisFiles {
  trajectory: string;
  overlay_video?: string;
}

export interface AnalysisResponse {
  analysis_id: string;
  status: AnalysisStatus;
  video?: VideoMetadata;
  results?: AnalysisResults;
  files?: AnalysisFiles;
  failure_reason?: string;
  error?: string;
  message?: string;
}

export interface StatusResponse {
  analysis_id: string;
  status: AnalysisStatus;
  progress: number; // 0 to 100
  current_frame?: number;
  total_frames?: number;
  failure_reason?: string;
}

export interface TrajectoryPoint {
  frame: number;
  x: number;
  y: number;
  // Optional enriched tracking data if supplied by backend for HUD overlay
  width?: number;
  height?: number;
  center_x?: number;
  center_y?: number;
  confidence?: number;
  tracking_state?: 'detected' | 'estimated' | 'lost';
}

export interface TrajectoryResponse {
  points: TrajectoryPoint[];
  rotation_center?: {
    x: number;
    y: number;
  };
}

export interface VideoFileValidation {
  isValid: boolean;
  file: File;
  name: string;
  sizeMB: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  previewUrl: string;
  checks: {
    videoLoaded: boolean;
    highFpsDetected: boolean;
    resolutionSuitable: boolean;
    durationSuitable: boolean;
  };
}

export type TrackingStatePill =
  | 'TRACKING'
  | 'CALIBRATING'
  | 'OCCLUDED'
  | 'LOW CONFIDENCE'
  | 'TRACKING LOST';
