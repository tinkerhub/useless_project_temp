import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Scan() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const navigate = useNavigate();

  const [scanning, setScanning] = useState(false);
  const [name, setName] = useState("");

  const [message, setMessage] = useState(
    "Align your teeth with the cat's mouth"
  );

  const [errorMessage, setErrorMessage] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const currentStream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });

        streamRef.current = currentStream;

        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (error) {
        console.error(
          "Camera error:",
          error
        );

        setErrorMessage(true);

        setMessage(
          "DON'T PRODUCE TOO MUCH!!!"
        );
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }
    };
  }, []);

  async function captureAndAnalyze() {
    if (!videoRef.current) {
      return;
    }

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      setErrorMessage(true);

      setMessage(
        "Please enter your name first."
      );

      return;
    }

    setScanning(true);
    setErrorMessage(false);

    setMessage(
      "Analyzing your teeth..."
    );

    const video =
      videoRef.current;

    const canvas =
      canvasRef.current;

    if (
      !video.videoWidth ||
      !video.videoHeight
    ) {
      setErrorMessage(true);

      setMessage(
        "DON'T PRODUCE TOO MUCH!!!"
      );

      setScanning(false);

      return;
    }

    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;

    const ctx =
      canvas.getContext("2d");

    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const imageData =
      canvas.toDataURL(
        "image/jpeg",
        0.9
      );

    try {
      const response =
        await fetch(
           "https://useless-project-skc4.onrender.com/api/analyze",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              image: imageData,
              name: trimmedName,
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        "Backend result:",
        data
      );

      if (!response.ok) {
        setErrorMessage(true);

        setMessage(
          "DON'T PRODUCE TOO MUCH!!!"
        );

        setScanning(false);

        return;
      }

      if (data.error) {
        setErrorMessage(true);

        setMessage(
          "DON'T PRODUCE TOO MUCH!!!"
        );

        setScanning(false);

        return;
      }

      setErrorMessage(false);

      localStorage.setItem(
        "toothCheckResult",
        JSON.stringify(data)
      );

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        streamRef.current = null;
      }

      navigate("/results");

    } catch (error) {
      console.error(
        "Analysis error:",
        error
      );

      setErrorMessage(true);

      setMessage(
        "DON'T PRODUCE TOO MUCH!!!"
      );

      setScanning(false);
    }
  }

  return (
    <div className="scan-page">

    <h1
    className="pallu-title"
    style={{
        fontSize: "80px",
        color: "black",
    }}
    >
    PALLU TECHO?
    </h1>

      <div className="cat-camera">

        <img
          src="/cat-mouth-guide.jpeg"
          alt="ToothCheck cat guide"
          className="cat-image"
        />

        <div className="mouth-camera">

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />

        </div>

        <div className="camera-label">

          <span className="camera-dot"></span>

          Camera

        </div>

      </div>

      <div className="scan-instruction">

        <div className="tooth-circle">

          <span>♡</span>

        </div>

        <span>
          Make sure your teeth are clearly
          visible and well-lit.
        </span>

      </div>

      <div className="name-input-container">

        <label htmlFor="player-name">
          Enter your name
        </label>

        <input
          id="player-name"
          type="text"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          placeholder="Your name"
          maxLength={30}
          disabled={scanning}
        />

      </div>

      <button
        className="capture-button"
        onClick={captureAndAnalyze}
        disabled={scanning}
      >

        <span className="capture-camera-icon">
          ▣
        </span>

        {scanning
          ? "Analyzing..."
          : "Capture"}

      </button>

      <div
        className={
          errorMessage
            ? "scan-status scan-error"
            : "scan-status"
        }
      >
        {message}
      </div>

      <canvas
        ref={canvasRef}
        style={{
          display: "none",
        }}
      />

    </div>
  );
}