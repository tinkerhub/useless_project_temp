"""
CYBERSECURITY USER INTERFACE (ONLY FOR YOUR EYES 😍)
High-fidelity classified terminal desktop application built with Tkinter, Canvas, and PIL.
Features custom cyber frames, tactical HUDs, real-time video feed, audio meters,
strict independent gate enforcement, and the dramatic Rickroll reveal.
"""

import os
import sys
import time
import math
import random
import threading
import webbrowser
import tkinter as tk
from tkinter import messagebox
from PIL import Image, ImageTk
import cv2
import numpy as np

import config
from cognition import CognitionVerifier
from typing_analysis import TypingTracker, analyze_keystroke_behaviour, load_typing_sentences, TypingSession
from multimodal import MultimodalVerifier
from voice import VoiceVerifier
from scoring import SecurityAssessmentEngine


class AppUI:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title(f"{config.APP_NAME} | {config.APP_SUBTITLE}")
        self.root.geometry(f"{config.WINDOW_WIDTH}x{config.WINDOW_HEIGHT}")
        self.root.configure(bg=config.BG_COLOR)
        self.root.minsize(980, 720)

        # Engines & Handlers
        self.engine = SecurityAssessmentEngine()
        self.cognition_verifier = CognitionVerifier()
        self.multimodal_verifier = MultimodalVerifier()
        self.voice_verifier = VoiceVerifier()
        self.typing_session = TypingSession()
        self.typing_sentences = self.typing_session.sentences

        # Camera & Sensor State
        self.cap: Optional[cv2.VideoCapture] = None
        self.camera_running = False
        self.camera_photo: Optional[ImageTk.PhotoImage] = None
        self.target_photo: Optional[ImageTk.PhotoImage] = None
        self.live_telemetry: Dict = {}
        self.webcam_frame_bgr: Optional[np.ndarray] = None

        # Typing protocol state
        self.typing_tracker = TypingTracker()
        self.current_typing_sentence = ""

        # Voice protocol state
        self.vu_animating = False

        # Container Frame
        self.container = tk.Frame(self.root, bg=config.BG_COLOR)
        self.container.pack(fill="both", expand=True)

        # Protocol Header bar (persists across verification screens)
        self.header_frame = tk.Frame(self.container, bg=config.BG_SURFACE, height=55)
        self.header_frame.pack(fill="x", side="top")
        self._build_global_header()

        # Main dynamic content frame
        self.content_frame = tk.Frame(self.container, bg=config.BG_COLOR)
        self.content_frame.pack(fill="both", expand=True, padx=25, pady=(10, 20))

        # Start Screen
        self.show_screen_start()

        # Handle window close
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    def _build_global_header(self):
        """Top persistent classified terminal status ribbon."""
        for widget in self.header_frame.winfo_children():
            widget.destroy()

        left_f = tk.Frame(self.header_frame, bg=config.BG_SURFACE)
        left_f.pack(side="left", padx=20, pady=8)

        lbl_app = tk.Label(
            left_f,
            text=config.APP_NAME,
            font=(config.FONT_MONO, 12, "bold"),
            fg=config.COLOR_ACCENT,
            bg=config.BG_SURFACE
        )
        lbl_app.pack(side="left", padx=(0, 15))

        self.lbl_protocol_step = tk.Label(
            left_f,
            text="STATUS: STANDBY",
            font=(config.FONT_MONO, 10),
            fg=config.COLOR_CYAN,
            bg=config.BG_SURFACE
        )
        self.lbl_protocol_step.pack(side="left")

        right_f = tk.Frame(self.header_frame, bg=config.BG_SURFACE)
        right_f.pack(side="right", padx=20, pady=8)

        lbl_sec = tk.Label(
            right_f,
            text=config.CLEARANCE_BADGE,
            font=(config.FONT_MONO, 9, "bold"),
            fg=config.COLOR_WARNING,
            bg=config.BG_SURFACE
        )
        lbl_sec.pack(side="right")

    def update_header_status(self, protocol_text: str):
        self.lbl_protocol_step.config(text=protocol_text)

    def clear_content(self):
        """Stop sensors and clear active content frame."""
        self._stop_camera()
        self.vu_animating = False
        for widget in self.content_frame.winfo_children():
            widget.destroy()

    def _stop_camera(self):
        """Cleanly stop camera thread and release capture."""
        self.camera_running = False
        if self.cap:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None

    def _on_close(self):
        """Clean exit."""
        self._stop_camera()
        try:
            self.multimodal_verifier.close()
        except Exception:
            pass
        self.root.destroy()
        sys.exit(0)

    # ============================================================
    # SCREEN 0: SYSTEM INITIALIZATION & START
    # ============================================================
    def show_screen_start(self):
        self.clear_content()
        self.engine.reset()
        self.update_header_status("STATUS: INITIALIZING SECURITY SYSTEM")

        outer_card = tk.Frame(
            self.content_frame,
            bg=config.PANEL_COLOR,
            highlightbackground=config.PANEL_BORDER,
            highlightthickness=2
        )
        outer_card.pack(expand=True, padx=60, pady=40, fill="both")

        # Classification Banner
        tk.Label(
            outer_card,
            text="RESTRICTED ACCESS TERMINAL // LEVEL-4 CLASSIFIED",
            font=(config.FONT_MONO, 10, "bold"),
            fg=config.COLOR_DANGER,
            bg=config.PANEL_COLOR
        ).pack(pady=(35, 10))

        # Main Title
        tk.Label(
            outer_card,
            text=config.APP_NAME,
            font=(config.FONT_MONO, 24, "bold"),
            fg=config.COLOR_ACCENT,
            bg=config.PANEL_COLOR
        ).pack(pady=5)

        tk.Label(
            outer_card,
            text=config.APP_SUBTITLE,
            font=(config.FONT_MONO, 12),
            fg=config.COLOR_TEXT,
            bg=config.PANEL_COLOR
        ).pack(pady=(0, 25))

        # System Directive Info Box
        info_panel = tk.Frame(outer_card, bg="#0D131C", padx=25, pady=18, highlightbackground="#1C2738", highlightthickness=1)
        info_panel.pack(padx=80, fill="x")

        directive_text = (
            "NOTICE: You are accessing a high-security defense information terminal.\n"
            "In accordance with National Cyber Defense Protocol 94-B, access to classified\n"
            "intelligence requires passing four mandatory autonomous verification protocols:\n\n"
            "  [PROTOCOL 01] Human Cognition Semantic Assessment\n"
            "  [PROTOCOL 02] Keystroke Dynamics & Behavioural Cadence\n"
            "  [PROTOCOL 03] Multimodal Optical Expression & Gesture Verification\n"
            "  [PROTOCOL 04] Acoustic Voice Response & Harmonic Timing\n\n"
            "WARNING: Autonomous bot countermeasures are active. Any single protocol failure\n"
            "will result in immediate security termination without retry."
        )
        tk.Label(
            info_panel,
            text=directive_text,
            font=(config.FONT_MONO, 10),
            fg="#A4B3C6",
            bg="#0D131C",
            justify="left",
            anchor="w"
        ).pack(fill="x")

        # Initiate Button
        btn_start = tk.Button(
            outer_card,
            text="[ INITIATE SECURITY PROTOCOLS ]",
            font=(config.FONT_MONO, 13, "bold"),
            fg="#070A0E",
            bg=config.COLOR_ACCENT,
            activebackground="#00D280",
            activeforeground="#070A0E",
            padx=25,
            pady=12,
            relief="flat",
            cursor="hand2",
            command=self.show_screen_protocol_01
        )
        btn_start.pack(pady=(40, 30))

    # ============================================================
    # SCREEN 1: PROTOCOL 01 // HUMAN COGNITION VERIFICATION
    # ============================================================
    def show_screen_protocol_01(self):
        self.clear_content()
        self.update_header_status("PROTOCOL 01 // HUMAN COGNITION VERIFICATION")

        challenge = self.cognition_verifier.get_new_challenge()

        panel = tk.Frame(
            self.content_frame,
            bg=config.PANEL_COLOR,
            highlightbackground=config.PANEL_BORDER,
            highlightthickness=2,
            padx=40,
            pady=30
        )
        panel.pack(expand=True, fill="both", padx=80, pady=30)

        # Header Badge
        tk.Label(
            panel,
            text="PROTOCOL 01 // HUMAN COGNITION VERIFICATION",
            font=(config.FONT_MONO, 14, "bold"),
            fg=config.COLOR_CYAN,
            bg=config.PANEL_COLOR
        ).pack(anchor="w", pady=(0, 10))

        tk.Label(
            panel,
            text="Automated CAPTCHAs are obsolete. Provide an authentic human response to verify natural cognitive reasoning.",
            font=(config.FONT_MONO, 10),
            fg=config.COLOR_MUTED,
            bg=config.PANEL_COLOR
        ).pack(anchor="w", pady=(0, 25))

        # Prompt Box
        prompt_frame = tk.Frame(panel, bg="#0A0E15", padx=20, pady=18, highlightbackground="#1D2736", highlightthickness=1)
        prompt_frame.pack(fill="x", pady=10)

        tk.Label(
            prompt_frame,
            text="RESPOND TO THE FOLLOWING:",
            font=(config.FONT_MONO, 10, "bold"),
            fg=config.COLOR_WARNING,
            bg="#0A0E15"
        ).pack(anchor="w")

        tk.Label(
            prompt_frame,
            text=f'"{challenge.get("prompt", "")}"',
            font=(config.FONT_MONO, 15, "bold"),
            fg=config.COLOR_TEXT,
            bg="#0A0E15",
            wraplength=700,
            justify="left"
        ).pack(anchor="w", pady=(10, 5))

        # Text input field
        tk.Label(
            panel,
            text="INPUT RESPONSE (Free-form text):",
            font=(config.FONT_MONO, 10),
            fg=config.COLOR_MUTED,
            bg=config.PANEL_COLOR
        ).pack(anchor="w", pady=(20, 5))

        entry_resp = tk.Entry(
            panel,
            font=(config.FONT_MONO, 13),
            bg="#090D13",
            fg=config.COLOR_TEXT,
            insertbackground=config.COLOR_ACCENT,
            highlightbackground="#1C2738",
            highlightcolor=config.COLOR_ACCENT,
            highlightthickness=1,
            relief="flat"
        )
        entry_resp.pack(fill="x", ipady=8)
        entry_resp.focus()

        # Status & Telemetry label
        lbl_status = tk.Label(
            panel,
            text="AWAITING RESPONSE SUBMISSION...",
            font=(config.FONT_MONO, 10),
            fg=config.COLOR_MUTED,
            bg=config.PANEL_COLOR
        )
        lbl_status.pack(pady=15)

        def submit_response():
            user_text = entry_resp.get().strip()
            if not user_text:
                lbl_status.config(text="ERROR: RESPONSE CANNOT BE EMPTY", fg=config.COLOR_WARNING)
                return

            lbl_status.config(text="EVALUATING SEMANTIC LOGIC...", fg=config.COLOR_WARNING)
            self.root.update()

            eval_res = self.cognition_verifier.evaluate_response(user_text, challenge)
            passed = self.engine.record_protocol_01_cognition(eval_res)

            if passed:
                lbl_status.config(
                    text=f"COGNITIVE RESPONSE: VERIFIED\nCONFIDENCE: {eval_res['confidence']:.1f}%\nPROCEEDING TO PROTOCOL 02...",
                    fg=config.COLOR_ACCENT
                )
                entry_resp.config(state="disabled")
                btn_submit.config(state="disabled")
                self.root.after(1400, self.show_screen_protocol_02)
            else:
                # STRICT GATE FAIL: Trigger BOT DETECTED immediately
                self.show_screen_bot_detected()

        entry_resp.bind("<Return>", lambda e: submit_response())

        btn_row = tk.Frame(panel, bg=config.PANEL_COLOR)
        btn_row.pack(pady=(10, 10))

        btn_submit = tk.Button(
            btn_row,
            text="[ SUBMIT RESPONSE ]",
            font=(config.FONT_MONO, 11, "bold"),
            fg="#070A0E",
            bg=config.COLOR_ACCENT,
            activebackground="#00D280",
            activeforeground="#070A0E",
            padx=20,
            pady=8,
            relief="flat",
            cursor="hand2",
            command=submit_response
        )
        btn_submit.pack(side="left", padx=(0, 15))

        def try_another_cognition():
            # Discard current challenge, select another without penalty or score change
            self.show_screen_protocol_01()

        btn_try = tk.Button(
            btn_row,
            text="[ TRY ANOTHER ]",
            font=(config.FONT_MONO, 11, "bold"),
            fg=config.COLOR_CYAN,
            bg="#141B26",
            activebackground="#1C2738",
            activeforeground=config.COLOR_CYAN,
            padx=18,
            pady=8,
            relief="flat",
            cursor="hand2",
            command=try_another_cognition
        )
        btn_try.pack(side="left")

    # ============================================================
    # SCREEN 2: PROTOCOL 02 // BEHAVIOURAL TYPING ANALYSIS
    # ============================================================
    def show_screen_protocol_02(self):
        self.clear_content()
        self.update_header_status("PROTOCOL 02 // BEHAVIOURAL TYPING ANALYSIS")

        self.current_typing_sentence = self.typing_session.get_new_sentence()
        self.typing_tracker.reset()

        panel = tk.Frame(
            self.content_frame,
            bg=config.PANEL_COLOR,
            highlightbackground=config.PANEL_BORDER,
            highlightthickness=2,
            padx=40,
            pady=25
        )
        panel.pack(expand=True, fill="both", padx=60, pady=20)

        tk.Label(
            panel,
            text="PROTOCOL 02 // BEHAVIOURAL TYPING ANALYSIS",
            font=(config.FONT_MONO, 14, "bold"),
            fg=config.COLOR_CYAN,
            bg=config.PANEL_COLOR
        ).pack(anchor="w", pady=(0, 5))

        tk.Label(
            panel,
            text="Reproduce the target security phrase. Flight intervals, dwell times, and cadence consistency will be analyzed.",
            font=(config.FONT_MONO, 10),
            fg=config.COLOR_MUTED,
            bg=config.PANEL_COLOR
        ).pack(anchor="w", pady=(0, 15))

        # Sentence Box
        phrase_frame = tk.Frame(panel, bg="#0A0E15", padx=20, pady=14, highlightbackground="#1D2736", highlightthickness=1)
        phrase_frame.pack(fill="x", pady=(0, 15))

        tk.Label(
            phrase_frame,
            text="TARGET PHRASE:",
            font=(config.FONT_MONO, 9, "bold"),
            fg=config.COLOR_WARNING,
            bg="#0A0E15"
        ).pack(anchor="w")

        tk.Label(
            phrase_frame,
            text=self.current_typing_sentence,
            font=(config.FONT_MONO, 13, "bold"),
            fg=config.COLOR_TEXT,
            bg="#0A0E15",
            wraplength=800,
            justify="left"
        ).pack(anchor="w", pady=(6, 2))

        # Typing Box
        entry_typing = tk.Entry(
            panel,
            font=(config.FONT_MONO, 13),
            bg="#090D13",
            fg=config.COLOR_TEXT,
            insertbackground=config.COLOR_ACCENT,
            highlightbackground="#1C2738",
            highlightcolor=config.COLOR_ACCENT,
            highlightthickness=1,
            relief="flat"
        )
        entry_typing.pack(fill="x", ipady=8, pady=(0, 15))
        entry_typing.focus()

        # Telemetry Grid Dashboard
        telemetry_frame = tk.Frame(panel, bg="#0D131C", padx=15, pady=10, highlightbackground="#1C2738", highlightthickness=1)
        telemetry_frame.pack(fill="x", pady=(0, 15))

        lbl_wpm = tk.Label(telemetry_frame, text="SPEED: -- WPM", font=(config.FONT_MONO, 9), fg=config.COLOR_CYAN, bg="#0D131C")
        lbl_wpm.grid(row=0, column=0, padx=15, sticky="w")

        lbl_flight = tk.Label(telemetry_frame, text="MEAN FLIGHT: -- ms", font=(config.FONT_MONO, 9), fg=config.COLOR_CYAN, bg="#0D131C")
        lbl_flight.grid(row=0, column=1, padx=15, sticky="w")

        lbl_dwell = tk.Label(telemetry_frame, text="DWELL TIME: -- ms", font=(config.FONT_MONO, 9), fg=config.COLOR_CYAN, bg="#0D131C")
        lbl_dwell.grid(row=0, column=2, padx=15, sticky="w")

        lbl_corrections = tk.Label(telemetry_frame, text="CORRECTIONS: 0", font=(config.FONT_MONO, 9), fg=config.COLOR_CYAN, bg="#0D131C")
        lbl_corrections.grid(row=0, column=3, padx=15, sticky="w")

        # Telemetry status / Verdict label
        lbl_verdict = tk.Label(
            panel,
            text="RECORDING HARDWARE KEYSTROKE SIGNATURE...",
            font=(config.FONT_MONO, 10),
            fg=config.COLOR_MUTED,
            bg=config.PANEL_COLOR
        )
        lbl_verdict.pack(pady=5)

        def on_key_press(event):
            self.typing_tracker.record_key_down(event.keysym)
            lbl_verdict.config(text="CAPTURING TEMPORAL INTER-KEY INTERVALS...", fg=config.COLOR_WARNING)
            lbl_corrections.config(text=f"CORRECTIONS: {self.typing_tracker.backspace_count}")

        def on_key_release(event):
            self.typing_tracker.record_key_up(event.keysym)

        entry_typing.bind("<KeyPress>", on_key_press)
        entry_typing.bind("<KeyRelease>", on_key_release)

        def submit_keystrokes():
            typed = entry_typing.get()
            eval_res = analyze_keystroke_behaviour(self.current_typing_sentence, typed, self.typing_tracker)
            passed = self.engine.record_protocol_02_typing(eval_res)

            # Update telemetry view
            lbl_wpm.config(text=f"SPEED: {eval_res['speed_wpm']} WPM ({eval_res['speed_cps']} CPS)")
            lbl_flight.config(text=f"MEAN FLIGHT: {eval_res['flight_ms']} ms")
            lbl_dwell.config(text=f"DWELL TIME: {eval_res['dwell_ms']} ms")
            lbl_corrections.config(text=f"CORRECTIONS: {eval_res['corrections']}")

            if passed:
                lbl_verdict.config(
                    text=(
                        f"KEYSTROKE BEHAVIOUR: VERIFIED\n"
                        f"BEHAVIOURAL SCORE: {eval_res['score']:.1f}%\n"
                        f"CADENCE: {eval_res['cadence_status']}\n"
                        f"PROCEEDING TO PROTOCOL 03..."
                    ),
                    fg=config.COLOR_ACCENT
                )
                entry_typing.config(state="disabled")
                btn_verify.config(state="disabled")
                self.root.after(1600, self.show_screen_protocol_03)
            else:
                # STRICT GATE FAIL
                self.show_screen_bot_detected()

        entry_typing.bind("<Return>", lambda e: submit_keystrokes())

        btn_row = tk.Frame(panel, bg=config.PANEL_COLOR)
        btn_row.pack(pady=10)

        btn_verify = tk.Button(
            btn_row,
            text="[ ANALYSE BEHAVIOURAL CADENCE ]",
            font=(config.FONT_MONO, 11, "bold"),
            fg="#070A0E",
            bg=config.COLOR_ACCENT,
            activebackground="#00D280",
            activeforeground="#070A0E",
            padx=20,
            pady=8,
            relief="flat",
            cursor="hand2",
            command=submit_keystrokes
        )
        btn_verify.pack(side="left", padx=(0, 15))

        def try_another_typing():
            if len(self.typing_sentences) > 1:
                self.show_screen_protocol_02()

        has_multiple_typing = len(self.typing_sentences) > 1
        btn_try = tk.Button(
            btn_row,
            text="[ TRY ANOTHER ]",
            font=(config.FONT_MONO, 11, "bold"),
            fg=config.COLOR_CYAN if has_multiple_typing else config.COLOR_MUTED,
            bg="#141B26" if has_multiple_typing else "#0B1017",
            activebackground="#1C2738",
            activeforeground=config.COLOR_CYAN,
            padx=18,
            pady=8,
            relief="flat",
            state="normal" if has_multiple_typing else "disabled",
            cursor="hand2" if has_multiple_typing else "arrow",
            command=try_another_typing
        )
        btn_try.pack(side="left")

    # ============================================================
    # SCREEN 3: PROTOCOL 03 // MULTIMODAL EXPRESSION + GESTURE
    # ============================================================
    def show_screen_protocol_03(self):
        self.clear_content()
        self.update_header_status("PROTOCOL 03 // MULTIMODAL EXPRESSION + GESTURE VERIFICATION")

        target = self.multimodal_verifier.get_new_target()

        panel = tk.Frame(
            self.content_frame,
            bg=config.PANEL_COLOR,
            highlightbackground=config.PANEL_BORDER,
            highlightthickness=2,
            padx=25,
            pady=20
        )
        panel.pack(expand=True, fill="both", padx=30, pady=15)

        tk.Label(
            panel,
            text="PROTOCOL 03 // MULTIMODAL EXPRESSION + GESTURE VERIFICATION",
            font=(config.FONT_MONO, 14, "bold"),
            fg=config.COLOR_CYAN,
            bg=config.PANEL_COLOR
        ).pack(anchor="w", pady=(0, 4))

        tk.Label(
            panel,
            text="Simultaneously mirror the target facial expression, hand configuration, and body posture shown on the target specification.",
            font=(config.FONT_MONO, 9),
            fg=config.COLOR_MUTED,
            bg=config.PANEL_COLOR
        ).pack(anchor="w", pady=(0, 10))

        # Two-column layout: Left Target Image, Right Live Webcam Stream
        stream_container = tk.Frame(panel, bg=config.PANEL_COLOR)
        stream_container.pack(fill="both", expand=True)

        # Left Column: Target Reference Card
        left_col = tk.Frame(stream_container, bg="#0A0E15", highlightbackground="#1C2738", highlightthickness=1)
        left_col.pack(side="left", fill="both", expand=True, padx=(0, 10))

        tk.Label(
            left_col,
            text="REFERENCE TARGET // LOADED",
            font=(config.FONT_MONO, 10, "bold"),
            fg=config.COLOR_ACCENT,
            bg="#0A0E15"
        ).pack(pady=(8, 2))

        tk.Label(
            left_col,
            text="SOURCE: USER-PROVIDED ASSET",
            font=(config.FONT_MONO, 8, "bold"),
            fg=config.COLOR_WARNING,
            bg="#0A0E15"
        ).pack(pady=(0, 4))

        lbl_target_img = tk.Label(left_col, bg="#0A0E15")
        lbl_target_img.pack(padx=10, pady=5, expand=True)

        # Load and display target image
        if target.get("image_path") and os.path.exists(target["image_path"]):
            try:
                pil_img = Image.open(target["image_path"]).resize((420, 340), Image.Resampling.LANCZOS)
                self.target_photo = ImageTk.PhotoImage(pil_img)
                lbl_target_img.config(image=self.target_photo)
            except Exception as e:
                lbl_target_img.config(text=f"Target: {target['name']}\n{target['instructions']}")
        else:
            lbl_target_img.config(text=f"Target: {target['name']}\n{target['instructions']}", fg=config.COLOR_TEXT)

        lbl_action = tk.Label(
            left_col,
            text=f"ACTION: {target.get('instructions', '')}",
            font=(config.FONT_MONO, 9, "bold"),
            fg=config.COLOR_CYAN,
            bg="#0A0E15",
            wraplength=400,
            justify="center"
        )
        lbl_action.pack(pady=(4, 8))

        # Right Column: Live Video Sensor Feed
        right_col = tk.Frame(stream_container, bg="#0A0E15", highlightbackground="#1C2738", highlightthickness=1)
        right_col.pack(side="right", fill="both", expand=True, padx=(10, 0))

        tk.Label(
            right_col,
            text="LIVE OPTICAL FEED // OPTICAL SENSOR [ACTIVE]",
            font=(config.FONT_MONO, 10, "bold"),
            fg=config.COLOR_ACCENT,
            bg="#0A0E15"
        ).pack(pady=(8, 4))

        lbl_webcam = tk.Label(right_col, bg="#0A0E15")
        lbl_webcam.pack(padx=10, pady=5, expand=True)

        # Countdown & telemetry bottom bar
        bottom_bar = tk.Frame(panel, bg="#0D131C", padx=15, pady=8, highlightbackground="#1C2738", highlightthickness=1)
        bottom_bar.pack(fill="x", pady=(10, 0))

        lbl_scores = tk.Label(
            bottom_bar,
            text="FACE COMPATIBILITY: --%  |  HAND COMPATIBILITY: --%  |  POSE COMPATIBILITY: --%  |  MULTIMODAL: --%",
            font=(config.FONT_MONO, 10),
            fg=config.COLOR_CYAN,
            bg="#0D131C"
        )
        lbl_scores.pack(side="left")

        # Start Camera Thread
        self.camera_running = True
        try:
            self.cap = cv2.VideoCapture(0)
            if not self.cap.isOpened():
                self.cap = None
        except Exception:
            self.cap = None

        def update_camera():
            if not self.camera_running:
                return

            frame = None
            if self.cap and self.cap.isOpened():
                ret, live_frame = self.cap.read()
                if ret:
                    frame = live_frame

            if frame is None:
                # Simulated tactical fallback frame if no webcam hardware
                frame = np.zeros((360, 480, 3), dtype=np.uint8)
                cv2.putText(frame, "OPTICAL SENSOR SIMULATION", (60, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 156), 2)
                cv2.putText(frame, "PRESS SCAN TO EVALUATE", (75, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (117, 128, 138), 1)

            # Flip horizontally for natural mirror effect
            frame = cv2.flip(frame, 1)
            self.webcam_frame_bgr = frame

            # Process frame with MediaPipe / HUD overlays
            annotated_frame, telemetry = self.multimodal_verifier.process_frame(frame, draw_hud=True)
            self.live_telemetry = telemetry

            # Render to Tkinter label
            rgb = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)
            pil_feed = Image.fromarray(rgb).resize((420, 340), Image.Resampling.BILINEAR)
            self.camera_photo = ImageTk.PhotoImage(pil_feed)
            lbl_webcam.config(image=self.camera_photo)

            if self.camera_running:
                self.root.after(35, update_camera)

        self.root.after(100, update_camera)

        # 5-Second Countdown and Peak-Score Window Tracking
        countdown_state = {"seconds_left": 5, "scanning": False}
        best_eval = [{"multimodal_score": 0.0}]

        def start_countdown():
            if countdown_state["scanning"]:
                return
            countdown_state["scanning"] = True
            countdown_state["seconds_left"] = 5
            best_eval[0] = {"multimodal_score": 0.0}
            btn_scan.config(state="disabled")

            def countdown_tick():
                sec = countdown_state["seconds_left"]
                # Continuously evaluate current frame and retain peak congruence
                if self.live_telemetry:
                    current_eval = self.multimodal_verifier.evaluate_telemetry(self.live_telemetry, target)
                    if current_eval.get("multimodal_score", 0.0) > best_eval[0].get("multimodal_score", 0.0):
                        best_eval[0] = current_eval

                if sec > 0:
                    btn_scan.config(text=f"[ SCANNING IN {sec}s... HOLD POSE ]", fg=config.COLOR_WARNING)
                    countdown_state["seconds_left"] -= 1
                    self.root.after(1000, countdown_tick)
                else:
                    btn_scan.config(text="[ ANALYSING BIOMETRIC CONGRUENCE... ]", fg=config.COLOR_ACCENT)
                    perform_evaluation()

            countdown_tick()

        def perform_evaluation():
            # Use best frame captured during the 5s window
            eval_res = best_eval[0] if best_eval[0].get("multimodal_score", 0.0) > 0.0 else self.multimodal_verifier.evaluate_telemetry(self.live_telemetry, target)

            passed = self.engine.record_protocol_03_multimodal(eval_res)

            lbl_scores.config(
                text=(
                    f"FACE COMPATIBILITY: {eval_res.get('face_compatibility', 85)}%  |  "
                    f"HAND COMPATIBILITY: {eval_res.get('hand_compatibility', 82)}%  |  "
                    f"POSE COMPATIBILITY: {eval_res.get('pose_compatibility', 84)}%  |  "
                    f"MULTIMODAL RESPONSE: {eval_res.get('multimodal_score', 85)}%"
                )
            )

            if passed:
                btn_scan.config(text="✓ MULTIMODAL VERIFIED", fg=config.COLOR_ACCENT)
                self.root.after(1600, self.show_screen_protocol_04)
            else:
                # STRICT GATE FAIL
                self.show_screen_bot_detected()

        def try_another_target():
            nonlocal target
            # Reset active scan state & timer
            countdown_state["scanning"] = False
            countdown_state["seconds_left"] = 0
            best_eval[0] = {"multimodal_score": 0.0}
            btn_scan.config(text="[ COMMENCE 5-SECOND SCAN ]", fg="#070A0E", bg=config.COLOR_ACCENT, state="normal")
            lbl_scores.config(text="FACE COMPATIBILITY: --%  |  HAND COMPATIBILITY: --%  |  POSE COMPATIBILITY: --%  |  MULTIMODAL: --%")

            # Select a different real JPEG target from the pool
            target = self.multimodal_verifier.get_new_target()

            if target.get("image_path") and os.path.exists(target["image_path"]):
                try:
                    pil_img = Image.open(target["image_path"]).resize((420, 340), Image.Resampling.LANCZOS)
                    self.target_photo = ImageTk.PhotoImage(pil_img)
                    lbl_target_img.config(image=self.target_photo, text="")
                except Exception:
                    lbl_target_img.config(image="", text=f"Target: {target['name']}\n{target['instructions']}")
            else:
                lbl_target_img.config(image="", text=f"Target: {target['name']}\n{target['instructions']}")

            lbl_action.config(text=f"ACTION: {target.get('instructions', '')}")

        btn_try = tk.Button(
            bottom_bar,
            text="[ TRY ANOTHER ]",
            font=(config.FONT_MONO, 10, "bold"),
            fg=config.COLOR_CYAN,
            bg="#141B26",
            activebackground="#1C2738",
            activeforeground=config.COLOR_CYAN,
            padx=14,
            pady=6,
            relief="flat",
            cursor="hand2",
            command=try_another_target
        )
        btn_try.pack(side="right", padx=(10, 0))

        btn_scan = tk.Button(
            bottom_bar,
            text="[ COMMENCE 5-SECOND SCAN ]",
            font=(config.FONT_MONO, 10, "bold"),
            fg="#070A0E",
            bg=config.COLOR_ACCENT,
            activebackground="#00D280",
            activeforeground="#070A0E",
            padx=15,
            pady=6,
            relief="flat",
            cursor="hand2",
            command=start_countdown
        )
        btn_scan.pack(side="right")

    # ============================================================
    # SCREEN 4: PROTOCOL 04 // VOICE RESPONSE VERIFICATION
    # ============================================================
    def show_screen_protocol_04(self):
        self.clear_content()
        self.update_header_status("PROTOCOL 04 // VOICE RESPONSE VERIFICATION")

        prompt = self.voice_verifier.get_new_prompt()

        panel = tk.Frame(
            self.content_frame,
            bg=config.PANEL_COLOR,
            highlightbackground=config.PANEL_BORDER,
            highlightthickness=2,
            padx=40,
            pady=25
        )
        panel.pack(expand=True, fill="both", padx=60, pady=20)

        tk.Label(
            panel,
            text="PROTOCOL 04 // VOICE RESPONSE VERIFICATION",
            font=(config.FONT_MONO, 14, "bold"),
            fg=config.COLOR_CYAN,
            bg=config.PANEL_COLOR
        ).pack(anchor="w", pady=(0, 5))

        tk.Label(
            panel,
            text="Play the reference vocal recording, then speak into the microphone to replicate the phonetic and harmonic cadence.",
            font=(config.FONT_MONO, 10),
            fg=config.COLOR_MUTED,
            bg=config.PANEL_COLOR
        ).pack(anchor="w", pady=(0, 15))

        # Reference Audio Box
        ref_frame = tk.Frame(panel, bg="#0A0E15", padx=20, pady=16, highlightbackground="#1D2736", highlightthickness=1)
        ref_frame.pack(fill="x", pady=(0, 15))

        tk.Label(
            ref_frame,
            text=f"REFERENCE RESPONSE // SPEAKER: {prompt.get('speaker', 'Classified')}",
            font=(config.FONT_MONO, 9, "bold"),
            fg=config.COLOR_WARNING,
            bg="#0A0E15"
        ).pack(anchor="w")

        tk.Label(
            ref_frame,
            text=f'"{prompt.get("phrase", "")}"',
            font=(config.FONT_MONO, 14, "bold"),
            fg=config.COLOR_TEXT,
            bg="#0A0E15"
        ).pack(anchor="w", pady=(8, 10))

        def try_another_voice():
            # Stop any audio playback immediately
            self.voice_verifier.stop_playback()

            # Stop recording and cancel timer
            if recording_timer[0]:
                try:
                    self.root.after_cancel(recording_timer[0])
                except Exception:
                    pass
                recording_timer[0] = None
            if self.voice_verifier.is_recording:
                self.voice_verifier.stop_recording()

            # Refresh protocol 04 with a different voice challenge
            self.show_screen_protocol_04()

        def play_ref():
            btn_play.config(text="[ 🔊 PLAYING REFERENCE... ]", state="disabled")
            def on_done():
                btn_play.config(text="[ 🔊 PLAY REFERENCE ]", state="normal")
            self.voice_verifier.play_reference_audio(on_finish=on_done)

        audio_ctrl_frame = tk.Frame(ref_frame, bg="#0A0E15")
        audio_ctrl_frame.pack(anchor="w")

        btn_play = tk.Button(
            audio_ctrl_frame,
            text="[ 🔊 PLAY REFERENCE ]",
            font=(config.FONT_MONO, 10, "bold"),
            fg=config.COLOR_CYAN,
            bg="#141B26",
            activebackground="#1C2738",
            activeforeground=config.COLOR_CYAN,
            padx=14,
            pady=6,
            relief="flat",
            cursor="hand2",
            command=play_ref
        )
        btn_play.pack(side="left", padx=(0, 15))

        btn_try_ref = tk.Button(
            audio_ctrl_frame,
            text="[ TRY ANOTHER ]",
            font=(config.FONT_MONO, 10, "bold"),
            fg=config.COLOR_CYAN,
            bg="#141B26",
            activebackground="#1C2738",
            activeforeground=config.COLOR_CYAN,
            padx=14,
            pady=6,
            relief="flat",
            cursor="hand2",
            command=try_another_voice
        )
        btn_try_ref.pack(side="left")

        # Microphone Recording & Level Meter Section
        rec_frame = tk.Frame(panel, bg="#0D131C", padx=20, pady=16, highlightbackground="#1C2738", highlightthickness=1)
        rec_frame.pack(fill="x", pady=(0, 15))

        tk.Label(
            rec_frame,
            text="REPEAT THE RESPONSE // VOCAL SENSOR INPUT:",
            font=(config.FONT_MONO, 10, "bold"),
            fg=config.COLOR_CYAN,
            bg="#0D131C"
        ).pack(anchor="w", pady=(0, 8))

        # Audio VU Level Meter Canvas
        canvas_vu = tk.Canvas(rec_frame, height=22, bg="#080B10", highlightthickness=1, highlightbackground="#1C2738")
        canvas_vu.pack(fill="x", pady=(0, 12))

        def update_vu_meter():
            if not self.vu_animating:
                canvas_vu.delete("all")
                return
            canvas_vu.delete("all")
            vol = self.voice_verifier.live_volume
            w = canvas_vu.winfo_width()
            h = canvas_vu.winfo_height()
            bar_w = int(w * vol)

            # Draw segmented cyber VU bars
            num_bars = 40
            active_bars = int(num_bars * vol)
            for i in range(num_bars):
                x1 = int(i * (w / num_bars)) + 2
                x2 = int((i + 1) * (w / num_bars)) - 2
                col = config.COLOR_ACCENT if i < 28 else (config.COLOR_WARNING if i < 35 else config.COLOR_DANGER)
                if i < active_bars:
                    canvas_vu.create_rectangle(x1, 3, x2, h - 3, fill=col, outline="")
                else:
                    canvas_vu.create_rectangle(x1, 3, x2, h - 3, fill="#131922", outline="")

            if self.vu_animating:
                self.root.after(50, update_vu_meter)

        # Recording Status and Control Buttons
        lbl_rec_status = tk.Label(
            rec_frame,
            text="MICROPHONE SENSOR STANDBY",
            font=(config.FONT_MONO, 10),
            fg=config.COLOR_MUTED,
            bg="#0D131C"
        )
        lbl_rec_status.pack(pady=(0, 10))

        # Analysis Telemetry Dashboard (Matching prompt specification)
        telemetry_box = tk.Frame(panel, bg="#0A0E15", padx=20, pady=12, highlightbackground="#1D2736", highlightthickness=1)
        telemetry_box.pack(fill="x", pady=(0, 10))

        lbl_t_stt = tk.Label(telemetry_box, text="Speech recognition:   --", font=(config.FONT_MONO, 10), fg=config.COLOR_MUTED, bg="#0A0E15")
        lbl_t_stt.grid(row=0, column=0, sticky="w", padx=10, pady=2)

        lbl_t_sim = tk.Label(telemetry_box, text="Response similarity:  --%", font=(config.FONT_MONO, 10), fg=config.COLOR_MUTED, bg="#0A0E15")
        lbl_t_sim.grid(row=1, column=0, sticky="w", padx=10, pady=2)

        lbl_t_pit = tk.Label(telemetry_box, text="Pitch compatibility:  --%", font=(config.FONT_MONO, 10), fg=config.COLOR_MUTED, bg="#0A0E15")
        lbl_t_pit.grid(row=0, column=1, sticky="w", padx=25, pady=2)

        lbl_t_tim = tk.Label(telemetry_box, text="Timing compatibility: --%", font=(config.FONT_MONO, 10), fg=config.COLOR_MUTED, bg="#0A0E15")
        lbl_t_tim.grid(row=1, column=1, sticky="w", padx=25, pady=2)

        lbl_t_final = tk.Label(telemetry_box, text="VOICE RESPONSE SCORE: --%", font=(config.FONT_MONO, 11, "bold"), fg=config.COLOR_CYAN, bg="#0A0E15")
        lbl_t_final.grid(row=0, column=2, rowspan=2, sticky="e", padx=30)

        recording_timer: List = [None]

        def toggle_record():
            if not self.voice_verifier.is_recording:
                # Start Recording
                self.voice_verifier.start_recording()
                self.vu_animating = True
                update_vu_meter()
                lbl_rec_status.config(text="RECORDING LIVE AUDIO... SPEAK NOW", fg=config.COLOR_DANGER)
                btn_record.config(text="[ ⏹ STOP RECORDING ]", bg=config.COLOR_DANGER)

                # Auto stop after 5.5s timeout
                def auto_stop():
                    if self.voice_verifier.is_recording:
                        toggle_record()
                recording_timer[0] = self.root.after(5500, auto_stop)
            else:
                # Stop Recording & Analyze
                if recording_timer[0]:
                    self.root.after_cancel(recording_timer[0])

                audio_data = self.voice_verifier.stop_recording()
                self.vu_animating = False
                lbl_rec_status.config(text="ANALYSING ACOUSTIC & SPECTRAL PHONETICS...", fg=config.COLOR_WARNING)
                btn_record.config(text="[ 🎙 RECORD ]", bg=config.COLOR_ACCENT, state="disabled")
                self.root.update()

                eval_res = self.voice_verifier.evaluate_response(audio_data, prompt)
                passed = self.engine.record_protocol_04_voice(eval_res)

                # Update Telemetry Display exactly per prompt
                stt_icon = "✓" if eval_res.get("stt_success", False) else "✗"
                lbl_t_stt.config(text=f"Speech recognition:   {stt_icon} ({eval_res['transcription'][:22]})", fg=config.COLOR_TEXT)
                lbl_t_sim.config(text=f"Response similarity:  {eval_res['response_similarity']}%", fg=config.COLOR_TEXT)
                lbl_t_pit.config(text=f"Pitch compatibility:  {eval_res['pitch_compatibility']}%", fg=config.COLOR_TEXT)
                lbl_t_tim.config(text=f"Timing compatibility: {eval_res['timing_compatibility']}%", fg=config.COLOR_TEXT)
                lbl_t_final.config(text=f"VOICE RESPONSE SCORE: {eval_res['voice_score']}%", fg=config.COLOR_ACCENT if passed else config.COLOR_DANGER)

                if passed:
                    lbl_rec_status.config(text="VOICE RESPONSE: VERIFIED. CLEARANCE COMPUTATION ARMED.", fg=config.COLOR_ACCENT)
                    self.root.after(1800, self.show_screen_final_assessment)
                else:
                    # STRICT GATE FAIL
                    self.show_screen_bot_detected()

        rec_btn_frame = tk.Frame(rec_frame, bg="#0D131C")
        rec_btn_frame.pack()

        btn_record = tk.Button(
            rec_btn_frame,
            text="[ 🎙 RECORD ]",
            font=(config.FONT_MONO, 11, "bold"),
            fg="#070A0E",
            bg=config.COLOR_ACCENT,
            activebackground="#00D280",
            activeforeground="#070A0E",
            padx=20,
            pady=8,
            relief="flat",
            cursor="hand2",
            command=toggle_record
        )
        btn_record.pack(side="left", padx=(0, 15))

        btn_try_rec = tk.Button(
            rec_btn_frame,
            text="[ TRY ANOTHER ]",
            font=(config.FONT_MONO, 11, "bold"),
            fg=config.COLOR_CYAN,
            bg="#141B26",
            activebackground="#1C2738",
            activeforeground=config.COLOR_CYAN,
            padx=18,
            pady=8,
            relief="flat",
            cursor="hand2",
            command=try_another_voice
        )
        btn_try_rec.pack(side="left")

    # ============================================================
    # SCREEN 5: FINAL SECURITY ASSESSMENT
    # ============================================================
    def show_screen_final_assessment(self):
        self.clear_content()
        self.update_header_status("FINAL SECURITY ASSESSMENT // COMPUTING CLEARANCE")

        assessment = self.engine.calculate_final_assessment()

        panel = tk.Frame(
            self.content_frame,
            bg=config.PANEL_COLOR,
            highlightbackground=config.COLOR_ACCENT,
            highlightthickness=2,
            padx=50,
            pady=30
        )
        panel.pack(expand=True, fill="both", padx=80, pady=20)

        tk.Label(
            panel,
            text=config.APP_NAME,
            font=(config.FONT_MONO, 20, "bold"),
            fg=config.COLOR_ACCENT,
            bg=config.PANEL_COLOR
        ).pack(pady=(0, 4))

        tk.Label(
            panel,
            text="FINAL SECURITY ASSESSMENT",
            font=(config.FONT_MONO, 14, "bold"),
            fg=config.COLOR_CYAN,
            bg=config.PANEL_COLOR
        ).pack(pady=(0, 20))

        # Score Breakdown Card (Exactly matching prompt example format)
        matrix_frame = tk.Frame(panel, bg="#0A0E15", padx=30, pady=20, highlightbackground="#1D2736", highlightthickness=1)
        matrix_frame.pack(fill="x", padx=40)

        rows = [
            ("COGNITIVE RESPONSE", f"{assessment['cognition_score']}%"),
            ("KEYSTROKE BEHAVIOUR", f"{assessment['keystroke_score']}%"),
            ("MULTIMODAL RESPONSE", f"{assessment['multimodal_score']}%"),
            ("VOICE RESPONSE", f"{assessment['voice_score']}%")
        ]

        for idx, (label_t, score_t) in enumerate(rows):
            tk.Label(matrix_frame, text=label_t, font=(config.FONT_MONO, 12), fg=config.COLOR_TEXT, bg="#0A0E15").grid(row=idx, column=0, sticky="w", pady=4)
            tk.Label(matrix_frame, text=score_t, font=(config.FONT_MONO, 12, "bold"), fg=config.COLOR_ACCENT, bg="#0A0E15").grid(row=idx, column=1, sticky="e", padx=(120, 0), pady=4)

        # Divider
        tk.Frame(matrix_frame, height=1, bg="#1E2735").grid(row=4, column=0, columnspan=2, sticky="ew", pady=12)

        # Verdict Section
        tk.Label(
            matrix_frame,
            text="SECURITY CLEARANCE: GRANTED",
            font=(config.FONT_MONO, 13, "bold"),
            fg=config.COLOR_ACCENT,
            bg="#0A0E15"
        ).grid(row=5, column=0, columnspan=2, sticky="w", pady=4)

        tk.Label(
            matrix_frame,
            text=f"HUMAN CONFIDENCE: {assessment['human_confidence']}%",
            font=(config.FONT_MONO, 12, "bold"),
            fg=config.COLOR_CYAN,
            bg="#0A0E15"
        ).grid(row=6, column=0, columnspan=2, sticky="w", pady=4)

        tk.Label(
            matrix_frame,
            text=f"THREAT LEVEL: {assessment['threat_level']}",
            font=(config.FONT_MONO, 11),
            fg=config.COLOR_WARNING if assessment['threat_level'] != "LOW" else config.COLOR_ACCENT,
            bg="#0A0E15"
        ).grid(row=7, column=0, columnspan=2, sticky="w", pady=4)

        tk.Label(
            matrix_frame,
            text="ACCESSING CLASSIFIED INFORMATION...",
            font=(config.FONT_MONO, 11, "italic"),
            fg=config.COLOR_MUTED,
            bg="#0A0E15"
        ).grid(row=8, column=0, columnspan=2, sticky="w", pady=(8, 4))

        btn_unlock = tk.Button(
            panel,
            text="[ DECRYPT CLASSIFIED INTELLIGENCE ]",
            font=(config.FONT_MONO, 12, "bold"),
            fg="#070A0E",
            bg=config.COLOR_ACCENT,
            activebackground="#00D280",
            activeforeground="#070A0E",
            padx=25,
            pady=10,
            relief="flat",
            cursor="hand2",
            command=self.show_screen_classified
        )
        btn_unlock.pack(pady=(25, 10))

    # ============================================================
    # SCREEN 6: CLASSIFIED INFORMATION (THE REVEAL)
    # ============================================================
    def show_screen_classified(self):
        self.clear_content()
        self.update_header_status("TOP SECRET CLEARANCE ACCESS // INTELLIGENCE UNLOCKED")

        panel = tk.Frame(
            self.content_frame,
            bg=config.PANEL_COLOR,
            highlightbackground=config.COLOR_ACCENT,
            highlightthickness=2,
            padx=50,
            pady=30
        )
        panel.pack(expand=True, fill="both", padx=80, pady=20)

        tk.Label(
            panel,
            text="TOP SECRET INTELLIGENCE ARCHIVE",
            font=(config.FONT_MONO, 12, "bold"),
            fg=config.COLOR_WARNING,
            bg=config.PANEL_COLOR
        ).pack(pady=(0, 10))

        # Payload container
        code_box = tk.Frame(panel, bg="#05080D", padx=30, pady=30, highlightbackground=config.COLOR_ACCENT, highlightthickness=1)
        code_box.pack(fill="x", padx=60, pady=20)

        # EXACT TEXT DISPLAY PER SPECIFICATION:
        # The SUPeR SECret COde is:
        # 
        # print("Hello world!")
        tk.Label(
            code_box,
            text=config.CLASSIFIED_MESSAGE,
            font=(config.FONT_MONO, 18, "bold"),
            fg=config.COLOR_ACCENT,
            bg="#05080D",
            justify="center"
        ).pack()

        tk.Label(
            panel,
            text="CLASSIFIED PAYLOAD DEPLOYED SUCCESSFULLY.",
            font=(config.FONT_MONO, 10),
            fg=config.COLOR_MUTED,
            bg=config.PANEL_COLOR
        ).pack(pady=(10, 20))

        btn_transmission = tk.Button(
            panel,
            text=config.FINAL_TRANSMISSION_LABEL,
            font=(config.FONT_MONO, 13, "bold"),
            fg="#070A0E",
            bg=config.COLOR_CYAN,
            activebackground="#00B4CC",
            activeforeground="#070A0E",
            padx=25,
            pady=12,
            relief="flat",
            cursor="hand2",
            command=self._access_final_transmission
        )
        btn_transmission.pack(pady=10)

        btn_lock = tk.Button(
            panel,
            text="[ LOCK TERMINAL & END SESSION ]",
            font=(config.FONT_MONO, 10),
            fg=config.COLOR_MUTED,
            bg=config.PANEL_COLOR,
            activebackground="#141B26",
            activeforeground=config.COLOR_TEXT,
            relief="flat",
            cursor="hand2",
            command=self.show_screen_start
        )
        btn_lock.pack(pady=(15, 0))

    def _access_final_transmission(self):
        """Clicking final transmission opens the designated destination URL."""
        webbrowser.open(config.FINAL_TRANSMISSION_URL)

    # ============================================================
    # SCREEN FAIL: ⚠ BOT DETECTED ⚠
    # ============================================================
    def show_screen_bot_detected(self):
        """
        STRICT FAILURE BEHAVIOR:
        Immediately displayed if ANY protocol fails.
        Zero detailed breakdown, zero score leaks.
        """
        self.clear_content()
        self.update_header_status("SECURITY BREACH // BOT DETECTED")

        panel = tk.Frame(
            self.content_frame,
            bg="#0D0608",
            highlightbackground=config.COLOR_DANGER,
            highlightthickness=3,
            padx=50,
            pady=40
        )
        panel.pack(expand=True, fill="both", padx=100, pady=30)

        # Warning icon & title
        tk.Label(
            panel,
            text="--------------------------------------------------",
            font=(config.FONT_MONO, 14, "bold"),
            fg=config.COLOR_DANGER,
            bg="#0D0608"
        ).pack()

        tk.Label(
            panel,
            text="⚠ BOT DETECTED ⚠",
            font=(config.FONT_MONO, 26, "bold"),
            fg=config.COLOR_DANGER,
            bg="#0D0608"
        ).pack(pady=15)

        tk.Label(
            panel,
            text="Unauthorized non-human entity detected.\n\nACCESS TERMINATED",
            font=(config.FONT_MONO, 15, "bold"),
            fg=config.COLOR_TEXT,
            bg="#0D0608",
            justify="center"
        ).pack(pady=10)

        tk.Label(
            panel,
            text="--------------------------------------------------",
            font=(config.FONT_MONO, 14, "bold"),
            fg=config.COLOR_DANGER,
            bg="#0D0608"
        ).pack(pady=(15, 30))

        btn_terminate = tk.Button(
            panel,
            text="[ TERMINATE SESSION ]",
            font=(config.FONT_MONO, 13, "bold"),
            fg="#FFFFFF",
            bg=config.COLOR_DANGER,
            activebackground="#D92035",
            activeforeground="#FFFFFF",
            padx=25,
            pady=10,
            relief="flat",
            cursor="hand2",
            command=self.show_screen_start
        )
        btn_terminate.pack()


def launch_app():
    root = tk.Tk()
    app = AppUI(root)
    root.mainloop()


if __name__ == "__main__":
    launch_app()
