import React, { useEffect, useRef } from 'react';

/**
 * MouseVortexTrail - Restrained bubble burst mouse follow effect.
 * Ports the outward-burst circle particles from my-extension content.js,
 * refined with throttled spawning, smaller sizes, and page-theme colors.
 * 
 * Props:
 * - colors: Array of RGB color objects { r, g, b } to use for the particles.
 * - spawnDistance: Distance in pixels the mouse must travel to spawn particles.
 * - baseSizeRange: Minimum and maximum starting radius [min, max].
 * - baseSpeedRange: Minimum and maximum initial speed [min, max].
 */
export default function MouseVortexTrail({
  colors = [
    { r: 231, g: 199, b: 126 }, // #e7c77e (金丹色)
    { r: 167, g: 139, b: 250 }, // #a78bfa (真灵紫)
    { r: 90, g: 163, b: 143 },  // #5aa38f (药圃绿)
    { r: 99, g: 102, b: 241 }   // #6366f1 (星空蓝)
  ],
  spawnDistance = 10,
  baseSizeRange = [3, 9], // Restrained particle radius (instead of 5 to 30)
  baseSpeedRange = [1.2, 2.5] // Restrained speed (instead of 5)
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

      // Throttled travel distance to prevent crowding
      if (dist > spawnDistance) {
        // Spawn 1 to 3 particles per step for a clean, restrained trail
        const count = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < count; i++) {
          const selectedColor = colors[Math.floor(Math.random() * colors.length)];
          const th = Math.random() * Math.PI * 2;
          const speed = Math.random() * (baseSpeedRange[1] - baseSpeedRange[0]) + baseSpeedRange[0];
          const size = Math.random() * (baseSizeRange[1] - baseSizeRange[0]) + baseSizeRange[0];
          
          particlesRef.current.push({
            x,
            y,
            r: size,
            color: `rgba(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b}, 0.76)`,
            th,
            vx: Math.sin(th) * speed,
            vy: Math.cos(th) * speed,
            decay: 0.94 - Math.random() * 0.02 // Shrinks by 6% to 8% per frame
          });
        }
        
        lastMousePosRef.current = { x, y };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const activeParticles = [];
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        
        p.x += p.vx;
        p.y += p.vy;
        
        // Outward expansion acceleration from my-extension content.js
        p.vx += Math.cos(p.th) * 0.05;
        p.vy += Math.sin(p.th) * 0.05;
        
        p.vx *= 0.92; // Friction deceleration
        p.vy *= 0.92;
        p.r *= p.decay; // Shrink radius

        if (p.r > 0.4) {
          activeParticles.push(p);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, false);
          ctx.fillStyle = p.color;
          ctx.fill();
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
  }, [colors, spawnDistance, baseSizeRange, baseSpeedRange]);

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
