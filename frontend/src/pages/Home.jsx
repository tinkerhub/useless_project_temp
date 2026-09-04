import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">🦷 ToothCheck</h1>
      <p className="text-gray-500">
        Estimate your tooth shade using your camera.
      </p>
      <button
        onClick={() => navigate("/scan")}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg"
      >
        Start Scan
      </button>
    </div>
  );
}