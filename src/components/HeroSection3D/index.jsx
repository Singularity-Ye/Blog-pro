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

const pulseAnim = keyframes`
  0%, 100% { opacity: 0.42; }
  50% { opacity: 0.9; }
`;

const cardShine = keyframes`
  from { transform: translateX(-140%) skewX(-18deg); }
  to { transform: translateX(360%) skewX(-18deg); }
`;

const dropletPulse = keyframes`
  0%, 100% {
    border-radius: 62% 38% 58% 42% / 44% 52% 48% 56%;
    transform: rotate(-8deg) scale(1);
  }
  45% {
    border-radius: 42% 58% 43% 57% / 58% 44% 56% 42%;
    transform: rotate(6deg) scale(1.04);
  }
  72% {
    border-radius: 54% 46% 62% 38% / 42% 60% 40% 58%;
    transform: rotate(-2deg) scale(0.98);
  }
`;

const HeroWrapper = styled.section`
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 100svh;
  min-height: 620px;
  max-height: 100svh;
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
  gap: 0.58rem;
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
  grid-template-columns: 3rem 1fr;
  gap: 0.7rem;
  align-items: center;
  min-height: 70px;
  padding: 0.62rem 0.9rem 0.62rem 0.72rem;
  border: 1px solid ${({ $active, $glow }) => ($active ? `${$glow}d8` : 'rgba(37, 99, 113, 0.15)')};
  border-radius: 18px 8px 20px 8px;
  background: ${({ $active, $glow }) => ($active
    ? `radial-gradient(circle at 14% 50%, ${$glow}28, transparent 34%), linear-gradient(110deg, rgba(255, 255, 255, 0.78), rgba(217, 250, 255, 0.34) 66%, rgba(255, 255, 255, 0.42))`
    : 'linear-gradient(110deg, rgba(255, 255, 255, 0.54), rgba(217, 250, 255, 0.22) 66%, rgba(255, 255, 255, 0.36))')};
  color: #073b4c;
  cursor: pointer;
  text-align: left;
  backdrop-filter: blur(12px) saturate(1.08);
  box-shadow: ${({ $active, $glow }) => ($active
    ? `0 16px 36px ${$glow}2c, 0 0 0 1px rgba(255, 255, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.82)`
    : '0 12px 28px rgba(31, 91, 112, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.64)')};
  transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease;

  &::before {
    content: '';
    position: absolute;
    left: 3.55rem;
    top: 1rem;
    width: 34px;
    height: 1px;
    pointer-events: none;
    background: ${({ $glow }) => `linear-gradient(90deg, ${$glow}, transparent)`};
    box-shadow:
      0 6px 0 ${({ $glow }) => `${$glow}88`},
      0 12px 0 ${({ $glow }) => `${$glow}55`};
    opacity: ${({ $active }) => ($active ? 0.9 : 0.48)};
  }

  &::after {
    content: '';
    position: absolute;
    right: 1rem;
    top: 0.85rem;
    width: 44px;
    height: 22px;
    pointer-events: none;
    border-top: 1px solid ${({ $glow }) => `${$glow}70`};
    border-right: 1px solid ${({ $glow }) => `${$glow}58`};
    opacity: 0.62;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: ${({ $glow }) => `${$glow}dd`};
    background: ${({ $glow }) => `linear-gradient(110deg, rgba(255, 255, 255, 0.82), ${$glow}2c 62%, rgba(255, 255, 255, 0.54))`};
    box-shadow:
      0 18px 36px rgba(31, 91, 112, 0.14),
      0 0 0 1px rgba(255, 255, 255, 0.42),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }
`;

const LegendSwatch = styled.span`
  position: relative;
  width: 2.55rem;
  height: 2.55rem;
  justify-self: center;
  border-radius: 62% 38% 58% 42% / 44% 52% 48% 56%;
  background:
    radial-gradient(circle at 36% 30%, rgba(255, 255, 255, 0.5), transparent 28%),
    ${({ $color }) => $color};
  box-shadow:
    inset 0 0 0 5px rgba(255, 255, 255, 0.38),
    0 0 0 1px rgba(255, 255, 255, 0.7),
    0 0 20px ${({ $glow }) => $glow};
  z-index: 1;
  animation: ${dropletPulse} 5.2s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    inset: 8px 10px 12px 9px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
  }

  &::after {
    content: '';
    position: absolute;
    right: -5px;
    top: 8px;
    width: 10px;
    height: 1px;
    background: ${({ $glow }) => $glow};
    box-shadow: 0 5px 0 ${({ $glow }) => $glow}, 0 10px 0 ${({ $glow }) => $glow};
    opacity: 0.7;
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
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: 0.02em;
`;

const LegendDescription = styled.span`
  color: rgba(7, 59, 76, 0.58);
  font-size: 0.68rem;
  line-height: 1.28;
`;

const LegendCta = styled(motion.a)`
  position: relative;
  overflow: hidden;
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
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
  bottom: clamp(4.4rem, 8.5vh, 6.2rem);
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
          PINECONE GLOBE ONLINE
        </GreetBadge>

        <HeroTitle
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.4 }}
        >
          松果灵感地球仪
        </HeroTitle>

        <HeroSubtitle
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.6 }}
        >
          把博客、图谱、项目和联系入口折叠成一颗明亮的小星球。拖拽旋转它，从大陆进入不同的页面。
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
          <LegendCta href="/about" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            关于本站 →
          </LegendCta>
        </PlanetLegend>
      </Overlay>

      <HintText>拖拽旋转星球 · 按住星球滚轮缩放 · 点击大陆进入页面</HintText>

    </HeroWrapper>
  );
}

export default HeroSection3D;
