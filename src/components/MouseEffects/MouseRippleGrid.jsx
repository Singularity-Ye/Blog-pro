import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * MouseRippleGrid - A premium "Stellar Sand Chessboard" physics-based ripple effect.
 * Under cursor movement, it distorts a full-screen coordinate grid using a 2D elastic wave equation.
 * The waves propagate physically in the direction of the swipe/drag.
 * Intersections (stars) light up and bob dynamically when active.
 */
export default function MouseRippleGrid({
  theme = 'dark',
  spacing = 56, // Grid cell size in pixels
  zIndex = 1
}) {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const dimsRef = useRef({ cols: 0, rows: 0, width: 0, height: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0, time: 0 });

  // Physics parameters
  const kRest = 0.045;       // Spring constant back to rest position
  const kNeighbor = 0.075;   // Coupling spring constant between neighbors
  const damping = 0.935;     // Damping factor for wave attenuation
  const influenceRadius = 130; // Mouse interaction radius
  const influence = 0.16;     // 2D displacement force factor
  const influenceZ = 0.22;    // Height wave factor

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = null;

    const initGrid = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      dimsRef.current = { cols, rows, width, height };

      const nodes = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x0 = c * spacing;
          const y0 = r * spacing;
          const pinned = (c === 0 || r === 0 || c === cols - 1 || r === rows - 1);
          nodes.push({
            x0,
            y0,
            dx: 0, // 2D displacements
            dy: 0,
            z: 0,  // Bob height displacement
            vx: 0, // Velocities
            vy: 0,
            vz: 0,
            pinned,
            disp: 0 // cached total displacement amplitude
          });
        }
      }
      nodesRef.current = nodes;
    };

    initGrid();

    const handleResize = () => {
      initGrid();
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e) => {
      const mx = e.clientX;
      const my = e.clientY;
      const now = Date.now();

      const dx = mx - lastMouseRef.current.x;
      const dy = my - lastMouseRef.current.y;
      const dt = Math.max(1, now - lastMouseRef.current.time);
      const speed = Math.sqrt(dx * dx + dy * dy);

      const nodes = nodesRef.current;
      if (nodes.length === 0) return;

      // Only apply force if mouse is moving
      if (speed > 0.5 && dt < 100) {
        const radiusSq = influenceRadius * influenceRadius;

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.pinned) continue;

          const nx = node.x0 + node.dx;
          const ny = node.y0 + node.dy;

          const distSq = (nx - mx) * (nx - mx) + (ny - my) * (ny - my);
          if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq);
            // Quadratic falloff for smoother boundary interaction
            const falloff = (1 - dist / influenceRadius) * (1 - dist / influenceRadius);

            // 1. Directional force: push nodes in the mouse velocity vector direction
            node.vx += dx * falloff * influence;
            node.vy += dy * falloff * influence;

            // 2. Transverse force: create height bobs proportional to speed and direction
            // Adds small turbulence to make it look like water surface disruption
            node.vz += speed * falloff * influenceZ * (Math.random() - 0.5);
          }
        }
      }

      lastMouseRef.current = { x: mx, y: my, time: now };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Initial mouse coordinate seeding to prevent jump on start
    const handleMouseEnter = (e) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    };
    window.addEventListener('mouseenter', handleMouseEnter);

    const tick = () => {
      const nodes = nodesRef.current;
      const { cols, rows, width, height } = dimsRef.current;

      if (nodes.length === 0) {
        animationId = requestAnimationFrame(tick);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Solve wave equation for the grid
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = c + r * cols;
          const node = nodes[idx];
          if (node.pinned) continue;

          // Spring restoring force back to origin
          let ax = -kRest * node.dx;
          let ay = -kRest * node.dy;
          let az = -kRest * node.z;

          // Coupling forces to neighbors
          // Left neighbor
          if (c > 0) {
            const n = nodes[(c - 1) + r * cols];
            ax += kNeighbor * (n.dx - node.dx);
            ay += kNeighbor * (n.dy - node.dy);
            az += kNeighbor * (n.z - node.z);
          }
          // Right neighbor
          if (c < cols - 1) {
            const n = nodes[(c + 1) + r * cols];
            ax += kNeighbor * (n.dx - node.dx);
            ay += kNeighbor * (n.dy - node.dy);
            az += kNeighbor * (n.z - node.z);
          }
          // Top neighbor
          if (r > 0) {
            const n = nodes[c + (r - 1) * cols];
            ax += kNeighbor * (n.dx - node.dx);
            ay += kNeighbor * (n.dy - node.dy);
            az += kNeighbor * (n.z - node.z);
          }
          // Bottom neighbor
          if (r < rows - 1) {
            const n = nodes[c + (r + 1) * cols];
            ax += kNeighbor * (n.dx - node.dx);
            ay += kNeighbor * (n.dy - node.dy);
            az += kNeighbor * (n.z - node.z);
          }

          // Update velocities
          node.vx = (node.vx + ax) * damping;
          node.vy = (node.vy + ay) * damping;
          node.vz = (node.vz + az) * damping;

          // Impose strict bounds on velocities to prevent instabilities
          const maxV = 16;
          const vMag = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
          if (vMag > maxV) {
            node.vx = (node.vx / vMag) * maxV;
            node.vy = (node.vy / vMag) * maxV;
          }
          if (Math.abs(node.vz) > maxV) {
            node.vz = Math.sign(node.vz) * maxV;
          }
        }
      }

      // Update positions and cache total displacement amplitude
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node.pinned) {
          node.dx += node.vx;
          node.dy += node.vy;
          node.z += node.vz;
        }
        node.disp = Math.sqrt(node.dx * node.dx + node.dy * node.dy + node.z * node.z);
      }

      // Draw background grid lines (Single stroke batching for absolute performance)
      // Line configurations based on theme
      const isLight = theme === 'light';
      const baseGridColor = isLight ? 'rgba(153, 99, 22, 0.05)' : 'rgba(216, 162, 71, 0.055)';
      const activeLineColorRgb = isLight ? '120, 77, 15' : '231, 199, 126'; // light gold
      const activePurpleColorRgb = '167, 139, 250'; // Purple accent for large bobs

      ctx.strokeStyle = baseGridColor;
      ctx.lineWidth = 0.8;
      ctx.beginPath();

      // Batch all horizontal base grid lines
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const n1 = nodes[c + r * cols];
          const n2 = (c + 1) + r * cols;
          const node2 = nodes[n2];
          ctx.moveTo(n1.x0 + n1.dx, n1.y0 + n1.dy);
          ctx.lineTo(node2.x0 + node2.dx, node2.y0 + node2.dy);
        }
      }

      // Batch all vertical base grid lines
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows - 1; r++) {
          const n1 = nodes[c + r * cols];
          const n2 = c + (r + 1) * cols;
          const node2 = nodes[n2];
          ctx.moveTo(n1.x0 + n1.dx, n1.y0 + n1.dy);
          ctx.lineTo(node2.x0 + node2.dx, node2.y0 + node2.dy);
        }
      }
      ctx.stroke();

      // Highlight active grid lines (where wave amplitude is high)
      const threshold = 1.0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = c + r * cols;
          const node = nodes[idx];

          if (node.disp > threshold) {
            // Check right neighbor
            if (c < cols - 1) {
              const right = nodes[(c + 1) + r * cols];
              const avgDisp = (node.disp + right.disp) / 2;
              if (avgDisp > threshold) {
                const colorRgb = node.z > 6 ? activePurpleColorRgb : activeLineColorRgb;
                const opacity = Math.min(avgDisp * 0.03 + 0.06, 0.45);
                ctx.strokeStyle = `rgba(${colorRgb}, ${opacity})`;
                ctx.lineWidth = 0.8 + Math.min(avgDisp * 0.12, 2.2);
                ctx.beginPath();
                ctx.moveTo(node.x0 + node.dx, node.y0 + node.dy);
                ctx.lineTo(right.x0 + right.dx, right.y0 + right.dy);
                ctx.stroke();
              }
            }
            // Check bottom neighbor
            if (r < rows - 1) {
              const bottom = nodes[c + (r + 1) * cols];
              const avgDisp = (node.disp + bottom.disp) / 2;
              if (avgDisp > threshold) {
                const colorRgb = node.z > 6 ? activePurpleColorRgb : activeLineColorRgb;
                const opacity = Math.min(avgDisp * 0.03 + 0.06, 0.45);
                ctx.strokeStyle = `rgba(${colorRgb}, ${opacity})`;
                ctx.lineWidth = 0.8 + Math.min(avgDisp * 0.12, 2.2);
                ctx.beginPath();
                ctx.moveTo(node.x0 + node.dx, node.y0 + node.dy);
                ctx.lineTo(bottom.x0 + bottom.dx, bottom.y0 + bottom.dy);
                ctx.stroke();
              }
            }
          }
        }
      }

      // Draw star bobs at active intersection vertices
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.pinned) continue;

        if (node.disp > 1.2) {
          const x = node.x0 + node.dx;
          const y = node.y0 + node.dy;
          const dotSize = 1.0 + Math.min(node.disp * 0.14, 2.2);
          const opacity = Math.min(node.disp * 0.045, 0.82);

          // Alternating colors based on wave depth
          const colorRgb = node.z > 5 ? activePurpleColorRgb : activeLineColorRgb;

          ctx.fillStyle = `rgba(${colorRgb}, ${opacity})`;
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();

          // Subtle flare on high displacement
          if (node.disp > 5.0) {
            ctx.strokeStyle = `rgba(${colorRgb}, ${opacity * 0.4})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(x - dotSize * 2.8, y);
            ctx.lineTo(x + dotSize * 2.8, y);
            ctx.moveTo(x, y - dotSize * 2.8);
            ctx.lineTo(x, y + dotSize * 2.8);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [spacing, theme]);

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
