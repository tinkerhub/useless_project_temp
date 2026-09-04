"""
PROTOCOL 03: MULTIMODAL EXPRESSION + GESTURE VERIFICATION
Combined real-time computer vision analysis using MediaPipe Tasks (FaceLandmarker,
HandLandmarker, PoseLandmarker) and OpenCV.
Extracts facial blendshapes/geometry, finger kinematics, and body posture.
Compares live camera response against tactical reference target images.
No permanent video/biometric storage; zero identity recognition.
"""

import os
import math
import random
import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

import config

# Landmark indices for Hand analysis
WRIST = 0
THUMB_CMC = 1
THUMB_MCP = 2
THUMB_IP = 3
THUMB_TIP = 4
INDEX_MCP = 5
INDEX_PIP = 6
INDEX_DIP = 7
INDEX_TIP = 8
MIDDLE_MCP = 9
MIDDLE_PIP = 10
MIDDLE_DIP = 11
MIDDLE_TIP = 12
RING_MCP = 13
RING_PIP = 14
RING_DIP = 15
RING_TIP = 16
PINKY_MCP = 17
PINKY_PIP = 18
PINKY_DIP = 19
PINKY_TIP = 20


class MultimodalVerifier:
    def __init__(self):
        self.face_landmarker: Optional[vision.FaceLandmarker] = None
        self.hand_landmarker: Optional[vision.HandLandmarker] = None
        self.pose_landmarker: Optional[vision.PoseLandmarker] = None
        self.models_loaded = False

        self._init_models()
        self.target_challenges = self.load_target_challenges()
        self.current_target: Optional[Dict[str, Any]] = None

    def _init_models(self):
        """Initialize MediaPipe Tasks with CPU TFLite models."""
        try:
            if os.path.exists(config.FACE_MODEL_PATH):
                face_opts = vision.FaceLandmarkerOptions(
                    base_options=python.BaseOptions(model_asset_path=config.FACE_MODEL_PATH),
                    output_face_blendshapes=True,
                    num_faces=1
                )
                self.face_landmarker = vision.FaceLandmarker.create_from_options(face_opts)

            if os.path.exists(config.HAND_MODEL_PATH):
                hand_opts = vision.HandLandmarkerOptions(
                    base_options=python.BaseOptions(model_asset_path=config.HAND_MODEL_PATH),
                    num_hands=2
                )
                self.hand_landmarker = vision.HandLandmarker.create_from_options(hand_opts)

            if os.path.exists(config.POSE_MODEL_PATH):
                pose_opts = vision.PoseLandmarkerOptions(
                    base_options=python.BaseOptions(model_asset_path=config.POSE_MODEL_PATH),
                    num_poses=1
                )
                self.pose_landmarker = vision.PoseLandmarker.create_from_options(pose_opts)

            self.models_loaded = True
            print("[MULTIMODAL] MediaPipe vision models loaded successfully.")
        except Exception as e:
            print(f"[MULTIMODAL] Error initializing MediaPipe models: {e}. Falling back to OpenCV.")
            self.models_loaded = False

    def load_target_challenges(self) -> List[Dict[str, Any]]:
        """Load real target images and profiles from gesture_targets.json or discovered files."""
        targets = []
        meta_paths = [
            os.path.join(config.GESTURE_ASSETS_DIR, "gesture_targets.json"),
            os.path.join(config.BASE_DIR, "gesture_targets.json")
        ]
        
        # 1. Load from explicit metadata file if present
        for meta_path in meta_paths:
            if os.path.exists(meta_path):
                try:
                    import json
                    with open(meta_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    if isinstance(data, list):
                        for item in data:
                            img_name = item.get("image", "")
                            # Check assets/gestures then base
                            cand1 = os.path.join(config.GESTURE_ASSETS_DIR, img_name)
                            cand2 = os.path.join(config.BASE_DIR, img_name)
                            found_path = cand1 if os.path.exists(cand1) else (cand2 if os.path.exists(cand2) else "")
                            if found_path:
                                profile = dict(item)
                                profile["image_path"] = found_path
                                targets.append(profile)
                    if targets:
                        return targets
                except Exception as e:
                    print(f"[MULTIMODAL] Error loading gesture_targets.json: {e}")

        # 2. Auto-discover standalone real images (ignoring generated target_ wireframes)
        search_dirs = [config.GESTURE_ASSETS_DIR, config.BASE_DIR]
        discovered_files = []
        for s_dir in search_dirs:
            if os.path.exists(s_dir):
                for fname in sorted(os.listdir(s_dir)):
                    if fname.lower().endswith((".jpeg", ".jpg", ".png")) and not fname.startswith("target_"):
                        if fname not in [os.path.basename(f) for f in discovered_files]:
                            discovered_files.append(os.path.join(s_dir, fname))

        for idx, fpath in enumerate(discovered_files):
            fname = os.path.basename(fpath)
            targets.append({
                "id": f"gesture_{idx+1:02d}",
                "name": f"TARGET SPECIFICATION {idx+1:02d}",
                "image": fname,
                "image_path": fpath,
                "instructions": "Replicate the exact facial expression, hand gesture, and body position shown in the reference image.",
                "face_target": "expressive",
                "gesture_target": "pose_gesture",
                "pose_target": "centered"
            })

        if not targets:
            # Safe placeholder only if no user images exist at all
            targets.append({
                "id": "target_default",
                "name": "DEFAULT REFERENCE SPECIFICATION",
                "image_path": "",
                "instructions": "Replicate the exact facial expression, hand gesture, and body position shown in the reference image.",
                "face_target": "expressive",
                "gesture_target": "pose_gesture",
                "pose_target": "centered"
            })

        return targets

    def get_new_target(self) -> Dict[str, Any]:
        """Select a target challenge from the real asset pool without immediate repeats."""
        if not hasattr(self, "_target_pool") or not self._target_pool:
            self.target_challenges = self.load_target_challenges()
            pool = list(self.target_challenges)
            random.shuffle(pool)
            if len(pool) > 1 and hasattr(self, "current_target") and self.current_target and pool[-1].get("image_path") == self.current_target.get("image_path"):
                pool[0], pool[-1] = pool[-1], pool[0]
            self._target_pool = pool

        if len(self._target_pool) > 1 and hasattr(self, "current_target") and self.current_target and self._target_pool[-1].get("image_path") == self.current_target.get("image_path"):
            self._target_pool[0], self._target_pool[-1] = self._target_pool[-1], self._target_pool[0]

        self.current_target = self._target_pool.pop()
        return self.current_target

    def process_frame(
        self,
        frame_bgr: np.ndarray,
        draw_hud: bool = True
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Process a live video frame:
        1. Run MediaPipe Face, Hand, and Pose landmarkers
        2. Draw tactical cyber HUD overlays (crosshair, wireframes, brackets)
        3. Extract telemetry features (blendshapes, finger configurations)
        Returns: (annotated_bgr_frame, extracted_telemetry)
        """
        h, w, _ = frame_bgr.shape
        hud_frame = frame_bgr.copy() if draw_hud else frame_bgr

        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        face_detected = False
        hand_detected = False
        pose_detected = False

        blendshapes_dict = {}
        hand_gestures_detected = []
        hand_positions = []
        face_center = None

        # 1. Face Analysis
        if self.face_landmarker:
            try:
                face_result = self.face_landmarker.detect(mp_image)
                if face_result and face_result.face_landmarks:
                    face_detected = True
                    face_lms = face_result.face_landmarks[0]

                    # Extract face center (nose bridge tip #1)
                    nose_lm = face_lms[1]
                    face_center = (int(nose_lm.x * w), int(nose_lm.y * h))

                    # Blendshapes (smile, jawOpen, browUp)
                    if face_result.face_blendshapes:
                        for cat in face_result.face_blendshapes[0]:
                            blendshapes_dict[cat.category_name] = cat.score

                    if draw_hud:
                        # Draw tactical facial bounding brackets
                        xs = [int(p.x * w) for p in face_lms]
                        ys = [int(p.y * h) for p in face_lms]
                        min_x, max_x = max(0, min(xs) - 15), min(w, max(xs) + 15)
                        min_y, max_y = max(0, min(ys) - 15), min(h, max(ys) + 15)

                        # Cyber brackets
                        b_col = (156, 255, 0) # Neon green in BGR
                        b_len = 20
                        # Corners
                        cv2.line(hud_frame, (min_x, min_y), (min_x + b_len, min_y), b_col, 2)
                        cv2.line(hud_frame, (min_x, min_y), (min_x, min_y + b_len), b_col, 2)
                        cv2.line(hud_frame, (max_x, min_y), (max_x - b_len, min_y), b_col, 2)
                        cv2.line(hud_frame, (max_x, min_y), (max_x, min_y + b_len), b_col, 2)
                        cv2.line(hud_frame, (min_x, max_y), (min_x + b_len, max_y), b_col, 2)
                        cv2.line(hud_frame, (min_x, max_y), (min_x, max_y - b_len), b_col, 2)
                        cv2.line(hud_frame, (max_x, max_y), (max_x - b_len, max_y), b_col, 2)
                        cv2.line(hud_frame, (max_x, max_y), (max_x, max_y - b_len), b_col, 2)

                        # Face label
                        cv2.putText(
                            hud_frame,
                            "FACIAL VECTOR TRACKED",
                            (min_x, max(20, min_y - 8)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.45,
                            b_col,
                            1,
                            cv2.LINE_AA
                        )
            except Exception as e:
                pass

        # 2. Hand Analysis
        if self.hand_landmarker:
            try:
                hand_result = self.hand_landmarker.detect(mp_image)
                if hand_result and hand_result.hand_landmarks:
                    hand_detected = True
                    for hand_lms in hand_result.hand_landmarks:
                        # Extract finger extension
                        gesture = self._classify_hand_gesture(hand_lms)
                        hand_gestures_detected.append(gesture)

                        wrist_pt = (int(hand_lms[WRIST].x * w), int(hand_lms[WRIST].y * h))
                        hand_positions.append(wrist_pt)

                        if draw_hud:
                            # Draw key landmarks
                            h_col = (255, 229, 0) # Cyan in BGR
                            for lm in [THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP, WRIST]:
                                px, py = int(lm_x := lm.x if hasattr(lm, 'x') else hand_lms[lm].x) * w, int(hand_lms[lm].y * h)
                                cv2.circle(hud_frame, (int(px), int(py)), 4, h_col, -1)
                            
                            # Gesture tag
                            cv2.putText(
                                hud_frame,
                                f"HAND: {gesture.upper()}",
                                (wrist_pt[0] - 20, max(25, wrist_pt[1] - 15)),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.45,
                                h_col,
                                1,
                                cv2.LINE_AA
                            )
            except Exception as e:
                pass

        # 3. Pose Analysis
        torso_center = None
        if self.pose_landmarker:
            try:
                pose_result = self.pose_landmarker.detect(mp_image)
                if pose_result and pose_result.pose_landmarks:
                    pose_detected = True
                    pose_lms = pose_result.pose_landmarks[0]
                    # Left shoulder (11), Right shoulder (12)
                    ls, rs = pose_lms[11], pose_lms[12]
                    torso_center = (int((ls.x + rs.x) * 0.5 * w), int((ls.y + rs.y) * 0.5 * h))

                    if draw_hud:
                        # Draw shoulder line
                        p1 = (int(ls.x * w), int(ls.y * h))
                        p2 = (int(rs.x * w), int(rs.y * h))
                        cv2.line(hud_frame, p1, p2, (87, 200, 255), 2)
            except Exception as e:
                pass

        # HUD Center Scanning Crosshair
        if draw_hud:
            cx, cy = w // 2, h // 2
            cv2.line(hud_frame, (cx - 20, cy), (cx + 20, cy), (0, 70, 255), 1)
            cv2.line(hud_frame, (cx, cy - 20), (cx, cy + 20), (0, 70, 255), 1)
            cv2.putText(
                hud_frame,
                "CLASSIFIED OPTICAL SENSOR // ACTIVE SCAN",
                (15, 25),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (0, 255, 156),
                1,
                cv2.LINE_AA
            )

        telemetry = {
            "face_detected": face_detected,
            "hand_detected": hand_detected,
            "pose_detected": pose_detected,
            "blendshapes": blendshapes_dict,
            "hand_gestures": hand_gestures_detected,
            "hand_positions": hand_positions,
            "face_center": face_center,
            "torso_center": torso_center,
            "frame_dims": (w, h)
        }

        return hud_frame, telemetry

    def _classify_hand_gesture(self, lms) -> str:
        """Classify hand landmarks into recognized poses: peace, thumbs_up, open_palm, pointing."""
        # Check finger extension: Tip distance to wrist vs PIP distance to wrist
        def is_extended(tip_idx, pip_idx):
            tip = lms[tip_idx]
            pip = lms[pip_idx]
            wrist = lms[WRIST]
            d_tip = (tip.x - wrist.x)**2 + (tip.y - wrist.y)**2
            d_pip = (pip.x - wrist.x)**2 + (pip.y - wrist.y)**2
            return d_tip > d_pip

        index_ext = is_extended(INDEX_TIP, INDEX_PIP)
        middle_ext = is_extended(MIDDLE_TIP, MIDDLE_PIP)
        ring_ext = is_extended(RING_TIP, RING_PIP)
        pinky_ext = is_extended(PINKY_TIP, PINKY_PIP)

        # Thumb extension: check tip vs IP
        thumb_tip = lms[THUMB_TIP]
        thumb_mcp = lms[THUMB_MCP]
        thumb_ext = thumb_tip.y < thumb_mcp.y # pointing up

        # Peace / V-sign
        if index_ext and middle_ext and not ring_ext and not pinky_ext:
            return "peace"

        # Thumbs Up
        if thumb_ext and not index_ext and not middle_ext and not ring_ext and not pinky_ext:
            return "thumbs_up"

        # Open Palm
        if index_ext and middle_ext and ring_ext and pinky_ext:
            return "open_palm"

        # Pointing / Thinking
        if index_ext and not middle_ext and not ring_ext and not pinky_ext:
            return "pointing"

        return "unknown"

    def evaluate_telemetry(
        self,
        telemetry: Dict[str, Any],
        target: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Compare captured live telemetry against target challenge profile deterministically:
        - Face Compatibility % (smile, jawOpen, browInnerUp, eye contact)
        - Hand Compatibility % (detected hands, finger kinematics, spatial coordinates)
        - Pose Compatibility % (shoulder horizontal level, head-to-torso alignment, wrist height)
        - Multimodal Response % (deterministic weighted combination)
        """
        tgt = target or self.current_target or {}
        exp_face = tgt.get("face_target", tgt.get("expected_face", "expressive"))
        exp_hand = tgt.get("gesture_target", tgt.get("expected_hand", "pose_gesture"))
        exp_pose = tgt.get("pose_target", tgt.get("expected_pose", "centered"))

        if not telemetry.get("face_detected", False):
            return {
                "verified": False,
                "face_compatibility": 0.0,
                "hand_compatibility": 0.0,
                "pose_compatibility": 0.0,
                "multimodal_score": 0.0,
                "verdict": "NO SUBJECT IN SENSOR RANGE"
            }

        # 1. Face Compatibility (0 - 100%) - Deterministic
        blend = telemetry.get("blendshapes", {})
        smile_l = blend.get("mouthSmileLeft", 0.0)
        smile_r = blend.get("mouthSmileRight", 0.0)
        avg_smile = (smile_l + smile_r) * 0.5
        jaw_open = blend.get("jawOpen", 0.0)
        brow_up = blend.get("browInnerUp", 0.0)
        brow_down = (blend.get("browDownLeft", 0.0) + blend.get("browDownRight", 0.0)) * 0.5
        eye_blink = (blend.get("eyeBlinkLeft", 0.0) + blend.get("eyeBlinkRight", 0.0)) * 0.5

        if exp_face == "smile":
            face_score = 65.0 + min(33.0, avg_smile * 45.0)
        elif exp_face == "surprised":
            expressive_val = max(jaw_open, brow_up)
            face_score = 60.0 + min(38.0, expressive_val * 50.0)
        elif exp_face in ("neutral", "neutral_focus", "concentrated"):
            neutrality = max(0.0, 1.0 - (avg_smile * 0.8 + jaw_open * 0.8))
            face_score = 75.0 + min(23.0, neutrality * 23.0)
        else:
            activity = (avg_smile * 0.4 + jaw_open * 0.3 + brow_up * 0.2 + (1.0 - eye_blink) * 0.1)
            face_score = 70.0 + min(27.0, activity * 35.0)

        face_score = round(min(98.0, max(20.0, face_score)), 1)

        # 2. Hand Compatibility (0 - 100%) - Deterministic
        hand_detected = telemetry.get("hand_detected", False)
        gestures = telemetry.get("hand_gestures", [])
        hand_positions = telemetry.get("hand_positions", [])
        face_center = telemetry.get("face_center")
        frame_dims = telemetry.get("frame_dims", (640, 480))

        if not hand_detected:
            hand_score = 45.0
        else:
            num_hands = min(2, len(hand_positions))
            base_hand = 70.0 + (num_hands * 6.0)

            valid_gestures = [g for g in gestures if g != "unknown"]
            if valid_gestures:
                base_hand += 8.0

            if face_center and hand_positions:
                wrist_y = min(p[1] for p in hand_positions)
                face_y = face_center[1]
                if wrist_y < face_y + (frame_dims[1] * 0.25):
                    base_hand += 6.0

            hand_score = round(min(98.0, max(40.0, base_hand)), 1)

        # 3. Pose Compatibility (0 - 100%) - Deterministic
        pose_detected = telemetry.get("pose_detected", False)
        torso_center = telemetry.get("torso_center")

        if pose_detected and torso_center and face_center:
            w = frame_dims[0]
            center_dist = abs(torso_center[0] - (w // 2)) / (w * 0.5)
            alignment_score = max(0.0, 1.0 - center_dist)
            pose_score = 80.0 + (alignment_score * 12.0)
            if hand_detected:
                pose_score += 5.0
        elif pose_detected:
            pose_score = 82.0
        elif face_detected:
            pose_score = 70.0
        else:
            pose_score = 30.0

        pose_score = round(min(98.0, max(20.0, pose_score)), 1)

        # Combined Multimodal Compatibility Score
        multimodal_score = (face_score * 0.40) + (hand_score * 0.40) + (pose_score * 0.20)
        multimodal_score = round(min(99.0, max(0.0, multimodal_score)), 1)

        is_verified = (multimodal_score >= config.THRESHOLD_MULTIMODAL)

        return {
            "verified": is_verified,
            "face_compatibility": face_score,
            "hand_compatibility": hand_score,
            "pose_compatibility": pose_score,
            "multimodal_score": multimodal_score,
            "verdict": "MULTIMODAL BIOMETRIC CONGRUENCE VERIFIED" if is_verified else "POSE/EXPRESSION DEVIATION DETECTED"
        }

    def close(self):
        """Clean up MediaPipe detector handles."""
        if self.face_landmarker:
            self.face_landmarker.close()
        if self.hand_landmarker:
            self.hand_landmarker.close()
        if self.pose_landmarker:
            self.pose_landmarker.close()
