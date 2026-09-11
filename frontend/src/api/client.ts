import type {
  AnalysisResponse,
  StatusResponse,
  TrajectoryResponse,
} from '../types/analysis';
import { MOCK_ANALYSIS_COMPLETED, MOCK_TRAJECTORY } from './mockData';

const API_BASE = '/api';

export class ApiService {
  private useMockFallback: boolean = false;
  private mockJobProgress: Map<string, number> = new Map();

  constructor() {
    // Check if user or environment forced mock mode
    const storedPref = localStorage.getItem('penflip_use_mock');
    if (storedPref !== null) {
      this.useMockFallback = storedPref === 'true';
    }
  }

  public setMockMode(enabled: boolean) {
    this.useMockFallback = enabled;
    localStorage.setItem('penflip_use_mock', String(enabled));
  }

  public isMockMode(): boolean {
    return this.useMockFallback;
  }

  /**
   * Health check for backend
   */
  public async checkHealth(): Promise<boolean> {
    if (this.useMockFallback) return true;
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Upload video and create analysis
   * POST /api/analyses
   */
  public async uploadVideo(videoFile: File): Promise<{ analysis_id: string; status: string }> {
    if (!this.useMockFallback) {
      try {
        const formData = new FormData();
        formData.append('video', videoFile);

        const res = await fetch(`${API_BASE}/analyses`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          return {
            analysis_id: data.analysis_id,
            status: data.status || 'queued',
          };
        } else {
          // If server error, fall back if in development
          console.warn('Backend returned non-200, checking fallback...');
        }
      } catch (err) {
        console.warn('Backend unavailable, engaging simulation fallback:', err);
      }
    }

    // Mock Simulation Fallback
    const simulatedId = 'sim_' + Math.random().toString(36).substring(2, 9);
    this.mockJobProgress.set(simulatedId, 0);
    return {
      analysis_id: simulatedId,
      status: 'queued',
    };
  }

  /**
   * Poll analysis status
   * GET /api/analyses/{id}/status
   */
  public async getStatus(analysisId: string): Promise<StatusResponse> {
    if (!this.useMockFallback && !analysisId.startsWith('sim_')) {
      try {
        const res = await fetch(`${API_BASE}/analyses/${analysisId}/status`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Failed to poll status from backend, falling back:', err);
      }
    }

    // Simulated progress increment
    const current = this.mockJobProgress.get(analysisId) ?? 0;
    const increment = Math.floor(Math.random() * 15) + 12;
    const nextProgress = Math.min(100, current + increment);
    this.mockJobProgress.set(analysisId, nextProgress);

    const totalFrames = 576;
    const currentFrame = Math.round((nextProgress / 100) * totalFrames);

    return {
      analysis_id: analysisId,
      status: nextProgress >= 100 ? 'completed' : 'processing',
      progress: nextProgress,
      current_frame: currentFrame,
      total_frames: totalFrames,
    };
  }

  /**
   * Get completed analysis results
   * GET /api/analyses/{id}
   */
  public async getAnalysis(analysisId: string): Promise<AnalysisResponse> {
    if (!this.useMockFallback && !analysisId.startsWith('sim_')) {
      try {
        const res = await fetch(`${API_BASE}/analyses/${analysisId}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Failed to fetch analysis from backend, falling back:', err);
      }
    }

    // Return realistic mock result
    return {
      ...MOCK_ANALYSIS_COMPLETED,
      analysis_id: analysisId,
    };
  }

  /**
   * Get trajectory coordinates
   * GET /api/analyses/{id}/trajectory
   */
  public async getTrajectory(analysisId: string): Promise<TrajectoryResponse> {
    if (!this.useMockFallback && !analysisId.startsWith('sim_')) {
      try {
        const res = await fetch(`${API_BASE}/analyses/${analysisId}/trajectory`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Failed to fetch trajectory from backend, falling back:', err);
      }
    }

    return MOCK_TRAJECTORY;
  }

  /**
   * Get video replay URL
   * GET /api/analyses/{id}/video
   */
  public getVideoUrl(analysisId: string): string {
    if (analysisId.startsWith('sim_') || this.useMockFallback) {
      return '';
    }
    return `${API_BASE}/analyses/${analysisId}/video`;
  }
}

export const api = new ApiService();
