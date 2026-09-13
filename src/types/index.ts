export type CommandCategory = 'NAVIGATION' | 'ACTION' | 'UNKNOWN';

export interface FileNode {
  type: 'file';
  name: string;
  content: string;
  isLocked?: boolean;
  isHidden?: boolean;
  size?: string;
  updatedAt?: string;
}

export interface DirectoryNode {
  type: 'directory';
  name: string;
  children: Record<string, FileNode | DirectoryNode>;
  isLocked?: boolean;
  isHidden?: boolean;
  updatedAt?: string;
}

export type FSNode = FileNode | DirectoryNode;

export interface ClassifiedCommand {
  category: CommandCategory;
  rawInput: string;
  originalVerb: string;
  oppositeVerb?: string;
  args: string[];
}

export interface StagedOutputLog {
  id: string;
  command: string;
  cwd: string;
  timestamp: string;
  category: CommandCategory;
  originalVerb: string;
  oppositeVerb?: string;
  args: string[];
  stageLine?: string; // e.g. "↳ create project"
  resultLine?: string; // e.g. "✓ project has been created ♡"
  resultType?: 'success' | 'error' | 'info' | 'cute';
  customSymbol?: string; // e.g. "☺" or "✓" or "♡"
}
