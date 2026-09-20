import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Camera, RefreshCcw, Sparkles, Copy, Check, Timer, Coffee, BookmarkCheck } from 'lucide-react';
import { analyzeSnackImage, AnalysisResult } from '../utils/imageAnalysis';
import { CHAI_PRESETS, BISCUIT_PRESETS } from '../data/roasts';
import { CameraModal } from './CameraModal';
import { SnackAnalysisRecord, BiscuitPreset } from '../types';

interface KadiViewProps {
  onSaveToHistory: (record: SnackAnalysisRecord) => void;
}

export const KadiView: React.FC<KadiViewProps> = ({ onSaveToHistory }) => {
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedBiscuit, setSelectedBiscuit] = useState<BiscuitPreset>(BISCUIT_PRESETS[0]);

  // Interactive Live Dunk Simulator state
  const [isDunking, setIsDunking] = useState(false);
  const [dunkTimeSeconds, setDunkTimeSeconds] = useState(0);
  const [dunkStatus, setDunkStatus] = useState<'idle' | 'dunking' | 'safe' | 'collapsed'>('idle');
  const dunkTimerRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const runAnalysis = async (source: string, name: string) => {
    setIsAnalyzing(true);
    setImgPreview(source);
    setFileName(name);

    setTimeout(async () => {
      const res = await analyzeSnackImage(source, name, 'kadi');
      setResult(res);
      setIsAnalyzing(false);

      if (res.score >= 76) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#b45309', '#facc15', '#22c55e']
        });
      }

      // Persist to history
      const record: SnackAnalysisRecord = {
        id: `kadi-${Date.now()}`,
        timestamp: Date.now(),
        type: 'kadi',
        score: res.score,
        verdictTitle: res.verdictTitle,
        verdictDesc: res.verdictDesc,
        footer: res.footer,
        badgeText: res.badgeText,
        badgeClass: res.badgeClass,
        imageSrc: source,
        fileName: name,
        snackSubtype: selectedBiscuit.name
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
    setDunkStatus('idle');
    setDunkTimeSeconds(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePresetSelect = (preset: typeof CHAI_PRESETS[0]) => {
    const svgContent = getChaiPresetSvg(preset.name);
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
    runAnalysis(dataUrl, preset.hint);
  };

  const copyRoast = () => {
    if (!result) return;
    const text = `☕ [Useless Food Inc.] Chai Dunk Integrity: ${result.verdictTitle} (${result.score}/100) — "${result.verdictDesc}"`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startDunking = () => {
    setIsDunking(true);
    setDunkStatus('dunking');
    setDunkTimeSeconds(0);
    const startTime = Date.now();

    dunkTimerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setDunkTimeSeconds(elapsed);

      if (elapsed > selectedBiscuit.maxDunkSeconds) {
        stopDunking(true);
      }
    }, 50);
  };

  const stopDunking = (didCollapse = false) => {
    if (dunkTimerRef.current) {
      clearInterval(dunkTimerRef.current);
      dunkTimerRef.current = null;
    }
    setIsDunking(false);

    if (didCollapse) {
      setDunkStatus('collapsed');
      const collapsedSvg = getChaiPresetSvg('Sludge Catastrophe');
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(collapsedSvg)}`;
      runAnalysis(dataUrl, `collapsed_sludge_${selectedBiscuit.id}.jpg`);
    } else if (dunkTimeSeconds > 0.4) {
      setDunkStatus('safe');
      const ratio = 1 - (dunkTimeSeconds / selectedBiscuit.maxDunkSeconds);
      const safeScore = Math.min(95, Math.max(50, Math.floor(ratio * 50) + 50));
      const safeSvg = getChaiPresetSvg(selectedBiscuit.name);
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(safeSvg)}`;
      runAnalysis(dataUrl, `master_dunk_${selectedBiscuit.id}_score_${safeScore}.jpg`);
    }
  };

  useEffect(() => {
    return () => {
      if (dunkTimerRef.current) {
        clearInterval(dunkTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-[700px]">
      <div className="container grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Card */}
        <div 
          id="kadi-upload-card"
          className="card rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col justify-between min-h-[320px] shadow-xs transition-all hover:-translate-y-1 hover:shadow-md hover:border-[#d1ccba]"
        >
          <div>
            <div
              id="kadi-upload-zone"
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
                  id="kadi-img-preview"
                  src={imgPreview}
                  alt="Chai preview"
                  className="max-h-[150px] max-w-full rounded-lg object-contain animate-pop-in"
                />
              ) : (
                <div id="kadi-placeholder" className="py-3">
                  <div className="text-4xl mb-2">☕</div>
                  <p className="font-bold text-sm text-[var(--text-main)] mb-1">Drop a chai-biscuit photo</p>
                  <p className="text-xs text-[var(--text-muted)]">or click to browse from device</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                id="kadi-input"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Quick Action buttons */}
            <div className="mt-3 flex gap-2">
              <button
                id="btn-kadi-camera"
                onClick={() => setIsCameraOpen(true)}
                className="flex-1 py-2.5 px-3 rounded-lg bg-[var(--text-main)] text-xs font-semibold text-white hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Camera className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
                <span>Snap Camera</span>
              </button>
              <button
                id="kadi-reset"
                onClick={resetApp}
                className="py-2.5 px-3 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] hover:bg-[#f3efe2] hover:text-[var(--text-main)] transition flex items-center justify-center gap-1 cursor-pointer"
                title="Reset and test another dunk"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Biscuit Type Selection */}
          <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                <Coffee className="w-3 h-3 text-[var(--accent-tea)]" /> Biscuit:
              </span>
              <span className="text-[11px] text-[var(--accent-tea)] font-semibold">
                Limit: {selectedBiscuit.maxDunkSeconds}s
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {BISCUIT_PRESETS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBiscuit(b)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    selectedBiscuit.id === b.id
                      ? 'bg-[var(--accent-tea)] text-white'
                      : 'bg-[#fcfbf7] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>

            {/* Quick Test Presets */}
            <div className="grid grid-cols-2 gap-1.5 mt-2.5">
              {CHAI_PRESETS.map((p) => (
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

        {/* Verdict & Live Dunk Simulator Card */}
        <div 
          id="kadi-verdict-card"
          className="card rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col justify-between min-h-[320px] shadow-xs transition-all hover:-translate-y-1 hover:shadow-md hover:border-[#d1ccba]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div
                id="kadi-badge"
                className={`badge inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-all ${
                  result?.badgeClass === 'roast-badge'
                    ? 'roast-badge bg-[#fee2e2] text-[#dc2626]'
                    : 'bg-[#ede8d5] text-[var(--text-muted)]'
                }`}
              >
                {result ? result.badgeText : 'Structural Integrity'}
              </div>

              {result && (
                <button
                  id="btn-copy-kadi-roast"
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
                id="kadi-score"
                className="score-num text-5xl font-black leading-none tracking-tight text-[var(--text-main)]"
              >
                {isAnalyzing ? '...' : result ? result.score : '--'}
              </span>
              <span className="score-total text-sm font-semibold text-[var(--text-muted)]">/100</span>
            </div>

            <div
              id="kadi-verdict"
              className="verdict-title text-lg font-bold text-[var(--text-main)] mt-3 mb-1 animated-text"
            >
              {isAnalyzing
                ? 'Calculating Surface Tension & Crumb Saturation...'
                : result
                ? result.verdictTitle
                : 'Your dunk status will appear here'}
            </div>

            <div
              id="kadi-desc"
              className="verdict-desc text-sm text-[var(--text-muted)] leading-relaxed min-h-[48px] mb-3 animated-text"
            >
              {isAnalyzing
                ? 'Measuring biscuit porosity against viscous tannin currents...'
                : result
                ? result.verdictDesc
                : 'Upload a photo of your setup to calculate failure risk or try the interactive dunk test below.'}
            </div>

            {/* Interactive Hold-to-Dunk Simulator */}
            <div className="my-2 p-3 rounded-xl bg-[#fcfbf7] border border-[var(--border-color)]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[var(--text-main)] flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5 text-[var(--accent-tea)]" /> Live Dunk Simulator:
                </span>
                <span className={`font-mono font-bold ${
                  dunkTimeSeconds > selectedBiscuit.maxDunkSeconds * 0.75 ? 'text-[#dc2626]' : 'text-[var(--accent-tea)]'
                }`}>
                  {dunkTimeSeconds.toFixed(2)}s / {selectedBiscuit.maxDunkSeconds}s
                </span>
              </div>

              {/* Biscuit soak meter */}
              <div className="h-2 bg-[#efece1] rounded-full overflow-hidden mb-2.5">
                <div
                  className="h-full transition-all duration-75"
                  style={{
                    width: `${Math.min(100, (dunkTimeSeconds / selectedBiscuit.maxDunkSeconds) * 100)}%`,
                    backgroundColor: dunkTimeSeconds > selectedBiscuit.maxDunkSeconds * 0.8 ? 'var(--accent-red)' : 'var(--accent-tea)'
                  }}
                />
              </div>

              <button
                id="btn-hold-to-dunk"
                onMouseDown={startDunking}
                onMouseUp={() => stopDunking(false)}
                onTouchStart={startDunking}
                onTouchEnd={() => stopDunking(false)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all select-none cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                  isDunking
                    ? 'bg-[#dc2626] text-white scale-[0.98] ring-2 ring-[#dc2626]'
                    : dunkStatus === 'collapsed'
                    ? 'bg-[#fee2e2] border border-[#dc2626] text-[#dc2626]'
                    : 'bg-[var(--accent-tea)] text-white hover:opacity-95'
                }`}
              >
                {isDunking
                  ? 'HOLDING IN CHAI... RELEASE BEFORE CRUMBLE!'
                  : dunkStatus === 'collapsed'
                  ? 'DISASTER! SANK TO SEDIMENT. TAP TO RETRY'
                  : `PRESS & HOLD TO DUNK ${selectedBiscuit.name.toUpperCase()}`}
              </button>
            </div>
          </div>

          <div>
            <div className="progress-bar h-2.5 bg-[#efece1] rounded-full overflow-hidden mb-2">
              <div
                id="kadi-bar"
                className="progress-fill h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: result ? `${result.score}%` : '0%',
                  backgroundColor: result ? result.barColor : 'var(--accent-tea)'
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span id="kadi-footer">
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
        snackType="kadi"
      />
    </div>
  );
};

function getChaiPresetSvg(name: string): string {
  const isSludge = name.toLowerCase().includes('sludge') || name.toLowerCase().includes('drown');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <rect width="160" height="160" fill="#fcfbf7"/>
    <!-- Chai Cup -->
    <path d="M 40,70 L 48,130 C 50,140 60,145 70,145 L 90,145 C 100,145 110,140 112,130 L 120,70 Z" fill="#b45309" stroke="#e2decb" stroke-width="3"/>
    <ellipse cx="80" cy="70" rx="40" ry="12" fill="#78350f"/>
    ${isSludge 
      ? '<!-- Sunken biscuit residue --><ellipse cx="80" cy="135" rx="16" ry="6" fill="#1e293b"/><path d="M 68,70 Q 80,74 92,70" stroke="#dc2626" stroke-width="2"/>' 
      : '<!-- Pristine biscuit dipped --><rect x="68" y="30" width="24" height="48" rx="4" fill="#facc15" stroke="#b45309" stroke-width="2"/>'}
  </svg>`;
}
