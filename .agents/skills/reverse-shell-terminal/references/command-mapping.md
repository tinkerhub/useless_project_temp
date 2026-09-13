# Command Mappings & 2-Tier Translation Registry

This document defines the opposite-command lookup table, argument translation rules, and navigation passthrough whitelist for the native Linux terminal application.

---

## 1. Navigation & System Command Whitelist (DO NOT INVERT)

The following commands bypass the opposite resolver completely and execute directly through the underlying Bash shell:

```python
NAVIGATION_COMMANDS = {
    'ls', 'dir', 'cd', 'pwd', 'echo', 'cat', 'less', 'more',
    'head', 'tail', 'grep', 'find', 'which', 'whoami', 'clear',
    'help', 'history', 'tree', 'uname', 'date'
}
```

---

## 2. 2-Tier Translation Layer Architecture

```
User Input: "delete project"
 ├── Tier 1 (Semantic Resolver): delete ↔ create
 └── Tier 2 (Concrete Execution):
       If argument is folder -> os.makedirs("~/PookieTerminalWorkspace/project")
       If argument has extension -> touch file
```

### 2.1 Mappings Registry

```python
OPPOSITE_REGISTRY = {
    'delete': {
        'opposite': 'create',
        'result_verb': 'created',
        'symbol': '✓'
    },
    'remove': {
        'opposite': 'save',
        'result_verb': 'saved',
        'symbol': '✓'
    },
    'rm': {
        'opposite': 'save',
        'result_verb': 'saved',
        'symbol': '✓'
    },
    'save': {
        'opposite': 'remove',
        'result_verb': 'removed',
        'symbol': '✓'
    },
    'create': {
        'opposite': 'delete',
        'result_verb': 'deleted',
        'symbol': '✓'
    },
    'copy': {
        'opposite': 'move',
        'result_verb': 'moved',
        'symbol': '✓'
    },
    'cp': {
        'opposite': 'move',
        'result_verb': 'moved',
        'symbol': '✓'
    },
    'move': {
        'opposite': 'copy',
        'result_verb': 'copied',
        'symbol': '✓'
    },
    'mv': {
        'opposite': 'copy',
        'result_verb': 'copied',
        'symbol': '✓'
    },
    'lock': {
        'opposite': 'unlock',
        'result_verb': 'unlocked',
        'symbol': '✓'
    },
    'unlock': {
        'opposite': 'lock',
        'result_verb': 'locked',
        'symbol': '✓'
    },
    'hide': {
        'opposite': 'show',
        'result_verb': 'revealed',
        'symbol': '✓'
    },
    'show': {
        'opposite': 'hide',
        'result_verb': 'hidden',
        'symbol': '✓'
    },
    'exit': {
        'opposite': 'stay',
        'result_verb': "you're still here, pookie ♡",
        'symbol': '☺'
    }
}
```

---

## 3. Argument Translation Rules

- **Single Target**: `delete project` → opposite `create` → creates directory `project`.
- **Dual Targets**: `copy src.txt dest.txt` → opposite `move` → moves `src.txt` to `dest.txt` via `shutil.move` / `mv`.
- **Exit Interception**: `exit` → opposite `stay` → outputs `☺ You're still here, pookie ♡`. Shell process remains running.
