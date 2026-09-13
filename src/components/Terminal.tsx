import React, { useState, useRef, useEffect } from 'react';
import { StagedOutputLog } from '../types';
import { applyAtbash } from '../utils/atbash';
import confetti from 'canvas-confetti';

interface TerminalProps {
  logs: StagedOutputLog[];
  currentPath: string;
  atbashEnabled: boolean;
  onExecuteCommand: (cmd: string) => void;
  onClear: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  logs,
  currentPath,
  atbashEnabled,
  onExecuteCommand,
  onClear
}) => {
  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new logs
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Keep input focused
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const finalInput = atbashEnabled ? applyAtbash(inputVal) : inputVal;
      if (!finalInput.trim()) return;

      // Add to command history
      setCommandHistory(prev => [...prev, finalInput]);
      setHistoryIndex(-1);

      // Trigger cute confetti on special opposite commands!
      const lower = finalInput.trim().toLowerCase();
      if (lower.startsWith('exit') || lower.startsWith('delete') || lower.startsWith('save') || lower.startsWith('lock')) {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#ff79c6', '#50fa7b', '#8be9fd', '#ffb86c']
        });
      }

      onExecuteCommand(finalInput);
      setInputVal('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[nextIdx]);
      }
    }
  };

  // Preview transformed text if Atbash is enabled
  const previewText = atbashEnabled && inputVal ? applyAtbash(inputVal) : inputVal;

  return (
    <div className="pookie-window" onClick={handleContainerClick}>
      {/* Window Titlebar */}
      <div className="pookie-titlebar flex items-center justify-between px-4 py-2.5">
        {/* macOS Dots */}
        <div className="flex items-center gap-2">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
          <span className="ml-3 text-xs font-mono text-pink-300/80 font-medium">
            pookie@reverse: {currentPath}
          </span>
        </div>

        {/* Right title */}
        <div className="flex items-center gap-2 text-xs font-mono text-pink-300/70">
          <span>just opposite things ♡</span>
          <span className="text-base select-none">🐱</span>
        </div>
      </div>

      {/* Terminal Canvas Body */}
      <div className="pookie-terminal-body p-6 overflow-y-auto font-mono text-sm leading-relaxed select-text">
        {/* Pixel Cat Header Banner */}
        <div className="pookie-header-banner mb-6 select-none">
          <div className="flex items-center gap-4">
            <pre className="text-pink-400 text-xs font-bold leading-tight">
{`   |\\__/|
  (  -.- )
  (  > < )`}
            </pre>

            <div>
              <div className="text-pink-400 text-xl font-bold font-pixel tracking-wider flex items-center gap-2">
                <span>✦ Pookie Terminal</span>
                <span className="text-pink-300 text-lg">♡</span>
              </div>
              <div className="text-pink-300/80 text-xs tracking-wide font-medium mt-1">
                same commands. opposite results. ♡
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Logs */}
        <div className="space-y-4">
          {logs.map(log => {
            const isAction = log.category === 'ACTION';
            const isNav = log.category === 'NAVIGATION';

            // Determine stage verb color class
            let verbColor = 'text-emerald-400';
            if (log.oppositeVerb === 'remove' || log.oppositeVerb === 'delete') verbColor = 'text-rose-400';
            if (log.oppositeVerb === 'stay') verbColor = 'text-cyan-300';
            if (log.oppositeVerb === 'unlock') verbColor = 'text-amber-300';

            return (
              <div key={log.id} className="log-entry space-y-1">
                {/* Prompt Line */}
                <div className="flex items-baseline gap-2">
                  <span className="prompt-label font-bold text-pink-400">
                    pookie@reverse:{log.cwd}$
                  </span>
                  <span className="text-gray-100 font-medium">{log.command}</span>
                </div>

                {/* Stage 1 Line (for Action Commands) */}
                {isAction && log.stageLine && (
                  <div className="flex items-baseline gap-2 pl-4 text-purple-300/90">
                    <span className="text-purple-400 font-bold">↳</span>
                    <span className={`font-bold ${verbColor}`}>{log.oppositeVerb}</span>
                    <span className="text-gray-300">{log.args.join(' ')}</span>
                  </div>
                )}

                {/* Result Line */}
                {log.resultLine && (
                  <div className="flex items-baseline gap-2 pl-4 text-pink-200/90">
                    <span className="text-pink-400 font-bold">{log.customSymbol || '✓'}</span>
                    <span className="text-pink-100">{log.resultLine}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Input Line */}
        <div className="active-prompt-line mt-4 flex items-center gap-2">
          <span className="prompt-label font-bold text-pink-400">
            pookie@reverse:{currentPath}$
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-gray-100 font-mono w-full caret-pink-500"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            {atbashEnabled && inputVal && (
              <span className="absolute right-2 text-[11px] text-pink-400/70 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-500/20">
                Atbash Output: <strong className="text-pink-300">{previewText}</strong>
              </span>
            )}
          </div>
        </div>

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
