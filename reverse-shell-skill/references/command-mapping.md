# Centralized Command Registry & Mappings

This document defines the official opposite-command mapping dictionary, argument translation rules, and extension protocols for **Reverse Shell**.

---

## 1. Centralized Mappings Registry

The table below maps user action command verbs to their conceptual opposites.

```typescript
export const OPPOSITE_COMMANDS: Record<string, string> = {
  // File Lifecycle & Operations
  'remove': 'save',
  'delete': 'create',
  'rm': 'save',
  'create': 'delete',
  'touch': 'delete',
  'mk': 'delete',

  // Open / Access Control
  'open': 'close',
  'cat': 'close',
  'close': 'open',

  // System & Process Control
  'start': 'stop',
  'run': 'stop',
  'stop': 'start',
  'kill': 'start',

  // Data Manipulation & Transfer
  'copy': 'move',
  'cp': 'move',
  'move': 'copy',
  'mv': 'copy',
  'download': 'upload',
  'upload': 'download',

  // Security & Visibility State
  'lock': 'unlock',
  'unlock': 'lock',
  'hide': 'show',
  'show': 'hide',

  // Extended Absurd Commands
  'rename': 'keep-name',
  'compress': 'expand',
  'zip': 'unzip',
  'unzip': 'zip',
  'connect': 'disconnect',
  'disconnect': 'connect',
  'enable': 'disable',
  'disable': 'enable',
  'encrypt': 'decrypt',
  'decrypt': 'encrypt'
};
```

---

## 2. Navigation Commands (DO NOT INVERT)

The following commands are registered as **Navigation Commands** and MUST bypass the opposite command resolver:

```typescript
export const NAVIGATION_COMMANDS = new Set([
  'ls',
  'dir',
  'cd',
  'pwd',
  'clear',
  'help',
  'history'
]);
```

---

## 3. Argument Translation & Mapping Rules

When an action command is translated to its opposite, positional arguments must be preserved and correctly assigned to the target operation:

1. **Single File Target**:
   - Input: `remove report.txt`
   - Inverted Verb: `save`
   - Target Execution: `saveFile("report.txt")`

2. **Source & Destination Target**:
   - Input: `copy source.txt dest.txt`
   - Inverted Verb: `move`
   - Target Execution: `moveNode("source.txt", "dest.txt")`

3. **Flag & Option Arguments**:
   - Input: `delete -r folder/`
   - Inverted Verb: `create`
   - Target Execution: `createDirectory("folder/")`

---

## 4. Extension Guidelines

To add a new absurd opposite command pair:

1. Open `OPPOSITE_COMMANDS` dictionary.
2. Add bi-directional or custom pair:
   ```typescript
   'mute': 'amplify',
   'amplify': 'mute'
   ```
3. Implement corresponding mock handler in `FileSystemSimulator` or `ProcessSimulator`.
4. Add automated test case covering the new pair in test suite.
