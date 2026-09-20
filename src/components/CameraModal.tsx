import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, fileName: string) => void;
  snackType: 'tholi' | 'kadi';
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  snackType
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        stopCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access unavailable. Please enable camera permission in your browser or upload a saved photo.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (!capturedImage) return;
    const timestamp = Date.now();
    const fileName = `${snackType}_camera_snap_${timestamp}.jpg`;
    onCapture(capturedImage, fileName);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col animate-pop-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[var(--accent-tea)]" />
            <span className="font-bold text-sm text-[var(--text-main)]">
              {snackType === 'tholi' ? 'Scan Banana Ripeness' : 'Scan Chai & Biscuit Dunk'}
            </span>
          </div>
          <button
            id="btn-close-camera"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[#ede8d5] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera View / Preview */}
        <div className="relative bg-black min-h-[280px] max-h-[400px] flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-sm text-[#dc2626] max-w-sm">
              <p>{cameraError}</p>
              <button
                onClick={startCamera}
                className="mt-3 px-4 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-semibold hover:bg-[#f3efe2] cursor-pointer"
              >
                Retry Camera
              </button>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured snack"
              className="max-h-[380px] w-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full max-h-[380px] object-cover"
              />
              {/* Target Reticle Overlay */}
              <div className="absolute inset-8 pointer-events-none border-2 border-dashed border-[var(--accent-yellow)]/70 rounded-xl flex items-center justify-center">
                <span className="text-[11px] font-bold tracking-widest text-[var(--text-main)] uppercase px-2 py-1 rounded bg-[var(--card-bg)]/80 backdrop-blur-xs">
                  Align {snackType === 'tholi' ? 'Banana' : 'Biscuit'} Here
                </span>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 bg-[#fcfbf7] border-t border-[var(--border-color)] flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <button
                id="btn-retake-photo"
                onClick={handleRetake}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-main)] hover:bg-[#f3efe2] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button
                id="btn-use-photo"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--accent-green)] text-white text-xs font-bold hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Analyze This
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleFacingMode}
                className="py-2.5 px-3 rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[#f3efe2] transition flex items-center gap-1.5 cursor-pointer"
                title="Switch Camera"
              >
                <RefreshCw className="w-4 h-4" /> Flip
              </button>
              <button
                id="btn-snap-photo"
                onClick={handleSnap}
                disabled={!!cameraError}
                className="flex-1 py-3 px-6 rounded-xl bg-[var(--text-main)] text-white text-sm font-black hover:opacity-90 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[var(--accent-yellow)]" /> Capture Photo
              </button>
              <div className="w-12" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
