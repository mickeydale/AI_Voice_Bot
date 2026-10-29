/**
 * visualizer.js — Interactive 2D Canvas Audio Orb
 * Renders a reactive glowing orb with state-driven particle waves:
 * IDLE, LISTENING, THINKING, SPEAKING.
 */

import { speechManager } from './speech.js';
import { audioManager } from './audio.js';

export class OrbVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.state = 'idle'; // 'idle' | 'listening' | 'thinking' | 'speaking'
    this.animationId = null;
    this.angle = 0;
    this.particles = [];
    this.numParticles = 40;

    this.setupCanvas();
    this.initParticles();
    this.startLoop();

    window.addEventListener('resize', () => this.setupCanvas());
  }

  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = (rect.width || 280) * dpr;
    this.canvas.height = (rect.height || 280) * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width || 280;
    this.height = rect.height || 280;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        orbitRadius: 40 + Math.random() * 65,
        speed: (0.01 + Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1),
        currentAngle: Math.random() * Math.PI * 2,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.6
      });
    }
  }

  setState(newState) {
    this.state = newState;
  }

  startLoop() {
    const render = () => {
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    this.animationId = requestAnimationFrame(render);
  }

  draw() {
    const { ctx, width, height, centerX, centerY } = this;
    ctx.clearRect(0, 0, width, height);

    this.angle += 0.03;

    // Pick visual color themes based on current state
    let primaryColor, secondaryColor, coreRadius;

    if (this.state === 'listening') {
      const vol = speechManager.getMicVolume();
      primaryColor = '16, 185, 129'; // emerald
      secondaryColor = '6, 182, 212'; // cyan
      coreRadius = 55 + vol * 35;
      this.drawDynamicWaveRings(coreRadius, primaryColor, 4, vol);
    } else if (this.state === 'speaking') {
      const vol = audioManager.getSpeakingVolume();
      primaryColor = '99, 102, 241'; // indigo
      secondaryColor = '168, 85, 247'; // purple
      coreRadius = 52 + vol * 28;
      this.drawDynamicWaveRings(coreRadius, primaryColor, 5, vol);
    } else if (this.state === 'thinking') {
      primaryColor = '245, 158, 11'; // amber
      secondaryColor = '99, 102, 241'; // indigo
      coreRadius = 48 + Math.sin(this.angle * 2) * 5;
      this.drawThinkingRays(coreRadius, primaryColor);
    } else {
      // Idle
      primaryColor = '6, 182, 212'; // cyan
      secondaryColor = '99, 102, 241'; // indigo
      coreRadius = 48 + Math.sin(this.angle) * 3;
      this.drawIdleBreathingRings(coreRadius, primaryColor);
    }

    // Draw Central Glowing Sphere
    const gradient = ctx.createRadialGradient(
      centerX - coreRadius * 0.2,
      centerY - coreRadius * 0.2,
      coreRadius * 0.1,
      centerX,
      centerY,
      coreRadius
    );
    gradient.addColorStop(0, `rgba(${secondaryColor}, 0.95)`);
    gradient.addColorStop(0.6, `rgba(${primaryColor}, 0.7)`);
    gradient.addColorStop(1, `rgba(${primaryColor}, 0.05)`);

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.shadowColor = `rgba(${primaryColor}, 0.6)`;
    ctx.shadowBlur = 25;
    ctx.fill();
    ctx.restore();

    // Draw Orbiting Constellation Particles
    this.drawParticles(primaryColor, secondaryColor);
  }

  drawIdleBreathingRings(radius, color) {
    const { ctx, centerX, centerY } = this;
    const ringRadii = [radius * 1.3, radius * 1.6];
    
    ctx.save();
    ringRadii.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r + Math.sin(this.angle + idx) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color}, ${0.15 - idx * 0.05})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    ctx.restore();
  }

  drawDynamicWaveRings(radius, color, count, intensity) {
    const { ctx, centerX, centerY } = this;
    ctx.save();
    for (let i = 1; i <= count; i++) {
      const ringRadius = radius + i * 14 * (1 + intensity * 0.8);
      ctx.beginPath();
      
      // Perturb ring points with wave amplitude
      const segments = 32;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        const wave = Math.sin(theta * 6 + this.angle * 2) * (3 + intensity * 8);
        const curR = ringRadius + wave;
        const px = centerX + Math.cos(theta) * curR;
        const py = centerY + Math.sin(theta) * curR;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(${color}, ${(0.4 - i * 0.07) * (0.6 + intensity * 0.4)})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = `rgba(${color}, 0.5)`;
      ctx.shadowBlur = 10;
      ctx.stroke();
    }
    ctx.restore();
  }

  drawThinkingRays(radius, color) {
    const { ctx, centerX, centerY } = this;
    ctx.save();
    const count = 12;
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2 + this.angle * 1.5;
      const x1 = centerX + Math.cos(theta) * (radius * 1.15);
      const y1 = centerY + Math.sin(theta) * (radius * 1.15);
      const x2 = centerX + Math.cos(theta) * (radius * 1.45);
      const y2 = centerY + Math.sin(theta) * (radius * 1.45);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(${color}, ${0.3 + Math.sin(theta + this.angle) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  drawParticles(primary, secondary) {
    const { ctx, centerX, centerY } = this;
    ctx.save();

    this.particles.forEach((p, idx) => {
      p.currentAngle += p.speed;
      const x = centerX + Math.cos(p.currentAngle) * p.orbitRadius;
      const y = centerY + Math.sin(p.currentAngle) * p.orbitRadius;

      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      const particleColor = idx % 2 === 0 ? primary : secondary;
      ctx.fillStyle = `rgba(${particleColor}, ${p.alpha})`;
      ctx.fill();
    });

    ctx.restore();
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
