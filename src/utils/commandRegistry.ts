import { ClassifiedCommand } from '../types';

export const OPPOSITE_COMMANDS: Record<string, { opposite: string; resultVerb: string; symbol?: string }> = {
  // Direct screenshot examples & primary file actions
  'delete': { opposite: 'create', resultVerb: 'created', symbol: '✓' },
  'remove': { opposite: 'save', resultVerb: 'saved', symbol: '✓' },
  'rm': { opposite: 'save', resultVerb: 'saved', symbol: '✓' },
  'save': { opposite: 'remove', resultVerb: 'removed', symbol: '✓' },
  'create': { opposite: 'delete', resultVerb: 'deleted', symbol: '✓' },
  'touch': { opposite: 'delete', resultVerb: 'deleted', symbol: '✓' },
  'mk': { opposite: 'delete', resultVerb: 'deleted', symbol: '✓' },
  'exit': { opposite: 'stay', resultVerb: 'still here, pookie', symbol: '☺' },
  'quit': { opposite: 'stay', resultVerb: 'still here, pookie', symbol: '☺' },

  // Open / Close
  'open': { opposite: 'close', resultVerb: 'closed', symbol: '✓' },
  'cat': { opposite: 'close', resultVerb: 'closed', symbol: '✓' },
  'close': { opposite: 'open', resultVerb: 'opened', symbol: '✓' },

  // Process control
  'start': { opposite: 'stop', resultVerb: 'stopped', symbol: '✓' },
  'run': { opposite: 'stop', resultVerb: 'stopped', symbol: '✓' },
  'stop': { opposite: 'start', resultVerb: 'started', symbol: '✓' },
  'kill': { opposite: 'start', resultVerb: 'resurrected', symbol: '✓' },

  // File Transfer & Movement
  'copy': { opposite: 'move', resultVerb: 'moved', symbol: '✓' },
  'cp': { opposite: 'move', resultVerb: 'moved', symbol: '✓' },
  'move': { opposite: 'copy', resultVerb: 'copied', symbol: '✓' },
  'mv': { opposite: 'copy', resultVerb: 'copied', symbol: '✓' },
  'download': { opposite: 'upload', resultVerb: 'uploaded', symbol: '✓' },
  'upload': { opposite: 'download', resultVerb: 'downloaded', symbol: '✓' },

  // Security & Visibility
  'lock': { opposite: 'unlock', resultVerb: 'unlocked', symbol: '✓' },
  'unlock': { opposite: 'lock', resultVerb: 'locked', symbol: '✓' },
  'hide': { opposite: 'show', resultVerb: 'revealed', symbol: '✓' },
  'show': { opposite: 'hide', resultVerb: 'hidden', symbol: '✓' },

  // Extended funny pairs
  'rename': { opposite: 'keep-name', resultVerb: 'kept unchanged', symbol: '✓' },
  'compress': { opposite: 'expand', resultVerb: 'expanded', symbol: '✓' },
  'zip': { opposite: 'unzip', resultVerb: 'unzipped', symbol: '✓' },
  'unzip': { opposite: 'zip', resultVerb: 'zipped', symbol: '✓' },
  'connect': { opposite: 'disconnect', resultVerb: 'disconnected', symbol: '✓' },
  'disconnect': { opposite: 'connect', resultVerb: 'connected', symbol: '✓' },
  'enable': { opposite: 'disable', resultVerb: 'disabled', symbol: '✓' },
  'disable': { opposite: 'enable', resultVerb: 'enabled', symbol: '✓' },
  'encrypt': { opposite: 'decrypt', resultVerb: 'decrypted', symbol: '✓' },
  'decrypt': { opposite: 'encrypt', resultVerb: 'encrypted', symbol: '✓' }
};

export const NAVIGATION_COMMANDS = new Set([
  'ls',
  'dir',
  'cd',
  'pwd',
  'clear',
  'help',
  'history',
  'tree',
  'status',
  'atbash'
]);

export function classifyCommand(input: string): ClassifiedCommand {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      category: 'UNKNOWN',
      rawInput: input,
      originalVerb: '',
      args: []
    };
  }

  const parts = trimmed.split(/\s+/);
  const originalVerb = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (NAVIGATION_COMMANDS.has(originalVerb)) {
    return {
      category: 'NAVIGATION',
      rawInput: input,
      originalVerb,
      args
    };
  }

  if (OPPOSITE_COMMANDS[originalVerb]) {
    const opp = OPPOSITE_COMMANDS[originalVerb];
    return {
      category: 'ACTION',
      rawInput: input,
      originalVerb,
      oppositeVerb: opp.opposite,
      args
    };
  }

  return {
    category: 'UNKNOWN',
    rawInput: input,
    originalVerb,
    args
  };
}
