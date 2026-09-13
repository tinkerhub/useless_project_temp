# PySide6 Native Terminal UI & Aesthetic Guidelines

This document specifies the visual styling, component layout, and Qt stylesheets for the **Pookie Reverse Terminal** native Linux application.

---

## 1. Color Palette & Typography

- **Background Canvas**: `#0e0b18` (Midnight Dark Purple)
- **Titlebar Background**: `#141024`
- **Primary Prompt Text**: `#ff79c6` (Hot Pink)
- **Mint Action Verb / Success**: `#50fa7b` (Mint Green)
- **Remove / Alert Text**: `#ff5555` (Neon Red)
- **Cyan / Info Text**: `#8be9fd`
- **Muted Text**: `#a89bbe`
- **Font**: Monospace (`Fira Code`, `DejaVu Sans Mono`, or `Consolas`, 11pt)

---

## 2. PySide6 Stylesheet (QSS)

```css
QWidget#TerminalWindow {
    background-color: #0e0b18;
    color: #f8f8f2;
    font-family: 'Fira Code', 'DejaVu Sans Mono', monospace;
    font-size: 13px;
}

QFrame#TitleBar {
    background-color: #141024;
    border-bottom: 1px solid rgba(255, 121, 198, 0.15);
}

QTextEdit#TerminalOutput {
    background-color: #0e0b18;
    color: #f8f8f2;
    border: none;
    selection-background-color: rgba(255, 121, 198, 0.3);
}

QLineEdit#CommandInput {
    background-color: transparent;
    color: #f8f8f2;
    border: none;
    font-family: 'Fira Code', monospace;
    font-size: 13px;
}
```

---

## 3. Pixel Cat Banner Header

Render this ASCII cat banner in the terminal output widget on application launch:

```text
   |\__/|     ✦ Pookie Terminal ♡
  (  -.- )    same commands. opposite results. ♡
  (  > < )
```

---

## 4. Staged Execution Log Formatting

For action commands, output sequential stage lines:

```text
pookie@reverse:~$ delete project
  ↳ Interpreting...
  ↳ Opposite operation: CREATE
  ↳ Executing real filesystem operation...
  ✓ project created ♡
```

For navigation commands:

```text
pookie@reverse:~$ cd projects
  ✓ Navigated to /projects
```
