import React, { useEffect, useRef } from 'react';

/**
 * MouseConstellationTrail - A port of the constellation particle connection network.
 * Elegant floating nodes that form webs with each other and the mouse cursor.
 * 
 * Props:
 * - particleCount: Number of background floating nodes (default: 60 for restraint).
 * - color: RGB object for the nodes and lines (default: soft gold #e7c77e).
 * - connectDistance: Distance threshold for connections (default: 120px).
 * - baseSpeed: Speed coefficient for node floating (default: 0.4).
 */
export default function MouseConstellationTrail({
  particleCount = 65,
  color = { r: 231, g: 199, b: 126 }, // #e7c77e
  connectDistance = 120,
  baseSpeed = 0.35,
  zIndex = 9999
}) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mousePosRef = useRef({ x: null, y: null, active: false });

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
      
      // Initialize particles within the viewport bounds
      initializeParticles();
    };

    // Particle class inside hook to access canvas state easily
    class NodeParticle {
      constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.vx = (Math.random() - 0.5) * baseSpeed;
        this.vy = (Math.random() - 0.5) * baseSpeed;
        this.size = Math.random() * 2 + 1; // 1px to 3px
        this.alpha = Math.random() * 0.45 + 0.15; // Muted opacity for restraint
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce borders smoothly
        if (this.x < 0) { this.x = 0; this.vx *= -1; }
        if (this.x > window.innerWidth) { this.x = window.innerWidth; this.vx *= -1; }
        if (this.y < 0) { this.y = 0; this.vy *= -1; }
        if (this.y > window.innerHeight) { this.y = window.innerHeight; this.vy *= -1; }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${this.alpha})`;
        ctx.fill();
      }
    }

    const initializeParticles = () => {
      const list = [];
      for (let i = 0; i < particleCount; i++) {
        list.push(new NodeParticle());
      }
      particlesRef.current = list;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse position relative to canvas bounding box for absolute alignment
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true
      };
    };

    const handleMouseLeave = () => {
      mousePosRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const list = particlesRef.current;

      // 1. Update and draw nodes
      list.forEach(p => {
        p.update();
        p.draw();
      });

      // 2. Draw connections between nodes
      for (let i = 0; i < list.length; i++) {
        const p1 = list[i];
        for (let j = i + 1; j < list.length; j++) {
          const p2 = list[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectDistance) {
            const opacity = (1.0 - dist / connectDistance) * 0.24; // More visible lines
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // 3. Draw connection to mouse if active
        if (mousePosRef.current.active) {
          const mx = mousePosRef.current.x;
          const my = mousePosRef.current.y;
          const dx = p1.x - mx;
          const dy = p1.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectDistance * 1.2) {
            // Draw connection line to mouse
            const opacity = (1.0 - dist / (connectDistance * 1.2)) * 0.45; // Clearly visible interactive lines
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
            ctx.lineWidth = 1.1;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mx, my);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [particleCount, color, connectDistance, baseSpeed]);

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
