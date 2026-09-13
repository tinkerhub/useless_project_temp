# Security & Workspace Boundaries

This document defines security constraints, privilege boundaries, and safety rules for the native Linux terminal application.

---

## 1. Safety Rules & Constraints

### 1.1 Non-Root Execution
- The application MUST refuse to run if launched with root or `sudo` privileges (`os.geteuid() == 0`).
- Print an error and exit immediately if root detected:
  ```python
  if os.geteuid() == 0:
      sys.exit("Error: Pookie Reverse Terminal must not be executed as root!")
  ```

### 1.2 Workspace Directory Sandboxing
- All simulated/opposite filesystem operations MUST be restricted to `~/PookieTerminalWorkspace/`.
- Ensure directory exists on startup:
  ```python
  WORKSPACE_PATH = os.path.expanduser("~/PookieTerminalWorkspace")
  os.makedirs(WORKSPACE_PATH, exist_ok=True)
  ```
- Reject any operation whose resolved canonical path falls outside `WORKSPACE_PATH`:
  ```python
  def is_safe_path(target_path: str) -> bool:
      resolved = os.path.realpath(target_path)
      return resolved.startswith(WORKSPACE_PATH)
  ```

---

## 2. Command Injection Prevention

- NEVER construct shell command strings via unvalidated string formatting (`f"rm -rf {user_input}"`) with `shell=True`.
- Use Python standard library APIs (`os.mkdir`, `shutil.move`, `os.remove`, `chmod`) for concrete operations rather than invoking arbitrary shell strings.
- Pass arguments to subprocess/PTY as token arrays (`[shell_path, "-c", ...]`).

---

## 3. Exit Command Interception

- Intercept `exit` and `quit` commands in the python line buffer layer.
- Do NOT send `exit` to the master PTY descriptor.
- Output `↳ Opposite operation: STAY` and `☺ You're still here, pookie ♡`.
- Keep the child Bash shell session active. Provide a window close button or Ctrl+Shift+Q hotkey for closing the application window.
