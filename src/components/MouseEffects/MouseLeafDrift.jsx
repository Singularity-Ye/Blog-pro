import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * MouseLeafDrift - A premium "Golden Forest Leaves & Shimmering Pollen" follow effect.
 * Tailored for pages with the "叶间书林" theme (Blog and Note detail pages):
 * - Renders ambient falling leaves designed as delicate golden filament veins (金丝叶脉).
 * - Leaves sway horizontally (sine-wave oscillation), fall vertically, and flutter with 3D-like rotations.
 * - Mouse movement generates a localized wind force that pushes nearby leaves.
 * - Mouse movement trails a gentle, short-lived path of glowing golden pollen particles (碎金星沙).
 * - Excludes mobile/touch-only platforms automatically to ensure 0% background overhead on mobile.
 */

// Theme color palette definitions
const LEAF_COLORS = {
  dark: {
    leafFill: 'rgba(216, 162, 71, 0.05)',       // Transparent Stellar Gold
    leafStroke: 'rgba(231, 199, 126, 0.65)',    // Shimmering Gold
    veinStroke: 'rgba(255, 247, 223, 0.42)',    // Tai-bai Silver-gold
    pollen: [
      { r: 231, g: 199, b: 126 },               // Celestial Gold
      { r: 255, g: 215, b: 64 },                // Amber Gold
      { r: 255, g: 247, b: 223 }                // White Star
    ]
  },
  light: {
    leafFill: 'rgba(153, 99, 22, 0.03)',        // Transparent Amber
    leafStroke: 'rgba(196, 147, 59, 0.55)',     // Sandy Brass
    veinStroke: 'rgba(120, 77, 15, 0.35)',      // Dark Copper
    pollen: [
      { r: 153, g: 99, b: 22 },                 // Warm Amber
      { r: 196, g: 147, b: 59 },                // Sandy Gold
      { r: 120, g: 77, b: 15 }                  // Copper Brown
    ]
  }
};

export default function MouseLeafDrift({
  theme = 'dark',
  leafCount = 6, // Ambient leaves count (reduced from 12)
  zIndex = 9999   // Render on top but pointer-events: none
}) {
  const [isMobile, setIsMobile] = useState(false);
  const canvasRef = useRef(null);
  const leavesRef = useRef([]);
  const pollenRef = useRef([]);
  const lastMouseRef = useRef({ x: null, y: null, time: 0 });

  // 1. Mobile & Touch Screen Safeguard
  useEffect(() => {
    const checkMobile = () => {
      const isMobileSize = window.innerWidth < 768;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileSize || isMobileUA);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 2. Main animation and interaction loop
  useEffect(() => {
    if (isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = null;

    // Set canvas dimensions
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      
      // Re-seed leaves within the new bounds
      initializeLeaves();
    };

    // Class to represent a falling leaf
    class Leaf {
      constructor(isInitial = false) {
        this.reset(isInitial);
      }

      reset(isInitial = false) {
        this.w = 16 + Math.random() * 14;              // Width (16px to 30px)
        this.h = 24 + Math.random() * 20;              // Height (24px to 44px)
        this.x = Math.random() * window.innerWidth;
        this.y = isInitial ? Math.random() * window.innerHeight : -this.h - 20;
        
        this.vy = 0.28 + Math.random() * 0.32;          // Slow gravity vertical speed (halved)
        this.vx = (Math.random() - 0.5) * 0.12;         // Gentler base drift
        
        // Sway parameters
        this.swayTime = Math.random() * 100;
        this.swaySpeed = 0.008 + Math.random() * 0.012;
        this.swayAmp = 0.18 + Math.random() * 0.24;      // Reduced sway amplitude for calmness
        
        // Rotation (2D and 3D simulation)
        this.angle = Math.random() * Math.PI * 2;       // Z-axis rotation angle
        this.spinSpeed = (Math.random() - 0.5) * 0.004; // Slower spin
        
        this.flopTime = Math.random() * 100;            // X/Y-axis scale fluctuation
        this.flopSpeed = 0.008 + Math.random() * 0.012;  // Much slower, graceful turning
        
        this.opacity = 0.15 + Math.random() * 0.65;     // Transparency
        this.windX = 0;                                 // Mouse wind acceleration
        this.windY = 0;
      }

      update(mx, my) {
        // Apply mouse wind force if cursor is close
        if (mx !== null && my !== null) {
          const dx = this.x - mx;
          const dy = this.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 180) {
            const force = (180 - dist) / 180;
            const angle = Math.atan2(dy, dx);
            
            // Push leaf away from cursor with mild force
            this.windX += Math.cos(angle) * force * 0.35;
            this.windY += Math.sin(angle) * force * 0.22;
          }
        }

        // Apply drag/friction to wind forces
        this.windX *= 0.94;
        this.windY *= 0.94;

        // Update position
        this.swayTime += this.swaySpeed;
        this.flopTime += this.flopSpeed;
        this.angle += this.spinSpeed;

        this.x += this.vx + Math.sin(this.swayTime) * this.swayAmp + this.windX;
        this.y += this.vy + this.windY;

        // Reset if leaf leaves the screen bounds
        if (this.y > window.innerHeight + this.h || 
            this.x < -this.w * 2 || 
            this.x > window.innerWidth + this.w * 2) {
          this.reset(false);
        }
      }

      draw(colors) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Simulate 3D rotation by scaling width/height sinusoidally
        const scaleX = Math.sin(this.flopTime);
        const scaleY = Math.cos(this.flopTime * 0.5);
        ctx.scale(scaleX, scaleY);

        ctx.strokeStyle = colors.leafStroke;
        ctx.fillStyle = colors.leafFill;
        ctx.lineWidth = 0.9;

        // A. Draw leaf blade outline (using two bezier paths meeting at tips)
        ctx.beginPath();
        ctx.moveTo(0, -this.h / 2);
        // Left side
        ctx.quadraticCurveTo(-this.w * 0.6, 0, 0, this.h / 2);
        // Right side
        ctx.quadraticCurveTo(this.w * 0.6, 0, 0, -this.h / 2);
        ctx.closePath();
        
        ctx.globalAlpha = this.opacity;
        ctx.fill();
        ctx.stroke();

        // B. Draw leaf veins (golden wireframe skeleton)
        ctx.strokeStyle = colors.veinStroke;
        ctx.lineWidth = 0.6;
        
        // Center main vein
        ctx.beginPath();
        ctx.moveTo(0, -this.h / 2);
        ctx.lineTo(0, this.h / 2 - 2);
        ctx.stroke();

        // Branching side veins
        const veinSegments = 4;
        for (let i = 1; i < veinSegments; i++) {
          const ratio = i / veinSegments;
          const vy = -this.h / 2 + this.h * ratio;
          const slant = this.h * 0.08; // Slant forward
          
          // Left branching vein
          ctx.beginPath();
          ctx.moveTo(0, vy);
          ctx.quadraticCurveTo(-this.w * 0.25 * ratio, vy + slant, -this.w * 0.45 * (1 - Math.abs(ratio - 0.5) * 2), vy + slant * 2);
          ctx.stroke();

          // Right branching vein
          ctx.beginPath();
          ctx.moveTo(0, vy);
          ctx.quadraticCurveTo(this.w * 0.25 * ratio, vy + slant, this.w * 0.45 * (1 - Math.abs(ratio - 0.5) * 2), vy + slant * 2);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    const initializeLeaves = () => {
      const list = [];
      for (let i = 0; i < leafCount; i++) {
        list.push(new Leaf(true));
      }
      leavesRef.current = list;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 3. Mouse move handling: spawns glowing pollen trail
    const handleMouseMove = (e) => {
      const mx = e.clientX;
      const my = e.clientY;
      const now = Date.now();

      const dx = lastMouseRef.current.x !== null ? mx - lastMouseRef.current.x : 0;
      const dy = lastMouseRef.current.y !== null ? my - lastMouseRef.current.y : 0;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Spawn shimmering golden pollen grains as mouse moves
      if (dist > 3) {
        const activeColors = LEAF_COLORS[theme] || LEAF_COLORS.dark;
        const count = Math.min(3, Math.floor(dist / 4));
        
        for (let i = 0; i < count; i++) {
          const colorList = activeColors.pollen;
          const selectedColor = colorList[Math.floor(Math.random() * colorList.length)];
          const spreadAngle = Math.random() * Math.PI * 2;
          const spreadSpeed = Math.random() * 0.6;

          pollenRef.current.push({
            x: mx + (Math.random() - 0.5) * 6,
            y: my + (Math.random() - 0.5) * 6,
            vx: -dx * 0.15 + Math.cos(spreadAngle) * spreadSpeed,
            vy: -dy * 0.15 + Math.sin(spreadAngle) * spreadSpeed + 0.15, // slight lift/gravity combo
            size: 0.8 + Math.random() * 1.5,
            colorRgb: selectedColor,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.035 // Fades out in 30-50 frames (0.5s - 0.8s)
          });
        }
      }

      lastMouseRef.current = { x: mx, y: my, time: now };
    };

    const handleMouseLeave = () => {
      lastMouseRef.current = { x: null, y: null, time: Date.now() };
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // 4. Main drawing loop
    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Blending mode: Glow on dark, standard alpha blending on light
      const isLight = theme === 'light';
      ctx.globalCompositeOperation = isLight ? 'source-over' : 'screen';

      const activeColors = LEAF_COLORS[theme] || LEAF_COLORS.dark;
      const mx = lastMouseRef.current.x;
      const my = lastMouseRef.current.y;

      // Draw and update falling leaves
      leavesRef.current.forEach((leaf) => {
        leaf.update(mx, my);
        leaf.draw(activeColors);
      });

      // Update and draw pollen trail (碎金星沙)
      const activePollen = [];
      for (let i = 0; i < pollenRef.current.length; i++) {
        const p = pollenRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= p.decay;

        if (p.life > 0.02) {
          activePollen.push(p);

          ctx.save();
          ctx.translate(p.x, p.y);
          
          // Radial glow for pollen dust
          const size = p.size * p.life;
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2.2);
          grad.addColorStop(0, `rgba(255, 255, 255, ${p.life})`);
          grad.addColorStop(0.4, `rgba(${p.colorRgb.r}, ${p.colorRgb.g}, ${p.colorRgb.b}, ${p.life * 0.8})`);
          grad.addColorStop(1.0, `rgba(${p.colorRgb.r}, ${p.colorRgb.g}, ${p.colorRgb.b}, 0)`);
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, size * 2.2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      }
      pollenRef.current = activePollen;

      ctx.globalCompositeOperation = 'source-over';
      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [leafCount, theme, isMobile]);

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
