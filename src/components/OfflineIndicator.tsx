import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff, Zap } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return (
      <div 
        id="offline-ready-badge"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--accent-green)] shadow-xs"
        title="Ready for offline use on-the-go"
      >
        <Zap className="w-3 h-3 text-[var(--accent-green)]" />
        <span>Offline Ready</span>
      </div>
    );
  }

  return (
    <div 
      id="offline-banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 flex items-center justify-between gap-3 rounded-xl bg-[var(--accent-yellow)] px-4 py-2.5 text-xs font-bold text-[var(--text-main)] shadow-2xl border border-[var(--border-color)] animate-bounce"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-[var(--text-main)]" />
        <span>Offline Mode Active — On-the-go snack tests running local diagnostics</span>
      </div>
    </div>
  );
};
