import 'dotenv/config';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.json({
    status: 'alive',
    nvidia: !!process.env.NVIDIA_API_KEY,
    nvidia_stream: !!process.env.NVIDIA_STREAM_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
  });
}
