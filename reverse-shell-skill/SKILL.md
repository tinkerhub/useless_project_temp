---
name: reverse-shell
description: Architectural instructions, design guidelines, and implementation rules for building, modifying, debugging, and extending "Reverse Shell" — a hackathon terminal web application that intentionally executes the conceptual opposite of action commands while preserving normal filesystem navigation and optional Atbash keyboard reversal.
---

# Reverse Shell — Agent Skill Guide

## 1. Purpose & Core Philosophy

**Reverse Shell** is a deliberately hilarious, technically convincing hackathon web application. Visually, it looks and feels like a modern developer terminal, but functionally, it intentionally executes the **conceptual opposite** of whatever action command the user enters.

- Action commands are inverted (e.g., `remove` becomes `save`, `copy` becomes `move`, `lock` becomes `unlock`).
- Navigation commands (`cd`, `ls`, `pwd`) remain **completely normal** so the user can navigate the terminal logically.
- An optional **Keyboard Reversal** mode applies Atbash-style letter reversal (`a` ↔ `z`, `b` ↔ `y`) as a visual/input transformation layer.

This skill equips an AI coding agent with the exact architectural patterns, state models, UI rules, test suites, and extension mechanisms needed to build, modify, debug, or extend the Reverse Shell web application safely and predictably.

---

## 2. Activation & Trigger Conditions

Activate this skill whenever:
1. You are asked to build, modify, extend, or debug the **Reverse Shell** web application.
2. The task involves implementing or refactoring **opposite command logic**, **command classification**, or **in-memory filesystem simulation**.
3. You need to implement or adjust **keyboard reversal (Atbash)** as a separate input transformation mode.
4. You are creating or refining **hackathon demo scenarios** or terminal visual stage output for this project.

---

## 3. System Architecture & 3-Layer Processing

The application MUST maintain a clear separation of concerns across three distinct processing layers:

```
[ User Text Input ]
         │
         ▼
 ┌───────────────────────────────────────────────────────────┐
 │ Layer 1: Keyboard Reversal (Optional Atbash Mode)        │
 └───────────────────────────┬───────────────────────────────┘
                             │ (Normalized Raw Command String)
                             ▼
 ┌───────────────────────────────────────────────────────────┐
 │ Layer 2: Command Parser & Classifier                      │
 └─────────────┬───────────────────────────────┬─────────────┘
               │                               │
    (Navigation Commands)              (Action Commands)
               │                               │
               ▼                               ▼
 ┌───────────────────────────┐   ┌───────────────────────────┐
 │ Layer 3: Normal Navigation│   │ Opposite Command Resolver │
 │ (ls, cd, pwd - direct)    │   │ (lookup opposite in table)│
 └─────────────┬─────────────┘   └─────────────┬─────────────┘
               │                               │
               ▼                               ▼
 ┌───────────────────────────────────────────────────────────┐
 │ In-Memory Filesystem Simulator (State Operations)         │
 └───────────────────────────┬───────────────────────────────┘
                             │ (Execution Result + Logs)
                             ▼
 ┌───────────────────────────────────────────────────────────┐
 │ Staged Terminal UI Renderer (Stage-by-Stage Logs)         │
 └───────────────────────────┬───────────────────────────────┘
```

### Layer 1 — Keyboard Reversal Mode
- Maps alphabetic characters using Atbash cipher (`a` ↔ `z`, `b` ↔ `y`, `c` ↔ `x`, etc.). Case sensitivity is preserved.
- Represents a **configurable / toggleable visual input mode**.
- Must **NOT** interfere with normal command interpretation or underlying filesystem execution by default. It acts purely as a pre-parser input layer.

### Layer 2 — Opposite Command Interpreter
- Intercepts **Action Commands** and replaces them with their conceptual opposites via a centralized registry (`OPPOSITE_COMMANDS`).
- Preserves command arguments and targets while translating the verb.
- Must produce staged terminal output describing the reversal process.

### Layer 3 — Normal Navigation System
- Handles filesystem traversal (`cd`, `cd ..`, `ls`, `pwd`).
- **MUST NEVER BE INVERTED.** `cd projects` navigates to `/projects`. `pwd` prints the current directory.
- Keeps the terminal fully usable and navigable while action commands behave absurdly.

For deep-dive data flows and component specifications, consult [architecture.md](file:///reverse-shell-skill/references/architecture.md).

---

## 4. Centralized Command System & Registry

Action command inversion MUST be managed via a single source of truth: a centralized command registry. Do **NOT** scatter `if/else` checks or hard-coded command logic across UI components.

### 4.1 Opposite Command Mapping Table

| Input Command | Opposite Operation | Description |
| :--- | :--- | :--- |
| `remove` / `delete` / `rm` | `save` / `create` | Saves/writes the file state instead of deleting |
| `create` / `touch` / `mk` | `delete` / `remove` | Removes the target node instead of creating |
| `open` / `cat` | `close` | Closes access or hides node details |
| `close` | `open` | Opens and exposes node details |
| `start` / `run` | `stop` | Halts or terminates simulated process |
| `stop` / `kill` | `start` | Launches or resumes simulated process |
| `copy` / `cp` | `move` / `mv` | Moves the file to destination instead of copying |
| `move` / `mv` | `copy` / `cp` | Copies the file to destination instead of moving |
| `download` | `upload` | Uploads simulated local payload to target |
| `upload` | `download` | Downloads simulated target to local state |
| `lock` | `unlock` | Grants permissions or unlocks node |
| `unlock` | `lock` | Restricts permissions or locks node |
| `hide` | `show` | Unhides hidden files/directories |
| `show` | `hide` | Hides files/directories from list views |

For extension guidelines and complete registry structure, consult [command-mapping.md](file:///reverse-shell-skill/references/command-mapping.md).

---

## 5. Simulated In-Memory Filesystem

To ensure total safety during demos, all operations MUST target an **in-memory mock filesystem state**.

### 5.1 Rules for Filesystem Simulation
1. **Safety Boundary**: NEVER call Node.js `child_process`, `exec`, `fs` (on host OS), or system shell execution.
2. **Initial State**: Seed a predictable directory tree on startup so demos are 100% deterministic:
   ```
   /
   ├── projects/
   │   ├── reverse-shell/
   │   └── secret-plan.txt
   ├── documents/
   │   └── report.txt
   └── downloads/
       └── archive.zip
   ```
3. **State Mutation**: When an opposite operation executes (e.g. `remove report.txt` resolving to `SAVE`), update the simulated tree state (e.g. create or update `report.txt` with saved payload).

---

## 6. Terminal UI & Staged Output Guidelines

The terminal UI must clearly reveal the joke by rendering staged execution logs.

### 6.1 Action Command Staged Output
For action commands, output sequential stage messages:

```text
$ remove report.txt
  ↳ Interpreting command...
  ↳ Action command detected: remove
  ↳ Opposite operation resolved: SAVE
  ↳ Executing opposite operation on [report.txt]...
  ✓ Success: report.txt has been saved to /documents/report.txt
```

### 6.2 Navigation Command Direct Output
For navigation commands, show direct, clean feedback:

```text
$ cd projects
  ✓ Navigated to /projects
```

### 6.3 UI Layout Requirements
- Dark modern terminal canvas (sleek background, monospace typography, green/cyan prompt accents).
- Minimalist status bar displaying:
  `[ Keyboard: REVERSED ]  [ Commands: OPPOSITE ]  [ Navigation: NORMAL ]`
- Smooth auto-scrolling terminal history.
- Up/Down arrow key command history navigation.

---

## 7. Hackathon Demo Scenarios

When validating or demonstrating the project, run the deterministic demo sequence:

1. `$ remove report.txt` → Opposite operation `SAVE` → File saved.
2. `$ copy a.txt b.txt` → Opposite operation `MOVE` → `a.txt` moved to `b.txt`.
3. `$ lock secret.txt` → Opposite operation `UNLOCK` → `secret.txt` unlocked.
4. `$ cd projects` → Normal navigation → CWD becomes `/projects`.
5. `$ pwd` → Normal navigation → Outputs current path `/projects`.

For complete step-by-step test scripts and output specs, consult [demo-scenarios.md](file:///reverse-shell-skill/references/demo-scenarios.md).

---

## 8. Error Handling & Edge Cases

The terminal must handle invalid input gracefully without throwing browser console errors or breaking state:

- **Unknown Command**: Render `Command unrecognized. Resolving opposite of unknown command: DOES NOTHING.`
- **Missing Arguments**: Render `Error: 'remove' requires a target filename.`
- **Nonexistent Path**: Render `Error: Path '/nonexistent' does not exist.`
- **Empty Input**: Ignore whitespace-only submissions without adding to history.

---

## 9. Testing & Verification Requirements

Ensure the implementation passes four core test categories:
1. **Command Reversal Verification**: Assert every registered action command maps to its precise conceptual opposite.
2. **Navigation Preservation Verification**: Assert `cd`, `ls`, and `pwd` are never passed to the opposite resolver.
3. **State Mutation Verification**: Assert the in-memory tree state reflects the *opposite* operation after execution.
4. **Edge Case Verification**: Assert missing arguments and invalid paths emit friendly terminal log entries.

---

## 10. Progressive Disclosure References

For detailed reference specifications:
- [Architecture & Data Flow](file:///reverse-shell-skill/references/architecture.md)
- [Command Registry & Mappings](file:///reverse-shell-skill/references/command-mapping.md)
- [Demo Scenarios & Output Formats](file:///reverse-shell-skill/references/demo-scenarios.md)
