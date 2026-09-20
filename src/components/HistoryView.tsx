import React, { useState } from 'react';
import { SnackAnalysisRecord } from '../types';
import { Trash2, Download, Search, AlertTriangle } from 'lucide-react';

interface HistoryViewProps {
  history: SnackAnalysisRecord[];
  onDeleteRecord: (id: string) => void;
  onClearHistory: () => void;
  onSwitchTab: (tab: 'tholi' | 'kadi') => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onDeleteRecord,
  onClearHistory,
  onSwitchTab,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'tholi' | 'kadi'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<SnackAnalysisRecord | null>(null);

  const filteredHistory = history.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      item.verdictTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.verdictDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.fileName && item.fileName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.snackSubtype && item.snackSubtype.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const bananaCount = history.filter((i) => i.type === 'tholi').length;
  const chaiCount = history.filter((i) => i.type === 'kadi').length;
  const biohazardOrSludgeCount = history.filter(
    (i) => (i.type === 'tholi' && i.score >= 95) || (i.type === 'kadi' && i.score <= 25)
  ).length;

  const exportHistoryJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `useless_food_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full max-w-[700px] flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3.5 text-center shadow-xs">
          <div className="text-2xl font-black text-[var(--text-main)]">{history.length}</div>
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
            Snacks Judged
          </div>
        </div>
        <div className="card rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3.5 text-center shadow-xs">
          <div className="text-2xl font-black text-[var(--accent-tea)]">{bananaCount} 🍌 / {chaiCount} ☕</div>
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
            Banana / Chai
          </div>
        </div>
        <div className="card rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3.5 text-center shadow-xs">
          <div className="text-2xl font-black text-[var(--accent-red)]">{biohazardOrSludgeCount}</div>
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
            Hazards Dodged
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center bg-[var(--card-bg)] p-3 rounded-2xl border border-[var(--border-color)] shadow-xs">
        {/* Type pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-[var(--text-main)] text-white'
                : 'bg-[#fcfbf7] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            All ({history.length})
          </button>
          <button
            onClick={() => setFilterType('tholi')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              filterType === 'tholi'
                ? 'bg-[var(--accent-yellow)] text-[var(--text-main)]'
                : 'bg-[#fcfbf7] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            🍌 Tholi ({bananaCount})
          </button>
          <button
            onClick={() => setFilterType('kadi')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              filterType === 'kadi'
                ? 'bg-[var(--accent-tea)] text-white'
                : 'bg-[#fcfbf7] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            ☕ Kadi ({chaiCount})
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search roasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#fcfbf7] border border-[var(--border-color)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--text-main)]"
            />
          </div>

          <button
            id="btn-export-history"
            onClick={exportHistoryJson}
            className="p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[#f3efe2] transition cursor-pointer"
            title="Export history JSON"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            id="btn-clear-history"
            onClick={onClearHistory}
            className="p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--accent-red)] hover:bg-[#fee2e2] transition cursor-pointer"
            title="Clear all history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="flex flex-col gap-2.5">
        {filteredHistory.length === 0 ? (
          <div className="card rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-10 text-center text-[var(--text-muted)]">
            <AlertTriangle className="w-8 h-8 text-[var(--accent-tea)] mx-auto mb-2 opacity-80" />
            <p className="font-bold text-base text-[var(--text-main)] mb-1">No snack verdicts found</p>
            <p className="text-xs max-w-xs mx-auto mb-4 text-[var(--text-muted)]">
              Test your banana ripeness or chai-biscuit structural integrity to populate your persistent log.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => onSwitchTab('tholi')}
                className="px-4 py-2 rounded-xl bg-[var(--accent-yellow)] text-[var(--text-main)] text-xs font-bold hover:opacity-90 transition cursor-pointer"
              >
                Test Banana 🍌
              </button>
              <button
                onClick={() => onSwitchTab('kadi')}
                className="px-4 py-2 rounded-xl bg-[var(--accent-tea)] text-white text-xs font-bold hover:opacity-90 transition cursor-pointer"
              >
                Test Chai ☕
              </button>
            </div>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const dateStr = new Date(item.timestamp).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={item.id}
                className="card group rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3.5 flex items-center justify-between gap-3 transition-all hover:border-[#d1ccba] hover:shadow-sm"
              >
                {/* Left: Thumbnail / Type icon */}
                <div
                  onClick={() => setSelectedRecord(item)}
                  className="w-12 h-12 rounded-xl bg-[#fcfbf7] border border-[var(--border-color)] flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer"
                >
                  {item.imageSrc ? (
                    <img src={item.imageSrc} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">{item.type === 'tholi' ? '🍌' : '☕'}</span>
                  )}
                </div>

                {/* Middle info */}
                <div
                  onClick={() => setSelectedRecord(item)}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-extrabold text-[var(--text-main)] truncate">
                      {item.verdictTitle}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeClass === 'roast-badge'
                          ? 'bg-[#fee2e2] text-[#dc2626]'
                          : 'bg-[#ede8d5] text-[var(--text-muted)]'
                      }`}
                    >
                      {item.badgeText}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate line-clamp-1">
                    "{item.verdictDesc}"
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] opacity-80 mt-1">
                    <span>{dateStr}</span>
                    {item.snackSubtype && (
                      <>
                        <span>•</span>
                        <span className="text-[var(--accent-tea)] font-semibold">{item.snackSubtype}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right score and delete */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-xl font-black text-[var(--text-main)]">{item.score}</span>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">/100</span>
                  </div>
                  <button
                    onClick={() => onDeleteRecord(item.id)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#dc2626] hover:bg-[#fee2e2] transition cursor-pointer"
                    title="Delete log entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Record Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] p-5 shadow-2xl text-[var(--text-main)] animate-pop-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedRecord.type === 'tholi' ? '🍌' : '☕'}</span>
                <span className="font-bold text-sm text-[var(--text-main)]">
                  {selectedRecord.type === 'tholi' ? 'Banana Ripeness Record' : 'Chai Dunk Record'}
                </span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] px-2.5 py-1 rounded-lg bg-[#ede8d5] cursor-pointer"
              >
                Close
              </button>
            </div>

            {selectedRecord.imageSrc && (
              <div className="my-3 rounded-xl overflow-hidden bg-[#fcfbf7] border border-[var(--border-color)] max-h-48 flex items-center justify-center">
                <img
                  src={selectedRecord.imageSrc}
                  alt="Snack proof"
                  className="max-h-48 w-full object-contain"
                />
              </div>
            )}

            <div className="space-y-3 mt-3">
              <div className="flex items-baseline justify-between">
                <h4 className="text-base font-black text-[var(--text-main)]">
                  {selectedRecord.verdictTitle}
                </h4>
                <div className="text-2xl font-black text-[var(--accent-tea)]">
                  {selectedRecord.score}
                  <span className="text-xs text-[var(--text-muted)]">/100</span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[var(--text-muted)] bg-[#fcfbf7] p-3 rounded-xl border border-[var(--border-color)]">
                "{selectedRecord.verdictDesc}"
              </p>

              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>{selectedRecord.footer}</span>
                <span>{new Date(selectedRecord.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
