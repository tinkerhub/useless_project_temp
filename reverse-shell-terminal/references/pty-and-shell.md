# PTY & Shell Process Management

This document provides concrete Python implementation guidelines for managing POSIX Pseudo-Terminals (`pty`) and child shell processes.

---

## 1. PTY Master/Slave Spawning Code Pattern

```python
import os
import pty
import select
import termios
import struct
import fcntl
import subprocess
from PySide6.QtCore import QSocketNotifier, QObject, Signal

class PTYManager(QObject):
    data_received = Signal(str)

    def __init__(self, workspace_path: str):
        super().__init__()
        self.workspace_path = workspace_path
        self.master_fd = None
        self.slave_fd = None
        self.child_pid = None
        self.notifier = None

    def start_shell(self):
        # 1. Create pseudo-terminal pair
        self.master_fd, self.slave_fd = pty.openpty()

        # 2. Spawn child shell process attached to slave PTY
        env = os.environ.copy()
        env["TERM"] = "xterm-256color"
        env["POOKIE_TERMINAL"] = "1"

        self.child_pid = os.fork()
        if self.child_pid == 0:
            # Child process
            os.setsid()
            os.dup2(self.slave_fd, 0)
            os.dup2(self.slave_fd, 1)
            os.dup2(self.slave_fd, 2)
            if self.master_fd > 2:
                os.close(self.master_fd)

            os.chdir(self.workspace_path)
            shell = os.environ.get("SHELL", "/bin/bash")
            os.execvpe(shell, [shell], env)
        else:
            # Parent process
            os.close(self.slave_fd)
            # Set non-blocking on master_fd
            flags = fcntl.fcntl(self.master_fd, fcntl.F_GETFL)
            fcntl.fcntl(self.master_fd, fcntl.F_SETFL, flags | os.O_NONBLOCK)

            # Integrate with Qt Event Loop
            self.notifier = QSocketNotifier(self.master_fd, QSocketNotifier.Type.Read)
            self.notifier.activated.connect(self._handle_read)

    def _handle_read(self):
        try:
            output = os.read(self.master_fd, 1024).decode('utf-8', errors='ignore')
            if output:
                self.data_received.emit(output)
        except (OSError, IOError):
            pass

    def write_input(self, data: str):
        if self.master_fd is not None:
            os.write(self.master_fd, data.encode('utf-8'))

    def set_window_size(self, rows: int, cols: int):
        if self.master_fd is not None:
            s = struct.pack('HHHH', rows, cols, 0, 0)
            fcntl.ioctl(self.master_fd, termios.TIOCSWINSZ, s)
```

---

## 2. Terminal Control Sequences & Signals

- **Interrupt Signal (`Ctrl+C`)**: Send `b'\x03'` to `master_fd` or trigger `os.killpg(self.child_pid, signal.SIGINT)`.
- **EOF (`Ctrl+D`)**: Send `b'\x04'` to `master_fd`.
- **Window Resize (`SIGWINCH`)**: Call `set_window_size(rows, cols)` on Qt window resize events.
- **Process Termination**: On window close, send `SIGTERM` to `self.child_pid` and wait with `os.waitpid(self.child_pid, os.WNOHANG)`.
