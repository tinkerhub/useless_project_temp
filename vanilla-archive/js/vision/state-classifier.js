/**
 * Useless 3.0 - State Classifier (Finite State Machine with Hysteresis)
 * Enforces debounced state transitions:
 * NO_FACE, SILENT, TALKING.
 */
export class StateClassifier {
  constructor({
    enterTalkingDelay = 350,   // ms of sustained mouth motion before entering TALKING
    exitTalkingDelay = 650,    // ms of stillness before dropping to SILENT
    noFaceDelay = 500,         // ms before confirming face disappearance
    onStateChange = null
  } = {}) {
    this.state = 'IDLE'; // IDLE, INITIALIZING, NO_FACE, SILENT, TALKING
    this.enterTalkingDelay = enterTalkingDelay;
    this.exitTalkingDelay = exitTalkingDelay;
    this.noFaceDelay = noFaceDelay;
    this.onStateChange = onStateChange;

    this.motionStartTime = null;
    this.stillStartTime = null;
    this.faceLostStartTime = null;
  }

  setState(newState) {
    if (this.state === newState) return;
    const oldState = this.state;
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(newState, oldState);
    }
  }

  update({ hasFace, isMouthMoving, now = performance.now() }) {
    // 1. Check Face Visibility
    if (!hasFace) {
      this.motionStartTime = null;
      this.stillStartTime = null;

      if (!this.faceLostStartTime) {
        this.faceLostStartTime = now;
      } else if (now - this.faceLostStartTime >= this.noFaceDelay) {
        this.setState('NO_FACE');
      }
      return this.state;
    }

    // Face is visible: reset face lost tracker
    this.faceLostStartTime = null;

    // If currently in NO_FACE or IDLE/INIT, immediately promote to SILENT or TALKING
    if (this.state === 'NO_FACE' || this.state === 'IDLE' || this.state === 'INITIALIZING') {
      if (isMouthMoving) {
        this.setState('TALKING');
      } else {
        this.setState('SILENT');
      }
      return this.state;
    }

    // 2. Handle Transitions between SILENT and TALKING with Hysteresis
    if (this.state === 'SILENT') {
      this.stillStartTime = null;
      if (isMouthMoving) {
        if (!this.motionStartTime) {
          this.motionStartTime = now;
        } else if (now - this.motionStartTime >= this.enterTalkingDelay) {
          this.setState('TALKING');
          this.motionStartTime = null;
        }
      } else {
        this.motionStartTime = null;
      }
    } else if (this.state === 'TALKING') {
      this.motionStartTime = null;
      if (!isMouthMoving) {
        if (!this.stillStartTime) {
          this.stillStartTime = now;
        } else if (now - this.stillStartTime >= this.exitTalkingDelay) {
          this.setState('SILENT');
          this.stillStartTime = null;
        }
      } else {
        this.stillStartTime = null;
      }
    }

    return this.state;
  }
}
