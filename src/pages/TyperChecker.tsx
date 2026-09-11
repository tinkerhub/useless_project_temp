import {
    useEffect,
    useRef,
    useState,
} from "react";

import type {
    ChangeEvent,
    KeyboardEvent,
} from "react";

import { typingSample } from "../data/typingData";

import type {
    TypingVerdict,
} from "../data/typingData";

import { analyzeTyping } from "../utils/typingAnalysis";

import "./TyperChecker.css";

function formatDuration(seconds: number): string {
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);

    return `${m}:${String(s - m * 60).padStart(2, "0")}`;
}

function TyperChecker() {
    const [value, setValue] = useState<string>("");
    const [started, setStarted] = useState<boolean>(false);
    const [elapsed, setElapsed] = useState<number>(0);
    const [verdict, setVerdict] =
        useState<TypingVerdict | null>(null);
    const [checksDelivered, setChecksDelivered] =
        useState<number>(0);

    const startTimeRef = useRef<number>(0);
    const endTimeRef = useRef<number>(0);
    const keyTimesRef = useRef<number[]>([]);
    const backspacesRef = useRef<number>(0);
    const capsRef = useRef<number>(0);

    useEffect(() => {
        if (!started) {
            return;
        }

        const id = setInterval(() => {
            setElapsed(endTimeRef.current - startTimeRef.current);
        }, 500);

        return () => clearInterval(id);
    }, [started]);

    function handleKeyDown(
        e: KeyboardEvent<HTMLTextAreaElement>
    ) {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleAnalyze();
            return;
        }

        if (e.repeat) {
            return;
        }

        if (
            e.key === "Backspace" ||
            e.key === "Delete"
        ) {
            backspacesRef.current += 1;
            return;
        }

        const isModifier = [
            "Shift",
            "Control",
            "Alt",
            "Meta",
            "CapsLock",
        ].includes(e.key);

        if (
            isModifier ||
            e.ctrlKey ||
            e.metaKey ||
            e.altKey
        ) {
            return;
        }

        if (e.key.length === 1) {
            const now = performance.now();

            if (!started) {
                setStarted(true);
            }

            if (startTimeRef.current === 0) {
                startTimeRef.current = now;
            }

            keyTimesRef.current.push(now);
            endTimeRef.current = now;

            if (/^[A-Z]$/.test(e.key)) {
                capsRef.current += 1;
            }
        }
    }

    function handleChange(
        e: ChangeEvent<HTMLTextAreaElement>
    ) {
        setValue(e.target.value);
    }

    function matchingChars(): number {
        let count = 0;

        for (
            let i = 0;
            i < value.length &&
            i < typingSample.length;
            i++
        ) {
            if (value[i] === typingSample[i]) {
                count += 1;
            }
        }

        return count;
    }

    function handleAnalyze() {
        if (value.trim().length === 0) {
            return;
        }

        const metrics = analyzeTyping({
            value,
            keyTimes: keyTimesRef.current,
            backspaces: backspacesRef.current,
            caps: capsRef.current,
            startedAt: startTimeRef.current,
            endedAt:
                endTimeRef.current ||
                performance.now(),
        });

        setVerdict(metrics);
        setChecksDelivered((count) => count + 1);
    }

    function handleReset() {
        setValue("");
        setVerdict(null);
        setStarted(false);
        setElapsed(0);

        startTimeRef.current = 0;
        endTimeRef.current = 0;
        keyTimesRef.current = [];
        backspacesRef.current = 0;
        capsRef.current = 0;
    }

    const matching = matchingChars();

    const rows = verdict
        ? [
              {
                  label: "Words per minute",
                  value: String(verdict.wpm),
              },
              {
                  label: "Accuracy",
                  value: `${verdict.accuracy}%`,
              },
              {
                  label: "Backspaces",
                  value: String(verdict.backspaces),
              },
              {
                  label: "Hesitations",
                  value: `${verdict.hesitationSeconds.toFixed(1)}s`,
              },
              {
                  label: "Aggression",
                  value: `${verdict.aggressionLabel} · ${verdict.aggression}/100`,
              },
              {
                  label: "Session time",
                  value: formatDuration(
                      verdict.durationSeconds
                  ),
              },
          ]
        : [];

    return (
        <div className="typer-page">

            <header className="typer-header">
                <div className="typer-eyebrow">
                    UselessOS™ / Utility
                </div>

                <h1 className="typer-title">
                    The Typer Checker
                </h1>

                <p className="typer-subtitle">
                    Hoists your deepest psychological state
                    out of your keystrokes, one character at
                    a time. Accuracy not guaranteed. Science
                    barely involved.
                </p>
            </header>

            <section className="typer-card">

                <div className="typer-sample">
                    <span className="typer-sample-label">
                        Your mission, should you choose to
                        accept it
                    </span>

                    <span className="typer-sample-text">
                        {typingSample}
                    </span>
                </div>

                <textarea
                    className="typer-textarea"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Start typing, brave one…"
                    autoFocus
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    aria-label="Type the sample sentence"
                />

                <div className="typer-counters">
                    <span className="typer-counter">
                        Time typing:{" "}
                        {(elapsed / 1000).toFixed(1)}s
                    </span>

                    <span className="typer-counter">
                        Matching: {matching}/
                        {typingSample.length}
                    </span>
                </div>

                <div
                    className="typer-progress"
                    role="progressbar"
                    aria-valuenow={matching}
                    aria-valuemin={0}
                    aria-valuemax={typingSample.length}
                >
                    <div
                        className="typer-progress-fill"
                        style={{
                            width: `${(matching / typingSample.length) * 100}%`,
                        }}
                    />
                </div>

                <div className="typer-actions">
                    <button
                        className="analyze-button"
                        onClick={handleAnalyze}
                        disabled={value.trim().length === 0}
                    >
                        Analyze my typing
                    </button>

                    {verdict && (
                        <button
                            className="retry-button"
                            onClick={handleReset}
                        >
                            Try again
                        </button>
                    )}
                </div>

                {verdict ? (
                    <div
                        className="typer-verdict"
                        aria-live="polite"
                    >
                        <p className="verdict-label">
                            Your psychological typing profile
                        </p>

                        <div className="verdict-metrics">
                            {rows.map((row) => (
                                <div
                                    className="verdict-metric"
                                    key={row.label}
                                >
                                    <span className="verdict-metric-label">
                                        {row.label}
                                    </span>

                                    <span className="verdict-metric-value">
                                        {row.value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <p className="verdict-conclusion">
                            “{verdict.conclusion}”
                        </p>

                        <div className="verdict-confidence">
                            <div className="verdict-confidence-head">
                                <span>
                                    Confidence:
                                </span>
                                <span>
                                    {verdict.confidence}%
                                </span>
                            </div>

                            <div className="confidence-bar">
                                <div
                                    className="confidence-fill"
                                    style={{
                                        width: `${verdict.confidence}%`,
                                    }}
                                />
                            </div>

                            <p className="verdict-footnote">
                                Confidence is calculated by
                                a deeply scientific process
                                we will not be explaining.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="typer-verdict typer-verdict-empty">
                        <p className="verdict-label">
                            No verdict yet
                        </p>

                        <p className="verdict-placeholder">
                            Type the sentence above, then
                            press analyze so the machine can
                            read your soul. It does not have
                            a reading score.
                        </p>
                    </div>
                )}

                <div className="typer-stats">
                    <span>Checks delivered</span>
                    <span>{checksDelivered}</span>
                </div>

            </section>
        </div>
    );
}

export default TyperChecker;