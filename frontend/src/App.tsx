import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { UploadZone } from './components/UploadZone';
import { AnalysisPage } from './pages/AnalysisPage';
import { ResultsPage } from './pages/ResultsPage';
import { ErrorAlert } from './components/ErrorAlert';
import { api } from './api/client';
import { createSamplePenVideo } from './utils/sampleVideo';
import type {
  VideoFileValidation,
  StatusResponse,
  AnalysisResponse,
  TrajectoryResponse,
} from './types/analysis';

export function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'upload' | 'analysis' | 'results' | 'replay'>('home');
  const [isMockMode, setIsMockMode] = useState<boolean>(api.isMockMode());

  // Analysis Lifecycle State
  const [validation, setValidation] = useState<VideoFileValidation | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [, setAnalysisId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryResponse | null>(null);
  const [errorState, setErrorState] = useState<{ code: string; message: string } | null>(null);

  const pollingTimerRef = useRef<number | null>(null);

  // Check backend health on initial mount
  useEffect(() => {
    api.checkHealth().then((isHealthy) => {
      if (!isHealthy) {
        // Automatically switch to mock mode if backend isn't up
        api.setMockMode(true);
        setIsMockMode(true);
      }
    });
  }, []);

  const handleToggleMock = () => {
    const nextMode = !isMockMode;
    api.setMockMode(nextMode);
    setIsMockMode(nextMode);
  };

  // Start analysis pipeline
  const handleStartAnalysis = async () => {
    if (!validation) return;
    setErrorState(null);
    setIsUploading(true);

    try {
      const uploadRes = await api.uploadVideo(validation.file);
      setAnalysisId(uploadRes.analysis_id);
      setIsUploading(false);
      setCurrentTab('analysis');
      setStatus({
        analysis_id: uploadRes.analysis_id,
        status: 'processing',
        progress: 10,
        current_frame: 57,
        total_frames: 576,
      });

      // Start Polling Status
      startStatusPolling(uploadRes.analysis_id);
    } catch (err: any) {
      setIsUploading(false);
      setErrorState({
        code: 'ANALYSIS_FAILED',
        message: err?.message || 'Could not initiate video analysis pipeline.',
      });
    }
  };

  // Poll status endpoint until completion or error
  const startStatusPolling = (id: string) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    pollingTimerRef.current = window.setInterval(async () => {
      try {
        const statusRes = await api.getStatus(id);
        setStatus(statusRes);

        if (statusRes.status === 'completed') {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

          // Fetch full analysis and trajectory
          const [analysisRes, trajectoryRes] = await Promise.all([
            api.getAnalysis(id),
            api.getTrajectory(id),
          ]);

          setAnalysis(analysisRes);
          setTrajectory(trajectoryRes);
          setCurrentTab('results');
        } else if (statusRes.status === 'failed') {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          setErrorState({
            code: 'ANALYSIS_FAILED',
            message: statusRes.failure_reason || 'An error occurred during video processing.',
          });
        } else if (statusRes.status === 'tracking_lost') {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          setErrorState({
            code: 'TRACKING_LOST',
            message: statusRes.failure_reason || 'Pen tracking was lost during execution. Please check lighting and marker contrast.',
          });
        }
      } catch (err: any) {
        if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
        setErrorState({
          code: 'NETWORK_ERROR',
          message: 'Lost connection to analysis engine.',
        });
      }
    }, 600);
  };

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, []);

  // Quick Demo: generate synthetic 240 FPS sample video
  const handleLoadSample = async () => {
    try {
      const { file, url } = await createSamplePenVideo();
      const mockValidation: VideoFileValidation = {
        isValid: true,
        file,
        name: 'sample_spin_240fps.mp4',
        sizeMB: 2.1,
        duration: 2.4,
        width: 1280,
        height: 720,
        fps: 240,
        previewUrl: url,
        checks: {
          videoLoaded: true,
          highFpsDetected: true,
          resolutionSuitable: true,
          durationSuitable: true,
        },
      };
      setValidation(mockValidation);
      setCurrentTab('upload');
    } catch (err) {
      console.error('Failed to generate sample video:', err);
    }
  };

  const handleReset = () => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    setAnalysis(null);
    setTrajectory(null);
    setStatus(null);
    setErrorState(null);
    setCurrentTab('upload');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'results' || tab === 'replay') {
            if (analysis) setCurrentTab('results');
          } else {
            setCurrentTab(tab);
          }
        }}
        hasAnalysis={analysis !== null}
        isMockMode={isMockMode}
        onToggleMock={handleToggleMock}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '60px' }}>
        {errorState && (
          <div style={{ maxWidth: '1100px', margin: '24px auto 0', padding: '0 24px' }}>
            <ErrorAlert
              code={errorState.code}
              message={errorState.message}
              onReset={handleReset}
            />
          </div>
        )}

        {/* Tab / Route Routing */}
        {currentTab === 'home' && (
          <HomePage
            onStartUpload={() => setCurrentTab('upload')}
            onLoadSample={handleLoadSample}
          />
        )}

        {currentTab === 'upload' && (
          <div style={{ maxWidth: '980px', margin: '40px auto 0', padding: '0 24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', fontWeight: 600 }}>
                STEP 1 OF 3 · VIDEO SELECTION
              </div>
              <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                Upload Spinning Video
              </h2>
            </div>

            <UploadZone
              onVideoValidated={(val) => setValidation(val)}
              onStartAnalysis={handleStartAnalysis}
              selectedValidation={validation}
              isUploading={isUploading}
            />
          </div>
        )}

        {currentTab === 'analysis' && (
          <AnalysisPage
            status={status}
            validation={validation}
            onCancel={handleReset}
          />
        )}

        {(currentTab === 'results' || currentTab === 'replay') && analysis && (
          <ResultsPage
            analysis={analysis}
            trajectory={trajectory}
            videoSrc={validation?.previewUrl || ''}
            onNewAnalysis={handleReset}
          />
        )}
      </main>
    </div>
  );
}

export default App;
