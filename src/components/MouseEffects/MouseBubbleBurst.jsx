import React, { useEffect, useRef } from 'react';

/**
 * MouseBubbleBurst - A bubble burst mouse follow effect.
 * Ports the outward-burst circle particles from my-extension content.js.
 * 
 * Props:
 * - colors: Array of RGB color objects { r, g, b } to use for the bubbles.
 * - spawnDistance: Distance in pixels the mouse must travel to spawn particles.
 * - sizeRange: Minimum and maximum starting radius [min, max] (default: [3.5, 12]).
 * - speedRange: Minimum and maximum initial speed [min, max] (default: [1.2, 3.5]).
 * - friction: Deceleration multiplier per frame (default: 0.93).
 * - zIndex: Overlay position index (default: 1).
 */
export default function MouseBubbleBurst({
  colors = [
    { r: 231, g: 199, b: 126 }, // gold
    { r: 167, g: 139, b: 250 }, // violet
    { r: 90, g: 163, b: 143 },  // emerald
    { r: 99, g: 102, b: 241 }   // indigo
  ],
  spawnDistance = 10,
  sizeRange = [3.5, 12],
  speedRange = [1.0, 3.2],
  friction = 0.93,
  zIndex = 1
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

      if (dist > spawnDistance) {
        // Spawn 2 to 4 bubbles to make it lively but controlled
        const count = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < count; i++) {
          const selectedColor = colors[Math.floor(Math.random() * colors.length)];
          const th = Math.random() * Math.PI * 2;
          const speed = Math.random() * (speedRange[1] - speedRange[0]) + speedRange[0];
          const size = Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0];
          
          particlesRef.current.push({
            x,
            y,
            r: size,
            color: `rgba(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b}, 0.78)`,
            th,
            vx: Math.sin(th) * speed,
            vy: Math.cos(th) * speed,
            decay: 0.93 - Math.random() * 0.02 // Shrinks by 5-7% per frame
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
        p.vx += Math.cos(p.th) * 0.04;
        p.vy += Math.sin(p.th) * 0.04;
        
        p.vx *= friction;
        p.vy *= friction;
        p.r *= p.decay;

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
  }, [colors, spawnDistance, sizeRange, speedRange, friction]);

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
