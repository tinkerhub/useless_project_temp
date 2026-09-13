# Native Linux Reverse Terminal Architecture

This document details the system architecture, component boundaries, and data flow for the **Pookie Reverse Terminal** native Linux application.

---

## 1. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph UI ["PySide6 Qt Desktop UI"]
        A[Terminal Canvas / Key Listener] --> B[Line Buffer & Parser]
    end

    subgraph Core ["Reverse Shell Engine"]
        B --> C{Command Classifier}
        C -- Navigation / System --> D[Direct PTY Writer]
        C -- Action Command --> E[Opposite Command Resolver]
        E --> F[2-Tier Concrete Executor]
        F --> D
    end

    subgraph OS ["Linux System Sandbox"]
        D --> G[PTY Master FD]
        G <--> H[PTY Slave FD]
        H <--> I[Bash Process ($SHELL)]
        I <--> J[Workspace: ~/PookieTerminalWorkspace/]
    end

    G --> K[QSocketNotifier / Reader Thread]
    K --> L[Staged Terminal Visual Output]
    L --> A
```

---

## 2. Component Specifications

### 2.1 UI Thread (`PySide6.QtWidgets`)
- **`MainWindow`**: Main Qt application window with custom dark theme, header bar, and status indicators.
- **`TerminalWidget`**: Custom QPlainTextEdit or QWidget subclass rendering terminal output line-by-line with ANSI color code decoding and prompt control.

### 2.2 Shell Controller (`PTYManager`)
- Manages PTY master (`master_fd`) and slave (`slave_fd`) file descriptors via Python `pty.openpty()`.
- Spawns child process running `/bin/bash` with working directory set to `~/PookieTerminalWorkspace/`.
- Uses `QSocketNotifier(master_fd, QSocketNotifier.Read)` to asynchronously receive shell output on the Qt event loop.

### 2.3 Command Interceptor (`ReverseEngine`)
- **Tokenizer**: Splits user input into `verb` and `arguments`.
- **Classifier**: Matches verb against `NAVIGATION_COMMANDS` whitelist vs `OPPOSITE_COMMANDS` registry.
- **Resolver**: Replaces verb with conceptual opposite and translates to concrete execution steps.

---

## 3. Data Processing Sequence

```
1. User types "delete project" and presses Enter.
2. TerminalWidget captures text before sending to master_fd.
3. ReverseEngine classifies "delete" as ACTION command.
4. OppositeResolver maps "delete" -> "create".
5. ConcreteExecutor transforms "create project" -> mkdir("~/PookieTerminalWorkspace/project").
6. Staged Visual Output renders stage logs:
   ↳ Interpreting...
   ↳ Opposite operation: CREATE
   ✓ project created ♡
7. PTY master_fd receives sync signal; working directory state updates.
```
