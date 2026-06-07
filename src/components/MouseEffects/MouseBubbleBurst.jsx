import React, { useEffect, useRef } from 'react';

/**
 * MouseBubbleBurst - A premium 3D holographic glass soap bubble burst follow effect.
 * Ports the physics from my-extension content.js, but upgrades them with:
 * - Holographic iridescence (dual-color thin-film simulation)
 * - 3D dual-source specular and bounce highlights
 * - Fluid upward float, wave sway, and swirling vortex自旋力
 * - Interactive bubble pop particle sparkles on death.
 * 
 * Props:
 * - colors: Array of RGB color objects { r, g, b } to use for the bubbles.
 * - spawnDistance: Distance in pixels the mouse must travel to spawn particles.
 * - sizeRange: Minimum and maximum starting radius [min, max] (default: [6.0, 26.0]).
 * - speedRange: Minimum and maximum initial speed [min, max] (default: [1.8, 5.2]).
 * - friction: Deceleration multiplier per frame (default: 0.93).
 * - zIndex: Overlay position index (default: 1).
 */
export default function MouseBubbleBurst({
  colors = [
    { r: 255, g: 215, b: 64 },   // #ffd740 (Stellar Gold / 星砂金)
    { r: 243, g: 156, b: 18 },   // #f39c12 (Warm Amber / 琥珀橙)
    { r: 255, g: 140, b: 100 },  // #ff8c64 (Rose Sunset / 霞粉珠)
    { r: 120, g: 220, b: 180 },  // #78dcb4 (Spirit Emerald / 翡翠玉)
    { r: 250, g: 235, b: 190 }   // #faebbe (Celestial White / 太白砂)
  ],
  spawnDistance = 6,
  sizeRange = [6.0, 26.0],
  speedRange = [1.8, 5.2],
  friction = 0.93,
  zIndex = 1
}) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const sparksRef = useRef([]);
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
        // Spawn 2 to 5 bubbles for a rich but lightweight trail
        const count = Math.floor(Math.random() * 4) + 2;
        
        for (let i = 0; i < count; i++) {
          const colorIndex = Math.floor(Math.random() * colors.length);
          const selectedColor = colors[colorIndex];
          // Create a lighter, shimmery version of the same color for the rim to preserve color identity
          const selectedColorAlt = {
            r: Math.min(255, Math.floor(selectedColor.r * 1.25)),
            g: Math.min(255, Math.floor(selectedColor.g * 1.25)),
            b: Math.min(255, Math.floor(selectedColor.b * 1.25))
          };
          const th = Math.random() * Math.PI * 2;
          const speed = Math.random() * (speedRange[1] - speedRange[0]) + speedRange[0];
          const size = Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0];
          
          particlesRef.current.push({
            x,
            y,
            r: size,
            initialRadius: size,
            colorRgb: selectedColor,
            colorRgbAlt: selectedColorAlt,
            th,
            vx: Math.sin(th) * speed,
            vy: Math.cos(th) * speed,
            angle: Math.random() * Math.PI * 2,
            spinSpeed: (Math.random() - 0.5) * 0.05,
            waveTime: Math.random() * 100,
            waveSpeed: 0.03 + Math.random() * 0.04,
            waveAmp: 0.15 + Math.random() * 0.35,
            opacity: 1.0,
            decay: 0.975 - Math.random() * 0.015 // Slower decay: 1.5% to 3% size shrink per frame
          });
        }
        
        lastMousePosRef.current = { x, y };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Use screen blending so overlapping bubbles glow beautifully
      ctx.globalCompositeOperation = 'screen';

      // 1. Update and draw bubbles
      const activeParticles = [];
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        
        // Float upward (buoyancy)
        p.vy -= 0.035;
        
        // Tangential vortex self-rotation push
        p.vx += Math.cos(p.angle) * 0.06;
        p.vy += Math.sin(p.angle) * 0.06;
        
        p.x += p.vx;
        p.y += p.vy;
        
        p.vx *= friction;
        p.vy *= friction;
        
        // Fluid horizontal sway
        p.waveTime += p.waveSpeed;
        p.x += Math.sin(p.waveTime) * p.waveAmp;
        
        p.angle += p.spinSpeed;
        p.r *= p.decay;
        p.opacity *= 0.988; // Slightly slower opacity fade

        // When a bubble dies, check if it pops
        if (p.r <= 3.2 || p.opacity <= 0.08) {
          if (p.initialRadius > 11.0) {
            // Spawn 3 to 5 pop sparkles
            const sparkCount = Math.floor(Math.random() * 3) + 3;
            for (let j = 0; j < sparkCount; j++) {
              const sparkTh = Math.random() * Math.PI * 2;
              const sparkSpeed = Math.random() * 2.8 + 1.2;
              sparksRef.current.push({
                x: p.x,
                y: p.y,
                vx: Math.cos(sparkTh) * sparkSpeed,
                vy: Math.sin(sparkTh) * sparkSpeed - 0.4, // slight upward float
                r: Math.random() * 1.5 + 0.8,
                colorRgb: p.colorRgb,
                opacity: 1.0,
                decay: 0.88 - Math.random() * 0.04
              });
            }
          }
        } else {
          activeParticles.push(p);

          ctx.save();
          ctx.translate(p.x, p.y);

          // A. Iridescent holographic soap-film body gradient
          const bodyGrad = ctx.createRadialGradient(-p.r * 0.15, -p.r * 0.15, p.r * 0.1, 0, 0, p.r);
          bodyGrad.addColorStop(0, `rgba(${p.colorRgb.r}, ${p.colorRgb.g}, ${p.colorRgb.b}, ${0.05 * p.opacity})`);
          bodyGrad.addColorStop(0.7, `rgba(${p.colorRgb.r}, ${p.colorRgb.g}, ${p.colorRgb.b}, ${0.28 * p.opacity})`);
          bodyGrad.addColorStop(0.92, `rgba(${p.colorRgbAlt.r}, ${p.colorRgbAlt.g}, ${p.colorRgbAlt.b}, ${0.62 * p.opacity})`);
          bodyGrad.addColorStop(1.0, `rgba(255, 255, 255, ${0.15 * p.opacity})`);
          
          ctx.fillStyle = bodyGrad;
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();

          // B. Clear bubble membrane outer line
          ctx.strokeStyle = `rgba(${p.colorRgb.r}, ${p.colorRgb.g}, ${p.colorRgb.b}, ${0.42 * p.opacity})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.stroke();

          // Apply rotation for internal asymmetric details (visible spin)
          ctx.rotate(p.angle);

          // C. Spinning inner crescent reflection (rainbow shimmer)
          ctx.strokeStyle = `rgba(${p.colorRgbAlt.r}, ${p.colorRgbAlt.g}, ${p.colorRgbAlt.b}, ${0.35 * p.opacity})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, p.r * 0.65, 0.8 * Math.PI, 1.2 * Math.PI);
          ctx.stroke();

          // D. Top-left high specular highlight
          const highlightGrad = ctx.createRadialGradient(-p.r * 0.38, -p.r * 0.38, 0, -p.r * 0.38, -p.r * 0.38, p.r * 0.42);
          highlightGrad.addColorStop(0, `rgba(255, 255, 255, ${0.92 * p.opacity})`);
          highlightGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.4 * p.opacity})`);
          highlightGrad.addColorStop(1.0, `rgba(255, 255, 255, 0)`);
          ctx.fillStyle = highlightGrad;
          ctx.beginPath();
          ctx.arc(-p.r * 0.38, -p.r * 0.38, p.r * 0.42, 0, Math.PI * 2);
          ctx.fill();

          // E. Bottom-right soft bounce rim light
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.28 * p.opacity})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(0, 0, p.r * 0.82, 0.15 * Math.PI, 0.35 * Math.PI);
          ctx.stroke();

          ctx.restore();
        }
      }
      particlesRef.current = activeParticles;

      // 2. Update and draw pop spark fragments
      const activeSparks = [];
      for (let i = 0; i < sparksRef.current.length; i++) {
        const s = sparksRef.current[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.05; // gravity pulling fragment down
        s.opacity *= s.decay;

        if (s.opacity > 0.05) {
          activeSparks.push(s);

          ctx.fillStyle = `rgba(${s.colorRgb.r}, ${s.colorRgb.g}, ${s.colorRgb.b}, ${s.opacity})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      sparksRef.current = activeSparks;

      // Restore blending mode
      ctx.globalCompositeOperation = 'source-over';
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

