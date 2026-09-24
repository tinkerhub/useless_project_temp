/**
 * PHASE 7: TRANSMISSION ENGINE
 * High-performance optical playback loop using requestAnimationFrame.
 */
export class Transmitter {
    constructor(qrImages, targetFps = 15) {
        this.qrImages = qrImages;
        this.targetFps = targetFps;
        this.frameDuration = 1000 / targetFps;
        
        this.currentIndex = 0;
        this.isRunning = false;
        
        this.lastFrameTime = 0;
        this.animationFrameId = null;
        
        // FPS calculation variables
        this.actualFramesRendered = 0;
        this.lastFpsCalcTime = 0;
        
        // UI Callbacks
        this.onFrameUpdate = null;
        this.onFpsUpdate = null;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        const now = performance.now();
        this.lastFrameTime = now;
        this.lastFpsCalcTime = now;
        this._loop(now);
    }

    pause() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    stop() {
        this.pause();
        this.currentIndex = 0;
        this._triggerFrameUpdate();
    }

    _loop(timestamp) {
        if (!this.isRunning) return;

        const delta = timestamp - this.lastFrameTime;

        // If enough time has passed to render the next frame
        if (delta >= this.frameDuration) {
            this._triggerFrameUpdate();
            
            this.currentIndex++;
            
            // Continuous looping (Broadcast style)
            if (this.currentIndex >= this.qrImages.length) {
                this.currentIndex = 0;
            }

            // Adjust lastFrameTime to prevent drift
            this.lastFrameTime = timestamp - (delta % this.frameDuration);
            this.actualFramesRendered++;
        }

        // Calculate actual FPS every 1 second
        if (timestamp - this.lastFpsCalcTime >= 1000) {
            if (this.onFpsUpdate) {
                this.onFpsUpdate(this.actualFramesRendered);
            }
            this.actualFramesRendered = 0;
            this.lastFpsCalcTime = timestamp;
        }

        // Queue next loop
        this.animationFrameId = requestAnimationFrame((t) => this._loop(t));
    }

    _triggerFrameUpdate() {
        if (this.onFrameUpdate) {
            this.onFrameUpdate(this.qrImages[this.currentIndex], this.currentIndex + 1, this.qrImages.length);
        }
    }
    
    setTargetFps(fps) {
        this.targetFps = fps;
        this.frameDuration = 1000 / fps;
    }
}