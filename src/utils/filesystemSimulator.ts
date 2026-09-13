import { DirectoryNode, FileNode, FSNode } from '../types';

export class FileSystemSimulator {
  private root: DirectoryNode;
  private currentPath: string[]; // e.g. ['home', 'pookie'] represented as ~

  constructor() {
    this.root = {
      type: 'directory',
      name: 'root',
      updatedAt: '2026-09-13',
      children: {
        'home': {
          type: 'directory',
          name: 'home',
          children: {
            'pookie': {
              type: 'directory',
              name: 'pookie',
              children: {
                'file.txt': {
                  type: 'file',
                  name: 'file.txt',
                  content: 'Welcome to Pookie Terminal! Same commands, opposite results. ♡',
                  size: '1.2 KB',
                  updatedAt: '2026-09-13'
                },
                'project': {
                  type: 'directory',
                  name: 'project',
                  children: {
                    'main.ts': {
                      type: 'file',
                      name: 'main.ts',
                      content: 'console.log("Pookie Power! ♡");',
                      size: '420 B'
                    }
                  }
                },
                'projects': {
                  type: 'directory',
                  name: 'projects',
                  children: {
                    'reverse-shell': {
                      type: 'directory',
                      name: 'reverse-shell',
                      children: {
                        'readme.md': {
                          type: 'file',
                          name: 'readme.md',
                          content: '# Reverse Shell Hackathon Project\nThe terminal that does the opposite! ♡',
                          size: '850 B'
                        }
                      }
                    },
                    'secret-plan.txt': {
                      type: 'file',
                      name: 'secret-plan.txt',
                      content: 'Plan A: Reverse all commands. Plan B: Add cute hearts. ♡',
                      isLocked: true,
                      size: '2.1 KB'
                    }
                  }
                },
                'documents': {
                  type: 'directory',
                  name: 'documents',
                  children: {
                    'report.txt': {
                      type: 'file',
                      name: 'report.txt',
                      content: 'Confidential Pookie Report 2026 ♡',
                      size: '3.4 KB'
                    }
                  }
                },
                'downloads': {
                  type: 'directory',
                  name: 'downloads',
                  children: {
                    'archive.zip': {
                      type: 'file',
                      name: 'archive.zip',
                      content: '[Compressed Archive Payload]',
                      size: '14.2 MB'
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    // Default path is /home/pookie (~ in prompt)
    this.currentPath = ['home', 'pookie'];
  }

  /** Get prompt path formatting (e.g. ~ or ~/projects) */
  public getPromptPath(): string {
    if (this.currentPath.length === 2 && this.currentPath[0] === 'home' && this.currentPath[1] === 'pookie') {
      return '~';
    }
    if (this.currentPath.length > 2 && this.currentPath[0] === 'home' && this.currentPath[1] === 'pookie') {
      return '~/' + this.currentPath.slice(2).join('/');
    }
    return '/' + this.currentPath.join('/');
  }

  /** Get absolute path string */
  public getAbsolutePath(): string {
    return '/' + this.currentPath.join('/');
  }

  /** Get current directory node */
  public getCurrentDir(): DirectoryNode {
    let curr: DirectoryNode = this.root;
    for (const dirName of this.currentPath) {
      if (curr.children[dirName] && curr.children[dirName].type === 'directory') {
        curr = curr.children[dirName] as DirectoryNode;
      }
    }
    return curr;
  }

  /** Entire FS Tree for visual drawer */
  public getRoot(): DirectoryNode {
    return this.root;
  }

  // --- Layer 3: Navigation Commands ---

  public pwd(): string {
    return this.getPromptPath();
  }

  public ls(): { name: string; type: 'file' | 'directory'; isLocked?: boolean; isHidden?: boolean }[] {
    const dir = this.getCurrentDir();
    return Object.values(dir.children)
      .filter(node => !node.isHidden)
      .map(node => ({
        name: node.name,
        type: node.type,
        isLocked: node.isLocked,
        isHidden: node.isHidden
      }));
  }

  public cd(targetPath: string): { success: boolean; message: string } {
    if (!targetPath || targetPath === '~') {
      this.currentPath = ['home', 'pookie'];
      return { success: true, message: `Navigated to ~` };
    }

    if (targetPath === '/') {
      this.currentPath = [];
      return { success: true, message: `Navigated to /` };
    }

    const segments = targetPath.split('/').filter(Boolean);
    let tempPath = targetPath.startsWith('/') ? [] : [...this.currentPath];

    if (targetPath.startsWith('~')) {
      tempPath = ['home', 'pookie'];
      const rest = targetPath.slice(1).split('/').filter(Boolean);
      segments.splice(0, segments.length, ...rest);
    }

    for (const seg of segments) {
      if (seg === '.') continue;
      if (seg === '..') {
        if (tempPath.length > 0) {
          tempPath.pop();
        }
      } else {
        // Resolve dir
        let curr: DirectoryNode = this.root;
        for (const p of tempPath) {
          if (curr.children[p] && curr.children[p].type === 'directory') {
            curr = curr.children[p] as DirectoryNode;
          }
        }
        if (curr.children[seg] && curr.children[seg].type === 'directory') {
          tempPath.push(seg);
        } else {
          return { success: false, message: `cd: no such file or directory: ${targetPath}` };
        }
      }
    }

    this.currentPath = tempPath;
    return { success: true, message: `Navigated to ${this.getPromptPath()}` };
  }

  // --- Layer 2: Opposite State Mutation Handlers ---

  /** Opposite of delete -> create */
  public executeOppositeCreate(targetName: string): string {
    const name = targetName || 'new_pookie_project';
    const dir = this.getCurrentDir();
    
    // Create node if not exists
    if (!dir.children[name]) {
      // If extension present, create file; else create folder
      if (name.includes('.')) {
        dir.children[name] = {
          type: 'file',
          name,
          content: 'Created by Pookie Terminal opposite magic ♡',
          size: '1.0 KB',
          updatedAt: '2026-09-13'
        };
      } else {
        dir.children[name] = {
          type: 'directory',
          name,
          children: {},
          updatedAt: '2026-09-13'
        };
      }
    }
    return `${name} has been created ♡`;
  }

  /** Opposite of save/remove -> remove/save */
  public executeOppositeSave(targetName: string): string {
    const name = targetName || 'pookie_note.txt';
    const dir = this.getCurrentDir();
    dir.children[name] = {
      type: 'file',
      name,
      content: 'Saved with opposite love ♡',
      size: '2.5 KB',
      updatedAt: '2026-09-13'
    };
    return `${name} has been saved ♡`;
  }

  public executeOppositeRemove(targetName: string): string {
    const name = targetName || 'file.txt';
    const dir = this.getCurrentDir();
    if (dir.children[name]) {
      delete dir.children[name];
      return `${name} has been removed ♡`;
    }
    return `${name} was not found, but removed from existence ♡`;
  }

  public executeOppositeMove(src: string, dest: string): string {
    const dir = this.getCurrentDir();
    const sourceName = src || 'file.txt';
    const destName = dest || 'moved_file.txt';

    if (dir.children[sourceName]) {
      const node = dir.children[sourceName];
      delete dir.children[sourceName];
      node.name = destName;
      dir.children[destName] = node;
      return `${sourceName} moved to ${destName} ♡`;
    }
    // Create dest if src not existing
    dir.children[destName] = {
      type: 'file',
      name: destName,
      content: 'Moved payload ♡',
      size: '1.1 KB'
    };
    return `${sourceName} moved to ${destName} ♡`;
  }

  public executeOppositeCopy(src: string, dest: string): string {
    const dir = this.getCurrentDir();
    const sourceName = src || 'file.txt';
    const destName = dest || 'copied_file.txt';

    dir.children[destName] = {
      type: 'file',
      name: destName,
      content: 'Copied content from opposite universe ♡',
      size: '1.1 KB'
    };
    return `${sourceName} copied to ${destName} ♡`;
  }

  public executeOppositeUnlock(targetName: string): string {
    const name = targetName || 'secret.txt';
    const dir = this.getCurrentDir();
    if (dir.children[name]) {
      dir.children[name].isLocked = false;
    }
    return `${name} has been unlocked ♡`;
  }

  public executeOppositeLock(targetName: string): string {
    const name = targetName || 'secret.txt';
    const dir = this.getCurrentDir();
    if (dir.children[name]) {
      dir.children[name].isLocked = true;
    }
    return `${name} has been locked ♡`;
  }

  public executeOppositeShow(targetName: string): string {
    const name = targetName || 'hidden_file.txt';
    const dir = this.getCurrentDir();
    if (dir.children[name]) {
      dir.children[name].isHidden = false;
    }
    return `${name} has been revealed ♡`;
  }

  public executeOppositeHide(targetName: string): string {
    const name = targetName || 'file.txt';
    const dir = this.getCurrentDir();
    if (dir.children[name]) {
      dir.children[name].isHidden = true;
    }
    return `${name} has been hidden ♡`;
  }

  public executeOppositeOpen(targetName: string): string {
    const name = targetName || 'file.txt';
    return `${name} has been opened in opposite viewer ♡`;
  }

  public executeOppositeClose(targetName: string): string {
    const name = targetName || 'file.txt';
    return `${name} has been closed ♡`;
  }
}
