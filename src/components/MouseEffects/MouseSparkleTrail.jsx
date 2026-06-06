import React, { useEffect, useRef } from 'react';

/**
 * MouseSparkleTrail - A shimmering magical sparkle mouse follow effect.
 * Spawns twinkling starbursts, crosses, and glowing sparks that drift and fade.
 * 
 * Props:
 * - colors: Array of RGB color objects { r, g, b } to use for the sparkles.
 * - spawnDistance: Distance in pixels the mouse must travel to spawn a new particle.
 * - baseSize: Maximum radius of the sparkles.
 * - decaySpeed: Exponential decay rate of the particle's life (higher = shorter life).
 * - sparkleType: 'mixed' | 'star' | 'cross' | 'circle'
 */
export default function MouseSparkleTrail({
  colors = [
    { r: 253, g: 186, b: 116 }, // #fdba74 (warm orange-gold)
    { r: 254, g: 240, b: 138 }, // #fef08a (canary yellow)
    { r: 251, g: 191, b: 36 },  // #fbbf24 (amber)
    { r: 244, g: 63, b: 94 }    // #f43f5e (rose red)
  ],
  spawnDistance = 12,
  baseSize = 12,
  decaySpeed = 0.94,
  sparkleType = 'mixed'
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

    // Star drawing helper
    const drawStarShape = (c, cx, cy, spikes, outerRadius, innerRadius) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      let step = Math.PI / spikes;

      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fill();
    };

    // Cross glint drawing helper
    const drawCrossGlint = (c, cx, cy, size, thickness) => {
      c.beginPath();
      // Horizontal arm
      c.rect(cx - size, cy - thickness / 2, size * 2, thickness);
      // Vertical arm
      c.rect(cx - thickness / 2, cy - size, thickness, size * 2);
      c.closePath();
      c.fill();
    };

    const handleMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      const dx = x - lastMousePosRef.current.x;
      const dy = y - lastMousePosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > spawnDistance) {
        const selectedColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Randomize shape type if 'mixed' is selected
        let shape = sparkleType;
        if (shape === 'mixed') {
          const rand = Math.random();
          if (rand < 0.3) shape = 'star';
          else if (rand < 0.6) shape = 'cross';
          else shape = 'circle';
        }

        const particle = {
          x,
          y,
          // Gentle initial burst velocity
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.3) * 1.2 + 0.3, // slight downward bias
          size: Math.random() * (baseSize * 0.4) + (baseSize * 0.6),
          r: selectedColor.r,
          g: selectedColor.g,
          b: selectedColor.b,
          shape,
          angle: Math.random() * Math.PI * 2,
          vAngle: (Math.random() - 0.5) * 0.05,
          life: 1.0,
          decay: decaySpeed - Math.random() * 0.02,
          // shimmer speed
          shimmerFreq: Math.random() * 0.15 + 0.05
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
        
        // Gentle downward drift with random wind-like turbulence (sine wave)
        p.vx += Math.sin(p.y * 0.01 + p.angle) * 0.03;
        p.vy += 0.015; // Gravity/drift
        
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.angle += p.vAngle;
        p.life *= p.decay;

        if (p.life > 0.08) {
          activeParticles.push(p);

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          // Twinkling shimmer factor
          const shimmer = 0.5 + Math.sin(Date.now() * p.shimmerFreq) * 0.5;
          const currentSize = p.size * p.life;
          const opacity = p.life * (0.4 + 0.6 * shimmer);

          // 1. Particle shadow glow (soft light emission)
          const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, currentSize * 2.5);
          glowGrad.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${opacity * 0.4})`);
          glowGrad.addColorStop(0.5, `rgba(${p.r}, ${p.g}, ${p.b}, ${opacity * 0.12})`);
          glowGrad.addColorStop(1.0, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(0, 0, currentSize * 2.5, 0, Math.PI * 2);
          ctx.fill();

          // 2. Main sparkle drawing
          const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, currentSize);
          coreGrad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
          coreGrad.addColorStop(0.3, `rgba(255, 255, 255, ${opacity * 0.9})`);
          coreGrad.addColorStop(0.6, `rgba(${p.r}, ${p.g}, ${p.b}, ${opacity * 0.7})`);
          coreGrad.addColorStop(1.0, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
          ctx.fillStyle = coreGrad;

          if (p.shape === 'star') {
            drawStarShape(ctx, 0, 0, 4, currentSize, currentSize * 0.28);
          } else if (p.shape === 'cross') {
            drawCrossGlint(ctx, 0, 0, currentSize, Math.max(1, currentSize * 0.15));
          } else {
            // Circle
            ctx.beginPath();
            ctx.arc(0, 0, currentSize * 0.8, 0, Math.PI * 2);
            ctx.fill();
          }

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
  }, [colors, spawnDistance, baseSize, decaySpeed, sparkleType]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        display: 'block'
      }}
    />
  );
}
