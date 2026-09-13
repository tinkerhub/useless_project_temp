import os
import sys
import pty
import fcntl
import termios
import struct
import signal
import shutil
try:
    from terminal.qt_compat import QObject, Signal, QSocketNotifier
except ImportError:
    from qt_compat import QObject, Signal, QSocketNotifier

class PTYManager(QObject):
    """
    Manages Linux POSIX Pseudo-Terminal (PTY) master/slave file descriptors
    and child shell process lifecycle attached to /bin/bash or $SHELL.
    """
    output_received = Signal(str)
    shell_exited = Signal(int)

    def __init__(self, workspace_path: str):
        super().__init__()
        self.workspace_path = os.path.abspath(workspace_path)
        self.master_fd = None
        self.slave_fd = None
        self.child_pid = None
        self.notifier = None

    def start_shell(self, rows: int = 24, cols: int = 80):
        """Creates PTY pair, forks child process, and starts shell in workspace."""
        os.makedirs(self.workspace_path, exist_ok=True)

        # 1. Open PTY master/slave pair
        self.master_fd, self.slave_fd = pty.openpty()

        # Set initial window size
        self.set_window_size(rows, cols)

        # 2. Fork child shell process
        env = os.environ.copy()
        env["TERM"] = "xterm-256color"
        env["POOKIE_REVERSE_TERMINAL"] = "1"
        env["PS1"] = ""
        env["PS2"] = ""
        env["PROMPT_COMMAND"] = ""

        self.child_pid = os.fork()

        if self.child_pid == 0:
            # --- CHILD PROCESS ---
            os.setsid()

            # Set controlling terminal
            try:
                fcntl.ioctl(self.slave_fd, termios.TIOCSCTTY, 0)
            except Exception:
                pass

            # Disable ECHO on PTY slave so input is not echoed back into stdout
            try:
                attrs = termios.tcgetattr(self.slave_fd)
                attrs[3] = attrs[3] & ~termios.ECHO
                termios.tcsetattr(self.slave_fd, termios.TCSANOW, attrs)
            except Exception:
                pass

            # Duplicate slave_fd to stdin, stdout, stderr
            os.dup2(self.slave_fd, 0)
            os.dup2(self.slave_fd, 1)
            os.dup2(self.slave_fd, 2)

            if self.master_fd > 2:
                os.close(self.master_fd)
            if self.slave_fd > 2:
                os.close(self.slave_fd)

            # Change directory to workspace
            try:
                os.chdir(self.workspace_path)
            except Exception:
                pass

            shell = shutil.which("bash") or "/bin/bash"
            os.execvpe(shell, [shell, "--norc"], env)
        else:
            # --- PARENT PROCESS ---
            os.close(self.slave_fd)
            self.slave_fd = None

            # Set master_fd to non-blocking
            flags = fcntl.fcntl(self.master_fd, fcntl.F_GETFL)
            fcntl.fcntl(self.master_fd, fcntl.F_SETFL, flags | os.O_NONBLOCK)

            # Connect master_fd to Qt Event Loop via QSocketNotifier
            self.notifier = QSocketNotifier(self.master_fd, QSocketNotifier.Type.Read, self)
            self.notifier.activated.connect(self._read_master)
            print(f"[PTY] Started child process PID={self.child_pid} attached to master_fd={self.master_fd}")

    def _read_master(self):
        """Asynchronously reads available stdout/stderr data from PTY master_fd."""
        if self.master_fd is None:
            return

        try:
            data = os.read(self.master_fd, 4096)
            if data:
                text = data.decode('utf-8', errors='replace')
                # print(f"[PTY] Read output ({len(data)} bytes): {repr(text)}")
                self.output_received.emit(text)
            else:
                self.close()
        except (OSError, IOError):
            pass

    def write_input(self, text: str):
        """Writes text or command bytes to PTY master descriptor."""
        if self.master_fd is not None:
            try:
                print(f"[PTY] Writing bytes: {repr(text)}")
                os.write(self.master_fd, text.encode('utf-8'))
            except (OSError, IOError) as e:
                print(f"[PTY] Error writing bytes: {e}")

    def send_interrupt(self):
        """Sends Ctrl+C (SIGINT) to child process group."""
        if self.child_pid:
            try:
                os.killpg(os.getpgid(self.child_pid), signal.SIGINT)
            except Exception:
                self.write_input("\x03")

    def set_window_size(self, rows: int, cols: int):
        """Updates PTY terminal dimensions via TIOCSWINSZ ioctl."""
        if self.master_fd is not None:
            try:
                winsize = struct.pack('HHHH', rows, cols, 0, 0)
                fcntl.ioctl(self.master_fd, termios.TIOCSWINSZ, winsize)
            except Exception:
                pass

    def close(self):
        """Cleans up PTY master descriptor and terminates child process."""
        if self.notifier:
            self.notifier.setEnabled(False)
            self.notifier = None

        if self.master_fd is not None:
            try:
                os.close(self.master_fd)
            except Exception:
                pass
            self.master_fd = None

        if self.child_pid:
            try:
                os.kill(self.child_pid, signal.SIGTERM)
                os.waitpid(self.child_pid, os.WNOHANG)
            except Exception:
                pass
            self.child_pid = None
