import React, { Suspense, useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import heroMapBackground from '../../assets/backgrounds/hero-map-background.png';
import { BIOMES, BIOME_ORDER } from './BlogPlanet/biomeConfig';
import Scene from './Scene';

const floatAnim = keyframes`
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-8px); }
`;

const pulseAnim = keyframes`
  0%, 100% { opacity: 0.42; }
  50% { opacity: 0.9; }
`;

const cardShine = keyframes`
  from { transform: translateX(-140%) skewX(-18deg); }
  to { transform: translateX(360%) skewX(-18deg); }
`;

const HeroWrapper = styled.section`
  position: relative;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  height: calc(100svh - 60px);
  min-height: 620px;
  max-height: calc(100svh - 60px);
  overflow: hidden;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.36) 0%, rgba(238, 251, 255, 0.2) 42%, rgba(231, 249, 255, 0.06) 100%),
    linear-gradient(180deg, rgba(245, 253, 255, 0.12), rgba(204, 242, 248, 0.02)),
    url(${heroMapBackground});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: auto;
    pointer-events: none;
    z-index: 0;
    filter: blur(1px);
  }

  &::before {
    width: 100%;
    height: 100%;
    inset: 0;
    background:
      radial-gradient(ellipse at 24% 50%, rgba(255, 255, 255, 0.18), transparent 34%),
      radial-gradient(ellipse at 58% 48%, rgba(255, 255, 255, 0.08), transparent 42%);
    opacity: 0.32;
  }

  &::after {
    width: 100%;
    height: 100%;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(218, 245, 250, 0.03)),
      radial-gradient(circle at 76% 58%, rgba(255, 255, 255, 0.03), transparent 28%);
    opacity: 0.28;
  }
`;

const CanvasWrapper = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
`;

const Overlay = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: clamp(2rem, 6vw, 5rem);
  pointer-events: none;
  width: min(50vw, 560px);
  margin-right: 36vw;
  transform: translateY(-2.5vh);

  @media (max-width: 768px) {
    width: 100%;
    margin-right: 0;
    align-items: center;
    text-align: center;
    padding: 1.25rem;
  }
`;

const GreetBadge = styled(motion.span)`
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #0f766e;
  border: 1px solid rgba(15, 118, 110, 0.24);
  border-radius: 50px;
  padding: 0.34rem 1rem;
  backdrop-filter: blur(10px);
  background: rgba(240, 253, 250, 0.64);
  margin-bottom: 0.85rem;
  box-shadow: 0 14px 32px rgba(14, 116, 144, 0.12);
`;

const HeroTitle = styled(motion.h1)`
  font-size: clamp(2.15rem, 5vw, 4.35rem);
  font-weight: 900;
  line-height: 1.08;
  margin: 0 0 0.88rem;
  color: #073b4c;
  letter-spacing: -0.04em;
  text-shadow: 0 2px 0 rgba(255, 255, 255, 0.44);
`;

const HeroSubtitle = styled(motion.p)`
  font-size: clamp(0.9rem, 1.45vw, 1.02rem);
  color: rgba(7, 59, 76, 0.74);
  max-width: 500px;
  line-height: 1.68;
  margin: 0 0 1.15rem;
`;

const PlanetLegend = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.48rem;
  width: min(100%, 500px);
  margin-bottom: 0;
  pointer-events: all;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const LegendItem = styled.button`
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 0.72rem 1fr;
  gap: 0.55rem;
  align-items: start;
  min-height: 58px;
  padding: 0.62rem 0.78rem;
  border: 1px solid ${({ $active, $glow }) => ($active ? `${$glow}cc` : 'rgba(86, 160, 176, 0.2)')};
  border-radius: 16px;
  background: ${({ $active, $glow }) => ($active
    ? `linear-gradient(135deg, rgba(236, 254, 255, 0.9), ${$glow}2b)`
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(220, 248, 255, 0.42))')};
  color: #073b4c;
  cursor: pointer;
  text-align: left;
  backdrop-filter: blur(14px) saturate(1.15);
  box-shadow: ${({ $active, $glow }) => ($active
    ? `0 18px 46px ${$glow}34, 0 0 0 1px rgba(255, 255, 255, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.86)`
    : '0 14px 38px rgba(31, 91, 112, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.72)')};
  transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.65), transparent 36%);
    opacity: 0.52;
  }

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 34%;
    height: 100%;
    pointer-events: none;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.46), transparent);
    opacity: 0;
  }

  &:hover {
    transform: translateY(-3px);
    border-color: ${({ $glow }) => `${$glow}dd`};
    background: ${({ $glow }) => `linear-gradient(135deg, rgba(236, 254, 255, 0.88), ${$glow}24)`};
    box-shadow:
      0 18px 44px rgba(31, 91, 112, 0.16),
      0 0 0 1px rgba(255, 255, 255, 0.42),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  &:hover::after {
    opacity: 1;
    animation: ${cardShine} 0.8s ease;
  }
`;

const LegendSwatch = styled.span`
  position: relative;
  width: 0.72rem;
  height: 0.72rem;
  margin-top: 0.25rem;
  border-radius: 999px;
  background: ${({ $color }) => $color};
  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.42),
    0 0 18px ${({ $glow }) => $glow};
  z-index: 1;

  &::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: inherit;
    border: 1px solid ${({ $glow }) => $glow};
    opacity: 0.2;
  }
`;

const LegendText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  position: relative;
  z-index: 1;
`;

const LegendLabel = styled.span`
  font-size: 0.82rem;
  font-weight: 800;
`;

const LegendDescription = styled.span`
  color: rgba(7, 59, 76, 0.58);
  font-size: 0.66rem;
  line-height: 1.28;
`;

const LegendCta = styled(motion.a)`
  position: relative;
  overflow: hidden;
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background:
    radial-gradient(circle at 28% 12%, rgba(255, 255, 255, 0.34), transparent 32%),
    linear-gradient(135deg, #0f8f72 0%, #22c55e 100%);
  color: #fff;
  font-weight: 900;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.24);
  box-shadow:
    0 18px 42px rgba(16, 185, 129, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  pointer-events: all;
  transition: transform 0.22s ease, box-shadow 0.22s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transform: translateX(-120%) skewX(-18deg);
    opacity: 0;
  }

  &:hover::before {
    opacity: 1;
    animation: ${cardShine} 0.85s ease;
  }
`;

const HintText = styled.span`
  position: absolute;
  right: clamp(1.6rem, 8vw, 8rem);
  bottom: clamp(1.1rem, 4vh, 2.3rem);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  color: rgba(7, 59, 76, 0.62);
  pointer-events: none;
  animation: ${pulseAnim} 2.8s ease-in-out infinite;
  white-space: nowrap;
  z-index: 3;
  padding: 0.5rem 0.78rem;
  border-radius: 999px;
  background: rgba(236, 254, 255, 0.48);
  border: 1px solid rgba(14, 116, 144, 0.14);
  backdrop-filter: blur(10px);

  @media (max-width: 640px) {
    display: none;
  }
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 1.15rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  animation: ${floatAnim} 2.2s ease-in-out infinite;
  z-index: 3;

  @media (max-height: 760px) {
    display: none;
  }
`;

const ScrollDot = styled.div`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(7, 59, 76, 0.64);
`;

const ScrollLine = styled.div`
  width: 1px;
  height: 36px;
  background: linear-gradient(to bottom, rgba(7, 59, 76, 0.55), transparent);
`;

function HeroSection3D() {
  const navigate = useNavigate();
  const [activeBiome, setActiveBiome] = useState(null);

  const handleNavigate = useCallback((href) => {
    navigate(href);
  }, [navigate]);

  const handleLegendClick = useCallback((biomeKey) => {
    const biome = BIOMES[biomeKey];
    if (!biome) return;

    setActiveBiome(biomeKey);
    window.setTimeout(() => navigate(biome.href), 220);
  }, [navigate]);

  return (
    <HeroWrapper>
      <CanvasWrapper>
        <Canvas
          camera={{ position: [0, 0.05, 5.9], fov: 48 }}
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 2]}
          style={{ background: 'transparent' }}
          resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.12;
          }}
        >
          <Suspense fallback={null}>
            <Scene
              activeBiome={activeBiome}
              onBiomeHover={setActiveBiome}
              onBiomeSelect={setActiveBiome}
              onNavigate={handleNavigate}
            />
            <Preload all />
          </Suspense>
        </Canvas>
      </CanvasWrapper>

      <Overlay>
        <GreetBadge
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          BLOG GLOBE ONLINE
        </GreetBadge>

        <HeroTitle
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.4 }}
        >
          灵感小地球仪
        </HeroTitle>

        <HeroSubtitle
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.6 }}
        >
          把技术、笔记、随笔和项目折叠成一颗明亮的小星球。拖拽旋转它，找到散落在海洋上的雨林、雪山、荒漠与城市。
        </HeroSubtitle>

        <PlanetLegend
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.72 }}
        >
          {BIOME_ORDER.map((biomeKey) => {
            const biome = BIOMES[biomeKey];
            const isActive = activeBiome === biomeKey;

            return (
              <LegendItem
                key={biome.key}
                type="button"
                $active={isActive}
                $glow={biome.glow}
                onMouseEnter={() => setActiveBiome(biome.key)}
                onMouseLeave={() => setActiveBiome(null)}
                onClick={() => handleLegendClick(biome.key)}
              >
                <LegendSwatch $color={biome.color} $glow={biome.glow} />
                <LegendText>
                  <LegendLabel>{biome.label}</LegendLabel>
                  <LegendDescription>{biome.description}</LegendDescription>
                </LegendText>
              </LegendItem>
            );
          })}
          <LegendCta href="/blog" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            进入文章地图 →
          </LegendCta>
        </PlanetLegend>
      </Overlay>

      <HintText>拖拽旋转星球 · 点击大陆进入对应分类</HintText>

      <ScrollIndicator>
        <ScrollDot />
        <ScrollLine />
      </ScrollIndicator>
    </HeroWrapper>
  );
}

export default HeroSection3D;
