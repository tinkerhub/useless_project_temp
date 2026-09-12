import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Doodle, HatMascot, Sparkles, Tape } from "@/components/leviosa/magic";
import { characters, finalReport } from "@/lib/characters";
import {
  questions,
  resolveTie,
  scoreAnswers,
  tieBreakerAnswers,
  tieBreakerPrompt,
  topCharacters,
  type CharacterId,
} from "@/lib/quiz-data";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "The LEViosa Quiz — 10 deeply unnecessary questions" },
      {
        name: "description",
        content:
          "Answer 10 questions and let a retired, slightly goofy hat decide which questionable wizard you are.",
      },
      { property: "og:title", content: "The LEViosa Quiz" },
      {
        property: "og:description",
        content: "10 questions. 10 characters. Absolutely no scientific value.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Quiz,
});

type Phase = "questions" | "tiebreak" | "sorting" | "result";

const sortingLines = [
  "Consulting ancient magical records...",
  "Analyzing questionable decisions...",
  "Checking Hogwarts survival probability...",
  "Ignoring all established psychological principles...",
  "THE HAT HAS DECIDED.",
];

function Quiz() {
  const [phase, setPhase] = useState<Phase>("questions");
  const [picks, setPicks] = useState<number[]>([]);
  const [tied, setTied] = useState<CharacterId[]>([]);
  const [winner, setWinner] = useState<CharacterId | null>(null);

  const current = picks.length;

  function startSorting(id: CharacterId) {
    setWinner(id);
    setPhase("sorting");
  }

  function choose(index: number) {
    const next = [...picks, index];
    setPicks(next);
    if (next.length < questions.length) return;

    const top = topCharacters(scoreAnswers(next));
    if (top.length > 1) {
      setTied(top);
      setPhase("tiebreak");
    } else {
      startSorting(top[0]!);
    }
  }

  function restart() {
    setPicks([]);
    setTied([]);
    setWinner(null);
    setPhase("questions");
  }

  return (
    <main className="candlelight relative min-h-screen overflow-hidden px-5 py-8 sm:py-12">
      <Sparkles count={14} />
      <Doodle className="left-[4%] top-[30%] hidden sm:block" tilt={-8}>
        🪶
      </Doodle>
      <Doodle className="right-[4%] top-[40%] hidden sm:block" tilt={9}>
        🕯️
      </Doodle>

      <div className="relative mx-auto max-w-2xl">
        <Link
          to="/"
          className="mx-auto block text-center font-display text-3xl font-bold text-primary sm:text-4xl"
        >
          LEV<span className="text-gold">i</span>osa 🪄
        </Link>

        {phase === "questions" && (
          <QuestionCard index={current} onChoose={choose} />
        )}
        {phase === "tiebreak" && (
          <TieBreaker
            tied={tied}
            onChoose={(i) => startSorting(resolveTie(tied, i))}
          />
        )}
        {phase === "sorting" && <SortingScreen onDone={() => setPhase("result")} />}
        {phase === "result" && winner && <ResultScreen id={winner} onRestart={restart} />}
      </div>
    </main>
  );
}

function QuestionCard({
  index,
  onChoose,
}: {
  index: number;
  onChoose: (i: number) => void;
}) {
  const question = questions[index]!;

  return (
    <section className="mt-6">
      <p className="text-center text-[0.68rem] uppercase tracking-[0.35em] text-muted-foreground">
        Question {index + 1} / {questions.length}
      </p>

      <div className="mt-3 flex justify-center gap-2" aria-hidden>
        {questions.map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full border border-gold ${
              i <= index ? "bg-gold" : "bg-transparent"
            }`}
          />
        ))}
      </div>

      <div className="paper relative mt-7 rotate-[-0.6deg] px-6 py-7 sm:px-9">
        <Tape className="-top-3 left-1/2 -ml-11" tilt={-5} />
        <h2 className="font-display text-2xl leading-snug text-foreground sm:text-3xl">
          {question.prompt}
        </h2>
      </div>

      <ul className="mt-6 space-y-3.5">
        {question.answers.map((answer, i) => (
          <li key={answer.label}>
            <button
              type="button"
              onClick={() => onChoose(i)}
              className={`paper flex w-full items-start gap-3 px-5 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:rotate-[0.4deg] hover:shadow-[var(--shadow-glow)] ${
                i % 2 === 0 ? "rotate-[0.5deg]" : "rotate-[-0.5deg]"
              }`}
            >
              <span className="font-display text-lg font-bold text-gold">
                {answer.label}.
              </span>
              <span className="text-base leading-snug text-foreground sm:text-lg">
                {answer.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TieBreaker({
  tied,
  onChoose,
}: {
  tied: CharacterId[];
  onChoose: (i: number) => void;
}) {
  return (
    <section className="mt-8">
      <div className="paper paper-torn relative rotate-[0.8deg] px-6 py-7 text-center sm:px-10">
        <Tape className="-top-3 left-8" tilt={-10} />
        <h2 className="font-display text-2xl font-bold text-burgundy sm:text-3xl">
          ⚠️ The Sorting Hat is confused.
        </h2>
        <p className="mt-3 text-base text-foreground sm:text-lg">
          You appear to be equally questionable in two completely different ways.
        </p>
        <p className="handwritten mt-3 text-xl">
          currently torn between:{" "}
          {tied.map((id) => characters[id].name).join(" & ")}
        </p>
      </div>

      <div className="paper mt-6 rotate-[-0.6deg] px-6 py-6 sm:px-9">
        <h3 className="font-display text-xl leading-snug sm:text-2xl">
          {tieBreakerPrompt}
        </h3>
      </div>

      <ul className="mt-5 space-y-3.5">
        {tieBreakerAnswers.map((answer, i) => (
          <li key={answer.label}>
            <button
              type="button"
              onClick={() => onChoose(i)}
              className="paper flex w-full items-start gap-3 px-5 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]"
            >
              <span className="font-display text-lg font-bold text-gold">
                {answer.label}.
              </span>
              <span className="text-base leading-snug sm:text-lg">{answer.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SortingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= sortingLines.length - 1) {
      const finish = setTimeout(onDone, 1400);
      return () => clearTimeout(finish);
    }
    const next = setTimeout(() => setStep((s) => s + 1), 1300);
    return () => clearTimeout(next);
  }, [step, onDone]);

  return (
    <section className="mt-10 flex flex-col items-center text-center">
      <HatMascot className="w-56 sm:w-72" />
      <div className="paper mt-8 w-full max-w-md rotate-[-1deg] px-6 py-7">
        <p
          key={step}
          className="animate-in fade-in font-display text-xl leading-snug text-foreground duration-700 sm:text-2xl"
        >
          {sortingLines[step]}
        </p>
      </div>
      <p className="handwritten mt-4 text-xl">please hold, the hat is thinking</p>
    </section>
  );
}

function ResultScreen({ id, onRestart }: { id: CharacterId; onRestart: () => void }) {
  const character = characters[id];
  const [shared, setShared] = useState(false);

  async function share() {
    const text = `🪄 LEViosa says I'm ${character.name} — "${character.roast}" (Uselessness: ${character.uselessness})`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "LEViosa", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      /* the user dismissed the share sheet — nothing to do */
    }
  }

  return (
    <section className="mt-8 pb-12">
      <p className="text-center text-[0.68rem] uppercase tracking-[0.35em] text-muted-foreground">
        The LEViosa Record
      </p>

      <div className="paper relative mt-5 rotate-[-0.7deg] px-6 py-8 text-center sm:px-10">
        <Tape className="-top-3 left-8" tilt={-9} />
        <Tape className="-top-3 right-8" tilt={8} />
        <p className="handwritten text-xl">you got</p>
        <h2 className="font-display text-4xl font-bold leading-tight text-primary sm:text-5xl">
          {character.name}
        </h2>

        <div className="relative mx-auto mt-6 flex h-40 w-40 items-center justify-center rounded-full border-2 border-gold bg-tan text-6xl shadow-[var(--shadow-glow)] sm:h-48 sm:w-48 sm:text-7xl">
          <span aria-hidden>{character.emoji}</span>
          <HatMascot
            animated={false}
            className="absolute -top-10 left-1/2 w-24 -translate-x-1/2 -rotate-12 sm:w-28"
          />
        </div>

        <p className="mt-6 text-base leading-relaxed text-foreground sm:text-lg">
          {character.description}
        </p>
      </div>

      <Panel title="Magical Diagnosis" tilt={0.6}>
        <p className="font-display text-2xl text-burgundy">{character.diagnosis}</p>
      </Panel>

      <Panel title="Useless Stats" tilt={-0.7}>
        <ul className="space-y-2">
          {character.stats.map((stat) => (
            <li
              key={stat.label}
              className="flex items-baseline justify-between gap-4 border-b border-dashed border-border pb-1.5 text-sm sm:text-base"
            >
              <span>{stat.label}</span>
              <span className="font-display text-lg font-bold text-gold">
                {stat.value}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Roast" tilt={0.8}>
        <p className="handwritten text-2xl leading-snug">“{character.roast}”</p>
      </Panel>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Panel title="Greatest Magical Power" tilt={-0.8} className="mt-0">
          <p className="text-base">{character.power}</p>
        </Panel>
        <Panel title="Fatal Weakness" tilt={0.9} className="mt-0">
          <p className="text-base">{character.weakness}</p>
        </Panel>
        <Panel title="Hogwarts Survival Probability" tilt={0.7} className="mt-0">
          <p className="font-display text-3xl font-bold text-primary">
            {character.survival}
          </p>
        </Panel>
        <Panel title="Uselessness Score" tilt={-0.6} className="mt-0">
          <p className="font-display text-3xl font-bold text-primary">
            {character.uselessness}
          </p>
        </Panel>
      </div>

      <Panel title="Your Final Report" tilt={-0.5}>
        <ul className="space-y-2">
          {finalReport.map((row) => (
            <li
              key={row.label}
              className="flex items-baseline justify-between gap-4 border-b border-dashed border-border pb-1.5 text-sm sm:text-base"
            >
              <span>{row.label}</span>
              <span className="font-display text-lg font-bold text-gold">
                {row.value}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-base leading-relaxed">
          Congratulations. You have spent 4 minutes discovering which fictional
          wizard you resemble. Will this information help you in real life? No.
          Was it worth it? Absolutely.
        </p>
      </Panel>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onRestart}
          className="glow-gold w-full rounded-[16px_11px_18px_9px/10px_18px_10px_16px] border border-gold bg-parchment px-7 py-4 font-display text-lg font-bold uppercase tracking-widest text-primary transition-transform duration-300 hover:-translate-y-1 sm:w-auto"
        >
          🪄 Take the quiz again
        </button>
        <button
          type="button"
          onClick={share}
          className="w-full rounded-[16px_11px_18px_9px/10px_18px_10px_16px] border border-gold bg-tan px-7 py-4 font-display text-lg font-bold uppercase tracking-widest text-primary transition-transform duration-300 hover:-translate-y-1 sm:w-auto"
        >
          {shared ? "✓ Copied!" : "📤 Share my result"}
        </button>
      </div>

      <p className="handwritten mt-10 text-center text-2xl leading-tight">
        “The Sorting Hat has spoken.”
        <br />
        <span className="text-xl">
          Unfortunately, it appears to regret its decision.
        </span>
      </p>
    </section>
  );
}

function Panel({
  title,
  children,
  tilt,
  className = "mt-4",
}: {
  title: string;
  children: React.ReactNode;
  tilt: number;
  className?: string;
}) {
  return (
    <div
      className={`paper px-6 py-6 ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <h3 className="mb-3 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}
