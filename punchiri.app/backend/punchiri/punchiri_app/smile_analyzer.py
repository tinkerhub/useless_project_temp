import cv2
import mediapipe as mp
import numpy as np
from typing import Dict, Tuple, List

class SmileAnalyzer:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.MOUTH_LANDMARKS = [61, 291, 13, 14]
        self.FACE_BOUNDARY_LANDMARKS = [10, 152, 234, 454]
        self.smile_scores = []

    def process_frame(self, frame: np.ndarray) -> Tuple[Dict, np.ndarray]:
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(image_rgb)
        
        if not results.multi_face_landmarks:
            return None, frame

        face_landmarks = results.multi_face_landmarks[0]
        h, w, _ = frame.shape
        
        # Extract mouth and face boundary points
        mouth_points = self._get_landmarks(face_landmarks, self.MOUTH_LANDMARKS, w, h)
        face_boundary_points = self._get_landmarks(face_landmarks, self.FACE_BOUNDARY_LANDMARKS, w, h)
        
        # Calculate metrics
        is_symmetrical = self._evaluate_symmetry(mouth_points)
        has_minimal_gum = self._evaluate_gum_visibility(mouth_points, face_boundary_points)
        teeth_exposed_correctly = self._evaluate_teeth_exposure(mouth_points)
        stain_free = self._evaluate_stain_free(frame, mouth_points)
        
        # Calculate smile score
        smile_score = (is_symmetrical * 25 + has_minimal_gum * 25 +
                      teeth_exposed_correctly * 25 + stain_free * 25)
        
        # Smooth the score
        self.smile_scores.append(smile_score)
        if len(self.smile_scores) > 5:
            self.smile_scores.pop(0)
        average_smile_score = int(np.mean(self.smile_scores))
        
        analysis_result = {
            'smile_score': average_smile_score,
            'is_symmetrical': is_symmetrical,
            'has_minimal_gum': has_minimal_gum,
            'teeth_exposed_correctly': teeth_exposed_correctly,
            'stain_free': stain_free
        }
        
        return analysis_result, frame

    def _get_landmarks(self, face_landmarks, indices: List[int], w: int, h: int) -> Dict:
        return {idx: (int(face_landmarks.landmark[idx].x * w),
                     int(face_landmarks.landmark[idx].y * h))
                for idx in indices}

    def _evaluate_symmetry(self, mouth_points: Dict) -> bool:
        return abs(mouth_points[61][1] - mouth_points[291][1]) < 5

    def _evaluate_gum_visibility(self, mouth_points: Dict, face_points: Dict) -> bool:
        gum_showing = mouth_points[13][1] - face_points[10][1]
        return gum_showing < 2

    def _evaluate_teeth_exposure(self, mouth_points: Dict) -> bool:
        mouth_height = abs(mouth_points[13][1] - mouth_points[14][1])
        return 8 < mouth_height < 20

    def _evaluate_stain_free(self, frame: np.ndarray, mouth_points: Dict) -> bool:
        left, right = mouth_points[61], mouth_points[291]
        top, bottom = mouth_points[13], mouth_points[14]
        
        roi = frame[top[1]:bottom[1], left[0]:right[0]]
        if roi.size == 0:
            return False
            
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        brightness = hsv[..., 2].mean()
        return brightness > 120
