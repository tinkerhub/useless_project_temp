import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { Landing } from "@/components/Landing";
import { Quiz } from "@/components/Quiz";
import { Analyzing } from "@/components/Analyzing";
import { Result } from "@/components/Result";
import { GENRES, scoreQuiz, type GenreId } from "@/lib/quiz-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "What Genre Is Your Life? — A Chaotic Personality Quiz" },
      {
        name: "description",
        content:
          "Answer 12 completely unnecessary questions and find out which cinematic disaster your life currently belongs to.",
      },
      { property: "og:title", content: "What Genre Is Your Life?" },
      {
        property: "og:description",
        content:
          "Psychological thriller? Low-budget comedy? Take the quiz and discover your current life genre.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Stage = "landing" | "quiz" | "analyzing" | "result";

function Index() {
  const [stage, setStage] = useState<Stage>("landing");
  const [genreId, setGenreId] = useState<GenreId>("comedy");

  const genre = GENRES[genreId];
  const themed = stage === "result";

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={
        themed
          ? ({ ["--genre" as string]: genre.accent, ["--genre-glow" as string]: genre.glow })
          : undefined
      }
    >
      <Atmosphere />

      {stage === "landing" && <Landing onStart={() => setStage("quiz")} />}

      {stage === "quiz" && (
        <Quiz
          onDone={(answers) => {
            setGenreId(scoreQuiz(answers));
            setStage("analyzing");
          }}
        />
      )}

      {stage === "analyzing" && <Analyzing onDone={() => setStage("result")} />}

      {stage === "result" && <Result genreId={genreId} onReplay={() => setStage("landing")} />}
    </main>
  );
}
