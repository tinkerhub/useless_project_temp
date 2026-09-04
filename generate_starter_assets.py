"""
Helper script to generate starter assets for ONLY FOR YOUR EYES:
1. Voice WAV files + metadata
2. Gesture/Expression tactical target images
"""

import os
import json
import subprocess
from PIL import Image, ImageDraw, ImageFont

def generate_voice_assets():
    os.makedirs(os.path.join("assets", "voice"), exist_ok=True)
    
    prompts = [
        {
            "id": "hermione_leviosa",
            "file": "hermione_leviosa.wav",
            "speaker": "Hermione Granger",
            "phrase": "It's LeviOsa, not LevioSA!",
            "acceptable_phrases": [
                "it's leviosa not leviosa",
                "its leviosa not leviosa",
                "leviosa not leviosa"
            ],
            "keywords": ["leviosa", "not", "clever"],
            "target_duration": 2.5
        },
        {
            "id": "ron_butterflies",
            "file": "ron_butterflies.wav",
            "speaker": "Ron Weasley",
            "phrase": "Why spiders? Why couldn't it be follow the butterflies?",
            "acceptable_phrases": [
                "why spiders why couldn't it be follow the butterflies",
                "why spiders why couldn't it be follow the butterflies",
                "follow the butterflies"
            ],
            "keywords": ["spiders", "butterflies", "follow"],
            "target_duration": 3.4
        },
        {
            "id": "phil_lemons",
            "file": "phil_lemons.wav",
            "speaker": "Phil Dunphy",
            "phrase": "When life gives you lemonade, make lemons.",
            "acceptable_phrases": [
                "when life gives you lemonade make lemons",
                "when life gives you lemonade, make lemons"
            ],
            "keywords": ["life", "lemonade", "lemons", "make"],
            "target_duration": 2.8
        },
        {
            "id": "lily_vietnam",
            "file": "lily_vietnam.wav",
            "speaker": "Mitchell Pritchett",
            "phrase": "Lily, honey, we don't hate.",
            "acceptable_phrases": [
                "lily honey we don't hate",
                "lily honey we dont hate",
                "we don't hate"
            ],
            "keywords": ["lily", "honey", "hate"],
            "target_duration": 2.2
        }
    ]

    with open(os.path.join("assets", "voice", "prompts.json"), "w", encoding="utf-8") as f:
        json.dump(prompts, f, indent=2)

    # PowerShell TTS generation
    for item in prompts:
        wav_path = os.path.join("assets", "voice", item["file"])
        abs_wav = os.path.abspath(wav_path).replace("\\", "/")
        text = item["phrase"].replace('"', '`"')
        
        ps_code = f"""
Add-Type -AssemblyName System.Speech
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.SetOutputToWaveFile('{abs_wav}')
$speaker.Speak("{text}")
$speaker.Dispose()
"""
        ps_file = "temp_voice_gen.ps1"
        with open(ps_file, "w", encoding="utf-8") as pf:
            pf.write(ps_code)
        
        try:
            subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", ps_file], check=True)
            print(f"[VOICE] Generated {item['file']} ({os.path.getsize(wav_path)} bytes)")
        finally:
            if os.path.exists(ps_file):
                os.remove(ps_file)


def generate_gesture_assets():
    os.makedirs(os.path.join("assets", "gestures"), exist_ok=True)
    
    targets = [
        {
            "filename": "target_peace_smile.png",
            "code": "EXPR_GESTURE_01",
            "title": "PROTOCOL 03 TARGET // COMBINED DUAL-KEY",
            "face_desc": "BROAD SMILE (Open Mouth, Raised Cheeks)",
            "hand_desc": "PEACE / V-SIGN (Index + Middle Up)",
            "pose_desc": "HAND ELEVATED NEAR CHEEK LEVEL",
            "primary_color": (0, 255, 156),
            "accent_color": (0, 229, 255),
            "face_type": "smile",
            "hand_type": "peace"
        },
        {
            "filename": "target_thumbs_up_focus.png",
            "code": "EXPR_GESTURE_02",
            "title": "PROTOCOL 03 TARGET // BIOMETRIC FOCUS",
            "face_desc": "NEUTRAL SECURITY GAZE (Mouth Closed, Level Brows)",
            "hand_desc": "THUMBS-UP GESTURE (Thumb Extended Upward)",
            "pose_desc": "HAND POSITIONED AT CHEST LEVEL",
            "primary_color": (0, 229, 255),
            "accent_color": (255, 200, 87),
            "face_type": "neutral",
            "hand_type": "thumbs_up"
        },
        {
            "filename": "target_surprised_open_palm.png",
            "code": "EXPR_GESTURE_03",
            "title": "PROTOCOL 03 TARGET // ALERT REFLEX",
            "face_desc": "SURPRISED EXPRESSION (Mouth 'O' Shape, Brows Raised)",
            "hand_desc": "OPEN PALM SHIELD (All 5 Fingers Extended)",
            "pose_desc": "PALM FACING SENSOR AT CHEST/SHOULDER",
            "primary_color": (255, 200, 87),
            "accent_color": (255, 70, 85),
            "face_type": "surprised",
            "hand_type": "open_palm"
        },
        {
            "filename": "target_thinking_chin_pose.png",
            "code": "EXPR_GESTURE_04",
            "title": "PROTOCOL 03 TARGET // COGNITIVE POSE",
            "face_desc": "CONCENTRATED FOCUS (Subtle Smile)",
            "hand_desc": "INDEX FINGER EXTENDED TO CHIN / CHEEK",
            "pose_desc": "ELBOW RESTED, HAND ANCHORED AT JAWLINE",
            "primary_color": (0, 255, 156),
            "accent_color": (0, 229, 255),
            "face_type": "thinking",
            "hand_type": "chin_touch"
        }
    ]

    for t in targets:
        img_w, img_h = 640, 520
        bg_color = (12, 16, 23)
        panel_color = (18, 24, 34)
        border_color = (38, 49, 58)
        
        img = Image.new("RGB", (img_w, img_h), bg_color)
        draw = ImageDraw.Draw(img)
        
        # Grid lines background
        for x in range(0, img_w, 40):
            draw.line([(x, 0), (x, img_h)], fill=(20, 28, 38), width=1)
        for y in range(0, img_h, 40):
            draw.line([(0, y), (img_w, y)], fill=(20, 28, 38), width=1)
            
        # Tactical Border & Corner Brackets
        margin = 15
        draw.rectangle([margin, margin, img_w - margin, img_h - margin], outline=border_color, width=2)
        
        # Corner brackets
        c_len = 25
        prim = t["primary_color"]
        # Top-left
        draw.line([(margin, margin), (margin + c_len, margin)], fill=prim, width=3)
        draw.line([(margin, margin), (margin, margin + c_len)], fill=prim, width=3)
        # Top-right
        draw.line([(img_w - margin, margin), (img_w - margin - c_len, margin)], fill=prim, width=3)
        draw.line([(img_w - margin, margin), (img_w - margin, margin + c_len)], fill=prim, width=3)
        # Bottom-left
        draw.line([(margin, img_h - margin), (margin + c_len, img_h - margin)], fill=prim, width=3)
        draw.line([(margin, img_h - margin), (margin, img_h - margin - c_len)], fill=prim, width=3)
        # Bottom-right
        draw.line([(img_w - margin, img_h - margin), (img_w - margin - c_len, img_h - margin)], fill=prim, width=3)
        draw.line([(img_w - margin, img_h - margin), (img_w - margin, img_h - margin - c_len)], fill=prim, width=3)

        # Header Badge
        draw.rectangle([margin + 20, margin + 15, img_w - margin - 20, margin + 45], fill=panel_color, outline=border_color)
        draw.text((margin + 30, margin + 22), f"CLASSIFIED TARGET SPECIFICATION // {t['code']}", fill=prim)
        draw.text((img_w - margin - 150, margin + 22), "CLEARANCE: L-4", fill=(117, 128, 138))

        # Central Visual Diagram Frame
        diag_x, diag_y = margin + 30, margin + 60
        diag_w, diag_h = 320, 360
        draw.rectangle([diag_x, diag_y, diag_x + diag_w, diag_y + diag_h], fill=(15, 20, 29), outline=prim, width=2)
        
        # Draw target wireframe figure
        # Head / Face
        head_cx, head_cy = diag_x + 160, diag_y + 110
        head_r = 55
        draw.ellipse([head_cx - head_r, head_cy - head_r, head_cx + head_r, head_cy + head_r], outline=prim, width=2)
        
        # Eyes
        eye_y = head_cy - 12
        if t["face_type"] == "surprised":
            # Wide open eyes
            draw.ellipse([head_cx - 28, eye_y - 10, head_cx - 12, eye_y + 8], outline=prim, width=2)
            draw.ellipse([head_cx + 12, eye_y - 10, head_cx + 28, eye_y + 8], outline=prim, width=2)
            # Raised eyebrows
            draw.arc([head_cx - 30, eye_y - 20, head_cx - 10, eye_y - 8], 200, 340, fill=prim, width=2)
            draw.arc([head_cx + 10, eye_y - 20, head_cx + 30, eye_y - 8], 200, 340, fill=prim, width=2)
            # 'O' mouth
            draw.ellipse([head_cx - 14, head_cy + 15, head_cx + 14, head_cy + 35], outline=prim, width=3)
        elif t["face_type"] == "smile":
            # Smiling eyes (arcs)
            draw.arc([head_cx - 28, eye_y - 8, head_cx - 12, eye_y + 8], 200, 340, fill=prim, width=3)
            draw.arc([head_cx + 12, eye_y - 8, head_cx + 28, eye_y + 8], 200, 340, fill=prim, width=3)
            # Big smile
            draw.arc([head_cx - 24, head_cy + 8, head_cx + 24, head_cy + 32], 20, 160, fill=prim, width=3)
            draw.line([(head_cx - 24, head_cy + 18), (head_cx + 24, head_cy + 18)], fill=prim, width=2)
        elif t["face_type"] == "thinking":
            # Concentrated gaze
            draw.line([(head_cx - 26, eye_y), (head_cx - 14, eye_y)], fill=prim, width=3)
            draw.line([(head_cx + 14, eye_y), (head_cx + 26, eye_y)], fill=prim, width=3)
            # Thinking slight smirk
            draw.arc([head_cx - 15, head_cy + 12, head_cx + 18, head_cy + 25], 20, 160, fill=prim, width=2)
        else:
            # Neutral line eyes & mouth
            draw.line([(head_cx - 26, eye_y), (head_cx - 14, eye_y)], fill=prim, width=2)
            draw.line([(head_cx + 14, eye_y), (head_cx + 26, eye_y)], fill=prim, width=2)
            draw.line([(head_cx - 18, head_cy + 20), (head_cx + 18, head_cy + 20)], fill=prim, width=2)

        # Torso / Neck / Shoulders
        draw.line([(head_cx, head_cy + head_r), (head_cx, head_cy + head_r + 20)], fill=prim, width=2) # neck
        shoulder_y = head_cy + head_r + 20
        draw.line([(head_cx - 90, shoulder_y + 35), (head_cx + 90, shoulder_y + 35)], fill=prim, width=2) # shoulder bar
        draw.line([(head_cx - 90, shoulder_y + 35), (head_cx - 70, diag_y + diag_h - 10)], fill=prim, width=2)
        draw.line([(head_cx + 90, shoulder_y + 35), (head_cx + 70, diag_y + diag_h - 10)], fill=prim, width=2)

        # Hand Gesture Wireframe
        accent = t["accent_color"]
        if t["hand_type"] == "peace":
            # Hand raised near cheek
            hx, hy = head_cx + 70, head_cy
            draw.ellipse([hx - 15, hy - 10, hx + 15, hy + 20], fill=(24, 32, 45), outline=accent, width=2)
            # V-sign 2 fingers
            draw.line([(hx - 6, hy - 10), (hx - 12, hy - 45)], fill=accent, width=4) # index
            draw.line([(hx + 4, hy - 10), (hx + 12, hy - 45)], fill=accent, width=4) # middle
            # Label
            draw.text((hx - 20, hy - 65), "V-SIGN", fill=accent)
        elif t["hand_type"] == "thumbs_up":
            # Hand at chest
            hx, hy = head_cx + 45, shoulder_y + 60
            draw.rectangle([hx - 15, hy - 10, hx + 15, hy + 25], fill=(24, 32, 45), outline=accent, width=2)
            # Thumb up
            draw.line([(hx - 10, hy - 10), (hx - 10, hy - 38)], fill=accent, width=5)
            draw.text((hx - 25, hy - 55), "THUMB UP", fill=accent)
        elif t["hand_type"] == "open_palm":
            # Open palm facing forward
            hx, hy = head_cx + 65, shoulder_y + 40
            draw.rectangle([hx - 20, hy, hx + 20, hy + 35], fill=(24, 32, 45), outline=accent, width=2)
            # 5 fingers extended
            for fx, off in [(-16, -20), (-8, -32), (0, -36), (8, -32), (16, -24)]:
                draw.line([(hx + fx, hy), (hx + fx, hy + off)], fill=accent, width=3)
            draw.text((hx - 25, hy - 55), "OPEN PALM", fill=accent)
        elif t["hand_type"] == "chin_touch":
            # Finger to chin
            hx, hy = head_cx + 25, head_cy + 35
            draw.line([(head_cx + 80, shoulder_y + 60), (hx, hy)], fill=accent, width=3) # forearm
            draw.line([(hx, hy), (hx, hy - 25)], fill=accent, width=4) # index to cheek
            draw.text((hx + 10, hy - 15), "CHIN ANCHOR", fill=accent)

        # Scanning Reticle / Crosshair Over Face
        draw.line([(head_cx - 65, head_cy), (head_cx - 45, head_cy)], fill=(255, 70, 85), width=2)
        draw.line([(head_cx + 45, head_cy), (head_cx + 65, head_cy)], fill=(255, 70, 85), width=2)
        draw.line([(head_cx, head_cy - 65), (head_cx, head_cy - 45)], fill=(255, 70, 85), width=2)
        draw.line([(head_cx, head_cy + 45), (head_cx, head_cy + 65)], fill=(255, 70, 85), width=2)

        # Right-side Specification Cards
        rx = diag_x + diag_w + 20
        ry = diag_y
        rw = img_w - rx - margin - 20

        # Card 1: Face Spec
        draw.rectangle([rx, ry, rx + rw, ry + 105], fill=panel_color, outline=border_color)
        draw.text((rx + 15, ry + 12), "[01] FACIAL VECTOR", fill=prim)
        draw.text((rx + 15, ry + 35), t["face_desc"], fill=(232, 241, 242))
        draw.text((rx + 15, ry + 75), "REQUIRED COMPATIBILITY: >= 65%", fill=(117, 128, 138))

        # Card 2: Hand Spec
        ry2 = ry + 120
        draw.rectangle([rx, ry2, rx + rw, ry2 + 105], fill=panel_color, outline=border_color)
        draw.text((rx + 15, ry2 + 12), "[02] HAND KINEMATICS", fill=accent)
        draw.text((rx + 15, ry2 + 35), t["hand_desc"], fill=(232, 241, 242))
        draw.text((rx + 15, ry2 + 75), "REQUIRED COMPATIBILITY: >= 65%", fill=(117, 128, 138))

        # Card 3: Body / Pose Spec
        ry3 = ry2 + 120
        draw.rectangle([rx, ry3, rx + rw, ry3 + 105], fill=panel_color, outline=border_color)
        draw.text((rx + 15, ry3 + 12), "[03] POSTURE & POSITION", fill=prim)
        draw.text((rx + 15, ry3 + 35), t["pose_desc"], fill=(232, 241, 242))
        draw.text((rx + 15, ry3 + 75), "REQUIRED COMPATIBILITY: >= 65%", fill=(117, 128, 138))

        # Bottom Telemetry Bar
        bar_y = img_h - margin - 35
        draw.rectangle([margin + 20, bar_y, img_w - margin - 20, bar_y + 25], fill=panel_color, outline=border_color)
        draw.text((margin + 30, bar_y + 6), "STATUS: REFERENCE LOADED // SENSOR READY // TIMEOUT: 10s", fill=(0, 255, 156))

        save_path = os.path.join("assets", "gestures", t["filename"])
        img.save(save_path)
        print(f"[GESTURE] Generated {t['filename']} ({os.path.getsize(save_path)} bytes)")


if __name__ == "__main__":
    print("Generating starter assets...")
    generate_voice_assets()
    generate_gesture_assets()
    print("All starter assets generated successfully.")
