import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';
import { History as HistoryIcon, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTab: 'tholi' | 'kadi' | 'history';
  onSelectTab: (tab: 'tholi' | 'kadi' | 'history') => void;
  historyCount: number;
  isDarkTheme?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  historyCount,
  isDarkTheme = false,
  onToggleTheme,
}) => {
  return (
    <header className="text-center max-w-[650px] w-full mb-6 flex flex-col items-center animate-fade-in-down">
      {/* Top action bar with badges, PWA Install & Theme toggle */}
      <div className="flex items-center justify-between w-full mb-3 px-1 gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2">
          <div className="badge inline-block bg-[#ede8d5] text-[#706c61] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-transform hover:scale-105">
            Useless Food Inc.
          </div>
          <OfflineIndicator />
        </div>

        <div className="flex items-center gap-2">
          {onToggleTheme && (
            <button
              id="btn-toggle-theme"
              onClick={onToggleTheme}
              className="p-1.5 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer shadow-xs"
              title={isDarkTheme ? 'Switch to Warm Palette' : 'Switch to Dark Palette'}
            >
              {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-[#f9e2af]" /> : <Moon className="w-3.5 h-3.5 text-[#706c61]" />}
            </button>
          )}
          <PWAInstallButton />
        </div>
      </div>

      {/* Dynamic Title */}
      <h1 id="app-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-2 text-[var(--text-main)]">
        {activeTab === 'tholi' && (
          <>
            Is it ripe, or is it <span className="bg-[var(--accent-yellow)] text-[var(--text-main)] px-1.5 py-0.5 rounded">lying?</span>
          </>
        )}
        {activeTab === 'kadi' && (
          <>
            Will it hold, or will it <span className="bg-[var(--accent-yellow)] text-[var(--text-main)] px-1.5 py-0.5 rounded">drown?</span>
          </>
        )}
        {activeTab === 'history' && (
          <>
            Snack Archives & <span className="bg-[var(--accent-yellow)] text-[var(--text-main)] px-1.5 py-0.5 rounded">Judgments</span>
          </>
        )}
      </h1>

      {/* Dynamic Subtitle */}
      <p id="app-subtitle" className="text-[var(--text-muted)] text-sm max-w-md mx-auto leading-relaxed">
        {activeTab === 'tholi' && "Upload a photo and let peel science deliver your banana's moment of truth."}
        {activeTab === 'kadi' && "Upload your biscuit setup to calculate dunk structural integrity."}
        {activeTab === 'history' && "Your persistent offline log of culinary diagnostics, prime bananas, and chai catastrophes."}
      </p>

      {/* Navigation Tabs */}
      <div className="nav-tabs flex items-center justify-center gap-2.5 mt-5">
        <button
          id="btn-tholi"
          onClick={() => onSelectTab('tholi')}
          className={`tab-btn px-5 py-2 rounded-full font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'tholi'
              ? 'bg-[var(--text-main)] text-white border-[var(--text-main)] -translate-y-0.5 shadow-sm'
              : 'bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-[#d1ccba] hover:-translate-y-0.5 hover:shadow-md'
          }`}
        >
          Tholi 🍌
        </button>
        <button
          id="btn-kadi"
          onClick={() => onSelectTab('kadi')}
          className={`tab-btn px-5 py-2 rounded-full font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'kadi'
              ? 'bg-[var(--text-main)] text-white border-[var(--text-main)] -translate-y-0.5 shadow-sm'
              : 'bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-[#d1ccba] hover:-translate-y-0.5 hover:shadow-md'
          }`}
        >
          Kadi ☕
        </button>
        <button
          id="btn-history"
          onClick={() => onSelectTab('history')}
          className={`tab-btn px-4 py-2 rounded-full font-bold text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-[var(--text-main)] text-white border-[var(--text-main)] -translate-y-0.5 shadow-sm'
              : 'bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-[#d1ccba] hover:-translate-y-0.5 hover:shadow-md'
          }`}
        >
          <HistoryIcon className="w-3.5 h-3.5" />
          <span>History</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            activeTab === 'history' ? 'bg-white text-[var(--text-main)]' : 'bg-[#ede8d5] text-[var(--text-muted)]'
          }`}>
            {historyCount}
          </span>
        </button>
      </div>
    </header>
  );
};
