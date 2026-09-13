import os
import shutil
import pytest
from terminal.pty_manager import PTYManager

@pytest.fixture
def temp_workspace(tmp_path):
    ws = tmp_path / "pty_workspace"
    ws.mkdir()
    yield str(ws)
    if ws.exists():
        shutil.rmtree(ws)

def test_pty_spawning_and_write(temp_workspace):
    manager = PTYManager(temp_workspace)
    manager.start_shell(rows=24, cols=80)

    assert manager.master_fd is not None
    assert manager.child_pid is not None

    # Write simple command to shell
    manager.write_input("echo POOKIE_TEST_OK\n")

    # Read output
    import time
    time.sleep(0.3)
    
    try:
        output = os.read(manager.master_fd, 2048).decode('utf-8', errors='ignore')
        assert "POOKIE_TEST_OK" in output or "pookie" in output
    except (OSError, IOError):
        pass

    manager.close()
