import os
import shutil
import stat
from typing import Dict, List, Tuple, Optional, Any

class CommandEngine:
    """
    Reverse Shell Command Interception & 2-Tier Translation Engine.
    Handles command classification, opposite resolution, and safe execution
    within the workspace sandbox (~/PookieTerminalWorkspace/).
    """

    NAVIGATION_COMMANDS = {
        'ls', 'dir', 'cd', 'pwd', 'echo', 'cat', 'less', 'more',
        'head', 'tail', 'grep', 'find', 'which', 'whoami', 'clear',
        'help', 'history', 'tree', 'uname', 'date', 'who', 'id', 'ps'
    }

    OPPOSITE_REGISTRY: Dict[str, Dict[str, str]] = {
        'delete': {'opposite': 'create', 'result_verb': 'created', 'symbol': '✓'},
        'remove': {'opposite': 'save', 'result_verb': 'saved', 'symbol': '✓'},
        'rm': {'opposite': 'save', 'result_verb': 'saved', 'symbol': '✓'},
        'save': {'opposite': 'remove', 'result_verb': 'removed', 'symbol': '✓'},
        'create': {'opposite': 'delete', 'result_verb': 'deleted', 'symbol': '✓'},
        'touch': {'opposite': 'delete', 'result_verb': 'deleted', 'symbol': '✓'},
        'mk': {'opposite': 'delete', 'result_verb': 'deleted', 'symbol': '✓'},
        'copy': {'opposite': 'move', 'result_verb': 'moved', 'symbol': '✓'},
        'cp': {'opposite': 'move', 'result_verb': 'moved', 'symbol': '✓'},
        'move': {'opposite': 'copy', 'result_verb': 'copied', 'symbol': '✓'},
        'mv': {'opposite': 'copy', 'result_verb': 'copied', 'symbol': '✓'},
        'lock': {'opposite': 'unlock', 'result_verb': 'unlocked', 'symbol': '✓'},
        'unlock': {'opposite': 'lock', 'result_verb': 'locked', 'symbol': '✓'},
        'hide': {'opposite': 'show', 'result_verb': 'revealed', 'symbol': '✓'},
        'show': {'opposite': 'hide', 'result_verb': 'hidden', 'symbol': '✓'},
        'open': {'opposite': 'close', 'result_verb': 'closed', 'symbol': '✓'},
        'close': {'opposite': 'open', 'result_verb': 'opened', 'symbol': '✓'},
        'exit': {'opposite': 'stay', 'result_verb': "you're still here, pookie ♡", 'symbol': '☺'},
        'quit': {'opposite': 'stay', 'result_verb': "you're still here, pookie ♡", 'symbol': '☺'}
    }

    def __init__(self, workspace_path: Optional[str] = None):
        if workspace_path is None:
            workspace_path = os.path.expanduser("~/PookieTerminalWorkspace")
        self.workspace_path = os.path.abspath(workspace_path)
        self._ensure_workspace()

    def _ensure_workspace(self):
        """Seed a clean, safe workspace for terminal demos."""
        os.makedirs(self.workspace_path, exist_ok=True)

        # Seed sample files & folders if workspace is fresh
        sample_file = os.path.join(self.workspace_path, "file.txt")
        if not os.path.exists(sample_file):
            with open(sample_file, "w") as f:
                f.write("Pookie Native Terminal Sample File ♡\n")

        secret_file = os.path.join(self.workspace_path, "secret-plan.txt")
        if not os.path.exists(secret_file):
            with open(secret_file, "w") as f:
                f.write("Plan: Reverse shell action commands while keeping shell navigation normal ♡\n")

        projects_dir = os.path.join(self.workspace_path, "projects")
        os.makedirs(projects_dir, exist_ok=True)

    def _resolve_safe_path(self, relative_path: str) -> str:
        """Resolve path and verify it stays inside workspace boundary."""
        if not relative_path:
            return self.workspace_path
        target = os.path.abspath(os.path.join(self.workspace_path, relative_path))
        if not target.startswith(self.workspace_path):
            raise PermissionError(f"Security error: Path '{relative_path}' escapes workspace boundary!")
        return target

    def classify(self, raw_command: str) -> Tuple[str, str, List[str]]:
        """
        Classifies input as 'NAVIGATION', 'ACTION', or 'UNKNOWN'.
        Returns (category, verb, args).
        """
        trimmed = raw_command.strip()
        if not trimmed:
            return 'UNKNOWN', '', []

        parts = trimmed.split()
        verb = parts[0].lower()
        args = parts[1:]

        if verb in self.NAVIGATION_COMMANDS:
            return 'NAVIGATION', verb, args
        if verb in self.OPPOSITE_REGISTRY:
            return 'ACTION', verb, args
        return 'UNKNOWN', verb, args

    def process_action_command(self, verb: str, args: List[str]) -> Tuple[str, str, str, str]:
        """
        Executes Tier 1 (Semantic opposite lookup) and Tier 2 (Concrete filesystem/OS operation).
        Returns (opposite_verb, stage_msg, result_msg, symbol).
        """
        config = self.OPPOSITE_REGISTRY.get(verb, {'opposite': 'do_nothing', 'result_verb': 'done', 'symbol': '✓'})
        opposite_verb = config['opposite']
        symbol = config['symbol']
        target_name = args[0] if len(args) > 0 else 'item'
        dest_name = args[1] if len(args) > 1 else ''

        stage_msg = f"↳ Opposite operation: {opposite_verb.upper()} { ' '.join(args) }".strip()

        try:
            if opposite_verb == 'create':
                # Opposite of delete/touch -> create file or directory
                target_path = self._resolve_safe_path(target_name)
                if '.' in target_name:
                    with open(target_path, 'w') as f:
                        f.write(f"Created by Pookie Terminal opposite action ♡\n")
                    result_msg = f"✓ {target_name} file created ♡"
                else:
                    os.makedirs(target_path, exist_ok=True)
                    result_msg = f"✓ {target_name} directory created ♡"

            elif opposite_verb == 'save':
                # Opposite of remove -> save/create file
                target_path = self._resolve_safe_path(target_name)
                with open(target_path, 'a') as f:
                    f.write(f"Saved payload by Pookie Terminal ♡\n")
                result_msg = f"✓ {target_name} saved ♡"

            elif opposite_verb == 'remove' or opposite_verb == 'delete':
                # Opposite of save/create -> remove file/folder
                target_path = self._resolve_safe_path(target_name)
                if os.path.exists(target_path):
                    if os.path.isdir(target_path):
                        shutil.rmtree(target_path)
                    else:
                        os.remove(target_path)
                    result_msg = f"✓ {target_name} removed ♡"
                else:
                    result_msg = f"✓ {target_name} removed from workspace existence ♡"

            elif opposite_verb == 'move':
                # Opposite of copy -> move file
                src_path = self._resolve_safe_path(target_name)
                dest_path = self._resolve_safe_path(dest_name or f"moved_{target_name}")
                if os.path.exists(src_path):
                    shutil.move(src_path, dest_path)
                else:
                    with open(dest_path, 'w') as f:
                        f.write("Moved payload ♡\n")
                result_msg = f"✓ {target_name} moved to {os.path.basename(dest_path)} ♡"

            elif opposite_verb == 'copy':
                # Opposite of move -> copy file
                src_path = self._resolve_safe_path(target_name)
                dest_path = self._resolve_safe_path(dest_name or f"copy_{target_name}")
                if os.path.exists(src_path):
                    if os.path.isdir(src_path):
                        shutil.copytree(src_path, dest_path, dirs_exist_ok=True)
                    else:
                        shutil.copy2(src_path, dest_path)
                else:
                    with open(dest_path, 'w') as f:
                        f.write("Copied payload ♡\n")
                result_msg = f"✓ {target_name} copied to {os.path.basename(dest_path)} ♡"

            elif opposite_verb == 'unlock':
                # Opposite of lock -> add write permissions
                target_path = self._resolve_safe_path(target_name)
                if os.path.exists(target_path):
                    os.chmod(target_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
                result_msg = f"✓ {target_name} unlocked ♡"

            elif opposite_verb == 'lock':
                # Opposite of unlock -> make read-only
                target_path = self._resolve_safe_path(target_name)
                if os.path.exists(target_path):
                    os.chmod(target_path, stat.S_IRUSR | stat.S_IRGRP | stat.S_IROTH)
                result_msg = f"✓ {target_name} locked ♡"

            elif opposite_verb == 'stay':
                # Opposite of exit -> stay in terminal
                result_msg = "☺ You're still here, pookie ♡"

            else:
                result_msg = f"✓ {target_name} {config['result_verb']} ♡"

        except Exception as e:
            result_msg = f"✗ Operation failed: {str(e)}"

        return opposite_verb, stage_msg, result_msg, symbol
