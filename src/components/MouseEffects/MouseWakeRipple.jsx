import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * MouseWakeRipple - A premium "Kelvin Wake Vector Waves" follow effect.
 * Tailored for pages with interactive components (like Atlas relation graphs):
 * - Simulates physical water surface ripples (Doppler wave trains + riding star-sand).
 * - Spawns expanding wave-front arcs that travel in the direction of the cursor swipe.
 * - Leaves the screen completely clean when the mouse is still.
 * - Renders inside a React Portal attached to document.body to prevent layout offsets.
 */
// Theme colors definition
const COLORS_MAP = {
  dark: [
    { r: 216, g: 162, b: 71 },  // Stellar Sand Gold
    { r: 231, g: 199, b: 126 }, // Celestial Gold
    { r: 255, g: 247, b: 223 }, // 太白星银
    { r: 167, g: 139, b: 250 }  // Void Purple
  ],
  light: [
    { r: 153, g: 99, b: 22 },   // Warm Amber Brown
    { r: 196, g: 147, b: 59 },  // Sandy Gold
    { r: 120, g: 77, b: 15 },   // Dark Gold
    { r: 99, g: 72, b: 28 }     // Bark Brown
  ]
};

export default function MouseWakeRipple({
  theme = 'dark',
  spawnDistance = 8, // Minimum mouse movement to trigger a wave
  zIndex = 1
}) {
  const [isMobile, setIsMobile] = useState(false);
  const canvasRef = useRef(null);
  const wavesRef = useRef([]); // Active wave packets
  const particlesRef = useRef([]); // Riding stardust grains
  const lastMouseRef = useRef({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 || 
        ('ontouchstart' in window) || 
        (navigator.maxTouchPoints > 0)
      );
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;
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
      const mx = e.clientX;
      const my = e.clientY;
      const now = Date.now();

      const dx = mx - lastMouseRef.current.x;
      const dy = my - lastMouseRef.current.y;
      const dt = Math.max(1, now - lastMouseRef.current.time);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = dist / dt;

      // Only spawn ripples when drag distance exceeds threshold
      if (dist > spawnDistance && dt < 120) {
        const theta = Math.atan2(dy, dx);
        const activeColors = COLORS_MAP[theme] || COLORS_MAP.dark;
        const selectedColor = activeColors[Math.floor(Math.random() * activeColors.length)];

        // 1. Spawn a wave packet (wave train) propagating forward
        wavesRef.current.push({
          x: mx,
          y: my,
          vx: dx * 0.18, // Move center along mouse direction but slower
          vy: dy * 0.18,
          r: 4,          // Initial radius
          vr: 2.2 + speed * 0.6, // Higher base expansion, lower speed sensitivity
          theta,
          speed,
          colorRgb: selectedColor,
          life: 1.0,
          decay: 0.016 + Math.random() * 0.004 // Fades in ~55-60 frames (lasts ~1s)
        });

        // 2. Spawn star-sand particles riding the wave front
        // Pushes particles along the movement angle with angular dispersion
        const count = Math.floor(Math.random() * 3) + 4; // 4 to 6 particles per swipe
        for (let i = 0; i < count; i++) {
          const pAngle = theta + (Math.random() - 0.5) * 1.1; // +/- ~30 degrees arc
          const pSpeed = (2.2 + speed * 0.8) * (0.8 + Math.random() * 0.4);
          const pColor = activeColors[Math.floor(Math.random() * activeColors.length)];

          particlesRef.current.push({
            x: mx,
            y: my,
            vx: Math.cos(pAngle) * pSpeed + dx * 0.12,
            vy: Math.sin(pAngle) * pSpeed + dy * 0.12,
            r: 0.8 + Math.random() * 1.5, // small star-sand grains (0.8px to 2.3px)
            colorRgb: pColor,
            life: 1.0,
            decay: 0.975 - Math.random() * 0.015 // slower decay so they drift longer
          });
        }
      }

      lastMouseRef.current = { x: mx, y: my, time: now };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Seed initial position on enter
    const handleMouseEnter = (e) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    };
    window.addEventListener('mouseenter', handleMouseEnter);

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Blending mode for glowing celestial effects
      const isLight = theme === 'light';
      ctx.globalCompositeOperation = isLight ? 'source-over' : 'screen';

      // 1. Update and draw directional wave packets (涟漪波列)
      const activeWaves = [];
      for (let i = 0; i < wavesRef.current.length; i++) {
        const w = wavesRef.current[i];

        // Wave propagation physics
        w.r += w.vr;
        w.x += w.vx;
        w.y += w.vy;
        w.vx *= 0.92; // Damping center motion
        w.vy *= 0.92;
        w.vr *= 0.96; // Slow down wave expansion rate
        w.life -= w.decay;

        if (w.life > 0.05) {
          activeWaves.push(w);

          // Draw 3 concentric wave crests representing a wave train (Doppler group)
          const crests = [0, 14, 28];
          for (let j = 0; j < crests.length; j++) {
            const radius = w.r - crests[j];
            if (radius <= 3) continue;

            const crestAmp = 1.0 - j * 0.32; // Outer crest is strongest
            const opacity = w.life * 0.52 * crestAmp;
            
            // Angular dispersion: wave arc widens as it travels
            const arcWidth = Math.min(2.0, 0.9 + (w.r / 120) * 0.9);

            ctx.strokeStyle = `rgba(${w.colorRgb.r}, ${w.colorRgb.g}, ${w.colorRgb.b}, ${opacity})`;
            ctx.lineWidth = (2.2 - j * 0.5) * w.life; // Thicker lines for visibility

            ctx.beginPath();
            // Draw arc in the direction of velocity (theta)
            ctx.arc(w.x, w.y, radius, w.theta - arcWidth, w.theta + arcWidth);
            ctx.stroke();

            // Optional: draw a matching faint secondary trailing wake arc (sides)
            if (j === 0) {
              ctx.strokeStyle = `rgba(${w.colorRgb.r}, ${w.colorRgb.g}, ${w.colorRgb.b}, ${opacity * 0.45})`;
              ctx.lineWidth = 0.8 * w.life;
              ctx.beginPath();
              // Side waves (left and right wake)
              ctx.arc(w.x, w.y, radius * 0.85, w.theta + Math.PI * 0.5 - 0.4, w.theta + Math.PI * 0.5 + 0.4);
              ctx.arc(w.x, w.y, radius * 0.85, w.theta - Math.PI * 0.5 - 0.4, w.theta - Math.PI * 0.5 - 0.4);
              ctx.stroke();
            }
          }
        }
      }
      wavesRef.current = activeWaves;

      // 2. Update and draw riding star-sand particles (乘风星砂)
      const activeParticles = [];
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];

        // Motion integration
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.975; // Slower damping to slide longer
        p.vy *= 0.975;
        p.vy -= 0.015; // Tiny rising draft (hot sand column)
        p.life *= p.decay;

        if (p.life > 0.05) {
          activeParticles.push(p);

          ctx.save();
          ctx.translate(p.x, p.y);

          // Radial glow gradient for each star-sand grain
          const size = p.r * p.life;
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2.2);
          grad.addColorStop(0, `rgba(255, 255, 255, ${p.life})`);
          grad.addColorStop(0.35, `rgba(${p.colorRgb.r}, ${p.colorRgb.g}, ${p.colorRgb.b}, ${p.life * 0.82})`);
          grad.addColorStop(1.0, `rgba(${p.colorRgb.r}, ${p.colorRgb.g}, ${p.colorRgb.b}, 0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, size * 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Sparkle star-cross flares for high speed sand
          if (p.r > 1.8 && p.life > 0.6) {
            ctx.strokeStyle = `rgba(${p.colorRgb.r}, ${p.colorRgb.g}, ${p.colorRgb.b}, ${p.life * 0.35})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(-size * 3, 0); ctx.lineTo(size * 3, 0);
            ctx.moveTo(0, -size * 3); ctx.lineTo(0, size * 3);
            ctx.stroke();
          }

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
      window.removeEventListener('mouseenter', handleMouseEnter);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [spawnDistance, theme, isMobile]);

  if (isMobile) return null;

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
