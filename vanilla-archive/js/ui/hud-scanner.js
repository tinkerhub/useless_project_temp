/**
 * Useless 3.0 - Hero HUD Scanner Centerpiece
 * Renders an animated cybernetic facial mesh scanner on canvas.
 * Designed after the luxury editorial hero visual described in reference.md.
 */
export class HudScanner {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.animId = null;
    this.time = 0;
    this.state = 'IDLE'; // IDLE, TALKING, SILENT, NO_FACE
    this.mouthOpen = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
  }

  setState(state) {
    this.state = state;
  }

  start() {
    const render = () => {
      this.draw();
      this.time += 0.02;
      this.animId = requestAnimationFrame(render);
    };
    render();
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  draw() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (!w || !h) return;

    this.ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.48;
    const scale = Math.min(w, h) * 0.38;

    // 1. Concentric Cybernetic Radar Rings
    this.ctx.strokeStyle = 'rgba(216, 137, 134, 0.12)';
    this.ctx.lineWidth = 1;
    for (let r = 0.5; r <= 1.2; r += 0.25) {
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, scale * r, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Rotating radar sweep line
    const sweepAngle = this.time * 0.8;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy);
    this.ctx.lineTo(cx + Math.cos(sweepAngle) * scale * 1.1, cy + Math.sin(sweepAngle) * scale * 1.1);
    this.ctx.strokeStyle = 'rgba(216, 137, 134, 0.25)';
    this.ctx.stroke();

    // 2. Head & Facial Wireframe Mesh
    const points = this.getFaceMeshPoints(cx, cy, scale);

    // Render wireframe lines
    this.ctx.strokeStyle = this.state === 'TALKING' 
      ? 'rgba(216, 137, 134, 0.45)' 
      : 'rgba(255, 255, 255, 0.14)';
    this.ctx.lineWidth = 1;

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dist = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
        if (dist < scale * 0.36) {
          this.ctx.beginPath();
          this.ctx.moveTo(points[i].x, points[i].y);
          this.ctx.lineTo(points[j].x, points[j].y);
          this.ctx.stroke();
        }
      }
    }

    // Render node points
    for (let pt of points) {
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.isMouth ? 3.5 : 2, 0, Math.PI * 2);
      this.ctx.fillStyle = pt.isMouth 
        ? (this.state === 'TALKING' ? '#d88986' : '#64d2ff') 
        : 'rgba(255, 255, 255, 0.6)';
      this.ctx.fill();
    }

    // 3. Scanline Animation
    const scanY = cy + Math.sin(this.time * 1.5) * scale * 0.9;
    this.ctx.strokeStyle = 'rgba(216, 137, 134, 0.4)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - scale * 0.9, scanY);
    this.ctx.lineTo(cx + scale * 0.9, scanY);
    this.ctx.stroke();

    // 4. Subtle Audio Waveform at bottom
    this.drawWaveform(cx, h * 0.88, scale * 1.4);
  }

  getFaceMeshPoints(cx, cy, scale) {
    const pts = [];
    const t = this.time;
    const isTalking = this.state === 'TALKING';

    // Talking mouth movement animation
    this.mouthOpen = isTalking 
      ? (0.04 + Math.sin(t * 8) * 0.035 + Math.cos(t * 12) * 0.02)
      : 0.01;

    // Jaw contour
    const jawAngles = [-1.3, -1.0, -0.6, -0.2, 0.2, 0.6, 1.0, 1.3];
    for (let angle of jawAngles) {
      pts.push({
        x: cx + Math.sin(angle) * scale * 0.65,
        y: cy + Math.cos(angle) * scale * 0.8
      });
    }

    // Eyes & Forehead
    pts.push({ x: cx - scale * 0.28, y: cy - scale * 0.2 }); // Left Eye
    pts.push({ x: cx + scale * 0.28, y: cy - scale * 0.2 }); // Right Eye
    pts.push({ x: cx - scale * 0.45, y: cy - scale * 0.35 });
    pts.push({ x: cx + scale * 0.45, y: cy - scale * 0.35 });
    pts.push({ x: cx, y: cy - scale * 0.65 }); // Crown
    pts.push({ x: cx, y: cy }); // Nose center

    // Mouth Landmarks
    pts.push({ x: cx - scale * 0.18, y: cy + scale * 0.36, isMouth: true }); // Left Corner
    pts.push({ x: cx + scale * 0.18, y: cy + scale * 0.36, isMouth: true }); // Right Corner
    pts.push({ x: cx, y: cy + scale * (0.36 - this.mouthOpen), isMouth: true }); // Top Lip
    pts.push({ x: cx, y: cy + scale * (0.36 + this.mouthOpen * 1.5), isMouth: true }); // Bottom Lip

    return pts;
  }

  drawWaveform(cx, baseY, width) {
    this.ctx.beginPath();
    const halfW = width / 2;
    const isTalking = this.state === 'TALKING';

    for (let x = -halfW; x <= halfW; x += 6) {
      const norm = x / halfW;
      const amp = isTalking ? (1 - Math.abs(norm)) * 14 : 2;
      const wave = Math.sin(norm * 12 + this.time * 6) * amp;
      if (x === -halfW) {
        this.ctx.moveTo(cx + x, baseY + wave);
      } else {
        this.ctx.lineTo(cx + x, baseY + wave);
      }
    }

    this.ctx.strokeStyle = isTalking ? 'rgba(216, 137, 134, 0.7)' : 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }
}
