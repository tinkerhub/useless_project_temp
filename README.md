# Blink-QR File Transfer

A deliberately over-engineered file transfer system that sends files through a sequence of QR codes.

This project is being developed for **TinkerHub Useless Project 3.0**.

The idea is simple:

> Turn a file into data → split it into chunks → add error correction → display as multiple QR codes → scan the QR codes → reconstruct the original file.

The unnecessary part:

> The final transfer in "Private" mode will use an encryption key derived from an **eye-blinking pattern**.

## 🏗️ Project Concept & Architecture

The transmission pipeline is being built in strict, modular phases to ensure high performance and cross-language compatibility (JavaScript Sender, Python Receiver).

### Sender Pipeline (Current Focus)

1. **Phase 1 (Input):** Extract raw binary `Uint8Array` from the selected file.
2. **Phase 2 (Understand):** Generate SHA-256 hash for integrity and apply smart GZIP compression only if beneficial.
3. **Phase 3 (Coding):** Apply a custom-built Reed-Solomon GF(2^8) engine for error correction (surviving dropped QR frames).
4. **Phase 4 (Chunking):** Slice data into < 255-byte symbols (200 bytes data + 30 bytes RS parity).
5. **Phase 5 (Protocol):** _[Pending]_ Wrap symbols in Protocol V1 headers.
6. **Phase 6 (QR Generation):** _[Pending]_ Render bytes into visual QR canvases.
7. **Phase 7 (Transmission):** _[Pending]_ Playback QR codes at a controlled FPS.

### Future Receiver Pipeline

- Fast QR detection and decoding via OpenCV (Python).
- Protocol parsing and Session validation.
- Reed-Solomon decoding and missing frame recovery.
- Decompression (if applicable).
- SHA-256 verificatio<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



# [blink - QR] 🎯


## Basic Details
### Team Name: [Ob.Server]


### Team Members
- Team Lead: [Sam Peter] - [NSS enginering college palakkad]
- Member 2: [Riya rose ] - [Nss College of enginnerring]
- Member 3: [Name] - [College]

### Project Description
[the project details about slow file transfer using the  qr codes and eye blinking security]

### The Problem (that doesn't exist)
[making the file harder to transfer?]

### The Solution (that nobody asked for)
[making the techonogies likttle more complex and having the frequent build in team with the file transfer!]

## Technical Details
### Technologies/Components Used
For Software:
- [Html,java, css, python]
- [HTML5 & CSS3:]
- [numpy, Conda / Miniforge]
- [Tools used]

For Hardware:
- [List main components]
- [List specifications]
- [List tools required]

### Implementation
For Software:
# Installation
[commands]

# Run
[commands]

### Project Documentation
For Software:

# Screenshots (Add at least 3)
![Screenshot1](<img width="1407" height="624" alt="Screenshot 2026-09-12 at 7 24 01 AM" src="https://github.com/user-attachments/assets/592a7a60-dea3-4aaa-be26-74dbadae9c20" />
)
*Add caption explaining what this shows*

![Screenshot2](<img width="918" height="651" alt="Screenshot 2026-09-12 at 7 27 07 AM" src="https://github.com/user-attachments/assets/2ef6384d-77ec-4ac0-b097-63624a20e659" />
)
*Add caption explaining what this shows*

![Screenshot3](Add screenshot 3 here with proper name)
*Add caption explaining what this shows*

# Diagrams
![Workflow](Add your workflow/architecture diagram here)
*Add caption explaining your workflow*

For Hardware:

# Schematic & Circuit
![Circuit](Add your circuit diagram here)
*Add caption explaining connections*

![Schematic](Add your schematic diagram here)
*Add caption explaining the schematic*

# Build Photos
![Components](Add photo of your components here)
*List out all components shown*

![Build](Add photos of build process here)
*Explain the build steps*

![Final](Add photo of final product here)
*Explain the final build*

### Project Demo
# Video
[Add your demo video link here]
*Explain what the video demonstrates*

# Additional Demos
[Add any extra demo materials/links]

## Team Contributions
- [Name 1]: [Sam Peter - qr code sendr - receiver]
- [Name 2]: [Riya rose roy - eyeblinking detectin]
- [Name 3]: [Specific contributions]

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)n against the reconstructed file.

## 📂 Project Structure

```text
useless_project_3.0/
├── index.html              # Main UI shell
├── style.css               # Styling and theme
├── src/
│   ├── app.js              # UI state and pipeline orchestration
│   ├── FileProcessor.js    # Binary extraction, Hashing, Compression
│   ├── CodingEngine.js     # Reed-Solomon GF(2^8) Implementation
│   └── SymbolCreator.js    # Async chunking and parity generation
└── README.md
```
