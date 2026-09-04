"""
PROTOCOL 01: HUMAN COGNITION VERIFICATION
Evaluates free-response answers to jokes, riddles, and human cultural challenges
using semantic concept matching, TF-IDF n-gram cosine similarity, and token metrics.
Offline, local, fast, and deterministic fallback enabled.
"""

import os
import re
import json
import random
from typing import Dict, Any, List, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

import config

DEFAULT_CHALLENGES = [
    {
        "id": "chicken_road",
        "prompt": "Why did the chicken cross the road?",
        "expected": "to get to the other side",
        "acceptable_keywords": ["other side", "cross", "get across", "opposite side"],
        "required_concepts": [
            ["side", "across", "other", "cross", "road", "walk", "opposite"]
        ],
        "semantic_examples": [
            "to get to the other side",
            "because it wanted to cross the road",
            "to reach the opposite side",
            "to get across the street",
            "to get to the other end",
            "it wanted to cross the road"
        ],
        "min_semantic_score": 50.0
    },
    {
        "id": "knock_knock_cows",
        "prompt": "Knock, knock! Who's there? Cows go. Cows go who?",
        "expected": "No, cows go moo!",
        "acceptable_keywords": ["moo", "cows go moo", "no cows go moo", "they go moo"],
        "required_concepts": [
            ["moo"]
        ],
        "semantic_examples": [
            "No, cows go moo!",
            "cows go moo",
            "no, cows moo",
            "moo",
            "cows do not go who, they go moo"
        ],
        "min_semantic_score": 50.0
    },
    {
        "id": "scarecrow_award",
        "prompt": "Why did the scarecrow win an award?",
        "expected": "Because he was outstanding in his field",
        "acceptable_keywords": ["outstanding in his field", "outstanding", "out standing"],
        "required_concepts": [
            ["outstanding", "standing out", "best", "great", "out"],
            ["field", "farm", "crops"]
        ],
        "semantic_examples": [
            "he was outstanding in his field",
            "because he was out standing in his field",
            "outstanding in his field"
        ],
        "min_semantic_score": 50.0
    },
    {
        "id": "riddle_sponge",
        "prompt": "What is full of holes but still holds water?",
        "expected": "a sponge",
        "acceptable_keywords": ["sponge", "a sponge", "sea sponge"],
        "required_concepts": [
            ["sponge"]
        ],
        "semantic_examples": [
            "a sponge",
            "sponge",
            "the sponge"
        ],
        "min_semantic_score": 55.0
    },
    {
        "id": "riddle_towel",
        "prompt": "What gets wetter the more it dries?",
        "expected": "a towel",
        "acceptable_keywords": ["towel", "a towel", "bath towel"],
        "required_concepts": [
            ["towel"]
        ],
        "semantic_examples": [
            "a towel",
            "towel",
            "the towel",
            "a bath towel"
        ],
        "min_semantic_score": 55.0
    }
]


def normalize_text(text: str) -> str:
    """Lowercase, strip non-alphanumerics, and clean whitespace."""
    if not text:
        return ""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    tokens = text.split()
    return " ".join(tokens)


def parse_jokes_file(filepath: str) -> List[Dict[str, Any]]:
    """Parse Jokes.txt into structured challenges with semantic concept matching."""
    challenges = []
    if not os.path.exists(filepath):
        return challenges

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            raw_lines = [line.strip() for line in f]
    except Exception as e:
        print(f"[COGNITION] Error reading {filepath}: {e}")
        return challenges

    current_prompt = ""
    for line in raw_lines:
        if not line:
            continue
        if line.startswith("→") or line.startswith("->") or line.startswith("-->") or line.lower().startswith("answer:"):
            ans = re.sub(r"^(→|->|-->|answer:)\s*", "", line, flags=re.IGNORECASE).strip()
            if current_prompt and ans:
                clean_ans = ans.rstrip(".").strip()
                tokens = [t for t in re.sub(r"[^\w\s]", " ", clean_ans).lower().split() if t not in ("a", "an", "the")]
                key_concept = tokens[-1] if tokens else clean_ans.lower()

                keywords = [clean_ans.lower(), ans.lower()]
                for t in tokens:
                    if len(t) >= 2 and t not in keywords:
                        keywords.append(t)

                semantic_examples = [
                    clean_ans,
                    ans,
                    f"it is {clean_ans}",
                    f"a {clean_ans}" if not clean_ans.lower().startswith("a ") else clean_ans,
                    f"the {clean_ans}" if not clean_ans.lower().startswith("the ") else clean_ans,
                ]

                challenges.append({
                    "id": f"joke_{len(challenges)+1:02d}",
                    "prompt": current_prompt,
                    "expected": clean_ans,
                    "acceptable_keywords": keywords,
                    "required_concepts": [[key_concept]],
                    "semantic_examples": semantic_examples,
                    "min_semantic_score": 40.0
                })
                current_prompt = ""
        else:
            if current_prompt:
                current_prompt += " " + line
            else:
                current_prompt = line

    return challenges


def load_all_challenges() -> List[Dict[str, Any]]:
    """
    Load challenges from user-provided Jokes.txt in assets/cognition/ or root.
    Falls back to discovered JSON challenges or DEFAULT_CHALLENGES only if Jokes.txt is missing.
    """
    # 1. Primary Source of Truth: Jokes.txt
    for jokes_path in [
        os.path.join(config.COGNITION_ASSETS_DIR, "Jokes.txt"),
        os.path.join(config.BASE_DIR, "Jokes.txt")
    ]:
        if os.path.exists(jokes_path):
            parsed = parse_jokes_file(jokes_path)
            if parsed:
                return parsed

    # 2. Check JSON files in assets/cognition/
    challenges = []
    if os.path.exists(config.COGNITION_ASSETS_DIR):
        for fname in os.listdir(config.COGNITION_ASSETS_DIR):
            if fname.endswith(".json"):
                fpath = os.path.join(config.COGNITION_ASSETS_DIR, fname)
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            challenges.extend(data)
                        elif isinstance(data, dict):
                            challenges.append(data)
                except Exception as e:
                    print(f"[COGNITION] Warning loading {fname}: {e}")

    if not challenges:
        challenges = list(DEFAULT_CHALLENGES)

    return challenges


class CognitionVerifier:
    def __init__(self):
        self.challenges = load_all_challenges()
        self.current_challenge: Optional[Dict[str, Any]] = None
        self._pool: List[Dict[str, Any]] = []

    def get_new_challenge(self) -> Dict[str, Any]:
        """Select a challenge from the real asset pool without immediate repeats."""
        if not hasattr(self, "_pool") or not self._pool:
            self.challenges = load_all_challenges()
            pool = list(self.challenges)
            random.shuffle(pool)
            if len(pool) > 1 and self.current_challenge and pool[-1].get("id") == self.current_challenge.get("id"):
                pool[0], pool[-1] = pool[-1], pool[0]
            self._pool = pool

        if len(self._pool) > 1 and self.current_challenge and self._pool[-1].get("id") == self.current_challenge.get("id"):
            self._pool[0], self._pool[-1] = self._pool[-1], self._pool[0]

        self.current_challenge = self._pool.pop()
        return self.current_challenge

    def evaluate_response(self, user_input: str, challenge: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Multi-factor semantic assessment of user response:
        1. Exact / Substring match against expected answer and keywords.
        2. Concept group coverage (semantic synonym coverage).
        3. TF-IDF character & word n-gram cosine similarity across known semantic variants.
        4. Token Jaccard overlap.
        """
        target = challenge or self.current_challenge
        if not target:
            target = self.get_new_challenge()

        cleaned_user = normalize_text(user_input)
        cleaned_expected = normalize_text(target.get("expected", ""))
        semantic_corpus = target.get("semantic_examples", [])
        keywords = target.get("acceptable_keywords", [])
        required_concepts = target.get("required_concepts", [])

        if not cleaned_user:
            return {
                "verified": False,
                "confidence": 0.0,
                "score": 0.0,
                "feedback": "NO RESPONSE ENTERED"
            }

        # 1. Exact Match Check
        if cleaned_user == cleaned_expected:
            return {
                "verified": True,
                "confidence": 98.0,
                "score": 98.0,
                "feedback": "EXACT RECOGNITION"
            }

        # 2. Keyword / Substring Check
        keyword_match_score = 0.0
        for kw in keywords:
            cleaned_kw = normalize_text(kw)
            if cleaned_kw and cleaned_kw in cleaned_user:
                keyword_match_score = max(keyword_match_score, 88.0)

        # 3. Concept Groups Check
        # Check if user response hits required semantic concept bins
        concept_matches = 0
        total_concepts = len(required_concepts)
        if total_concepts > 0:
            for group in required_concepts:
                matched_in_group = any(normalize_text(concept) in cleaned_user for concept in group)
                if matched_in_group:
                    concept_matches += 1
            concept_score = (concept_matches / total_concepts) * 85.0
        else:
            concept_score = 50.0

        # 4. TF-IDF Cosine Similarity across reference corpus
        tfidf_score = 0.0
        all_references = [target.get("expected", "")] + semantic_corpus
        corpus_candidates = [normalize_text(ref) for ref in all_references if ref]

        if corpus_candidates:
            try:
                # Word + Char n-gram vectorizer for typo tolerance and semantic capture
                vectorizer = TfidfVectorizer(ngram_range=(1, 3), analyzer="char_wb")
                matrix = vectorizer.fit_transform(corpus_candidates + [cleaned_user])
                similarities = cosine_similarity(matrix[-1], matrix[:-1])
                max_sim = float(similarities.max())
                tfidf_score = max_sim * 100.0
            except Exception:
                tfidf_score = 0.0

        # 5. Token Jaccard Overlap with Expected
        user_tokens = set(cleaned_user.split())
        expected_tokens = set(cleaned_expected.split())
        jaccard_score = 0.0
        if user_tokens and expected_tokens:
            intersection = len(user_tokens.intersection(expected_tokens))
            union = len(user_tokens.union(expected_tokens))
            jaccard_score = (intersection / union) * 100.0

        # Composite Confidence Score
        # Prioritize concept matching and TF-IDF similarity
        composite_score = max(
            keyword_match_score,
            (concept_score * 0.45) + (tfidf_score * 0.40) + (jaccard_score * 0.15)
        )

        composite_score = min(99.0, max(0.0, composite_score))
        min_pass = target.get("min_semantic_score", config.THRESHOLD_COGNITION)
        if min_pass <= 1.0:
            min_pass *= 100.0
        is_verified = composite_score >= min_pass

        return {
            "verified": is_verified,
            "confidence": round(composite_score, 1),
            "score": round(composite_score, 1),
            "feedback": "COGNITIVE RESPONSE: VERIFIED" if is_verified else "SEMANTIC DEVIATION DETECTED"
        }
