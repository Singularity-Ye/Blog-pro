import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * MouseSandstormTrail - A premium "Stellar Sandstorm Vortex & Ripples" mouse follow effect.
 * Tailored exclusively for the Atlas page ("星沙浑天图谱"):
 * - Renders inside a React Portal (attached to document.body) to prevent layout/transform offsets.
 * - Spawns fluid wind ribbons that follow the mouse.
 * - Spawns tiny golden stardust grains that orbit the wind paths in a swirling vortex.
 * - Spawns dashed concentric wind ripples on rapid cursor movements.
 */
export default function MouseSandstormTrail({
  colors = [
    { r: 216, g: 162, b: 71 },  // #d8a247 (Stellar Sand Gold / 浑天星砂金)
    { r: 231, g: 199, b: 126 }, // #e7c77e (Celestial Gold / 帝星浅金)
    { r: 255, g: 247, b: 223 }, // #fff7df (Celestial White / 太白星银)
    { r: 167, g: 139, b: 250 }  // #a78bfa (Void Purple / 虚空天机紫)
  ],
  spawnDistance = 8,
  baseSize = 12,
  zIndex = 1
}) {
  const canvasRef = useRef(null);
  const historyRef = useRef([]); // Mouse history for wind ribbons
  const particlesRef = useRef([]); // Orbiting sand grains
  const ripplesRef = useRef([]); // Wind shockwave ripples
  const lastMousePosRef = useRef({ x: 0, y: 0 });

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
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = x - lastMousePosRef.current.x;
      const dy = y - lastMousePosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Record mouse history for wind ribbons (max 15 points)
      historyRef.current.push({ x, y, time: Date.now() });
      if (historyRef.current.length > 15) {
        historyRef.current.shift();
      }

      if (dist > spawnDistance) {
        // 1. Spawn wind shockwave ripples on rapid movements
        if (dist > 14 && ripplesRef.current.length < 3) {
          const selectedColor = colors[Math.floor(Math.random() * colors.length)];
          ripplesRef.current.push({
            x,
            y,
            r: 4,
            maxR: Math.random() * 25 + 50, // expands to 50-75px
            colorRgb: selectedColor,
            life: 1.0,
            decay: 0.05 + Math.random() * 0.02 // Fades in ~15 frames
          });
        }

        // 2. Spawn swirling sand particles
        const count = Math.floor(Math.random() * 3) + 2; // 2 to 4 sand grains
        for (let i = 0; i < count; i++) {
          const selectedColor = colors[Math.floor(Math.random() * colors.length)];
          particlesRef.current.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 1.8,
            vy: (Math.random() - 0.5) * 1.8 - 0.4, // Slight upward wind drift
            r: Math.random() * 1.6 + 0.8, // Small sand grains (0.8px to 2.4px)
            colorRgb: selectedColor,
            angle: Math.random() * Math.PI * 2,
            spinSpeed: (Math.random() - 0.5) * 0.18 + 0.08 * (Math.random() < 0.5 ? 1 : -1),
            life: 1.0,
            decay: 0.965 - Math.random() * 0.015 // Slower fade for sand grains
          });
        }

        lastMousePosRef.current = { x, y };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Use screen blending for glowing stardust wind
      ctx.globalCompositeOperation = 'screen';

      // Clean up old wind history coordinates (older than 300ms)
      const now = Date.now();
      historyRef.current = historyRef.current.filter((pt) => now - pt.time < 300);

      // 1. Draw flowing wind ribbons (气流线)
      if (historyRef.current.length > 1) {
        // Draw 3 offset ribbons to represent multi-layered wind gusts
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          const timeOffset = k * Math.PI * 0.6;
          
          for (let i = 0; i < historyRef.current.length; i++) {
            const pt = historyRef.current[i];
            const age = (now - pt.time) / 300; // 0.0 to 1.0
            const wave = Math.sin(pt.y * 0.018 - now * 0.006 + timeOffset) * 10 * (1 - age);
            const wx = pt.x + wave;
            const wy = pt.y;

            if (i === 0) {
              ctx.moveTo(wx, wy);
            } else {
              ctx.lineTo(wx, wy);
            }
          }
          ctx.strokeStyle = `rgba(216, 162, 71, ${0.14 * (1.0 - k * 0.28) * (historyRef.current.length / 15)})`;
          ctx.lineWidth = 1.8 - k * 0.45;
          ctx.stroke();
        }
      }

      // 2. Update and draw wind shockwave ripples (同心风压涟漪)
      const activeRipples = [];
      for (let i = 0; i < ripplesRef.current.length; i++) {
        const r = ripplesRef.current[i];
        r.r += (r.maxR - r.r) * 0.14; // expand
        r.life -= r.decay; // fade

        if (r.life > 0.05) {
          activeRipples.push(r);

          ctx.strokeStyle = `rgba(${r.colorRgb.r}, ${r.colorRgb.g}, ${r.colorRgb.b}, ${r.life * 0.48})`;
          ctx.lineWidth = 1.2 * r.life;
          ctx.setLineDash([4, 6]); // Dashed wind-ripple structure
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]); // Reset line dash
        }
      }
      ripplesRef.current = activeRipples;

      // 3. Update and draw swirling sand grains (龙卷星砂)
      const activeParticles = [];
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];

        // Orbit spiral mathematics (tornado swirl)
        p.vx += Math.cos(p.angle) * 0.09;
        p.vy += Math.sin(p.angle) * 0.09;
        p.vy -= 0.012; // Gentle rising air column draft
        
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94; // Inertia damping
        p.vy *= 0.94;

        p.angle += p.spinSpeed;
        p.life *= p.decay;

        if (p.life > 0.05) {
          activeParticles.push(p);

          ctx.save();
          ctx.translate(p.x, p.y);

          const currentSize = p.r * p.life;
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, currentSize * 2.0);
          grad.addColorStop(0, `rgba(255, 255, 255, ${p.life})`);
          grad.addColorStop(0.35, `rgba(${p.colorRgb.r}, ${p.colorRgb.g}, ${p.colorRgb.b}, ${p.life * 0.85})`);
          grad.addColorStop(1.0, `rgba(${p.colorRgb.r}, ${p.colorRgb.g}, ${p.colorRgb.b}, 0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, currentSize * 2.0, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
      particlesRef.current = activeParticles;

      ctx.globalCompositeOperation = 'source-over';
      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [colors, spawnDistance, baseSize]);

  // Render outside parent CSS transforms directly under document.body
  return createPortal(
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
    />,
    document.body
  );
}
