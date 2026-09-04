export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="reel-in font-display text-sm tracking-[0.5em] text-primary/80 uppercase">
        Now Showing · One Night Only
      </p>
      <h1
        className="reel-in flare font-display mt-6 text-5xl leading-[0.92] tracking-tight text-balance uppercase sm:text-7xl md:text-8xl"
        style={{ animationDelay: "0.08s" }}
      >
        🎬 What genre is your life right now?
      </h1>
      <p
        className="reel-in mt-8 max-w-xl text-lg text-muted-foreground italic sm:text-xl"
        style={{ animationDelay: "0.18s" }}
      >
        Your life has a plot. Unfortunately, nobody gave you the script.
      </p>
      <p
        className="reel-in mt-4 max-w-lg text-base text-foreground/80"
        style={{ animationDelay: "0.26s" }}
      >
        Answer 12 completely unnecessary questions and discover what cinematic disaster
        you&apos;re currently living in.
      </p>

      <button
        onClick={onStart}
        style={{ animationDelay: "0.36s" }}
        className="reel-in group relative mt-12 cursor-pointer overflow-hidden rounded-full border border-primary/60 bg-primary/10 px-10 py-5 font-display text-2xl tracking-[0.2em] text-primary uppercase transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_60px_-10px_var(--genre)] sm:text-3xl"
      >
        ▶ Start the movie
      </button>

      <p className="mt-10 font-display text-xs tracking-[0.35em] text-muted-foreground uppercase">
        Rated E · for emotionally unstable
      </p>
    </section>
  );
}
