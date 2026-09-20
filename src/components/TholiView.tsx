import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Camera, RefreshCcw, Sparkles, Copy, Check, BookmarkCheck } from 'lucide-react';
import { analyzeSnackImage, AnalysisResult } from '../utils/imageAnalysis';
import { BANANA_PRESETS } from '../data/roasts';
import { CameraModal } from './CameraModal';
import { SnackAnalysisRecord } from '../types';

interface TholiViewProps {
  onSaveToHistory: (record: SnackAnalysisRecord) => void;
}

export const TholiView: React.FC<TholiViewProps> = ({ onSaveToHistory }) => {
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const runAnalysis = async (source: string, name: string) => {
    setIsAnalyzing(true);
    setImgPreview(source);
    setFileName(name);

    setTimeout(async () => {
      const res = await analyzeSnackImage(source, name, 'tholi');
      setResult(res);
      setIsAnalyzing(false);

      if (res.score >= 75 && res.score <= 90) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#facc15', '#22c55e', '#b45309']
        });
      }

      const record: SnackAnalysisRecord = {
        id: `tholi-${Date.now()}`,
        timestamp: Date.now(),
        type: 'tholi',
        score: res.score,
        verdictTitle: res.verdictTitle,
        verdictDesc: res.verdictDesc,
        footer: res.footer,
        badgeText: res.badgeText,
        badgeClass: res.badgeClass,
        imageSrc: source,
        fileName: name
      };
      onSaveToHistory(record);
    }, 280);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        runAnalysis(event.target.result as string, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        runAnalysis(event.target.result as string, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetApp = () => {
    setImgPreview(null);
    setFileName('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePresetSelect = (preset: typeof BANANA_PRESETS[0]) => {
    const svgContent = getBananaPresetSvg(preset.category);
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
    runAnalysis(dataUrl, preset.hint);
  };

  const copyRoast = () => {
    if (!result) return;
    const text = `🍌 [Useless Food Inc.] Banana Ripeness Verdict: ${result.verdictTitle} (${result.score}/100) — "${result.verdictDesc}"`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[700px]">
      <div className="container grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Card */}
        <div 
          id="tholi-upload-card"
          className="card rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col justify-between min-h-[320px] shadow-xs transition-all hover:-translate-y-1 hover:shadow-md hover:border-[#d1ccba]"
        >
          <div>
            <div
              id="tholi-upload-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`upload-zone rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center cursor-pointer text-center min-h-[180px] transition-all ${
                isDragging 
                  ? 'border-[var(--text-main)] bg-[#f7f4ea]' 
                  : 'border-[var(--border-color)] bg-[#fcfbf7] hover:border-[var(--text-main)] hover:bg-[#f7f4ea]'
              }`}
            >
              {imgPreview ? (
                <img
                  ref={imgRef}
                  id="tholi-img-preview"
                  src={imgPreview}
                  alt="Banana preview"
                  className="max-h-[150px] max-w-full rounded-lg object-contain animate-pop-in"
                />
              ) : (
                <div id="tholi-placeholder" className="py-3">
                  <div className="text-4xl mb-2">🍌</div>
                  <p className="font-bold text-sm text-[var(--text-main)] mb-1">Drop a banana photo</p>
                  <p className="text-xs text-[var(--text-muted)]">or click to browse from device</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                id="tholi-input"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Quick Action Buttons */}
            <div className="mt-3 flex gap-2">
              <button
                id="btn-tholi-camera"
                onClick={() => setIsCameraOpen(true)}
                className="flex-1 py-2.5 px-3 rounded-lg bg-[var(--text-main)] text-xs font-semibold text-white hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Camera className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
                <span>Snap Camera</span>
              </button>
              <button
                id="tholi-reset"
                onClick={resetApp}
                className="py-2.5 px-3 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] hover:bg-[#f3efe2] hover:text-[var(--text-main)] transition flex items-center justify-center gap-1 cursor-pointer"
                title="Clear and analyze another"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Preset Samples */}
          <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--accent-yellow)]" /> Quick Test Presets:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {BANANA_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => handlePresetSelect(p)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#fcfbf7] border border-[var(--border-color)] text-[11px] font-medium text-[var(--text-main)] text-left hover:border-[var(--text-main)] hover:bg-[#f7f4ea] transition truncate cursor-pointer"
                  title={p.description}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Verdict Card */}
        <div 
          id="tholi-verdict-card"
          className="card rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col justify-between min-h-[320px] shadow-xs transition-all hover:-translate-y-1 hover:shadow-md hover:border-[#d1ccba]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div
                id="tholi-badge"
                className={`badge inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-all ${
                  result?.badgeClass === 'roast-badge'
                    ? 'roast-badge bg-[#fee2e2] text-[#dc2626]'
                    : 'bg-[#ede8d5] text-[var(--text-muted)]'
                }`}
              >
                {result ? result.badgeText : 'Verdict'}
              </div>

              {result && (
                <button
                  id="btn-copy-roast"
                  onClick={copyRoast}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 p-1 rounded transition cursor-pointer"
                  title="Copy roast"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Share'}</span>
                </button>
              )}
            </div>

            <div className="score-display flex items-baseline gap-1 my-2">
              <span
                id="tholi-score"
                className="score-num text-5xl font-black leading-none tracking-tight text-[var(--text-main)]"
              >
                {isAnalyzing ? '...' : result ? result.score : '--'}
              </span>
              <span className="score-total text-sm font-semibold text-[var(--text-muted)]">/100</span>
            </div>

            <div
              id="tholi-verdict"
              className="verdict-title text-lg font-bold text-[var(--text-main)] mt-3 mb-1 animated-text"
            >
              {isAnalyzing
                ? 'Measuring Peel Reflectance...'
                : result
                ? result.verdictTitle
                : 'Your verdict will appear here'}
            </div>

            <div
              id="tholi-desc"
              className="verdict-desc text-sm text-[var(--text-muted)] leading-relaxed min-h-[48px] mb-4 animated-text"
            >
              {isAnalyzing
                ? 'Running spectrographic chlorophyll and sugar breakdown algorithms...'
                : result
                ? result.verdictDesc
                : 'Upload a photo to run diagnostics.'}
            </div>
          </div>

          <div>
            <div className="progress-bar h-2.5 bg-[#efece1] rounded-full overflow-hidden mb-2">
              <div
                id="tholi-bar"
                className="progress-fill h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: result ? `${result.score}%` : '0%',
                  backgroundColor: result ? result.barColor : 'var(--accent-yellow)'
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span id="tholi-footer">
                {result ? result.footer : 'Waiting for image input...'}
              </span>
              {result && (
                <span className="inline-flex items-center gap-1 text-[#22c55e] font-semibold">
                  <BookmarkCheck className="w-3 h-3" /> Saved to History
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl, name) => runAnalysis(dataUrl, name)}
        snackType="tholi"
      />
    </div>
  );
};

function getBananaPresetSvg(category: string): string {
  let color = '#facc15';
  let spots = '';
  if (category === 'green') {
    color = '#22c55e';
  } else if (category === 'biohazard') {
    color = '#1e293b';
    spots = '<circle cx="50" cy="50" r="14" fill="#0f172a"/><circle cx="70" cy="70" r="16" fill="#0f172a"/>';
  } else if (category === 'spotted') {
    spots = '<circle cx="45" cy="45" r="3" fill="#78350f"/><circle cx="65" cy="60" r="4" fill="#78350f"/><circle cx="85" cy="75" r="3" fill="#78350f"/>';
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <rect width="160" height="160" fill="#fcfbf7"/>
    <path d="M 30,30 C 50,60 120,110 110,140 C 100,150 80,140 70,130 C 90,105 75,55 30,30 Z" fill="${color}" stroke="#e2decb" stroke-width="3"/>
    ${spots}
  </svg>`;
}
