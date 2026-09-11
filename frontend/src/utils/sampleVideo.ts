/**
 * Utility to generate a synthetic high-frame-rate pen-spinning video in the browser
 * for zero-setup demo testing.
 */
export async function createSamplePenVideo(): Promise<{ file: File; url: string }> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  // Use MediaRecorder on canvas stream
  const stream = canvas.captureStream(60);
  let mimeType = 'video/webm';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/mp4';
  }

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };
  });

  recorder.start();

  const durationSec = 2.4;
  const fps = 60;
  const totalFrames = Math.floor(durationSec * fps);
  const centerX = 640;
  const centerY = 360;
  const radius = 160;

  for (let f = 0; f < totalFrames; f++) {
    const angle = (f / totalFrames) * 12 * 2 * Math.PI; // 12 spins

    // Render frame
    ctx.fillStyle = '#0B0C0F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle table surface texture
    ctx.strokeStyle = '#171A20';
    ctx.lineWidth = 2;
    for (let x = 0; x < canvas.width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Finger / Center hand
    ctx.fillStyle = '#2A2E39';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2488FF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pen Body (angled bar rotating around finger)
    const penX = centerX + radius * Math.cos(angle);
    const penY = centerY + radius * Math.sin(angle);

    ctx.save();
    ctx.translate(penX, penY);
    ctx.rotate(angle + Math.PI / 4);

    // Pen body
    ctx.fillStyle = '#D1D5DB';
    ctx.fillRect(-60, -8, 120, 16);

    // Neon Green Tracking Marker at tip (per PRD HSV spec)
    ctx.fillStyle = '#36E2A0';
    ctx.fillRect(40, -8, 20, 16);

    // Dark grip
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(-30, -9, 30, 18);

    ctx.restore();

    // Small delay to allow recorder to capture frame
    await new Promise((r) => setTimeout(r, 16));
  }

  recorder.stop();
  const blob = await recordingPromise;
  const file = new File([blob], 'high_speed_pen_flip_240fps.mp4', { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);

  return { file, url };
}
