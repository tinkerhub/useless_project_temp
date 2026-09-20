/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TholiView } from './components/TholiView';
import { KadiView } from './components/KadiView';
import { HistoryView } from './components/HistoryView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SnackAnalysisRecord } from './types';
import {
  getHistory,
  saveHistoryRecord,
  deleteHistoryRecord,
  clearHistory as clearStoredHistory,
} from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tholi' | 'kadi' | 'history'>('tholi');
  const [history, setHistory] = useState<SnackAnalysisRecord[]>([]);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);

  // Load persistent history & saved theme on mount
  useEffect(() => {
    const loaded = getHistory();
    setHistory(loaded);

    const savedTheme = localStorage.getItem('useless_food_theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
    }
  }, []);

  const handleToggleTheme = () => {
    setIsDarkTheme((prev) => {
      const next = !prev;
      localStorage.setItem('useless_food_theme', next ? 'dark' : 'warm');
      return next;
    });
  };

  const handleSaveToHistory = (record: SnackAnalysisRecord) => {
    const updated = saveHistoryRecord(record);
    setHistory(updated);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = deleteHistoryRecord(id);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all snack analysis history?')) {
      clearStoredHistory();
      setHistory([]);
    }
  };

  return (
    <div
      className={`min-h-screen w-full bg-[var(--bg-color)] text-[var(--text-main)] flex flex-col items-center py-6 px-4 selection:bg-[var(--accent-yellow)] selection:text-[var(--text-main)] transition-colors duration-300 ${
        isDarkTheme ? 'theme-dark' : ''
      }`}
    >
      {/* App Header & Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        historyCount={history.length}
        isDarkTheme={isDarkTheme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Analysis Container */}
      <main className="w-full flex justify-center pb-12">
        {activeTab === 'tholi' && (
          <div id="tholi-tab" className="w-full flex justify-center tab-content active animate-in fade-in duration-300">
            <TholiView onSaveToHistory={handleSaveToHistory} />
          </div>
        )}

        {activeTab === 'kadi' && (
          <div id="kadi-tab" className="w-full flex justify-center tab-content active animate-in fade-in duration-300">
            <KadiView onSaveToHistory={handleSaveToHistory} />
          </div>
        )}

        {activeTab === 'history' && (
          <div id="history-tab" className="w-full flex justify-center tab-content active animate-in fade-in duration-300">
            <HistoryView
              history={history}
              onDeleteRecord={handleDeleteRecord}
              onClearHistory={handleClearHistory}
              onSwitchTab={(tab) => setActiveTab(tab)}
            />
          </div>
        )}
      </main>

      {/* Persistent Offline Status Banner */}
      <OfflineIndicator />

      {/* Subtle footer */}
      <footer className="mt-auto text-center py-4 text-xs text-[var(--text-muted)]">
        <p>
          Useless Food Inc. v3.1 • Powered by Peel Science & Fluid Dynamics • Works 100% Offline
        </p>
      </footer>
    </div>
  );
}
