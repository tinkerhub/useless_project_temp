import { useEffect, useState } from "react";
import { LOADING_LINES } from "@/lib/quiz-data";

export function Analyzing({ onDone }: { onDone: () => void }) {
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (line >= LOADING_LINES.length) {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLine((l) => l + 1), 900);
    return () => clearTimeout(t);
  }, [line, onDone]);

  return (
    <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h2 className="flicker font-display text-3xl tracking-[0.2em] text-primary uppercase sm:text-5xl">
        Analyzing your poor decisions...
      </h2>
      <div className="mt-10 h-8">
        {LOADING_LINES[Math.min(line, LOADING_LINES.length - 1)] && (
          <p key={line} className="reel-in text-lg text-muted-foreground italic">
            {LOADING_LINES[Math.min(line, LOADING_LINES.length - 1)]}
          </p>
        )}
      </div>
      <div className="mt-8 h-1 w-64 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-700 ease-linear"
          style={{ width: `${((line + 1) / (LOADING_LINES.length + 1)) * 100}%` }}
        />
      </div>
    </section>
  );
}
