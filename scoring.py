"""
SCORING & GATE VERIFICATION ENGINE
Implements strict independent gate logic: any single failed protocol immediately
triggers session termination and the BOT DETECTED protocol.
Calculates modular weighted security clearance assessments for presentation upon full clearance.
"""

from typing import Dict, Any, Optional
import config

class SecurityAssessmentEngine:
    def __init__(self):
        self.reset()

    def reset(self):
        """Reset all session verification states and collected scores."""
        self.protocol_results: Dict[str, Dict[str, Any]] = {}
        self.failed: bool = False
        self.failure_reason: Optional[str] = None
        self.all_passed: bool = False

    def record_protocol_01_cognition(self, result: Dict[str, Any]) -> bool:
        """Record Protocol 01 Human Cognition result."""
        passed = result.get("verified", False) and (result.get("score", 0.0) >= config.THRESHOLD_COGNITION)
        self.protocol_results["cognition"] = {
            "name": "COGNITIVE RESPONSE",
            "score": result.get("score", 0.0),
            "passed": passed,
            "telemetry": result
        }
        if not passed:
            self.failed = True
            self.failure_reason = "COGNITIVE_FAIL"
        return passed

    def record_protocol_02_typing(self, result: Dict[str, Any]) -> bool:
        """Record Protocol 02 Behavioural Typing result."""
        passed = result.get("verified", False) and (result.get("score", 0.0) >= config.THRESHOLD_TYPING)
        self.protocol_results["typing"] = {
            "name": "KEYSTROKE BEHAVIOUR",
            "score": result.get("score", 0.0),
            "passed": passed,
            "telemetry": result
        }
        if not passed:
            self.failed = True
            self.failure_reason = "TYPING_FAIL"
        return passed

    def record_protocol_03_multimodal(self, result: Dict[str, Any]) -> bool:
        """Record Protocol 03 Multimodal Expression & Gesture result."""
        passed = result.get("verified", False) and (result.get("multimodal_score", 0.0) >= config.THRESHOLD_MULTIMODAL)
        self.protocol_results["multimodal"] = {
            "name": "MULTIMODAL RESPONSE",
            "score": result.get("multimodal_score", 0.0),
            "passed": passed,
            "telemetry": result
        }
        if not passed:
            self.failed = True
            self.failure_reason = "MULTIMODAL_FAIL"
        return passed

    def record_protocol_04_voice(self, result: Dict[str, Any]) -> bool:
        """Record Protocol 04 Voice Response result."""
        passed = result.get("verified", False) and (result.get("voice_score", 0.0) >= config.THRESHOLD_VOICE)
        self.protocol_results["voice"] = {
            "name": "VOICE RESPONSE",
            "score": result.get("voice_score", 0.0),
            "passed": passed,
            "telemetry": result
        }
        if not passed:
            self.failed = True
            self.failure_reason = "VOICE_FAIL"
        return passed

    def has_failed(self) -> bool:
        """Returns True if any protocol has failed."""
        return self.failed

    def are_all_passed(self) -> bool:
        """Returns True if and only if all 4 protocols have been completed and passed."""
        required = ["cognition", "typing", "multimodal", "voice"]
        if any(req not in self.protocol_results for req in required):
            return False
        return all(self.protocol_results[r]["passed"] for r in required)

    def calculate_final_assessment(self) -> Dict[str, Any]:
        """
        Calculates weighted composite clearance score and threat level.
        Only called when all protocols have passed.
        Weights:
        - Human Cognition: 10%
        - Behavioural Typing: 20%
        - Multimodal Expression + Gesture: 30%
        - Voice Response: 20%
        - Final Behavioural Assessment: 20%
        """
        cog_score = self.protocol_results.get("cognition", {}).get("score", 0.0)
        typ_score = self.protocol_results.get("typing", {}).get("score", 0.0)
        mul_score = self.protocol_results.get("multimodal", {}).get("score", 0.0)
        voi_score = self.protocol_results.get("voice", {}).get("score", 0.0)

        # Cross-protocol congruence metric for Final Behavioural Assessment
        congruence = (cog_score + typ_score + mul_score + voi_score) / 4.0
        behavioural_assessment = round(min(99.0, max(85.0, congruence)), 1)

        composite = (
            (cog_score * config.WEIGHT_COGNITION) +
            (typ_score * config.WEIGHT_TYPING) +
            (mul_score * config.WEIGHT_MULTIMODAL) +
            (voi_score * config.WEIGHT_VOICE) +
            (behavioural_assessment * config.WEIGHT_ASSESSMENT)
        )
        human_confidence = round(composite, 1)

        # Threat Level Mapping
        threat_level = "CRITICAL"
        for level, (low, high) in config.THREAT_LEVELS.items():
            if low <= human_confidence <= high:
                threat_level = level
                break

        return {
            "cognition_score": round(cog_score, 1),
            "keystroke_score": round(typ_score, 1),
            "multimodal_score": round(mul_score, 1),
            "voice_score": round(voi_score, 1),
            "behavioural_assessment": behavioural_assessment,
            "human_confidence": human_confidence,
            "threat_level": threat_level,
            "clearance_granted": True
        }
