import { useState } from "react";

import type {
    ExcuseLevel,
    Situation,
} from "../data/excuses";

import { generateExcuse } from "../utils/excuseGenerator";

import "./ExcuseGenerator.css";

function ExcuseGenerator() {
    const [situation, setSituation] =
        useState<Situation>("late");

    const [level, setLevel] =
        useState<ExcuseLevel>("plausible");

    const [excuse, setExcuse] =
        useState<string>("");

    const [generatedCount, setGeneratedCount] =
        useState<number>(0);

    const [copied, setCopied] =
        useState<boolean>(false);

    function handleGenerate() {
        const newExcuse = generateExcuse(
            situation,
            level
        );

        setExcuse(newExcuse);
        setGeneratedCount((count) => count + 1);
        setCopied(false);
    }

    function handleCopy() {
        navigator.clipboard.writeText(excuse);

        setCopied(true);

        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div className="excuse-page">

            <header className="excuse-header">
                <div className="excuse-eyebrow">
                    UselessOS™ / Utility
                </div>

                <h1 className="excuse-title">
                    Excuse Generator
                </h1>

                <p className="excuse-subtitle">
                    Advanced accountability avoidance
                    technology for situations that
                    probably didn't require an excuse.
                </p>
            </header>

            <section className="excuse-card">

                <div className="excuse-form">

                    <div className="form-group">
                        <label
                            className="form-label"
                            htmlFor="situation"
                        >
                            Situation
                        </label>

                        <select
                            id="situation"
                            className="form-select"
                            value={situation}
                            onChange={(e) =>
                                setSituation(
                                    e.target.value as Situation
                                )
                            }
                        >
                            <option value="late">
                                Late to class
                            </option>

                            <option value="assignment">
                                Didn't submit assignment
                            </option>

                            <option value="reply">
                                Didn't reply
                            </option>

                            <option value="meeting">
                                Missed a meeting
                            </option>

                            <option value="study">
                                Didn't study
                            </option>

                            <option value="forgot">
                                Forgot something
                            </option>
                        </select>
                    </div>

                    <div className="form-group">

                        <div>
                            <div className="form-label">
                                Bullshit level
                            </div>

                            <p className="form-hint">
                                How believable do you want
                                your completely legitimate
                                explanation to be?
                            </p>
                        </div>

                        <div className="level-grid">

                            <label className="level-option">
                                <input
                                    type="radio"
                                    name="level"
                                    value="plausible"
                                    checked={level === "plausible"}
                                    onChange={() =>
                                        setLevel("plausible")
                                    }
                                />

                                <span className="level-button">
                                    <span className="level-name">
                                        Plausible
                                    </span>

                                    <span className="level-description">
                                        Could happen
                                    </span>
                                </span>
                            </label>

                            <label className="level-option">
                                <input
                                    type="radio"
                                    name="level"
                                    value="questionable"
                                    checked={level === "questionable"}
                                    onChange={() =>
                                        setLevel("questionable")
                                    }
                                />

                                <span className="level-button">
                                    <span className="level-name">
                                        Questionable
                                    </span>

                                    <span className="level-description">
                                        Hmm...
                                    </span>
                                </span>
                            </label>

                            <label className="level-option">
                                <input
                                    type="radio"
                                    name="level"
                                    value="ridiculous"
                                    checked={level === "ridiculous"}
                                    onChange={() =>
                                        setLevel("ridiculous")
                                    }
                                />

                                <span className="level-button">
                                    <span className="level-name">
                                        Ridiculous
                                    </span>

                                    <span className="level-description">
                                        Obviously fake
                                    </span>
                                </span>
                            </label>

                            <label className="level-option">
                                <input
                                    type="radio"
                                    name="level"
                                    value="unhinged"
                                    checked={level === "unhinged"}
                                    onChange={() =>
                                        setLevel("unhinged")
                                    }
                                />

                                <span className="level-button">
                                    <span className="level-name">
                                        Unhinged
                                    </span>

                                    <span className="level-description">
                                        Seek help
                                    </span>
                                </span>
                            </label>

                        </div>
                    </div>

                    <button
                        className="generate-button"
                        onClick={handleGenerate}
                    >
                        Generate excuse
                    </button>

                </div>

                {excuse ? (
                    <div
                        className="excuse-result"
                        aria-live="polite"
                    >
                        <p className="result-label">
                            Your official explanation
                        </p>

                        <p className="result-text">
                            “{excuse}”
                        </p>

                        <div className="result-actions">
                            <button
                                className={
                                    copied
                                        ? "copy-button copied"
                                        : "copy-button"
                                }
                                onClick={handleCopy}
                            >
                                {copied
                                    ? "Copied!"
                                    : "Copy excuse"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="excuse-result excuse-result-empty">
                        <p className="result-label">
                            Ready when you are
                        </p>

                        <p className="result-placeholder">
                            Pick a situation, choose a level
                            of believability, and press
                            generate. Your official
                            explanation will appear here.
                        </p>
                    </div>
                )}

                <div className="excuse-stats">
                    <span>
                        Excuses generated
                    </span>

                    <span>
                        {generatedCount}
                    </span>
                </div>

            </section>
        </div>
    );
}

export default ExcuseGenerator;