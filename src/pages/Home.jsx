import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSection3D from '../components/HeroSection3D';
import heroMapBackground from '../assets/images/home/hero-map-background.png';
import { MouseBubbleBurst } from '../components/MouseEffects';
import { BIOMES } from '../components/HeroSection3D/BlogPlanet/biomeConfig';

const HomeWrapper = styled.main`
  position: relative;
  min-height: 100vh;
  overflow: hidden;

  @media (max-width: 768px) {
    overflow: visible;
  }
`;

const LoadingScreen = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: #0b1517; /* Dark teal background to match homepage */
  z-index: 999999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  color: #e0f2f1;
  user-select: none;
  -webkit-user-select: none;
  
  .astro-circle {
    width: 80px;
    height: 80px;
    border: 2px dashed rgba(45, 212, 191, 0.2);
    border-radius: 50%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: loadingSpin 18s linear infinite;
    
    &::before {
      content: '';
      position: absolute;
      width: 60px;
      height: 60px;
      border: 1px solid rgba(45, 212, 191, 0.45);
      border-radius: 50%;
      border-left-color: transparent;
      border-right-color: transparent;
      animation: loadingSpinCounter 6s linear infinite;
    }
    
    &::after {
      content: '🪐';
      font-size: 1.6rem;
      animation: loadingBreathe 2s ease-in-out infinite alternate;
    }
  }

  .loading-text {
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: rgba(224, 242, 241, 0.85);
    text-shadow: 0 0 10px rgba(45, 212, 191, 0.35);
  }

  .loading-bar-bg {
    width: 140px;
    height: 2px;
    background: rgba(45, 212, 191, 0.12);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
  }

  .loading-bar-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(90deg, transparent, #2dd4bf, transparent);
    animation: loadingBarMove 1.5s infinite linear;
  }

  @keyframes loadingSpin {
    to { transform: rotate(360deg); }
  }

  @keyframes loadingSpinCounter {
    to { transform: rotate(-360deg); }
  }

  @keyframes loadingBreathe {
    0% { transform: scale(0.9) rotate(-8deg); opacity: 0.7; }
    100% { transform: scale(1.1) rotate(8deg); opacity: 1; }
  }

  @keyframes loadingBarMove {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

function Home() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [hoveredBiome, setHoveredBiome] = useState(null);

  useEffect(() => {
    // Preload hero background image to prevent popping
    const img = new Image();
    img.src = heroMapBackground;
    
    const startTime = Date.now();
    
    img.onload = img.onerror = () => {
      const elapsed = Date.now() - startTime;
      const minDelay = 1400; // 1.4s minimum delay to allow WebGL planet compilation to finish in background
      const remaining = Math.max(0, minDelay - elapsed);
      
      setTimeout(() => {
        setIsPageLoading(false);
      }, remaining);
    };
  }, []);

  // Map the active/hovered biome to its exact color
  const getBubbleColors = () => {
    if (hoveredBiome && BIOMES[hoveredBiome]) {
      const hex = BIOMES[hoveredBiome].color;
      // Convert hex (e.g. #10b981) to RGB
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [{ r, g, b }];
    }
    // Default background stellar nebula scheme (softer, dreamy stardust)
    return [
      { r: 245, g: 247, b: 250 }, // 太白星银 (#f5f7fa)
      { r: 74, g: 180, b: 220 },  // 以太幽蓝 (#4ab4dc)
      { r: 240, g: 200, b: 120 }, // 晨曦浅金 (#f0c878)
      { r: 160, g: 130, b: 240 }  // 紫薇幽紫 (#a082f0)
    ];
  };

  return (
    <HomeWrapper>
      <AnimatePresence>
        {isPageLoading && (
          <LoadingScreen
            key="home-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.65, ease: 'easeInOut' } }}
          >
            <div className="astro-circle" />
            <div className="loading-text">正在构筑星寰仪以太空间...</div>
            <div className="loading-bar-bg">
              <div className="loading-bar-fill" />
            </div>
          </LoadingScreen>
        )}
      </AnimatePresence>
      <HeroSection3D onActiveBiomeChange={setHoveredBiome} />
      <MouseBubbleBurst 
        zIndex={1}
        spawnDistance={8}
        sizeRange={[5.0, 22.0]}
        colors={getBubbleColors()}
      />
    </HomeWrapper>
  );
}

export default Home;
