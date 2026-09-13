<img width="1110" height="791" alt="Screenshot From 2026-09-13 16-58-01 (1)" src="https://github.com/user-attachments/assets/b07c3baf-cea0-45fe-9252-521e5a417530" /><img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />

# Pookie Terminal 🎀💻
### The Terminal That Does The Opposite

A deliberately useless terminal that turns your commands into their opposites — while still being a real Linux terminal underneath.

Because apparently, normal terminals weren't confusing enough. 💀

---

## Basic Details
### College: SOE, CUSAT
### Team Name: Binary Blunder

### Team Members
- Member : Thejas V
- Member : Sreelakshmi S

---

## Project Description

Pookie Terminal is a fun, intentionally useless Linux terminal that interprets certain action commands as their opposites.

For example, `delete` becomes its opposite operation, while normal Linux commands such as `ls`, `pwd`, `cd`, `echo`, `grep`, and `find` continue to run through a real Bash shell and PTY.

---

## The Problem (that doesn't exist)

Have you ever typed a command correctly and thought:

> "What if my computer just... did the opposite?"

No?

Exactly.

Modern terminals are far too predictable. They execute what you tell them to execute, making command-line computing unnecessarily useful.

Pookie Terminal solves this completely unnecessary problem.

---

## The Solution (that nobody asked for)

We created a terminal that deliberately misunderstands you.

Certain action commands are mapped to their conceptual opposites:

| You type | Pookie thinks |
|---|---|
| `delete` | create |
| `remove` | save |
| `open` | close |
| `start` | stop |
| `copy` | move |
| `download` | upload |
| `lock` | unlock |
| `hide` | show |
| `connect` | disconnect |
| `enable` | disable |
| `compress` | expand |
| `exit` | stay |

But there's a catch:

**Normal Linux commands remain real.**

Commands such as:

```bash
ls
pwd
cd
echo
cat
grep
find
```

pass right through untouched.

## Technical Details
### Technologies/Components Used
For Software:
- **Languages used**: Python, HTML, TypeScript
- **Frameworks used**: PySide6 (Native Desktop), React + Vite + TailwindCSS (Web Prototype)
- **Libraries used**: pty (Pseudo-terminal), re (Regex ANSI parsing), Termios
- **Tools used**: WSL2, Bash

### Implementation
For Software:
# Installation
Ensure you are using a POSIX-compliant environment (like WSL on Windows, or native Linux).
```bash
# Clone the repository
git clone https://github.com/vthejas44-rgb/useless_project_temp

# Navigate into the project
cd useless_project_temp

# Install Python requirements
pip install -r terminal/requirements.txt
```

# Run
```bash
# Run the Native Desktop Terminal directly 
PYTHONPATH=. python3 -m terminal.app
```

### Web Prototype Demo
To see the conceptual web prototype:
```bash
npm install
npm run dev
```

### Project Documentation
# Screenshots
Screenshot1:https://drive.google.com/file/d/1oZvUO2x7hZ7TTP_1DM89-S2-pk342R_8/view?usp=drive_link

Screenshot2:https://drive.google.com/file/d/1ZyCMbjHLOa-WTqVykke24xP3JSmIvH5V/view

Screenshot3:https://drive.google.com/file/d/1rk2tlt1hxFpSqEhzJmO47Ax3zgwpcYa8/view


# Diagrams
```mermaid
graph TD
    A["👤 User"] --> B["🖥️ PySide6 GUI Desktop Application"]
    B --> C["⌨️ Command Input Box (QLineEdit)"]
    C --> D["🧠 Command Engine (Classification Layer)"]

    D -->|Classifies Input| E{"Command Type?"}

    E -->|"Action Command<br/>(delete, copy, open, exit)"| F["🔄 Opposite Resolution Matrix"]
    E -->|"Navigation Command<br/>(ls, pwd, cd, grep)"| K["🔌 Native POSIX PTY<br/>(Pseudo-terminal)"]

    subgraph PATHA [" 💗 PATH A — Action / Opposite Interceptor "]
        F --> G["🔍 Identify Exact Opposite Operation<br/><i>e.g. delete → create</i>"]
        G --> H["📁 Execute Locally on<br/>File System Sandbox"]
        H --> I["⏳ Native Loading Animation UI"]
        I --> J["💌 Custom Success Message<br/><i>'Item created ♡'</i>"]
    end

    subgraph PATHB [" 💜 PATH B — Navigation / Real Shell "]
        K --> L["🐚 Subprocess Bash Shell"]
        L --> M["⚙️ Execute Real Command<br/>on Underlying OS"]
        M --> N["📤 Raw Output<br/>(incl. ANSI Escape Colors)"]
        N --> O["🎨 Native ANSI Parser"]
        O --> P["✨ Converts to Colored<br/>Qt Rich Text"]
    end

    J --> Q["🖼️ Terminal Display"]
    P --> Q

    Q -.->|Renders Back To| B

    %% ==== STYLING ====
    classDef gui fill:#fce4ec,stroke:#ad1457,stroke-width:2px,color:#4a148c,font-weight:bold;
    classDef engine fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px,color:#4a148c,font-weight:bold;
    classDef decision fill:#e1bee7,stroke:#6a1b9a,stroke-width:3px,color:#311b92,font-weight:bold;
    classDef pathA fill:#fff0f6,stroke:#d6336c,stroke-width:2px,color:#9d174d;
    classDef pathB fill:#f5f0ff,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef display fill:#fbcfe8,stroke:#831843,stroke-width:3px,color:#500724,font-weight:bold;

    class A,B,C gui;
    class D engine;
    class E decision;
    class F,G,H,I,J pathA;
    class K,L,M,N,O,P pathB;
    class Q display;

    style PATHA fill:#fff5f9,stroke:#e05a94,stroke-width:2px,stroke-dasharray: 4 2
    style PATHB fill:#f7f3ff,stroke:#9061e0,stroke-width:2px,stroke-dasharray: 4 2
```
*Architecture and execution flow mapping how Pookie Terminal intercepts and processes commands.* link

## Demo video link : https://drive.google.com/file/d/1rCwSDXPpi_rZvQMhZppgRwAnvENvn03Q/view?usp=drive_link

  In the demo video we have demostrated that when we try to create a file it deletes the file and when we try to delete the file it creates the file. it means that the commands we should type are opposites. We can do other things too.We have created an actual terminal due to limitations  we have demonstrated this in a video and so we have hosted a webapp of this terminal version .

## Vercel link :https://useless-project-temp-murex-theta.vercel.app/
  
## Team Contributions
- Thejas V: Implementation of PTY integration and Action Mapping architecture. UI formatting and compilation.
- Sreelakshmi S: Web Interface Prototype and UI Design.

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)
