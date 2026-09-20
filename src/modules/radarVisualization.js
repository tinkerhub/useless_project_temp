/**
 * RumorRadar - Canvas Radar HUD Visualization
 * Renders an animated radar sweep with glowing concentric grid rings,
 * active rumor blips, target lock-on reticles, hover inspection tooltips,
 * and multi-mode threat visualization.
 */

export class RadarHUD {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.blips = [];
    this.sweepAngle = 0;
    this.animId = null;
    this.width = 300;
    this.height = 300;
    this.centerX = 150;
    this.centerY = 150;
    this.radius = 130;
    this.mode = 'sweep'; // 'sweep' | 'orbital' | 'threat'
    this.hoveredBlip = null;
    this.selectedBlip = null;
    this.onBlipClick = options.onBlipClick || null;

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleClick = this.handleClick.bind(this);

    this.resize();
    window.addEventListener('resize', this.resize);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.addEventListener('click', this.handleClick);
    this.start();
  }

  setMode(mode) {
    if (['sweep', 'orbital', 'threat'].includes(mode)) {
      this.mode = mode;
    }
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 300;
    this.height = rect.height || 300;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.radius = Math.min(this.width, this.height) / 2 - 16;
  }

  start() {
    if (!this.animId) {
      this.animate();
    }
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found = null;
    for (let i = this.blips.length - 1; i >= 0; i--) {
      const blip = this.blips[i];
      const dx = mouseX - blip.x;
      const dy = mouseY - blip.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 14) {
        found = blip;
        break;
      }
    }

    if (found !== this.hoveredBlip) {
      this.hoveredBlip = found;
      this.canvas.style.cursor = found ? 'pointer' : 'default';
    }
  }

  handleMouseLeave() {
    this.hoveredBlip = null;
    this.canvas.style.cursor = 'default';
  }

  handleClick(e) {
    if (this.hoveredBlip) {
      this.selectedBlip = this.hoveredBlip;
      if (this.onBlipClick) {
        this.onBlipClick(this.hoveredBlip);
      }
    }
  }

  addBlip(item) {
    const normalizedScore = Math.max(0.12, (item.gossipScore || 20) / 100);
    const dist = normalizedScore * (this.radius - 16);
    const angle = Math.random() * Math.PI * 2;

    let color = '#10b981'; // green
    let level = 'Clean';
    if (item.gossipScore >= 80) {
      color = '#ef4444';
      level = 'Critical';
    } else if (item.gossipScore >= 55) {
      color = '#f97316';
      level = 'High';
    } else if (item.gossipScore >= 30) {
      color = '#f59e0b';
      level = 'Medium';
    }

    const blip = {
      id: Date.now() + Math.random(),
      x: this.centerX + Math.cos(angle) * dist,
      y: this.centerY + Math.sin(angle) * dist,
      angle: angle,
      dist: dist,
      score: item.gossipScore || 0,
      target: item.target || 'Unverified Whisper',
      level: level,
      messageText: item.messageText || '',
      color: color,
      alpha: 1.0,
      radius: item.gossipScore >= 75 ? 6 : 4.5,
      rippleRadius: 1,
      createdAt: Date.now()
    };

    this.blips.push(blip);
    if (this.blips.length > 16) {
      this.blips.shift();
    }
  }

  clearBlips() {
    this.blips = [];
    this.hoveredBlip = null;
    this.selectedBlip = null;
  }

  animate() {
    this.sweepAngle = (this.sweepAngle + 0.035) % (Math.PI * 2);
    this.render();
    this.animId = requestAnimationFrame(this.animate);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Radar Glass Background
    const bgGrad = ctx.createRadialGradient(this.centerX, this.centerY, 10, this.centerX, this.centerY, this.radius);
    bgGrad.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
    bgGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.45)');
    bgGrad.addColorStop(1, 'rgba(6, 182, 212, 0.12)');

    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // 2. Range Rings with Zone Labels
    const rings = [
      { factor: 0.3, label: '30% MILD', color: 'rgba(16, 185, 129, 0.25)' },
      { factor: 0.55, label: '55% SPECULATION', color: 'rgba(245, 158, 11, 0.25)' },
      { factor: 0.8, label: '80% HOT TEA', color: 'rgba(249, 115, 22, 0.25)' },
      { factor: 1.0, label: '100% NUCLEAR', color: 'rgba(239, 68, 68, 0.3)' }
    ];

    rings.forEach((ring) => {
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.radius * ring.factor, 0, Math.PI * 2);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Threat ring text mark
      ctx.font = '7px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.fillText(ring.label, this.centerX + 4, this.centerY - this.radius * ring.factor + 8);
    });

    // 3. Polar Grid Radial Lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.setLineDash([3, 4]);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(this.centerX - Math.cos(a) * this.radius, this.centerY - Math.sin(a) * this.radius);
      ctx.lineTo(this.centerX + Math.cos(a) * this.radius, this.centerY + Math.sin(a) * this.radius);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 4. Mode-Dependent Sweep Beam
    if (this.mode === 'sweep') {
      ctx.save();
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(this.sweepAngle);

      const sweepGrad = ctx.createLinearGradient(0, 0, this.radius, 0);
      sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
      sweepGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.15)');
      sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0.85)');

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, this.radius, 0, 0.45);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // Crisp leading beam line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(this.radius, 0);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.95)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.restore();
    } else if (this.mode === 'threat') {
      // Threat Pulse Wave
      const pulseTime = (Date.now() / 600) % Math.PI;
      const pulseR = Math.sin(pulseTime) * this.radius;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 5. Active Rumor Blips
    for (let i = this.blips.length - 1; i >= 0; i--) {
      const blip = this.blips[i];
      const isHovered = this.hoveredBlip === blip;
      const isSelected = this.selectedBlip === blip;

      // Expand spawn ripple
      if (blip.rippleRadius < 26) {
        blip.rippleRadius += 0.6;
        ctx.beginPath();
        ctx.arc(blip.x, blip.y, blip.rippleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = blip.color;
        ctx.globalAlpha = Math.max(0, 1 - blip.rippleRadius / 26);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // Draw blip core
      ctx.beginPath();
      ctx.arc(blip.x, blip.y, isHovered ? blip.radius + 2 : blip.radius, 0, Math.PI * 2);
      ctx.fillStyle = blip.color;
      ctx.shadowColor = blip.color;
      ctx.shadowBlur = isHovered ? 16 : 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Hover / Selection Reticle
      if (isHovered || isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(blip.x - 10, blip.y - 10, 20, 20);

        // Corner tick marks
        ctx.beginPath();
        ctx.arc(blip.x, blip.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = blip.color;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Blip Label
      ctx.font = isHovered ? 'bold 10px "JetBrains Mono", monospace' : '9px "JetBrains Mono", monospace';
      ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(241, 245, 249, 0.85)';
      ctx.fillText(`${blip.target} (${blip.score}%)`, blip.x + 9, blip.y + 3);
    }

    // 6. Blip Tooltip Inspector on Canvas if hovered
    if (this.hoveredBlip) {
      this.renderBlipTooltip(this.hoveredBlip);
    }

    // 7. Outer Boundary Ring Glow
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  renderBlipTooltip(blip) {
    const ctx = this.ctx;
    const pad = 8;
    const title = `TARGET: ${blip.target}`;
    const score = `GOSSIP INDEX: ${blip.score}% [${blip.level.toUpperCase()}]`;

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    const titleWidth = ctx.measureText(title).width;
    const scoreWidth = ctx.measureText(score).width;
    const boxW = Math.max(titleWidth, scoreWidth) + pad * 2;
    const boxH = 34;

    let bx = blip.x - boxW / 2;
    let by = blip.y - 42;

    // Bounds check within canvas
    if (bx < 6) bx = 6;
    if (bx + boxW > this.width - 6) bx = this.width - boxW - 6;
    if (by < 6) by = blip.y + 16;

    // Tooltip backdrop
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = blip.color;
    ctx.lineWidth = 1;
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeRect(bx, by, boxW, boxH);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, bx + pad, by + 13);
    ctx.fillStyle = blip.color;
    ctx.fillText(score, bx + pad, by + 26);
  }
}
