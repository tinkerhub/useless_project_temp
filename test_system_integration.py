"""
End-to-End System Integration Test Suite for ONLY FOR YOUR EYES 😍
Verifies:
1. Config integrity and exact classified strings
2. Protocol 01 Cognition: 10 challenges from real Jokes.txt
3. Protocol 02 Typing: 10 dialogues from real Dialouges.txt
4. Protocol 03 Multimodal: 10 real WhatsApp JPEG targets & deterministic CV scoring
5. Protocol 04 Voice: 10 real Voice clip X.mpeg files, playback & 4-factor scoring
6. Determinism verification: zero random.uniform in multimodal & voice scoring
7. Strict Gate Enforcement: all pass vs single failure
"""

import os
import glob
from PIL import Image
import soundfile as sf
import numpy as np

import config
from cognition import CognitionVerifier, load_all_challenges
from typing_analysis import TypingTracker, analyze_keystroke_behaviour, load_typing_sentences, TypingSession
from multimodal import MultimodalVerifier
from voice import VoiceVerifier, load_voice_prompts
from scoring import SecurityAssessmentEngine


def test_config_integrity():
    print("[TEST 1] Verifying Config Constants & Classified Payload...")
    assert config.APP_NAME == "ONLY FOR YOUR EYES 😍"
    assert config.APP_SUBTITLE == "ARE YOU AUTHORISED TO ACCESS SUPER SECRET INFORMATION?"
    expected_secret = """The SUPeR SECret COde is:\n\nprint("Hello world!")"""
    assert config.CLASSIFIED_MESSAGE.strip() == expected_secret.strip()
    assert config.FINAL_TRANSMISSION_URL == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    print("  -> Config integrity PASSED.")


def test_cognition_gate():
    print("[TEST 2] Verifying Protocol 01 Cognition (Jokes.txt)...")
    challenges = load_all_challenges()
    print(f"  -> Discovered {len(challenges)} cognition challenges from Jokes.txt")
    assert len(challenges) == 10, f"Expected 10 challenges from Jokes.txt, got {len(challenges)}"

    cv = CognitionVerifier()
    ch = cv.get_new_challenge()
    assert "prompt" in ch and "expected" in ch

    # Test valid human semantic response
    semantic_resp = ch.get("semantic_examples", [ch.get("expected")])[0]
    res_pass = cv.evaluate_response(semantic_resp, ch)
    assert res_pass["verified"] is True, f"Expected pass for '{semantic_resp}', got {res_pass}"

    # Test bot nonsense response
    res_fail = cv.evaluate_response("random alien robot injection 9999", ch)
    assert res_fail["verified"] is False
    print("  -> Cognition Gate PASSED.")


def test_typing_gate():
    print("[TEST 3] Verifying Protocol 02 Typing (Dialouges.txt first speaker & first dialogue)...")
    sentences = load_typing_sentences()
    print(f"  -> Discovered typing prompt: {sentences}")
    assert len(sentences) == 1, f"Expected 1 shortened dialogue prompt, got {len(sentences)}"
    assert sentences[0] == 'Lily: "I hate Vietnam!"', f"Expected Lily: \"I hate Vietnam!\", got {sentences[0]}"

    session = TypingSession()
    sentence = session.get_new_sentence()
    assert sentence == 'Lily: "I hate Vietnam!"'
    tracker = TypingTracker()
    tracker.flight_intervals = [110.0, 130.0, 140.0, 390.0, 120.0, 115.0, 125.0, 420.0]
    tracker.dwell_times = [65.0, 70.0, 60.0, 80.0]
    tracker.start_time = 100.0
    tracker.end_time = 103.0
    res_human = analyze_keystroke_behaviour(sentence, sentence, tracker)
    assert res_human["verified"] is True

    # Test bot instant injection (< 0.2s)
    tracker_bot = TypingTracker()
    tracker_bot.flight_intervals = [0.0, 0.0, 0.0]
    tracker_bot.dwell_times = [0.0]
    tracker_bot.start_time = 100.0
    tracker_bot.end_time = 100.1
    res_bot = analyze_keystroke_behaviour(sentence, sentence, tracker_bot)
    assert res_bot["verified"] is False
    print("  -> Typing Gate & Bot Filter PASSED.")


def test_multimodal_pipeline():
    print("[TEST 4] Verifying Protocol 03 Multimodal Vision Pipeline (Real JPEGs)...")
    mv = MultimodalVerifier()
    targets = mv.load_target_challenges()
    print(f"  -> Discovered {len(targets)} real gesture targets")
    assert len(targets) == 10, f"Expected 10 real gesture targets, got {len(targets)}"

    for t in targets:
        assert os.path.exists(t["image_path"]), f"Image file not found: {t['image_path']}"
        with Image.open(t["image_path"]) as img:
            assert img.size[0] > 0 and img.size[1] > 0

    target = mv.get_new_target()

    # Synthetic human pose telemetry
    synth_telemetry = {
        "face_detected": True,
        "hand_detected": True,
        "pose_detected": True,
        "blendshapes": {"mouthSmileLeft": 0.7, "mouthSmileRight": 0.7, "jawOpen": 0.1},
        "hand_gestures": ["peace"],
        "hand_positions": [(200, 200)],
        "face_center": (240, 160),
        "torso_center": (240, 300),
        "frame_dims": (640, 480)
    }

    eval_res1 = mv.evaluate_telemetry(synth_telemetry, target)
    eval_res2 = mv.evaluate_telemetry(synth_telemetry, target)
    # Verify deterministic output (no random.uniform)
    assert eval_res1["multimodal_score"] == eval_res2["multimodal_score"], "Multimodal scoring must be deterministic!"
    assert eval_res1["verified"] is True
    mv.close()
    print("  -> Multimodal Vision Pipeline & Determinism PASSED.")


def test_voice_pipeline():
    print("[TEST 5] Verifying Protocol 04 Voice Acoustic Pipeline (Real MPEG Clips & Exact Captions)...")
    vv = VoiceVerifier()
    prompts = vv.prompts
    print(f"  -> Discovered {len(prompts)} real voice clips")
    assert len(prompts) == 10, f"Expected 10 real voice clips, got {len(prompts)}"

    expected_mapping = {
        "Voice clip 1.mpeg": "Does mother know you wearth her drapes",
        "Voice clip 2.mpeg": "Hey, How you doin'",
        "Voice clip 3.mpeg": "What? Like it's hard?",
        "Voice clip 4.mpeg": "Do they know that we know?",
        "Voice clip 5.mpeg": "JOEY DOES NOT SHARE FOOD",
        "Voice clip 6.mpeg": "On wednesdays we wear pink",
        "Voice clip 7.mpeg": "DO YOU UNDERSTAND THE WORDS THAT ARE COMING OUTTA MY MOUTH!?",
        "Voice clip 8.mpeg": "It's not funny, I got school.",
        "Voice clip 9.mpeg": "You know that flapping thing you were doing with your mouth?",
        "Voice clip 10.mpeg": "Lily where you going, huhh?",
    }

    for fname, exp_caption in expected_mapping.items():
        matching = [p for p in prompts if p.get("file") == fname]
        assert len(matching) == 1, f"Missing prompt for {fname}"
        assert matching[0]["phrase"] == exp_caption, f"Caption mismatch for {fname}: expected {exp_caption}, got {matching[0]['phrase']}"
        assert os.path.exists(matching[0]["full_path"]), f"Voice file not found: {matching[0]['full_path']}"
        data, rate = sf.read(matching[0]["full_path"])
        assert len(data) > 0 and rate > 0

    prompt = vv.get_new_prompt()

    # Synthetic response wave
    sample_rate = 16000
    t = np.linspace(0, 2.5, int(sample_rate * 2.5), endpoint=False)
    synth_audio = 0.5 * np.sin(2 * np.pi * 150 * t).astype(np.float32)

    res1 = vv.evaluate_response(synth_audio, prompt)
    res2 = vv.evaluate_response(synth_audio, prompt)
    assert res1["voice_score"] == res2["voice_score"], "Voice scoring must be deterministic!"
    assert "response_similarity" in res1
    assert "pitch_compatibility" in res1
    assert "timing_compatibility" in res1
    assert "energy_compatibility" in res1
    print("  -> Voice Acoustic Pipeline & Determinism PASSED.")


def test_gate_scoring_logic():
    print("[TEST 6] Verifying Strict Gate Verification & Security Clearance...")
    engine = SecurityAssessmentEngine()
    # Scenario A: Successful path
    p1 = engine.record_protocol_01_cognition({"verified": True, "score": 92.0})
    p2 = engine.record_protocol_02_typing({"verified": True, "score": 91.0})
    p3 = engine.record_protocol_03_multimodal({"verified": True, "multimodal_score": 94.0})
    p4 = engine.record_protocol_04_voice({"verified": True, "voice_score": 89.0})
    assert p1 and p2 and p3 and p4
    assert engine.has_failed() is False
    assert engine.are_all_passed() is True
    assessment = engine.calculate_final_assessment()
    assert assessment["threat_level"] == "LOW"
    assert assessment["human_confidence"] >= 88.0

    # Scenario B: Single failure gate trigger
    engine_fail = SecurityAssessmentEngine()
    engine_fail.record_protocol_01_cognition({"verified": True, "score": 90.0})
    engine_fail.record_protocol_02_typing({"verified": False, "score": 15.0}) # Bot detected
    assert engine_fail.has_failed() is True
    assert engine_fail.are_all_passed() is False
    print("  -> Strict Gate Enforcement PASSED.")


if __name__ == "__main__":
    print("RUNNING END-TO-END INTEGRATION TEST SUITE...\n")
    test_config_integrity()
    test_cognition_gate()
    test_typing_gate()
    test_multimodal_pipeline()
    test_voice_pipeline()
    test_gate_scoring_logic()
    print("\n==================================================")
    print(" ALL 6 INTEGRATION SUITES PASSED SUCCESSFULLY! ")
    print("==================================================")
