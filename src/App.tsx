import React, { useState, useRef } from 'react';
import { FileSystemSimulator } from './utils/filesystemSimulator';
import { classifyCommand, OPPOSITE_COMMANDS } from './utils/commandRegistry';
import { StagedOutputLog } from './types';
import { Terminal } from './components/Terminal';
import { HeaderBar } from './components/HeaderBar';
import { FileTreeDrawer } from './components/FileTreeDrawer';
import { Sparkles, Heart } from 'lucide-react';

export const App: React.FC = () => {
  // Simulator instance stored in ref to retain state across renders
  const fsRef = useRef(new FileSystemSimulator());

  // App States
  const [atbashEnabled, setAtbashEnabled] = useState(false);
  const [showTree, setShowTree] = useState(false);
  const [currentPath, setCurrentPath] = useState(fsRef.current.getPromptPath());
  const [logs, setLogs] = useState<StagedOutputLog[]>([]);

  // Force trigger tree view re-render
  const [fsVersion, setFsVersion] = useState(0);

  // Command Execution Handler
  const executeCommand = (rawInput: string) => {
    const fs = fsRef.current;
    const classified = classifyCommand(rawInput);

    const logId = Math.random().toString(36).substring(2, 9);
    const cwd = fs.getPromptPath();

    if (classified.category === 'NAVIGATION') {
      const verb = classified.originalVerb;
      let resultLine = '';
      let customSymbol = '✓';

      if (verb === 'cd') {
        const res = fs.cd(classified.args[0]);
        resultLine = res.message;
        setCurrentPath(fs.getPromptPath());
      } else if (verb === 'pwd') {
        resultLine = `${fs.getPromptPath()}`;
      } else if (verb === 'ls' || verb === 'dir') {
        const items = fs.ls();
        if (items.length === 0) {
          resultLine = '(directory is empty ♡)';
        } else {
          resultLine = items.map(item => item.type === 'directory' ? `${item.name}/` : item.name).join('   ');
        }
      } else if (verb === 'clear') {
        setLogs([]);
        return;
      } else if (verb === 'help') {
        resultLine = 'Available Commands: delete, save, remove, exit, open, copy, move, lock, unlock, cd, ls, pwd, clear, help ♡';
      } else if (verb === 'atbash') {
        setAtbashEnabled(prev => !prev);
        resultLine = `Keyboard Reversal (Atbash Cipher) toggled! ♡`;
      } else {
        resultLine = `Executed navigation command: ${verb}`;
      }

      setLogs(prev => [
        ...prev,
        {
          id: logId,
          command: rawInput,
          cwd,
          timestamp: new Date().toLocaleTimeString(),
          category: 'NAVIGATION',
          originalVerb: verb,
          args: classified.args,
          resultLine,
          customSymbol
        }
      ]);
    } else if (classified.category === 'ACTION') {
      const verb = classified.originalVerb;
      const oppConfig = OPPOSITE_COMMANDS[verb];
      const oppositeVerb = oppConfig.opposite;
      const targetArg = classified.args[0] || '';
      const secondArg = classified.args[1] || '';

      let stageLine = `↳ ${oppositeVerb} ${classified.args.join(' ')}`;
      let resultText = '';
      let customSymbol = oppConfig.symbol || '✓';

      // Perform state mutation on opposite verb
      switch (oppositeVerb) {
        case 'create':
          resultText = fs.executeOppositeCreate(targetArg);
          break;
        case 'save':
          resultText = fs.executeOppositeSave(targetArg);
          break;
        case 'remove':
          resultText = fs.executeOppositeRemove(targetArg);
          break;
        case 'delete':
          resultText = fs.executeOppositeRemove(targetArg);
          break;
        case 'stay':
          resultText = "you're still here, pookie ♡";
          customSymbol = '☺';
          break;
        case 'move':
          resultText = fs.executeOppositeMove(targetArg, secondArg);
          break;
        case 'copy':
          resultText = fs.executeOppositeCopy(targetArg, secondArg);
          break;
        case 'unlock':
          resultText = fs.executeOppositeUnlock(targetArg);
          break;
        case 'lock':
          resultText = fs.executeOppositeLock(targetArg);
          break;
        case 'show':
          resultText = fs.executeOppositeShow(targetArg);
          break;
        case 'hide':
          resultText = fs.executeOppositeHide(targetArg);
          break;
        case 'close':
          resultText = fs.executeOppositeClose(targetArg);
          break;
        case 'open':
          resultText = fs.executeOppositeOpen(targetArg);
          break;
        default:
          resultText = `${targetArg || 'operation'} ${oppConfig.resultVerb} ♡`;
      }

      setLogs(prev => [
        ...prev,
        {
          id: logId,
          command: rawInput,
          cwd,
          timestamp: new Date().toLocaleTimeString(),
          category: 'ACTION',
          originalVerb: verb,
          oppositeVerb,
          args: classified.args,
          stageLine,
          resultLine: resultText,
          customSymbol
        }
      ]);
    } else {
      // UNKNOWN
      setLogs(prev => [
        ...prev,
        {
          id: logId,
          command: rawInput,
          cwd,
          timestamp: new Date().toLocaleTimeString(),
          category: 'UNKNOWN',
          originalVerb: classified.originalVerb,
          args: classified.args,
          stageLine: `↳ opposite of '${classified.originalVerb}' → DOES NOTHING`,
          resultLine: `Unknown command '${classified.originalVerb}'. Opposite universe left unchanged ♡`,
          customSymbol: '?'
        }
      ]);
    }

    setFsVersion(v => v + 1);
  };

  const handleResetFS = () => {
    fsRef.current = new FileSystemSimulator();
    setCurrentPath(fsRef.current.getPromptPath());
    setFsVersion(v => v + 1);
    setLogs([]);
  };

  return (
    <div className="pookie-app-container min-h-screen bg-[#0a0813] text-gray-100 flex flex-col font-sans selection:bg-pink-500/30">
      {/* Header bar & Judge Quick Presets */}
      <HeaderBar
        atbashEnabled={atbashEnabled}
        onToggleAtbash={() => setAtbashEnabled(prev => !prev)}
        onRunPreset={executeCommand}
        onToggleTree={() => setShowTree(prev => !prev)}
        onResetFS={handleResetFS}
        showTree={showTree}
      />

      {/* Main Terminal Area */}
      <main className="flex-1 flex overflow-hidden p-4 md:p-6 max-w-7xl mx-auto w-full gap-4">
        <div className="flex-1 flex flex-col min-w-0">
          <Terminal
            logs={logs}
            currentPath={currentPath}
            atbashEnabled={atbashEnabled}
            onExecuteCommand={executeCommand}
            onClear={() => setLogs([])}
          />
        </div>

        {/* Collapsible Live Filesystem Drawer */}
        {showTree && (
          <div className="rounded-xl overflow-hidden shadow-2xl border border-pink-500/20">
            <FileTreeDrawer
              rootNode={fsRef.current.getRoot()}
              currentPath={currentPath}
              onClose={() => setShowTree(false)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-2 text-center text-xs text-pink-300/50 border-t border-pink-500/10 flex items-center justify-center gap-1">
        <span>Reverse Shell Hackathon Demo • Built with</span>
        <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
        <span>Pookie Terminal Engine</span>
      </footer>
    </div>
  );
};

export default App;
