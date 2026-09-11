/**
 * Useless 3.0 - Camera Manager
 * Manages video stream lifecycle, permissions, and cleanup.
 * Strictly video-only (no microphone permission requested).
 */
export class CameraManager {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.isActive = false;
    this.onStateChange = null;

    // Handle tab visibility to reduce CPU/GPU load
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isActive) {
        this.pause();
      } else if (!document.hidden && this.isActive) {
        this.resume();
      }
    });
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("UNSUPPORTED_BROWSER");
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false // STRICTLY FALSE: Mouth tracking is purely visual
      });

      this.video.srcObject = this.stream;
      await this.video.play();
      this.isActive = true;
      return true;
    } catch (err) {
      this.isActive = false;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error("PERMISSION_DENIED");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error("NO_CAMERA_FOUND");
      } else {
        throw new Error(err.message || "CAMERA_ERROR");
      }
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.isActive = false;
  }

  pause() {
    if (this.video) {
      this.video.pause();
    }
  }

  resume() {
    if (this.video && this.isActive) {
      this.video.play().catch(() => {});
    }
  }
}
