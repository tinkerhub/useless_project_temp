"""
PROTOCOL 02: BEHAVIOURAL TYPING ANALYSIS
Captures key press timing, inter-key intervals (IKI), dwell times, burst patterns,
speed (WPM/CPS), pauses, and error correction behaviors.
Applies statistical anomaly detection and human rhythm profiling to differentiate
human typists from automated bot injections or uniform macro scripts.
Zero persistent retention of user-typed content.
"""

import os
import time
import math
import random
from typing import Dict, Any, List, Optional, Tuple

import config

DEFAULT_SENTENCES = [
    'Lily: "I hate Vietnam!" Mitchell: "Lily, honey, we don\'t hate." Lily: "I hate Vietnam!"',
    'Hermione: "It\'s LeviOsa, not LevioSA!" Ron: "You do it then if you\'re so clever!"',
    'Hermione: "Now if you two don\'t mind, I\'m going to bed before either of you come up with another clever idea to get us killed—or worse, expelled."',
    'Ron: "Why spiders? Why couldn\'t it be \'follow the butterflies\'?" Harry: "Because butterflies don\'t try to kill you, Ron."',
    'Phil: "Gotta fix that step." Claire: "You said that last time!" Phil: "Well, I haven\'t fixed it yet, have I?"',
    'Phil: "When life gives you lemonade, make lemons. Life will be all like, \'What?!\'" Claire: "That\'s not how it works, Phil."',
    'Stark: You\'re from Earth? Quill: I\'m not from Earth, I\'m from Missouri. Stark: Yeah, that\'s on EARTH, dipshit. What\'re you hassling us for?',
    'Quill: I\'m gonna ask you this one time: where is Gamora? Tony Stark: Yeah, I\'ll do you one better: WHO\'S Gamora? Drax: I\'ll do YOU one better: WHY is Gamora?',
    'Strange: Wait, what? Thanos? Alright, let me ask you this one time: what master do you serve? Quill: What master do I serve? What am I supposed to say, Jesus?',
    'Stark: You know Thor? Quill: Yeah. Tall guy, not that good-looking, needed saving.'
]


import re

def extract_shortened_dialogues(filepath: str) -> List[str]:
    """
    Parse Dialouges.txt and extract ONLY the first speaker and their first dialogue
    from EACH dialogue block in the file.
    """
    dialogues = []
    if not os.path.exists(filepath):
        return dialogues
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            raw = f.read()
    except Exception as e:
        print(f"[TYPING] Error reading {filepath}: {e}")
        return dialogues

    blocks = [b.strip() for b in re.split(r"\n\s*\n", raw) if b.strip()]
    for block in blocks:
        first_line = block.splitlines()[0].strip()

        # Pattern 1: Quoted dialogue on first line
        m_quoted = re.match(r'^([^:]+:\s*(?:"[^"]*"|\'[^\']*\'))', first_line)
        if m_quoted:
            dialogues.append(m_quoted.group(1).strip())
            continue

        # Pattern 2: Unquoted dialogue up to next speaker
        m_unquoted = re.match(
            r'^([A-Za-z0-9_ ]+:\s*.*?)(?=(?:[A-Z][a-z]+|\b(?:Tony Stark|Stark|Quill|Claire|Mitchell|Lily|Hermione|Ron|Harry|Phil|Strange|Drax))\s*:|$)',
            first_line
        )
        if m_unquoted:
            extracted = m_unquoted.group(1).strip()
            if len(extracted) > 5:
                dialogues.append(extracted)
                continue

        # Pattern 3: Multi-line Speaker:\n"Dialogue"
        if ":" in first_line:
            parts = first_line.split(":", 1)
            speaker = parts[0].strip()
            rest = parts[1].strip()
            if rest:
                dialogues.append(f'{speaker}: {rest}')
            elif len(block.splitlines()) > 1:
                next_line = block.splitlines()[1].strip()
                q = re.match(r'^("[^"]*"|\'[^\']*\')', next_line)
                if q:
                    dialogues.append(f'{speaker}: {q.group(1)}')
                else:
                    dialogues.append(f'{speaker}: {next_line}')
        else:
            dialogues.append(first_line)

    return dialogues


def load_typing_sentences() -> List[str]:
    """Load typing challenges from Dialouges.txt using each entry's first speaker and first dialogue."""
    for dial_path in [
        os.path.join(config.TYPING_ASSETS_DIR, "Dialouges.txt"),
        os.path.join(config.BASE_DIR, "Dialouges.txt")
    ]:
        if os.path.exists(dial_path):
            dialogues = extract_shortened_dialogues(dial_path)
            if dialogues:
                return dialogues

    return ['Lily: "I hate Vietnam!"']


class TypingSession:
    """Manages typing prompts with non-repeating random selection across all shortened dialogues."""
    def __init__(self):
        self.sentences = load_typing_sentences()
        self.current_sentence: Optional[str] = None
        self._pool: List[str] = []

    def get_new_sentence(self) -> str:
        if not hasattr(self, "_pool") or not self._pool:
            self.sentences = load_typing_sentences()
            pool = list(self.sentences)
            random.shuffle(pool)
            if len(pool) > 1 and hasattr(self, "current_sentence") and self.current_sentence and pool[-1] == self.current_sentence:
                pool[0], pool[-1] = pool[-1], pool[0]
            self._pool = pool

        if len(self._pool) > 1 and hasattr(self, "current_sentence") and self.current_sentence and self._pool[-1] == self.current_sentence:
            self._pool[0], self._pool[-1] = self._pool[-1], self._pool[0]

        self.current_sentence = self._pool.pop()
        return self.current_sentence


class TypingTracker:
    """Tracks keystroke timing events (key-down, key-up) in memory."""

    def __init__(self):
        self.reset()

    def reset(self):
        self.key_down_times: Dict[str, float] = {}
        self.flight_intervals: List[float] = []      # Inter-key intervals (ms)
        self.dwell_times: List[float] = []           # Key hold durations (ms)
        self.timestamps: List[float] = []
        self.last_key_down: Optional[float] = None
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
        self.backspace_count: int = 0
        self.total_keystrokes: int = 0

    def record_key_down(self, key_name: str) -> None:
        now = time.perf_counter()
        if self.start_time is None:
            self.start_time = now

        self.total_keystrokes += 1
        self.timestamps.append(now)

        # Inter-key flight time
        if self.last_key_down is not None:
            interval_ms = (now - self.last_key_down) * 1000.0
            # Cap extreme idle gaps (> 5s) to avoid skewing stats
            if interval_ms < 5000.0:
                self.flight_intervals.append(interval_ms)

        self.last_key_down = now
        self.key_down_times[key_name] = now

        if key_name in ("BackSpace", "Delete", "backspace", "delete"):
            self.backspace_count += 1

    def record_key_up(self, key_name: str) -> None:
        now = time.perf_counter()
        if key_name in self.key_down_times:
            down_time = self.key_down_times.pop(key_name)
            dwell_ms = (now - down_time) * 1000.0
            if 0.0 < dwell_ms < 2000.0:
                self.dwell_times.append(dwell_ms)

    def finish(self) -> float:
        if self.end_time is None:
            self.end_time = time.perf_counter()
        if self.start_time is not None:
            return max(0.001, self.end_time - self.start_time)
        return 0.0


def analyze_keystroke_behaviour(
    target_sentence: str,
    typed_text: str,
    tracker: TypingTracker
) -> Dict[str, Any]:
    """
    Evaluates keystroke dynamics and calculates a human behavioural consistency score.
    Detects bots (instant paste, zero variance, machine-precise macro timing).
    Exempts and deletes typed content from storage immediately after verification.
    """
    total_time = tracker.finish()
    
    # Forgiving text reproduction check (ignores punctuation, quotes, case)
    import re
    from difflib import SequenceMatcher

    def _clean(s: str) -> str:
        s = s.lower().replace('"', '').replace("'", "").replace("“", "").replace("”", "").replace("‘", "").replace("’", "")
        s = re.sub(r"[^\w\s]", " ", s)
        return " ".join(s.split())

    c_typed = _clean(typed_text)
    c_target = _clean(target_sentence)
    
    if c_typed == c_target:
        text_matches = True
        match_ratio = 1.0
    else:
        match_ratio = SequenceMatcher(None, c_typed, c_target).ratio()
        text_matches = (match_ratio >= 0.65) # 65%+ similarity is accepted

    char_len = len(target_sentence)
    wpm = ((char_len / 5.0) / (total_time / 60.0)) if total_time > 0 else 0.0
    cps = (char_len / total_time) if total_time > 0 else 0.0

    intervals = tracker.flight_intervals
    dwells = tracker.dwell_times
    backspaces = tracker.backspace_count

    # 1. BOT CHECKS (Only flag true inhuman injections and artificial loops)
    # Superhuman speed (> 38 chars/sec or < 0.20s total duration for sentence)
    if total_time < 0.20 or cps > 38.0:
        return {
            "verified": False,
            "score": 4.0,
            "speed_wpm": round(wpm, 1),
            "speed_cps": round(cps, 1),
            "dwell_ms": 0.0,
            "flight_ms": 0.0,
            "corrections": backspaces,
            "verdict": "AUTOMATED MACRO / INJECTION DETECTED",
            "anomaly": "Zero-latency instantaneous stream",
            "text_match": text_matches
        }

    # Missing interval data
    if len(intervals) < 3:
        return {
            "verified": False,
            "score": 10.0,
            "speed_wpm": round(wpm, 1),
            "speed_cps": round(cps, 1),
            "dwell_ms": 0.0,
            "flight_ms": 0.0,
            "corrections": backspaces,
            "verdict": "INSUFFICIENT TELEMETRY SAMPLE",
            "anomaly": "Too few key events captured",
            "text_match": text_matches
        }

    # Statistical moments of inter-key intervals
    mean_flight = sum(intervals) / len(intervals)
    var_flight = sum((x - mean_flight) ** 2 for x in intervals) / len(intervals)
    std_flight = math.sqrt(var_flight)
    cv_flight = (std_flight / mean_flight) if mean_flight > 0 else 0.0

    # Synthetic loop check: std < 2.5ms indicates programmed sleep loop
    if std_flight < 2.5 and len(intervals) > 10:
        return {
            "verified": False,
            "score": 8.0,
            "speed_wpm": round(wpm, 1),
            "speed_cps": round(cps, 1),
            "dwell_ms": 0.0,
            "flight_ms": round(mean_flight, 1),
            "corrections": backspaces,
            "verdict": "SYNTHETIC UNIFORM RHYTHM DETECTED",
            "anomaly": "Standard deviation below human biological limit",
            "text_match": text_matches
        }

    # Dwell statistics
    mean_dwell = (sum(dwells) / len(dwells)) if dwells else 85.0

    # 2. REALISTIC HUMAN SCORING (Friendly and forgiving)
    base_score = 92.0

    # Speed: Generous human typing range (8 to 150 WPM)
    if 10.0 <= wpm <= 130.0:
        base_score += 4.0
    elif wpm < 8.0:
        base_score -= 10.0

    # Natural rhythm variation
    if 0.20 <= cv_flight <= 1.40:
        base_score += 2.0

    # Human typos & backspaces are authentic human behavior
    if backspaces >= 1:
        base_score += 2.0

    # Minor deduction for partial text mismatch
    if match_ratio < 0.90 and text_matches:
        base_score -= (1.0 - match_ratio) * 20.0
    elif not text_matches:
        base_score -= 45.0

    final_score = min(99.0, max(0.0, base_score))
    is_verified = (final_score >= config.THRESHOLD_TYPING) and text_matches

    return {
        "verified": is_verified,
        "score": round(final_score, 1),
        "speed_wpm": round(wpm, 1),
        "speed_cps": round(cps, 1),
        "dwell_ms": round(mean_dwell, 1),
        "flight_ms": round(mean_flight, 1),
        "std_flight": round(std_flight, 1),
        "corrections": backspaces,
        "text_match": text_matches,
        "verdict": "HUMAN CADENCE VERIFIED" if is_verified else "BEHAVIOURAL ANOMALY DETECTED",
        "cadence_status": "ORGANIC BIOMETRIC RHYTHM" if is_verified else "DEVIANT PATTERN"
    }
