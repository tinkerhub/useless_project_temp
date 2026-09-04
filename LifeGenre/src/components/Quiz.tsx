import { useState } from "react";
import { QUESTIONS } from "@/lib/quiz-data";

export function Quiz({ onDone }: { onDone: (answers: number[]) => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  const question = QUESTIONS[index]!;
  const progress = ((index + (picked !== null ? 1 : 0)) / QUESTIONS.length) * 100;

  function choose(optionIndex: number) {
    if (picked !== null) return;
    setPicked(optionIndex);
    const next = [...answers, optionIndex];
    setAnswers(next);
    setTimeout(() => {
      if (index + 1 >= QUESTIONS.length) {
        onDone(next);
      } else {
        setIndex(index + 1);
        setPicked(null);
      }
    }, 520);
  }

  return (
    <section className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      {/* timeline progress */}
      <div className="mb-10">
        <div className="mb-3 flex items-center justify-between font-display text-xs tracking-[0.3em] text-muted-foreground uppercase">
          <span>Scene {index + 1} of {QUESTIONS.length}</span>
          <span>{Math.round(progress)}% watched</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              boxShadow: "0 0 24px color-mix(in oklab, var(--primary) 70%, transparent)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent 0 14px, oklch(1 0 0 / 0.25) 14px 16px)",
            }}
          />
        </div>
      </div>

      <div key={index} className="reel-in">
        <h2 className="font-display text-4xl leading-tight text-balance uppercase sm:text-5xl">
          {question.q}
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {question.options.map((opt, i) => {
            const isPicked = picked === i;
            const dimmed = picked !== null && !isPicked;
            return (
              <button
                key={opt.text}
                onClick={() => choose(i)}
                className={`group relative cursor-pointer rounded-xl border bg-card/70 p-5 text-left backdrop-blur transition-all duration-300 ${
                  isPicked
                    ? "scale-[1.03] border-primary bg-primary/15 shadow-[0_0_50px_-12px_var(--primary)]"
                    : dimmed
                      ? "scale-[0.98] opacity-35"
                      : "border-border hover:-translate-y-1 hover:border-primary/70 hover:bg-card"
                }`}
              >
                <span className="font-display text-xs tracking-[0.3em] text-primary/70 uppercase">
                  Take {String.fromCharCode(65 + i)}
                </span>
                <span className="mt-2 block text-lg text-foreground">{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
