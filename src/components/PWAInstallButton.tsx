import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, X, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#ede8d5] text-[var(--accent-green)] border border-[var(--border-color)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" /> Installed App
      </span>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install"
        onClick={install}
        className="flex items-center gap-1.5 rounded-full bg-[var(--text-main)] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 transition active:scale-95 cursor-pointer"
        title="Install Useless Food Inc. for offline on-the-go snack tests"
      >
        <Download className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--text-main)] hover:bg-[#f3efe2] transition active:scale-95 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-[var(--accent-tea)]" />
          <span>Add to iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] p-6 shadow-2xl text-[var(--text-main)] animate-pop-in">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h3 className="text-base font-bold text-[var(--text-main)]">Install on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ede8d5] text-[var(--text-main)] flex items-center justify-center font-bold text-xs">1</span>
                  <p>Tap the <strong className="text-[var(--text-main)] inline-flex items-center gap-1"><Share className="w-3.5 h-3.5" /> Share</strong> button in Safari's bottom toolbar.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ede8d5] text-[var(--text-main)] flex items-center justify-center font-bold text-xs">2</span>
                  <p>Scroll down and tap <strong className="text-[var(--text-main)]">Add to Home Screen</strong>.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ede8d5] text-[var(--text-main)] flex items-center justify-center font-bold text-xs">3</span>
                  <p>Launch from your home screen for instant offline snack diagnostics!</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[var(--text-main)] py-2 text-sm font-bold text-white hover:opacity-90 transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
