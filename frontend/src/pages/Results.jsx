import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GOOD_SONGS = [
  "/songs/good/good1.mpeg",
  "/songs/good/good2.mpeg",
  "/songs/good/good3.mpeg",
];

const BAD_SONGS = [
  "/songs/bad/bad1.mpeg",
  "/songs/bad/bad2.mpeg",
  "/songs/bad/bad3.mpeg",
];

export default function Results() {
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  /* =========================================================
     LOAD CURRENT SCAN RESULT
  ========================================================= */

  useEffect(() => {
    try {
      const savedResult =
        localStorage.getItem("toothCheckResult");

      if (savedResult) {
        setResult(JSON.parse(savedResult));
      }
    } catch (error) {
      console.error(
        "Could not read scan result:",
        error
      );
    }
  }, []);


  /* =========================================================
     PLAY RANDOM SONG
  ========================================================= */

  useEffect(() => {
    if (!result) {
      return;
    }

    const score =
      Number(result.whiteness_score) || 0;

    const songList =
      score >= 60
        ? GOOD_SONGS
        : BAD_SONGS;

    if (songList.length === 0) {
      return;
    }

    const randomIndex =
      Math.floor(
        Math.random() * songList.length
      );

    const selectedSong =
      songList[randomIndex];

    console.log(
      "Selected song:",
      selectedSong
    );

    const audio =
      new Audio(selectedSong);

    audio.volume = 1.0;

    audio.play().catch((error) => {
      console.log(
        "Browser blocked automatic audio playback:",
        error
      );
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [result]);


  /* =========================================================
     LOAD LEADERBOARD FROM DATABASE
  ========================================================= */

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoadingLeaderboard(true);

        const response = await fetch(
           "https://useless-project-skc4.onrender.com/api/leaderboard"
        );

        const data =
          await response.json();

        console.log(
          "Database leaderboard:",
          data
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load leaderboard"
          );
        }

        setLeaderboard(
          Array.isArray(data.leaderboard)
            ? data.leaderboard
            : []
        );
      } catch (error) {
        console.error(
          "Leaderboard error:",
          error
        );

        setLeaderboard([]);
      } finally {
        setLoadingLeaderboard(false);
      }
    }

    loadLeaderboard();
  }, []);


  /* =========================================================
     NO RESULT
  ========================================================= */

  if (!result) {
    return (
      <div className="results-page">
        <div className="results-container">
          <h1>
            Veluppu-o-Meter
          </h1>

          <p>
            No scan result found.
          </p>

          <button
            className="scan-again-button"
            onClick={() => navigate("/scan")}
          >
            Scan Again
          </button>
        </div>
      </div>
    );
  }


  /* =========================================================
     SCORE
  ========================================================= */

  const score = Math.max(
    0,
    Math.min(
      100,
      Number(result.whiteness_score) || 0
    )
  );

  const needleAngle =
    -90 + (score / 100) * 180;

  const currentScanId =
    Number(result.id);


  /* =========================================================
     RESULTS PAGE
  ========================================================= */

  return (
    <div className="results-page">

      {/* =====================================================
          VELOPPU-O-METER
      ===================================================== */}

      <div className="gauge-section">

        <h1>
          Veluppu-o-Meter
        </h1>

        <div className="gauge">

          <svg
            viewBox="0 0 220 130"
            className="gauge-svg"
          >

            <defs>

              <linearGradient
                id="gaugeGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >

                <stop
                  offset="0%"
                  stopColor="#e53935"
                />

                <stop
                  offset="50%"
                  stopColor="#fbc02d"
                />

                <stop
                  offset="100%"
                  stopColor="#43a047"
                />

              </linearGradient>

            </defs>


            {/* Gauge */}

            <path
              d="M 20 110 A 90 90 0 0 1 200 110"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="22"
              strokeLinecap="round"
            />


            {/* Needle */}

            <line
              x1="110"
              y1="110"
              x2="110"
              y2="38"
              stroke="black"
              strokeWidth="5"
              strokeLinecap="round"
              className="gauge-needle"
              style={{
                transform: `rotate(${needleAngle}deg)`,
                transformOrigin:
                  "110px 110px",
              }}
            />


            {/* Centre */}

            <circle
              cx="110"
              cy="110"
              r="8"
              fill="black"
            />

          </svg>


          {/* Score */}

          <div className="gauge-score">
            {score}
          </div>

        </div>

      </div>


      {/* =====================================================
          PALLU PREMIER LEAGUE
      ===================================================== */}

      <div className="leaderboard-section">

        <h2>
          Pallu Premier League
        </h2>


        {loadingLeaderboard ? (

          <p className="leaderboard-loading">
            Loading leaderboard...
          </p>

        ) : leaderboard.length === 0 ? (

          <p className="leaderboard-empty">
            No scores yet.
          </p>

        ) : (

          <div className="leaderboard">

            {leaderboard.map(
              (player, index) => {

                const isCurrentPlayer =
                  Number(player.id) ===
                  currentScanId;

                return (

                  <div
                    key={player.id}
                    className={`leaderboard-row ${
                      isCurrentPlayer
                        ? "current-player"
                        : ""
                    }`}
                  >

                    <div className="leaderboard-rank">
                      {index + 1}
                    </div>


                    <div className="leaderboard-name">
                      {player.name}
                    </div>


                    <div className="leaderboard-score">
                      {Number(
                        player.score
                      ).toFixed(0)}
                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}


        {/* =================================================
            SCAN AGAIN BUTTON
        ================================================= */}

        <button
          className="scan-again-button"
          onClick={() => {
            localStorage.removeItem(
              "toothCheckResult"
            );

            navigate("/scan");
          }}
        >
          Scan Again
        </button>

      </div>

    </div>
  );
}