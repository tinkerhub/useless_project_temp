import React from 'react';
import { DirectoryNode, FileNode } from '../types';
import { Folder, FileText, Lock, EyeOff, CheckCircle2 } from 'lucide-react';

interface FileTreeDrawerProps {
  rootNode: DirectoryNode;
  currentPath: string;
  onClose: () => void;
}

export const FileTreeDrawer: React.FC<FileTreeDrawerProps> = ({ rootNode, currentPath, onClose }) => {
  const renderNode = (node: DirectoryNode | FileNode, depth = 0) => {
    if (node.type === 'directory') {
      const childrenKeys = Object.keys(node.children);
      return (
        <div key={node.name} style={{ paddingLeft: `${depth * 14}px` }} className="my-1">
          <div className="flex items-center gap-1.5 text-xs text-pink-300 font-semibold py-0.5">
            <Folder className="w-3.5 h-3.5 text-pink-400 fill-pink-400/20" />
            <span>{node.name}/</span>
          </div>
          {childrenKeys.length > 0 && (
            <div className="border-l border-pink-500/20 ml-1.5 pl-1">
              {childrenKeys.map(key => renderNode(node.children[key], depth + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div key={node.name} style={{ paddingLeft: `${depth * 14}px` }} className="flex items-center gap-1.5 text-xs text-purple-200 py-0.5">
          <FileText className="w-3.5 h-3.5 text-purple-400" />
          <span>{node.name}</span>
          {node.isLocked && <span title="Locked"><Lock className="w-3 h-3 text-amber-400" /></span>}
          {node.isHidden && <span title="Hidden"><EyeOff className="w-3 h-3 text-gray-500" /></span>}
          {node.size && <span className="text-[10px] text-gray-500 font-mono ml-auto">{node.size}</span>}
        </div>
      );
    }
  };

  return (
    <div className="file-tree-panel border-l border-pink-500/20 bg-[#120f21] p-4 flex flex-col h-full w-72 text-gray-200">
      <div className="flex items-center justify-between border-b border-pink-500/20 pb-3 mb-3">
        <h3 className="text-sm font-semibold text-pink-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-pink-400" /> Live In-Memory FS
        </h3>
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-pink-300 px-2 py-0.5 rounded border border-gray-700 hover:border-pink-500/40"
        >
          Close
        </button>
      </div>

      <div className="text-[11px] text-gray-400 mb-2 font-mono">
        Active Directory: <span className="text-pink-300">{currentPath}</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {renderNode(rootNode.children['home'] as DirectoryNode)}
      </div>

      <div className="mt-3 pt-3 border-t border-pink-500/20 text-[11px] text-gray-400 italic">
        * Opposite commands automatically mutate this state in real-time! ♡
      </div>
    </div>
  );
};
