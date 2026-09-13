---
name: reverse-shell-terminal
description: Architectural instructions, design guidelines, and implementation rules for building, modifying, debugging, and extending a native Linux desktop terminal application (Python 3 + PySide6 + POSIX PTY/Bash) called "Pookie Reverse Terminal". Features real PTY/shell integration, normal navigation passthrough (cd, ls, pwd), command interception with opposite action semantics, workspace sandboxing, PySide6 terminal UI inspired by the Pookie web prototype, security boundaries, and automated testing.
---

# Pookie Reverse Terminal — Native Linux Agent Skill Guide

## 1. Purpose & Core Philosophy

**Pookie Reverse Terminal** is a native Linux desktop application built with Python 3, PySide6 (Qt for Python), and POSIX Pseudo-Terminals (`pty`).

Unlike a web prototype or terminal mock simulator, this is a **real native Linux terminal application** attached to an actual shell child process (e.g. `/bin/bash`).

- **Real Shell & Real PTY**: Interacts with the Linux OS, executes real commands, renders real shell output, and manages standard terminal signals (`Ctrl+C`, `SIGWINCH` resize).
- **Layered Command Interception**: Intercepts user action commands *before* they reach the shell, resolving them to their conceptual opposite (e.g. `delete` → `create`, `copy` → `move`, `lock` → `unlock`, `exit` → `stay`).
- **Normal Navigation Passthrough**: System navigation commands (`cd`, `ls`, `pwd`, `dir`, `echo`, `cat`) bypass the opposite resolver completely, executing directly through the shell.
- **Workspace Sandboxing**: Operates inside a dedicated working directory (`~/PookieTerminalWorkspace/`) to prevent accidental host system mutations during hackathon demos.
- **Visual Design**: Preserves the dark purple aesthetic, ASCII pixel cat header, and staged output logs from the existing Pookie web prototype reference.

---

## 2. Activation & Trigger Conditions

Activate this skill whenever:
1. You are asked to build, modify, debug, or extend the **native Linux Reverse Terminal application**.
2. The task involves integrating **POSIX PTY (`pty.openpty()`)**, Python `subprocess`, or `PySide6` desktop UI components for terminal emulation.
3. You need to implement **real-time command interception**, **2-tier opposite command resolution**, or **workspace sandboxing**.
4. You are creating automated tests or packaging the native Linux application (e.g. via PyInstaller).

---

## 3. Core Architecture & Pipeline

The native application MUST maintain a clear separation of concerns:

```
┌───────────────────────────────────────────────────────────┐
│ User Input (PySide6 Terminal UI Widget)                   │
└───────────────────────────┬───────────────────────────────┘
                            │ (Raw Command String on Enter)
                            ▼
┌───────────────────────────────────────────────────────────┐
│ Command Classifier & Parser                               │
└─────────────┬───────────────────────────────┬─────────────┘
              │                               │
   (Navigation / Normal)              (Action Commands)
              │                               │
              ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│ Direct PTY Shell Output   │   │ Opposite Command Resolver │
│ (Pass directly to Bash)   │   │ (delete ↔ create, etc.)   │
└─────────────┬─────────────┘   └─────────────┬─────────────┘
              │                               │
              │                               ▼
              │                 ┌───────────────────────────┐
              │                 │ 2-Tier Translation        │
              │                 │ (Semantic -> Concrete)    │
              │                 └─────────────┬─────────────┘
              │                               │
              ▼                               ▼
┌───────────────────────────────────────────────────────────┐
│ Real POSIX PTY Master File Descriptor & Child Bash Shell   │
│ (Target Workspace: ~/PookieTerminalWorkspace/)            │
└───────────────────────────┬───────────────────────────────┘
                            │ (Raw Shell Stream stdout/stderr)
                            ▼
┌───────────────────────────────────────────────────────────┐
│ Staged Visual Output Renderer (PySide6 Terminal Display)   │
└───────────────────────────────────────────────────────────┘
```

For detailed architectural sequence diagrams and component contracts, consult [architecture.md](file:///.agents/skills/reverse-shell-terminal/references/architecture.md).

---

## 4. Native PTY & Shell Subprocess Architecture

### 4.1 PTY Creation & Lifecycle
- Spawn child shell (`/bin/bash` or `$SHELL`) attached to a POSIX pseudo-terminal using Python `pty.openpty()`.
- Use `fcntl` / `select` or Qt `QSocketNotifier` for asynchronous, non-blocking reading of the PTY master file descriptor.
- Handle terminal resize signals (`struct winsize` with `fcntl.ioctl(fd, termios.TIOCSWINSZ, ...)`).
- Intercept control characters (`Ctrl+C` sends `SIGINT` to child process group).

For step-by-step PTY code patterns, consult [pty-and-shell.md](file:///.agents/skills/reverse-shell-terminal/references/pty-and-shell.md).

---

## 5. Centralized Opposite Command System (2-Tier Translation)

Action command inversion operates through a 2-tier translation layer:

1. **Tier 1 (Semantic Resolution)**: User Verb → Opposite Verb (`delete` → `create`, `remove` → `save`, `copy` → `move`, `exit` → `stay`).
2. **Tier 2 (Concrete Execution)**: Opposite Verb + Arguments → Real OS/Filesystem Call or Executable Command (e.g. `move a.txt b.txt` → `mv a.txt b.txt`, `delete folder` → `rm -rf folder`).

### 5.1 Command Classification Table

| Input Command | Category | Resolution Strategy |
| :--- | :--- | :--- |
| `ls`, `pwd`, `cd <dir>`, `cat` | `NAVIGATION` | Pass raw input directly to PTY master |
| `delete <target>` | `ACTION` | Resolves to `create <target>` → Calls FS API / `touch` |
| `remove <target>` / `save` | `ACTION` | Resolves to `save`/`remove` opposite mutation |
| `copy <src> <dest>` | `ACTION` | Resolves to `move <src> <dest>` → Executes `mv` |
| `lock <target>` / `unlock` | `ACTION` | Toggles file permissions (`chmod -w` / `chmod +w`) |
| `exit` | `ACTION` | Intercepted as `stay` → Prints funny message, shell stays alive |

For full command mapping registry definitions and extension rules, consult [command-mapping.md](file:///.agents/skills/reverse-shell-terminal/references/command-mapping.md).

---

## 6. Workspace Sandboxing & Safety Boundaries

To prevent accidental host machine damage:
1. **Workspace Root**: Default initial directory MUST be restricted to `~/PookieTerminalWorkspace/`. Create the directory automatically on startup.
2. **Path Traversal Protection**: Reject or sandbox target paths that attempt to escape `~/PookieTerminalWorkspace/` (e.g. `delete /usr/bin`).
3. **Non-Root Execution**: Refuse execution if launched with `root` / `sudo` privileges.
4. **Command Injection Prevention**: Never construct executable shell commands via unsafe string formatting or `shell=True` with unvalidated user input.

For security rules and boundary details, consult [security.md](file:///.agents/skills/reverse-shell-terminal/references/security.md).

---

## 7. Native Desktop UI (PySide6)

The native Qt desktop application MUST visually preserve the spirit of the Pookie web prototype:

- **Window Layout**: Custom frameless or dark-themed window container with macOS-style dots and title `pookie@reverse: ~`.
- **Typography & Canvas**: Monospace font (`Fira Code` / `DejaVu Sans Mono`), midnight dark purple background (`#0e0b18`).
- **Pixel Cat Banner**: Render top ASCII cat header on startup.
- **Staged Visual Logs**:
  ```text
  pookie@reverse:~$ delete project
    ↳ Interpreting...
    ↳ Opposite operation: CREATE
    ↳ Executing real filesystem operation...
    ✓ project created ♡
  ```

For UI layout specs and Qt stylesheet definitions, consult [terminal-ui.md](file:///.agents/skills/reverse-shell-terminal/references/terminal-ui.md).

---

## 8. Testing & Packaging Guidelines

- **Test Suite**: Includes unit tests for parser tokenization, opposite registry lookup, workspace sandboxing, PTY master read/write, and PySide6 UI event handling.
- **Standalone Linux Binary**: Bundle application into a single executable using `PyInstaller`:
  ```bash
  pyinstaller --noconfirm --onedir --windowed --name "PookieTerminal" app.py
  ```

For test specs and packaging commands, consult [testing.md](file:///.agents/skills/reverse-shell-terminal/references/testing.md).

---

## 9. Progressive Disclosure Reference Links

- [Architecture & Sequence Diagrams](file:///.agents/skills/reverse-shell-terminal/references/architecture.md)
- [PTY & Shell Process Management](file:///.agents/skills/reverse-shell-terminal/references/pty-and-shell.md)
- [Command Registry & 2-Tier Translation](file:///.agents/skills/reverse-shell-terminal/references/command-mapping.md)
- [PySide6 Terminal UI Design](file:///.agents/skills/reverse-shell-terminal/references/terminal-ui.md)
- [Security & Workspace Boundaries](file:///.agents/skills/reverse-shell-terminal/references/security.md)
- [Testing & Linux Packaging](file:///.agents/skills/reverse-shell-terminal/references/testing.md)
