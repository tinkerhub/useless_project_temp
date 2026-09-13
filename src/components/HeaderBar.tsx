import React from 'react';
import { Terminal, Keyboard, ShieldAlert, Compass, Sparkles, FolderTree, RefreshCw, Heart } from 'lucide-react';

interface HeaderBarProps {
  atbashEnabled: boolean;
  onToggleAtbash: () => void;
  onRunPreset: (cmd: string) => void;
  onToggleTree: () => void;
  onResetFS: () => void;
  showTree: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  atbashEnabled,
  onToggleAtbash,
  onRunPreset,
  onToggleTree,
  onResetFS,
  showTree
}) => {
  return (
    <header className="pookie-header-panel">
      {/* Top badges bar */}
      <div className="status-badges-group">
        <button
          onClick={onToggleAtbash}
          className={`badge-item key-badge ${atbashEnabled ? 'active-atbash' : ''}`}
          title="Click to toggle Layer 1 Keyboard Reversal (Atbash Cipher)"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Keyboard: <strong>{atbashEnabled ? 'REVERSED (Atbash)' : 'NORMAL'}</strong></span>
        </button>

        <div className="badge-item cmd-badge">
          <ShieldAlert className="w-3.5 h-3.5 text-pink-400" />
          <span>Commands: <strong className="text-pink-400">OPPOSITE</strong></span>
        </div>

        <div className="badge-item nav-badge">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>Navigation: <strong className="text-emerald-400">NORMAL</strong></span>
        </div>

        <button
          onClick={onToggleTree}
          className={`badge-item tree-badge ${showTree ? 'active-tree' : ''}`}
          title="Toggle Live In-Memory Filesystem Tree"
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>FS Tree</span>
        </button>
      </div>

      {/* Quick Judge Presets bar */}
      <div className="presets-bar">
        <span className="presets-label flex items-center gap-1 text-xs text-pink-300 font-medium">
          <Sparkles className="w-3 h-3 text-pink-400" /> Demo Presets:
        </span>
        
        <div className="presets-scroll">
          <button
            onClick={() => onRunPreset('delete project')}
            className="preset-chip chip-delete"
          >
            delete project
          </button>
          <button
            onClick={() => onRunPreset('save file.txt')}
            className="preset-chip chip-save"
          >
            save file.txt
          </button>
          <button
            onClick={() => onRunPreset('exit')}
            className="preset-chip chip-exit"
          >
            exit
          </button>
          <button
            onClick={() => onRunPreset('copy secret-plan.txt backup.txt')}
            className="preset-chip chip-copy"
          >
            copy secret-plan.txt backup.txt
          </button>
          <button
            onClick={() => onRunPreset('lock report.txt')}
            className="preset-chip chip-lock"
          >
            lock report.txt
          </button>
          <button
            onClick={() => onRunPreset('cd projects')}
            className="preset-chip chip-nav"
          >
            cd projects
          </button>
          <button
            onClick={() => onRunPreset('ls')}
            className="preset-chip chip-nav"
          >
            ls
          </button>
          <button
            onClick={() => onRunPreset('pwd')}
            className="preset-chip chip-nav"
          >
            pwd
          </button>
        </div>
      </div>
    </header>
  );
};
