/**
 * ai-service.js — Frontend API communication layer.
 *
 * All AI calls go through the Express proxy (server.js).
 * This module never touches API keys directly.
 *
 * Endpoints:
 *   POST /api/birth       — detect object + generate passport DNA
 *   POST /api/encounter   — generate next life encounter
 *   POST /api/resolve     — process player's choice + get consequence
 */

export class AIService {
  constructor() {
    this.baseUrl = '/api';
  }

  // ─── Birth (Milestone 1) ────────────────────────────────────────

  /**
   * Send captured frames to the server for multi-frame consensus detection + DNA generation.
   * @param {string[]} frames - Array of base64 data URIs (1–3 frames)
   * @returns {Promise<{dna, confidence, candidates, needsRescan}>}
   */
  async detectAndBirth(frames) {
    const payload = Array.isArray(frames)
      ? { frames }
      : { image: frames };                   // legacy single-image fallback

    const response = await fetch(`${this.baseUrl}/birth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error('Birth API returned failure');

    // Return full result so main.js can handle confidence gating
    return {
      dna: data.dna || null,
      confidence: data.confidence ?? 1.0,
      candidates: data.candidates || [],
      needsRescan: data.needsRescan ?? false,
    };
  }

  /**
   * Birth an object from a manual text name (when camera is unavailable).
   * @param {string} objectName - The name of the object typed by the user
   * @returns {Promise<Object>} The generated Object DNA
   */
  async birthFromName(objectName) {
    return this._post('/birth', { manualName: objectName }, 'dna');
  }

  // ─── Life Script (Milestone 2) ───────────────────────────────────

  /**
   * Generates the entire life script (4 encounters + death) in one go.
   * @param {Object} dna - The generated Object DNA
   * @returns {Promise<Object>} { chapters: [...], death: {...} }
   */
  async generateLifeScript(dna) {
    return this._post('/life-script', { dna }, 'script');
  }

  /**
   * Send an immigration query to the server for live reaction to player's typed answer.
   * @param {Object} payload - { dna, question, answer, context }
   */
  async immigrationQuery(payload) {
    const response = await fetch(`${this.baseUrl}/immigration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    // return full data (reply + decision)
    return data;
  }

  /**
   * Evaluate a free-action typed by the player during interactions.
   * @param {Object} payload - { dna, state, actionText }
   * @returns {Promise<Object>} result with consequence/stateChanges/memory
   */
  async evalAction(payload) {
    return this._post('/eval-action', payload, 'result');
  }

  /**
   * Request video generation for a short scene.
   * @param {Object} payload - { scene, metadata }
   * @returns {Promise<string>} jobId
   */
  async generateVideo(payload) {
    const response = await fetch(`${this.baseUrl}/generate-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Video API error');
    const data = await response.json();
    return data.jobId;
  }

  async videoStatus(jobId) {
    const response = await fetch(`${this.baseUrl}/video-status/${jobId}`);
    if (!response.ok) throw new Error('Video status error');
    return response.json();
  }

  // ─── Health ─────────────────────────────────────────────────────

  async healthCheck() {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ─── Internal ───────────────────────────────────────────────────

  /**
   * Generic POST helper with error handling.
   * @param {string} path - API path (e.g., '/birth')
   * @param {Object} body - Request body
   * @param {string} dataKey - Key in response JSON to extract
   */
  async _post(path, body, dataKey) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `Server error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data[dataKey]) {
      throw new Error(`Invalid response from ${path} API`);
    }

    return data[dataKey];
  }
}
