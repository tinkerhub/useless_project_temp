import { useMemo } from "react";

export function Atmosphere() {
  const motes = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        size: 2 + ((i * 7) % 5),
        duration: 14 + ((i * 5) % 16),
        delay: -((i * 3) % 20),
        dx: `${((i % 7) - 3) * 2}vw`,
      })),
    [],
  );

  return (
    <>
      <div className="spotlight" />
      <div className="dust" aria-hidden>
        {motes.map((m) => (
          <span
            key={m.id}
            style={{
              left: m.left,
              width: m.size,
              height: m.size,
              animationDuration: `${m.duration}s`,
              animationDelay: `${m.delay}s`,
              ["--dx" as string]: m.dx,
            }}
          />
        ))}
      </div>
      <div className="vignette" aria-hidden />
      <div className="grain-layer" aria-hidden />
    </>
  );
}
