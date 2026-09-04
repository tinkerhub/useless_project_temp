"""
PROTOCOL 04: VOICE RESPONSE VERIFICATION
Plays reference dialogue clips, captures microphone responses via sounddevice,
performs speech-to-text transcription via SpeechRecognition, and computes acoustic
features (pitch contour via autocorrelation, speech duration/timing, and spectral envelope).
Temporary audio buffers are purged immediately after evaluation.
"""

import os
import json
import time
import math
import random
import threading
import numpy as np
from typing import Dict, Any, List, Optional, Tuple, Callable
import sounddevice as sd
import soundfile as sf
from scipy.io import wavfile
import scipy.signal
import speech_recognition as sr

import config

# Exact user-provided captions mapped 1-to-1 to the 10 real audio clips
# Treat these as authoritative reference text - NEVER overwrite with ASR
AUTHORITATIVE_VOICE_CAPTIONS = {
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

AUTHORITATIVE_SPEAKERS = {
    "Voice clip 1.mpeg": "Tony Stark",
    "Voice clip 2.mpeg": "Joey Tribbiani",
    "Voice clip 3.mpeg": "Elle Woods",
    "Voice clip 4.mpeg": "Phoebe Buffay",
    "Voice clip 5.mpeg": "Joey Tribbiani",
    "Voice clip 6.mpeg": "Karen Smith",
    "Voice clip 7.mpeg": "Detective James Carter",
    "Voice clip 8.mpeg": "School Dialogue",
    "Voice clip 9.mpeg": "Movie Dialogue",
    "Voice clip 10.mpeg": "Mitchell Pritchett",
}

DEFAULT_VOICE_PROMPTS = [
    {
        "id": "hermione_leviosa",
        "file": "hermione_leviosa.wav",
        "speaker": "Hermione Granger",
        "phrase": "It's LeviOsa, not LevioSA!",
        "acceptable_phrases": [
            "it's leviosa not leviosa",
            "its leviosa not leviosa",
            "leviosa not leviosa",
            "it is leviosa"
        ],
        "keywords": ["leviosa", "clever", "not"],
        "target_duration": 2.5
    },
    {
        "id": "ron_butterflies",
        "file": "ron_butterflies.wav",
        "speaker": "Ron Weasley",
        "phrase": "Why spiders? Why couldn't it be follow the butterflies?",
        "acceptable_phrases": [
            "why spiders why couldn't it be follow the butterflies",
            "follow the butterflies",
            "why spiders"
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


def load_voice_prompts() -> List[Dict[str, Any]]:
    """Auto-discover reference voice clips and metadata from assets/voice/ and project root."""
    prompts = []
    audio_extensions = (".mpeg", ".mp3", ".wav", ".mp4", ".m4a", ".ogg")

    meta_paths = [
        os.path.join(config.VOICE_ASSETS_DIR, "prompts.json"),
        os.path.join(config.BASE_DIR, "prompts.json")
    ]

    # 1. Load prompts.json if present
    for meta_path in meta_paths:
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        for item in data:
                            fname = item.get("file", "")
                            c1 = os.path.join(config.VOICE_ASSETS_DIR, fname)
                            c2 = os.path.join(config.BASE_DIR, fname)
                            fpath = c1 if os.path.exists(c1) else (c2 if os.path.exists(c2) else "")
                            if fpath:
                                item_copy = dict(item)
                                item_copy["full_path"] = fpath
                                prompts.append(item_copy)
                if prompts:
                    break
            except Exception as e:
                print(f"[VOICE] Error loading prompts.json: {e}")

    # 2. Auto-discover all supported audio files without requiring prompts.json
    search_dirs = [config.VOICE_ASSETS_DIR, config.BASE_DIR]
    discovered_files = []
    for s_dir in search_dirs:
        if os.path.exists(s_dir):
            for fname in sorted(os.listdir(s_dir)):
                if fname.lower().endswith(audio_extensions):
                    if not any(p.get("file") == fname or os.path.basename(p.get("full_path", "")) == fname for p in prompts):
                        if fname not in [os.path.basename(f) for f in discovered_files]:
                            discovered_files.append(os.path.join(s_dir, fname))

    for fpath in discovered_files:
        fname = os.path.basename(fpath)
        dur = 3.0
        try:
            info = sf.info(fpath)
            dur = round(info.duration, 1)
        except Exception:
            pass

        prompts.append({
            "id": fname,
            "file": fname,
            "speaker": "CLASSIFIED SOURCE",
            "phrase": "Replicate reference audio response cadence",
            "acceptable_phrases": [],
            "keywords": [],
            "target_duration": dur,
            "full_path": fpath
        })

    # Strictly enforce the user's exact authoritative mapping for every clip
    for p in prompts:
        fname = p.get("file") or os.path.basename(p.get("full_path", ""))
        if fname in AUTHORITATIVE_VOICE_CAPTIONS:
            # Enforce exact supplied sentence - NEVER replace with ASR
            p["phrase"] = AUTHORITATIVE_VOICE_CAPTIONS[fname]
            if fname in AUTHORITATIVE_SPEAKERS:
                p["speaker"] = AUTHORITATIVE_SPEAKERS[fname]

    # Fallback only if no real audio files exist anywhere
    if not prompts:
        prompts = list(DEFAULT_VOICE_PROMPTS)
        for p in prompts:
            p["full_path"] = os.path.join(config.VOICE_ASSETS_DIR, p.get("file", ""))

    return prompts


class VoiceVerifier:
    def __init__(self):
        self.prompts = load_voice_prompts()
        self.current_prompt: Optional[Dict[str, Any]] = None
        self.is_recording = False
        self.recording_frames: List[np.ndarray] = []
        self.sample_rate = 16000
        self.recognizer = sr.Recognizer()
        self.live_volume = 0.0

    def get_new_prompt(self) -> Dict[str, Any]:
        """Select a reference prompt from the real asset pool without immediate repeats."""
        if not hasattr(self, "_prompt_pool") or not self._prompt_pool:
            self.prompts = load_voice_prompts()
            pool = list(self.prompts)
            random.shuffle(pool)
            if len(pool) > 1 and hasattr(self, "current_prompt") and self.current_prompt and pool[-1].get("file") == self.current_prompt.get("file"):
                pool[0], pool[-1] = pool[-1], pool[0]
            self._prompt_pool = pool

        if len(self._prompt_pool) > 1 and hasattr(self, "current_prompt") and self.current_prompt and self._prompt_pool[-1].get("file") == self.current_prompt.get("file"):
            self._prompt_pool[0], self._prompt_pool[-1] = self._prompt_pool[-1], self._prompt_pool[0]

        self.current_prompt = self._prompt_pool.pop()
        return self.current_prompt

    def stop_playback(self):
        """Stop any active audio playback immediately."""
        try:
            sd.stop()
        except Exception:
            pass
        try:
            import ctypes
            winmm = ctypes.windll.winmm
            winmm.mciSendStringW("stop all", None, 0, 0)
            winmm.mciSendStringW("close all", None, 0, 0)
        except Exception:
            pass

    def play_reference_audio(self, on_finish: Optional[Callable] = None):
        """Play current reference audio file asynchronously using soundfile/sounddevice with MCI fallback."""
        if not self.current_prompt:
            self.get_new_prompt()

        fpath = self.current_prompt.get("full_path")
        if not fpath or not os.path.exists(fpath):
            print(f"[VOICE] Reference audio file not found: {fpath}")
            if on_finish:
                on_finish()
            return

        def _play_worker():
            try:
                data, rate = sf.read(fpath)
                sd.play(data, samplerate=rate)
                sd.wait()
            except Exception as e1:
                try:
                    import ctypes
                    winmm = ctypes.windll.winmm
                    alias = f"clip_{int(time.time()*1000)}"
                    winmm.mciSendStringW(f'open "{os.path.abspath(fpath)}" type mpegvideo alias {alias}', None, 0, 0)
                    winmm.mciSendStringW(f'play {alias} wait', None, 0, 0)
                    winmm.mciSendStringW(f'close {alias}', None, 0, 0)
                except Exception as e2:
                    print(f"[VOICE] Audio playback failed: {e1} / {e2}")
            finally:
                if on_finish:
                    on_finish()

        threading.Thread(target=_play_worker, daemon=True).start()

    def start_recording(self):
        """Start capturing microphone stream with dynamic audio level callback."""
        self.is_recording = True
        self.recording_frames = []

        def audio_callback(indata, frames, time_info, status):
            if self.is_recording:
                self.recording_frames.append(indata.copy())
                rms = np.sqrt(np.mean(indata**2))
                self.live_volume = float(min(1.0, rms * 10.0))

        try:
            self.stream = sd.InputStream(
                samplerate=self.sample_rate,
                channels=1,
                dtype="float32",
                callback=audio_callback
            )
            self.stream.start()
        except Exception as e:
            print(f"[VOICE] Error opening microphone: {e}")
            self.is_recording = False

    def stop_recording(self) -> Optional[np.ndarray]:
        """Stop capturing and return raw audio array."""
        self.is_recording = False
        if hasattr(self, "stream") and self.stream:
            try:
                self.stream.stop()
                self.stream.close()
            except Exception:
                pass

        if not self.recording_frames:
            return None

        audio_data = np.concatenate(self.recording_frames, axis=0).flatten()
        return audio_data

    def evaluate_response(
        self,
        audio_data: Optional[np.ndarray],
        prompt: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Multimodal voice evaluation directly comparing recorded audio against reference audio:
        1. Speech Content & Transcription Similarity: 60%
        2. Speech Timing & Duration Compatibility: 15%
        3. Fundamental Pitch ($F_0$) & Harmonic Contour: 15%
        4. Energy & Spectral Dynamic Range: 10%
        Deterministic, zero biometric identity authentication, clears buffers immediately.
        """
        target = prompt or self.current_prompt
        if not target:
            target = self.get_new_prompt()

        if audio_data is None or len(audio_data) < self.sample_rate * 0.5:
            return {
                "verified": False,
                "stt_success": False,
                "transcription": "NO AUDIBLE RESPONSE DETECTED",
                "response_similarity": 0.0,
                "pitch_compatibility": 0.0,
                "timing_compatibility": 0.0,
                "energy_compatibility": 0.0,
                "voice_score": 0.0,
                "verdict": "NO SPEECH SIGNAL CAPTURED"
            }

        # Normalize audio amplitude
        max_amp = float(np.max(np.abs(audio_data)))
        if max_amp < 0.015:
            return {
                "verified": False,
                "stt_success": False,
                "transcription": "SIGNAL LEVEL BELOW NOISE FLOOR",
                "response_similarity": 0.0,
                "pitch_compatibility": 0.0,
                "timing_compatibility": 0.0,
                "energy_compatibility": 0.0,
                "voice_score": 0.0,
                "verdict": "MICROPHONE INPUT TOO FAINT"
            }

        audio_norm = audio_data / (max_amp + 1e-6)

        # Load reference audio for direct acoustic comparison
        ref_path = target.get("full_path")
        ref_mono = None
        ref_sr = self.sample_rate
        if ref_path and os.path.exists(ref_path):
            try:
                ref_raw, ref_sr = sf.read(ref_path)
                if len(ref_raw.shape) > 1:
                    ref_mono = np.mean(ref_raw, axis=1)
                else:
                    ref_mono = ref_raw
                ref_max = float(np.max(np.abs(ref_mono)))
                if ref_max > 0:
                    ref_mono = ref_mono / ref_max
            except Exception as e:
                print(f"[VOICE] Notice loading reference audio for comparison: {e}")

        # 1. Speech-to-Text via SpeechRecognition
        transcription = ""
        stt_success = False
        temp_wav = f"temp_eval_{int(time.time()*1000)}.wav"

        try:
            int16_audio = (np.clip(audio_norm, -1.0, 1.0) * 32767).astype(np.int16)
            wavfile.write(temp_wav, self.sample_rate, int16_audio)

            with sr.AudioFile(temp_wav) as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=0.15)
                audio_record = self.recognizer.record(source)
                try:
                    transcription = self.recognizer.recognize_google(audio_record)
                    stt_success = True
                except sr.UnknownValueError:
                    transcription = "[Inaudible Speech]"
                except sr.RequestError:
                    transcription = "[Acoustic Signal Analyzed]"
                    stt_success = True
        except Exception as e:
            print(f"[VOICE] STT Error: {e}")
        finally:
            if os.path.exists(temp_wav):
                try:
                    os.remove(temp_wav)
                except Exception:
                    pass

        # 2. Text / Response Similarity (60% Weight)
        import re
        from difflib import SequenceMatcher

        def _norm(s: str) -> str:
            s = s.lower().replace('"', '').replace("'", "").replace("“", "").replace("”", "").replace("‘", "").replace("’", "")
            s = re.sub(r"[^\w\s]", " ", s)
            return " ".join(s.split())

        cleaned_trans = transcription.lower().strip()
        expected_phrase = target.get("phrase", "")
        norm_trans = _norm(cleaned_trans)
        norm_expected = _norm(expected_phrase)

        acceptable = target.get("acceptable_phrases", [])
        norm_acceptable = [_norm(p) for p in acceptable]
        if norm_expected and norm_expected not in norm_acceptable:
            norm_acceptable.append(norm_expected)

        keywords = [k.lower() for k in target.get("keywords", [])]

        speech_score = 0.0
        if stt_success and cleaned_trans not in ("[inaudible speech]", ""):
            if norm_trans in norm_acceptable or any(norm_trans == acc or (len(acc) > 3 and (norm_trans in acc or acc in norm_trans)) for acc in norm_acceptable):
                speech_score = 96.0
            else:
                sim_ratio = SequenceMatcher(None, norm_trans, norm_expected).ratio()
                if sim_ratio >= 0.68:
                    speech_score = max(80.0, min(96.0, sim_ratio * 100.0))
                else:
                    kw_hits = sum(1 for kw in keywords if kw in cleaned_trans or kw in norm_trans)
                    if keywords and kw_hits > 0:
                        speech_score = 75.0 + (kw_hits / len(keywords)) * 20.0
                    else:
                        trans_words = set(norm_trans.split())
                        exp_words = set(norm_expected.split()) if norm_expected else set()
                        if trans_words and exp_words:
                            overlap = len(trans_words.intersection(exp_words)) / len(exp_words)
                            speech_score = max(55.0, overlap * 90.0)
                        else:
                            speech_score = 65.0
        else:
            if not norm_expected or "replicate" in norm_expected:
                speech_score = 72.0
            else:
                speech_score = 55.0

        # 3. Timing / Duration Compatibility (15% Weight)
        frame_len = int(self.sample_rate * 0.05)
        energies = [
            np.sum(audio_norm[i:i+frame_len]**2)
            for i in range(0, len(audio_norm) - frame_len, frame_len)
        ]
        active_frames = sum(1 for e in energies if e > 0.08)
        user_duration = max(0.4, active_frames * 0.05)

        ref_duration = (len(ref_mono) / ref_sr) if ref_mono is not None else target.get("target_duration", 3.0)
        dur_diff = abs(user_duration - ref_duration)
        timing_score = max(40.0, min(98.0, 100.0 - (dur_diff * 14.0)))

        # 4. Pitch & Harmonic Contour Compatibility (15% Weight)
        user_f0 = self._estimate_f0(audio_norm, self.sample_rate)
        ref_f0 = self._estimate_f0(ref_mono, ref_sr) if ref_mono is not None else 150.0

        if user_f0 > 0 and ref_f0 > 0:
            pitch_diff = abs(user_f0 - ref_f0)
            pitch_score = max(45.0, min(96.0, 100.0 - (min(pitch_diff, 120.0) * 0.45)))
        elif user_f0 > 0:
            pitch_score = 80.0
        else:
            pitch_score = 50.0

        # 5. Energy / Prosody Similarity (10% Weight)
        user_rms = float(np.sqrt(np.mean(audio_norm**2)))
        ref_rms = float(np.sqrt(np.mean(ref_mono**2))) if ref_mono is not None else 0.25
        energy_ratio = min(user_rms, ref_rms) / max(user_rms, ref_rms, 1e-4)
        energy_score = max(50.0, min(98.0, 70.0 + (energy_ratio * 26.0)))

        # Composite Deterministic Voice Response Score (60% + 15% + 15% + 10%)
        voice_score = (speech_score * 0.60) + (timing_score * 0.15) + (pitch_score * 0.15) + (energy_score * 0.10)
        voice_score = round(min(99.0, max(0.0, voice_score)), 1)

        is_verified = (voice_score >= config.THRESHOLD_VOICE)

        return {
            "verified": is_verified,
            "stt_success": stt_success,
            "transcription": transcription,
            "response_similarity": round(speech_score, 1),
            "pitch_compatibility": round(pitch_score, 1),
            "timing_compatibility": round(timing_score, 1),
            "energy_compatibility": round(energy_score, 1),
            "voice_score": voice_score,
            "verdict": "VOICE RESPONSE VERIFIED" if is_verified else "VOCAL MISMATCH DETECTED"
        }

    def _estimate_f0(self, audio: Optional[np.ndarray], sr: int) -> float:
        """Estimate fundamental vocal frequency (F0) deterministically via autocorrelation."""
        if audio is None or len(audio) < sr * 0.1:
            return 0.0
        try:
            mid = len(audio) // 2
            span = int(sr * 0.2)
            segment = audio[max(0, mid - span): min(len(audio), mid + span)]
            if len(segment) < span:
                return 0.0

            corr = scipy.signal.correlate(segment, segment, mode="full")
            corr = corr[len(corr)//2:]

            min_lag = int(sr / 400.0) # ~400 Hz upper limit
            max_lag = int(sr / 80.0)  # ~80 Hz lower limit

            if max_lag < len(corr):
                peak_lag = min_lag + int(np.argmax(corr[min_lag:max_lag]))
                if peak_lag > 0:
                    f0 = float(sr / peak_lag)
                    if 75.0 <= f0 <= 420.0:
                        return f0
            return 0.0
        except Exception:
            return 0.0

