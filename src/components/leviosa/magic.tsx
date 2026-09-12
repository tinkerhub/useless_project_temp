import hatImage from "@/assets/sorting-hat.png";

/** Twinkling stars scattered behind the content. */
export function Sparkles({ count = 18 }: { count?: number }) {
  const stars = Array.from({ length: count }, (_, i) => {
    // deterministic pseudo-random placement so SSR and client agree
    const top = (i * 37) % 95;
    const left = (i * 61) % 96;
    const delay = ((i * 13) % 30) / 10;
    const size = 6 + ((i * 7) % 10);
    return { top, left, delay, size, i };
  });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <span
          key={s.i}
          className="animate-twinkle absolute text-gold"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            fontSize: `${s.size}px`,
            animationDelay: `${s.delay}s`,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

/** A small illustrated doodle pinned at an angle. */
export function Doodle({
  children,
  className = "",
  tilt = -6,
}: {
  children: React.ReactNode;
  className?: string;
  tilt?: number;
}) {
  return (
    <div
      aria-hidden
      className={`animate-float-soft pointer-events-none absolute select-none text-3xl opacity-80 sm:text-4xl ${className}`}
      style={{ ["--tilt" as string]: `${tilt}deg` }}
    >
      {children}
    </div>
  );
}

/** A strip of paper tape. */
export function Tape({ className = "", tilt = -8 }: { className?: string; tilt?: number }) {
  return (
    <span
      aria-hidden
      className={`tape rounded-[2px] ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    />
  );
}

export function HatMascot({
  className = "",
  animated = true,
  priority = false,
}: {
  className?: string;
  animated?: boolean;
  priority?: boolean;
}) {
  return (
    <img
      src={hatImage}
      alt="A cheerful illustrated sorting hat with a big goofy smile"
      width={1024}
      height={1024}
      {...(priority ? {} : { loading: "lazy" as const })}
      className={`${animated ? "animate-hat" : ""} drop-shadow-[0_18px_28px_rgba(90,60,25,0.28)] ${className}`}
    />
  );
}
