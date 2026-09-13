#!/usr/bin/env python3
import sys
import os

# Security check: Refuse root execution
if hasattr(os, "geteuid") and os.geteuid() == 0:
    sys.exit("Security Error: Pookie Reverse Terminal must not be run with root/sudo privileges!")

try:
    from terminal.qt_compat import QApplication
    from terminal.ui import PookieTerminalWindow
except ImportError:
    from qt_compat import QApplication
    from ui import PookieTerminalWindow

def main():
    workspace = os.path.expanduser("~/PookieTerminalWorkspace")
    os.makedirs(workspace, exist_ok=True)

    app = QApplication(sys.argv)
    app.setApplicationName("Pookie Reverse Terminal")
    
    window = PookieTerminalWindow(workspace_path=workspace)
    window.show()

    sys.exit(app.exec())

if __name__ == "__main__":
    main()
