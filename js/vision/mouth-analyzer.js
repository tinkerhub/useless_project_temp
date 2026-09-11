/**
 * Useless 3.0 - Mouth Analyzer
 * Calculates normalized Mouth Aspect Ratio (MAR) and rolling temporal variance.
 * Distinguishes sustained talking from resting silence or single-frame twitches.
 */
export class MouthAnalyzer {
  constructor(windowSize = 15) {
    this.windowSize = windowSize; // Rolling buffer (~500ms at 30fps)
    this.marHistory = [];
    this.activityScore = 0; // 0 to 100%
    this.varianceThreshold = 0.015; // Sustained movement threshold
  }

  reset() {
    this.marHistory = [];
    this.activityScore = 0;
  }

  /**
   * Calculate MAR from facial landmarks.
   * Works with standard MediaPipe FaceMesh 468 landmark indices or generic normalized coords:
   * Top Lip: 13, Bottom Lip: 14, Left Corner: 61, Right Corner: 291
   */
  calculateMAR(landmarks) {
    if (!landmarks || landmarks.length < 300) {
      return 0;
    }

    const topLip = landmarks[13];
    const bottomLip = landmarks[14];
    const leftCorner = landmarks[61];
    const rightCorner = landmarks[291];

    if (!topLip || !bottomLip || !leftCorner || !rightCorner) {
      return 0;
    }

    // Euclidean distances
    const vDist = Math.hypot(topLip.x - bottomLip.x, topLip.y - bottomLip.y);
    const hDist = Math.hypot(leftCorner.x - rightCorner.x, leftCorner.y - rightCorner.y);

    if (hDist === 0) return 0;

    return vDist / hDist;
  }

  /**
   * Process current frame's MAR and return activity analysis
   */
  processFrame(mar) {
    this.marHistory.push(mar);
    if (this.marHistory.length > this.windowSize) {
      this.marHistory.shift();
    }

    if (this.marHistory.length < 5) {
      return { isMoving: false, activity: 0, mar };
    }

    // Compute variance in MAR over the buffer
    const mean = this.marHistory.reduce((a, b) => a + b, 0) / this.marHistory.length;
    const variance = this.marHistory.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.marHistory.length;
    const stdDev = Math.sqrt(variance);

    // Compute normalized activity percentage (0 - 100%)
    // Normalized against typical conversational speech variance (~0.015 - 0.05)
    this.activityScore = Math.min(100, Math.round((stdDev / 0.035) * 100));

    const isMoving = stdDev >= this.varianceThreshold;

    return {
      isMoving,
      activity: this.activityScore,
      mar: Math.round(mar * 100) / 100
    };
  }
}
