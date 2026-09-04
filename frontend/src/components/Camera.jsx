import { useEffect, useRef } from "react";

export default function Camera({ onFrame }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        alert("Could not access camera. Please allow camera permissions.");
      }
    }
    startCamera();

    // cleanup: stop camera when component unmounts
    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Captures the current video frame as a base64 JPEG
  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8); // base64 string
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="rounded-xl w-full max-w-md"
      />
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={() => onFrame(captureFrame())}
        className="px-6 py-3 bg-green-600 text-white rounded-lg"
      >
        Capture
      </button>
    </div>
  );
}