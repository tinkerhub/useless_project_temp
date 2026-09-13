# Hackathon Demo Scenarios & Scripted Walkthrough

This document defines the deterministic demo script for showcasing **Reverse Shell** to hackathon judges.

---

## 1. Hackathon Judge Demonstration Script

Follow this 5-step sequence during presentation to clearly explain the joke and technical implementation within 30 seconds.

### Scenario 1: File Deletion Inversion (`remove`)
- **User Prompt**: `remove report.txt`
- **Expected Stage Logs**:
  ```text
  $ remove report.txt
    ↳ Interpreting input: [remove report.txt]
    ↳ Operation classification: ACTION COMMAND
    ↳ Resolving opposite of 'remove'... -> SAVE
    ↳ Executing opposite action: saving /documents/report.txt...
    ✓ report.txt has been successfully saved!
  ```
- **State Impact**: `report.txt` is written/persisted in the simulated filesystem instead of being deleted.

### Scenario 2: File Copy Inversion (`copy`)
- **User Prompt**: `copy project.doc backup.doc`
- **Expected Stage Logs**:
  ```text
  $ copy project.doc backup.doc
    ↳ Interpreting input: [copy project.doc backup.doc]
    ↳ Operation classification: ACTION COMMAND
    ↳ Resolving opposite of 'copy'... -> MOVE
    ↳ Executing opposite action: moving project.doc to backup.doc...
    ✓ project.doc moved to backup.doc (original source removed!)
  ```
- **State Impact**: `project.doc` is moved to `backup.doc` rather than copied.

### Scenario 3: File Security Inversion (`lock`)
- **User Prompt**: `lock secret.txt`
- **Expected Stage Logs**:
  ```text
  $ lock secret.txt
    ↳ Interpreting input: [lock secret.txt]
    ↳ Operation classification: ACTION COMMAND
    ↳ Resolving opposite of 'lock'... -> UNLOCK
    ↳ Executing opposite action: unlocking /documents/secret.txt...
    ✓ secret.txt has been unlocked and granted public access!
  ```
- **State Impact**: `isLocked` flag on `secret.txt` becomes `false`.

### Scenario 4: Directory Navigation (`cd`)
- **User Prompt**: `cd projects`
- **Expected Stage Logs**:
  ```text
  $ cd projects
    ✓ Navigated to /projects
  ```
- **State Impact**: CWD changes to `/projects`. Demonstration shows navigation remains completely normal.

### Scenario 5: Print Working Directory (`pwd`)
- **User Prompt**: `pwd`
- **Expected Stage Logs**:
  ```text
  $ pwd
    /projects
  ```
- **State Impact**: Outputs current directory. Demonstrates navigation preservation.

---

## 2. Keyboard Reversal (Atbash) Visual Demo

Toggle the **Keyboard Reversal** UI status indicator to **ENABLED**:

- **Raw Typed Keys**: `svool`
- **Atbash Real-Time Interpretation**: `hello`
- **Command Output**: Processed as `hello` command.
- **Judge Impact**: Visual proof of Layer 1 input transformation operating independently from Layer 2 command inversion.
