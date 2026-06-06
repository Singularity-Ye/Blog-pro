import React, { useEffect, useRef } from 'react';

/**
 * MouseVortexTrail - A highly optimized, custom 2D canvas mouse follow effect.
 * Spawns swirling vortex-like spiritual sparks that float upward and fade.
 * 
 * Props:
 * - colors: Array of RGB color objects { r, g, b } to use for the particles.
 * - spawnDistance: Distance in pixels the mouse must travel to spawn a new particle.
 * - baseSize: Maximum radius of the vortex particles.
 * - decaySpeed: Exponential decay rate of the particle's life (higher = shorter life).
 */
export default function MouseVortexTrail({
  colors = [
    { r: 231, g: 199, b: 126 }, // #e7c77e (金丹色)
    { r: 167, g: 139, b: 250 }, // #a78bfa (真灵紫)
    { r: 90, g: 163, b: 143 },  // #5aa38f (药圃绿)
    { r: 99, g: 102, b: 241 }   // #6366f1 (星空蓝)
  ],
  spawnDistance = 15,
  baseSize = 16,
  decaySpeed = 0.95
}) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = null;

    // Adjust canvas size for high DPI displays (Retina)
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

      // Only spawn a particle when the mouse moves past the threshold to prevent clutter
      if (dist > spawnDistance) {
        const selectedColor = colors[Math.floor(Math.random() * colors.length)];
        const particle = {
          x,
          y,
          vx: (Math.random() - 0.5) * 0.9,
          vy: (Math.random() - 0.5) * 0.9,
          size: Math.random() * (baseSize * 0.5) + (baseSize * 0.75), // Random size around baseSize
          r: selectedColor.r,
          g: selectedColor.g,
          b: selectedColor.b,
          angle: Math.random() * Math.PI * 2,
          vAngle: (Math.random() - 0.5) * 0.09, // Swirl spin speed
          life: 1.0,
          decay: decaySpeed - Math.random() * 0.015
        };
        particlesRef.current.push(particle);
        lastMousePosRef.current = { x, y };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const activeParticles = [];
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        
        // Gentle spiritual rising force (anti-gravity)
        p.vy -= 0.032;
        
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.965; // Inertial dampening
        p.vy *= 0.965;
        p.angle += p.vAngle;
        p.life *= p.decay;

        if (p.life > 0.06) {
          activeParticles.push(p);

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          const currentSize = p.size * p.life;

          // 1. Draw outer spiritual diffuse glow
          const outerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, currentSize);
          outerGrad.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${0.36 * p.life})`);
          outerGrad.addColorStop(0.5, `rgba(${p.r}, ${p.g}, ${p.b}, ${0.12 * p.life})`);
          outerGrad.addColorStop(1.0, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
          ctx.fillStyle = outerGrad;
          ctx.beginPath();
          ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
          ctx.fill();

          // 2. Draw 2 swirling runic spiral arms
          const numArms = 2;
          const maxRadius = currentSize * 0.82;
          ctx.lineWidth = 1.0 + p.life;

          for (let arm = 0; arm < numArms; arm++) {
            const armStartAngle = (arm * Math.PI * 2) / numArms;
            ctx.beginPath();

            for (let d = 0; d <= 20; d++) {
              const t = d / 20;
              const radius = t * maxRadius;
              const theta = armStartAngle + t * Math.PI * 1.5; // Spiral twist
              const lx = radius * Math.cos(theta);
              const ly = radius * Math.sin(theta);

              if (d === 0) {
                ctx.moveTo(lx, ly);
              } else {
                ctx.lineTo(lx, ly);
              }
            }

            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius);
            grad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * p.life})`);
            grad.addColorStop(0.4, `rgba(${p.r}, ${p.g}, ${p.b}, ${0.68 * p.life})`);
            grad.addColorStop(0.8, `rgba(${p.r}, ${p.g}, ${p.b}, ${0.15 * p.life})`);
            grad.addColorStop(1.0, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
            ctx.strokeStyle = grad;
            ctx.stroke();
          }

          // 3. Central bright core
          const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, currentSize * 0.22);
          innerGrad.addColorStop(0, `rgba(255, 255, 255, ${p.life})`);
          innerGrad.addColorStop(0.4, `rgba(255, 255, 255, ${0.82 * p.life})`);
          innerGrad.addColorStop(1.0, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
          ctx.fillStyle = innerGrad;
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(1.5, currentSize * 0.22), 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      particlesRef.current = activeParticles;
      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [colors, spawnDistance, baseSize, decaySpeed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        display: 'block'
      }}
    />
  );
}
