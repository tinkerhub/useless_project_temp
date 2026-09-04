import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GENRES, type GenreId } from "@/lib/quiz-data";

export function Result({ genreId, onReplay }: { genreId: GenreId; onReplay: () => void }) {
  const genre = GENRES[genreId];
  const [trailer, setTrailer] = useState(false);
  const [trailerIndex, setTrailerIndex] = useState(0);

  useEffect(() => {
    if (!trailer) return;
    if (trailerIndex >= genre.trailer.length) {
      const t = setTimeout(() => setTrailer(false), 1400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTrailerIndex((i) => i + 1), 1100);
    return () => clearTimeout(t);
  }, [trailer, trailerIndex, genre.trailer.length]);

  async function share() {
    const text = `🎬 Apparently my life is currently a ${genre.name}.\n\n${genre.details[1]?.label ?? "Main villain"}: ${genre.details[1]?.value ?? "unclear"}.\n\nIMDb rating: emotionally unstable/10.\n\nFind out what genre your life is.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "What Genre Is Your Life?", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard — go ruin someone's day.");
    } catch {
      toast.error("Sharing failed. Very on-brand.");
    }
  }

  if (trailer) {
    const word = genre.trailer[Math.min(trailerIndex, genre.trailer.length - 1)];
    return (
      <section className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
        <h2
          key={trailerIndex}
          className="slam shake font-display text-5xl leading-tight text-balance uppercase sm:text-7xl md:text-8xl"
          style={{ color: "var(--genre)" }}
        >
          {word}
        </h2>
      </section>
    );
  }

  return (
    <section className="relative z-10 mx-auto max-w-3xl px-6 py-20">
      <p className="reel-in text-center font-display text-sm tracking-[0.45em] text-muted-foreground uppercase">
        🎥 Your life is currently a...
      </p>

      <h1
        className="slam flare mt-6 text-center font-display text-5xl leading-[0.9] text-balance uppercase sm:text-7xl"
        style={{ color: "var(--genre)" }}
      >
        {genre.emoji} {genre.name}
      </h1>

      <p className="reel-in mt-6 text-center text-lg text-foreground/85 italic">{genre.tagline}</p>

      <blockquote
        className="reel-in mt-10 rounded-xl border-l-4 bg-card/70 p-6 text-lg leading-relaxed backdrop-blur"
        style={{ borderColor: "var(--genre)" }}
      >
        {genre.logline}
      </blockquote>

      <div className="reel-in mt-10 rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
        <h3 className="font-display text-xl tracking-[0.3em] uppercase" style={{ color: "var(--genre)" }}>
          Movie Details
        </h3>
        <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {genre.details.map((d) => (
            <div key={d.label} className="border-b border-border/60 pb-2">
              <dt className="font-display text-xs tracking-[0.25em] text-muted-foreground uppercase">
                {d.label}
              </dt>
              <dd className="mt-1 text-foreground">{d.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="reel-in mt-6 rounded-2xl border border-border/70 bg-secondary/40 p-6 backdrop-blur">
        <h3 className="font-display text-sm tracking-[0.3em] text-muted-foreground uppercase">
          Critical Review
        </h3>
        <p className="mt-2 text-lg italic">{genre.review}</p>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <button
          onClick={onReplay}
          className="cursor-pointer rounded-full border border-border bg-card px-7 py-4 font-display text-lg tracking-[0.2em] uppercase transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
        >
          🔄 Play again
        </button>
        <button
          onClick={share}
          className="cursor-pointer rounded-full px-7 py-4 font-display text-lg tracking-[0.2em] text-primary-foreground uppercase transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: "var(--genre)", boxShadow: "0 0 40px -12px var(--genre)" }}
        >
          📤 Share my genre
        </button>
        <button
          onClick={() => {
            setTrailerIndex(0);
            setTrailer(true);
          }}
          className="cursor-pointer rounded-full border px-7 py-4 font-display text-lg tracking-[0.2em] uppercase transition-all hover:-translate-y-0.5"
          style={{ borderColor: "var(--genre)", color: "var(--genre)" }}
        >
          🎞 Trailer mode
        </button>
      </div>
    </section>
  );
}
