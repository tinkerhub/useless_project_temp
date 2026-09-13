import os
import shutil
import pytest
from terminal.command_engine import CommandEngine

@pytest.fixture
def temp_workspace(tmp_path):
    ws = tmp_path / "test_workspace"
    ws.mkdir()
    engine = CommandEngine(workspace_path=str(ws))
    yield engine
    if ws.exists():
        shutil.rmtree(ws)

def test_navigation_classification(temp_workspace):
    engine = temp_workspace
    cat, verb, args = engine.classify("ls -la")
    assert cat == "NAVIGATION"
    assert verb == "ls"
    assert args == ["-la"]

    cat, verb, args = engine.classify("cd projects")
    assert cat == "NAVIGATION"
    assert verb == "cd"

    cat, verb, args = engine.classify("pwd")
    assert cat == "NAVIGATION"
    assert verb == "pwd"

def test_action_classification(temp_workspace):
    engine = temp_workspace
    cat, verb, args = engine.classify("delete test.txt")
    assert cat == "ACTION"
    assert verb == "delete"
    assert args == ["test.txt"]

    cat, verb, args = engine.classify("copy a.txt b.txt")
    assert cat == "ACTION"
    assert verb == "copy"
    assert args == ["a.txt", "b.txt"]

    cat, verb, args = engine.classify("exit")
    assert cat == "ACTION"
    assert verb == "exit"

def test_opposite_delete_creates_file(temp_workspace):
    engine = temp_workspace
    opp_verb, stage, result, symbol = engine.process_action_command("delete", ["test_file.txt"])
    assert opp_verb == "create"
    assert "test_file.txt file created" in result

    # Check file exists in workspace
    created_path = os.path.join(engine.workspace_path, "test_file.txt")
    assert os.path.exists(created_path)

def test_opposite_copy_moves_file(temp_workspace):
    engine = temp_workspace
    src_file = os.path.join(engine.workspace_path, "a.txt")
    with open(src_file, "w") as f:
        f.write("source payload")

    opp_verb, stage, result, symbol = engine.process_action_command("copy", ["a.txt", "b.txt"])
    assert opp_verb == "move"
    assert "moved to b.txt" in result

    # Verify src removed and dest created (move semantics!)
    dest_file = os.path.join(engine.workspace_path, "b.txt")
    assert not os.path.exists(src_file)
    assert os.path.exists(dest_file)

def test_opposite_exit_intercepted_as_stay(temp_workspace):
    engine = temp_workspace
    opp_verb, stage, result, symbol = engine.process_action_command("exit", [])
    assert opp_verb == "stay"
    assert symbol == "☺"
    assert "you're still here, pookie" in result.lower()

def test_workspace_security_sandbox(temp_workspace):
    engine = temp_workspace
    with pytest.raises(PermissionError):
        engine._resolve_safe_path("../../etc/passwd")
