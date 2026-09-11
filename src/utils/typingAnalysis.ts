import {
    typingConclusions,
    typingSample,
} from "../data/typingData";

import type {
    TypingMetrics,
    TypingVerdict,
} from "../data/typingData";

export interface TypingSession {
    value: string;
    keyTimes: number[];
    backspaces: number;
    caps: number;
    startedAt: number;
    endedAt: number;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
    if (values.length === 0) {
        return 0;
    }

    return (
        values.reduce((sum, value) => sum + value, 0) /
        values.length
    );
}

function standardDeviation(values: number[]): number {
    if (values.length < 2) {
        return 0;
    }

    const mean = average(values);

    const variance =
        values.reduce(
            (sum, value) => sum + (value - mean) ** 2,
            0
        ) / values.length;

    return Math.sqrt(variance);
}

function pickLine(lines: string[]): string {
    return lines[
        Math.floor(Math.random() * lines.length)
    ];
}

export function analyzeTyping(
    session: TypingSession
): TypingVerdict {
    const { value, keyTimes, backspaces, caps } =
        session;

    const sample = typingSample;

    let keys = keyTimes.length;

    if (keys === 0 && session.endedAt > session.startedAt) {
        keys = 1;
    }

    let correctChars = 0;

    for (
        let i = 0;
        i < value.length && i < sample.length;
        i++
    ) {
        if (value[i] === sample[i]) {
            correctChars += 1;
        }
    }

    const accuracy =
        sample.length > 0
            ? clamp(
                  (correctChars / sample.length) * 100,
                  0,
                  100
              )
            : 0;

    const durationSeconds =
        Math.max(
            session.endedAt - session.startedAt,
            0
        ) / 1000;

    const wpm =
        durationSeconds > 0
            ? Math.round(
                  (correctChars / 5) /
                      (durationSeconds / 60)
              )
            : 0;

    const gaps: number[] = [];

    for (let i = 1; i < keyTimes.length; i++) {
        gaps.push(keyTimes[i] - keyTimes[i - 1]);
    }

    const hesitationSeconds =
        gaps.length > 0
            ? gaps
                  .filter((gap) => gap > 600)
                  .reduce((sum, gap) => sum + gap, 0) / 1000
            : 0;

    const cv =
        gaps.length > 1
            ? standardDeviation(gaps) / average(gaps)
            : 0;

    const capsFrac = keys > 0 ? caps / keys : 0;
    const delFrac = keys > 0 ? backspaces / keys : 0;

    const rapidFrac =
        gaps.length > 0
            ? gaps.filter((gap) => gap < 150).length /
              gaps.length
            : 0;

    const aggression = Math.round(
        100 *
            (0.35 * clamp(cv * 2.5, 0, 1) +
                0.25 * clamp(capsFrac * 8, 0, 1) +
                0.25 * clamp(delFrac * 3, 0, 1) +
                0.15 * clamp(rapidFrac * 4, 0, 1))
    );

    const aggressionLabel: TypingMetrics["aggressionLabel"] =
        aggression >= 66
            ? "HIGH"
            : aggression >= 33
              ? "MEDIUM"
              : "LOW";

    const confidence = Math.round(
        clamp(48 + keys * 0.24, 48, 96) +
            (Math.random() * 6 - 3)
    );

    const metrics: TypingMetrics = {
        keys,
        correctChars,
        accuracy: Math.round(accuracy),
        wpm,
        backspaces,
        hesitationSeconds: Math.round(
            hesitationSeconds * 10
        ) / 10,
        aggression,
        aggressionLabel,
        durationSeconds: Math.round(durationSeconds),
        confidence,
    };

    const matchingConclusion =
        typingConclusions.find((def) =>
            def.matches(metrics)
        ) ?? typingConclusions.find((def) => def.id === "generic");

    return {
        ...metrics,
        conclusion: pickLine(
            matchingConclusion?.lines ?? []
        ),
    };
}