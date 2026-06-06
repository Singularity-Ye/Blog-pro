import React, { useEffect, useRef } from 'react';

/**
 * AmbientDust - A clean and restrained floating particle background.
 * Adapts from the node drift logic of particle-desktop, but without any connection lines
 * to prevent confusion with graph relationships.
 * 
 * Props:
 * - particleCount: Number of background floating dust particles (default: 50).
 * - color: RGB object for the dust (default: soft gold #e7c77e).
 * - baseSpeed: Speed coefficient for dust drifting (default: 0.3).
 * - maxRadius: Maximum size of particles (default: 2.5).
 */
export default function AmbientDust({
  particleCount = 50,
  color = { r: 231, g: 199, b: 126 },
  baseSpeed = 0.25,
  maxRadius = 2.5,
  zIndex = 1
}) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = null;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      initializeParticles();
    };

    class DustParticle {
      constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.vx = (Math.random() - 0.5) * baseSpeed;
        this.vy = (Math.random() - 0.5) * baseSpeed;
        this.size = Math.random() * (maxRadius - 0.8) + 0.8;
        this.alpha = Math.random() * 0.4 + 0.1; // Restrained opacity
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
        this.pulseAngle = Math.random() * Math.PI;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce borders smoothly
        if (this.x < 0) { this.x = 0; this.vx *= -1; }
        if (this.x > window.innerWidth) { this.x = window.innerWidth; this.vx *= -1; }
        if (this.y < 0) { this.y = 0; this.vy *= -1; }
        if (this.y > window.innerHeight) { this.y = window.innerHeight; this.vy *= -1; }

        // Slow breathing / twinkling alpha
        this.pulseAngle += this.pulseSpeed;
      }

      draw() {
        const currentAlpha = this.alpha * (0.6 + 0.4 * Math.sin(this.pulseAngle));
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${currentAlpha})`;
        ctx.fill();
      }
    }

    const initializeParticles = () => {
      const list = [];
      for (let i = 0; i < particleCount; i++) {
        list.push(new DustParticle());
      }
      particlesRef.current = list;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const list = particlesRef.current;
      list.forEach(p => {
        p.update();
        p.draw();
      });

      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [particleCount, color, baseSpeed, maxRadius]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: zIndex,
        display: 'block'
      }}
    />
  );
}
