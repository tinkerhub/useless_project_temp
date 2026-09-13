# Testing & Packaging Guidelines

This document details test scenarios, automated unit/integration test specifications, and PyInstaller Linux packaging for **Pookie Reverse Terminal**.

---

## 1. Automated Test Suite (Pytest)

Test suite files should be located under `terminal/tests/`.

### 1.1 Command Classifier Tests (`test_classifier.py`)
- Test navigation whitelist matching (`ls`, `cd`, `pwd` return `NAVIGATION`).
- Test action command lookup (`delete` returns `ACTION` with opposite `create`).
- Test unknown commands.

### 1.2 Opposite Resolver Tests (`test_resolver.py`)
- Test `delete project` resolves to `create project`.
- Test `copy a.txt b.txt` resolves to `move a.txt b.txt`.
- Test `exit` resolves to `stay`.

### 1.3 Workspace Sandbox Tests (`test_sandbox.py`)
- Test path resolution inside `~/PookieTerminalWorkspace/`.
- Test rejection of path traversal targets (`../../etc/passwd`).

### 1.4 PTY Subprocess Tests (`test_pty.py`)
- Test PTY master/slave creation and shell output notification.
- Test terminal resize (`SIGWINCH`) ioctl execution.

---

## 2. Manual Hackathon Test Walkthrough

Execute these deterministic commands to verify native terminal functionality:

```bash
# 1. Navigation (Real Shell)
ls
pwd
cd projects
cd ..

# 2. Opposite Action Commands
delete project        # -> Creates ~/PookieTerminalWorkspace/project
copy file.txt copy.txt # -> Moves file.txt to copy.txt
lock secret.txt       # -> Unlocks secret.txt (chmod +w)
exit                  # -> Intercepted as stay ("You're still here, pookie ♡")
```

---

## 3. PyInstaller Packaging for Linux

Build a standalone executable binary `PookieTerminal`:

```bash
# Install PyInstaller
pip install pyinstaller pyside6

# Package application
pyinstaller \
  --noconfirm \
  --onedir \
  --windowed \
  --name "PookieTerminal" \
  --add-data "assets:assets" \
  terminal/app.py
```

The resulting runnable executable will be located at `dist/PookieTerminal/PookieTerminal`.
