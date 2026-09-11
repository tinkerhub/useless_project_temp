import type { AnalysisResponse, TrajectoryResponse, TrajectoryPoint } from '../types/analysis';

/**
 * Mock data matching docs/TEAM_SHARED_CONTRACT.md section 7, 10, 14
 */
export const MOCK_ANALYSIS_COMPLETED: AnalysisResponse = {
  analysis_id: 'a8f31c',
  status: 'completed',
  video: {
    fps: 240,
    duration: 2.4,
    total_frames: 576,
    width: 1920,
    height: 1080,
  },
  results: {
    rpm: 742.4,
    center_accuracy: 94.2,
    wobble_percent: 3.8,
    average_velocity: 2.4,
    peak_velocity: 4.8,
    average_acceleration: 5.1,
    peak_acceleration: 8.1,
    tracking_confidence: 97.0,
    rotations: 12,
    overall_score: 87,
  },
  files: {
    trajectory: '/api/analyses/a8f31c/trajectory',
    overlay_video: '/api/analyses/a8f31c/video',
  },
};

/**
 * Generates realistic pen-spinning trajectory points simulating 12 rotations over 576 frames (240 FPS, 2.4s)
 * Around rotation center (960, 540) in a 1920x1080 canvas
 */
export function generateMockTrajectory(totalFrames = 576): TrajectoryResponse {
  const points: TrajectoryPoint[] = [];
  const centerX = 960;
  const centerY = 540;
  const radius = 220; // pixels
  const rotations = 12;
  const totalAngle = rotations * 2 * Math.PI;

  for (let i = 1; i <= totalFrames; i++) {
    const progress = i / totalFrames;
    const currentAngle = progress * totalAngle;
    
    // Controlled sinusoidal wobble mimicking pen wobble
    const wobbleNoise = Math.sin(currentAngle * 3.7) * 8.4 + Math.cos(currentAngle * 2.1) * 4.2;
    const currentRadius = radius + wobbleNoise;
    
    // Slight center drift
    const centerDriftX = Math.sin(progress * Math.PI * 2) * 12;
    const centerDriftY = Math.cos(progress * Math.PI * 2) * 10;
    
    const penCenterX = centerX + centerDriftX + currentRadius * Math.cos(currentAngle);
    const penCenterY = centerY + centerDriftY + currentRadius * Math.sin(currentAngle);
    
    // Simulated temporary occlusion around frames 230-245 (finger cross)
    const isOccluded = i >= 230 && i <= 245;

    points.push({
      frame: i,
      x: Math.round(penCenterX - 45), // bounding box top-left x
      y: Math.round(penCenterY - 12), // bounding box top-left y
      width: 90,
      height: 24,
      center_x: Math.round(penCenterX),
      center_y: Math.round(penCenterY),
      confidence: isOccluded ? 0.42 : 0.98,
      tracking_state: isOccluded ? 'estimated' : 'detected',
    });
  }

  return {
    points,
    rotation_center: {
      x: centerX,
      y: centerY,
    },
  };
}

export const MOCK_TRAJECTORY: TrajectoryResponse = generateMockTrajectory(576);
