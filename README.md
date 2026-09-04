<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



# WhyClick!🎯


## Basic Details
### Team Name: DUOS


### Team Members
- Team Lead: Janna Jaleel - LBSITW 
- Member 2: Fathima Nasha C P - LBSTIW
  

### Project Description
A completely hands-free media player designed for peak laziness. Instead of touching a mouse or keyboard,  wave their hands to rewind and forward, and yell voice commands to manage the volume. It also includes an "Audio-Only" cloak mode when you just want to listen without the screen distracting you.

### The Problem (that doesn't exist)
Reaching across the desk to touch a keyboard or mouse while binge-watching videos causes unacceptable wrist fatigue, disrupts snacking efficiency, and demands far too much physical exertion from modern couch potatoes.

### The Solution (that nobody asked for)
We turned the user into a human remote control. By capturing audio frequencies and percussive transients through the laptop microphone, you can now wave your hands to the right of cam to skip forward, wave your hands to left of cam to re-watch a clip, and verbally order the player to adjust the volume.

## Technical Details
### Technologies/Components Used
For Software:
- **HTML5 & CSS3:** Semantic layout, custom UI components, responsive layout, CSS grid/flexbox, backdrop filters, and CSS keyframe animations (screen-shake and pulse effects).
- **Vanilla JavaScript (ES6+):** Core application architecture, DOM manipulation, state management, and real-time event handling with zero external runtime dependencies.
- **HTML5 Canvas API:** - Offscreen 64×48 canvas downsampling for fast pixel-difference extraction.
  - Transparent particle rendering overlay generating 60 FPS real-time motion trails ("Jedi Sparks").
- **MediaStreams API (`navigator.mediaDevices.getUserMedia`):** Captures raw video and high-sensitivity, uncompressed room audio streams from the user's webcam and microphone.
- **Computer Vision (Pixel Differencing & Spatial Masking):** Custom temporal frame-differencing algorithm calculating pixel brightness deltas across partitioned horizontal split-zones (Left Zone vs. Right Zone) for touchless gesture tracking.
- **Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`):** Low-latency voice engine featuring continuous listening, phonetic regex tokenization, alias matching, and a 1.2-second debounce mechanism to eliminate double-firing.
- **HTML5 Media Elements (`<video>` API) & Blob URLs:** Video playback control, volume scaling, dynamic scrubbing, and local file handling via `URL.createObjectURL` and memory management (`URL.revokeObjectURL`).


### Implementation
# Installation
[ ```bash
git clone [https://github.com/jannajaleel31/useless_project_temp.git](https://github.com/jannajaleel31/useless_project_temp.git)

cd WhyClick]

# Run
Open index.html using a local server (recommended for browser media permissions) or directly in your browser:
Using VS Code Live Server:
Right-click index.html and select "Open with Live Server".
Alternatively, via Python local HTTP server:
Bash
python -m http.server 8000

### Project Documentation
For Software:

# Screenshots (Add at least 3)
1.<img width="1377" height="995" alt="Screenshot 2026-09-03 223028" src="https://github.com/user-attachments/assets/39f28645-f870-419b-8be0-381f3a518c05" />
 This is the initial screen after just uploading a video

2.<img width="1376" height="995" alt="Screenshot 2026-09-03 221846" src="https://github.com/user-attachments/assets/ff5978cd-b60d-4086-a93a-38fd0e4abaeb" />
 When we wave our hand on the right side of webcam, the video skips forward. It also adds a little sparkle when we skip.

3.<img width="1376" height="993" alt="Screenshot 2026-09-03 221924" src="https://github.com/user-attachments/assets/80eecd8f-653e-4b23-913e-a79a1e02c80a" />
 This when we wave our hands on the left of webcam. It rewinds the video by 10 sec and also adds a little sparkles.

4.<img width="1375" height="981" alt="Screenshot 2026-09-03 222023" src="https://github.com/user-attachments/assets/38f77ca5-b02f-4404-ad87-7e48c21777f3" />
 This what happen when we command. for eg here I command max and the volume becomes maximum. It also show a pop-up message.you can also use words that is similar to pronunciation of these words and also words that with the same meaning. For eg, To command max , you can also use maximum or full etc.

5.<img width="1376" height="995" alt="Screenshot 2026-09-03 223720" src="https://github.com/user-attachments/assets/116644d8-cbfa-4707-b0a6-740fbde435a0" />
 when we say quit or down, the volume goes down and it shows a pop-up

6.<img width="1376" height="935" alt="Screenshot 2026-09-03 223823" src="https://github.com/user-attachments/assets/fc65251c-26e1-48e3-aa79-d953f41484f5" />
 when we say louder or fly or something similar, The volume goes up

7.<img width="1377" height="995" alt="Screenshot 2026-09-03 223733" src="https://github.com/user-attachments/assets/7bf976b7-23ad-4230-bbdf-6422689f3f5b" />
 When we say mute or silence, The video goes mute.

# Diagrams
<img width="3780" height="1890" alt="Your paragraph text" src="https://github.com/user-attachments/assets/1f079b19-99be-406c-bab3-3a4fe2a78f16" />
The system captures video and mic inputs directly in the browser, using temporal pixel differencing across screen zones to translate hand waves into forward and rewind actions. Simultaneously, the Web Speech API parses voice commands to adjust volume levels. Both pipelines operate locally in real time to control HTML5 video playback without external servers.


---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)



