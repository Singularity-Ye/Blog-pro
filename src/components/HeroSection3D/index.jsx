import React, { Suspense, useCallback, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import heroMapBackground from '../../assets/images/home/hero-map-background.png';
import { BIOMES, BIOME_ORDER } from './BlogPlanet/biomeConfig';
import Scene from './Scene';
import ErrorBoundary from '../ErrorBoundary';
import { useHandTracking, TRACKING_MODES } from '../../utils/useHandTracking';
import HandHologram from './HandHologram';

const pulseAnim = keyframes`
  0%, 100% { opacity: 0.42; }
  50% { opacity: 0.9; }
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

  @media (max-width: 768px) {
    height: auto;
    min-height: 100vh;
    max-height: none;
    overflow: visible;
  }

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
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .en-sub {
    font-size: clamp(0.75rem, 1.5vw, 0.95rem);
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(7, 59, 76, 0.45);
    font-family: 'Outfit', 'Inter', sans-serif;
    margin-top: 0.2rem;
    text-shadow: none;
  }
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
  gap: 1.2rem 1rem;
  width: min(100%, 560px);
  margin-bottom: 0;
  pointer-events: all;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }
`;

const LegendItem = styled.button`
  position: relative;
  overflow: visible;
  display: grid;
  grid-template-columns: 3.2rem 1fr;
  gap: 0.85rem;
  align-items: center;
  min-height: 96px;
  padding: 0.8rem 1.2rem 0.8rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  outline: none;
  color: #073b4c;
  z-index: ${({ $active }) => ($active ? 10 : 1)};

  &::before {
    content: '';
    position: absolute;
    inset: -12px;
    background-image: url(${({ $bgImage }) => $bgImage});
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;
    
    transform: ${({ $active }) => ($active ? 'scale(1.04)' : 'scale(1)')};
    opacity: ${({ $active }) => ($active ? 1 : 0.85)};
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
    z-index: 0;
    pointer-events: none;
    filter: drop-shadow(0 6px 16px rgba(14, 116, 144, 0.12));
  }

  & > * {
    position: relative;
    z-index: 1;
    /* 完全剥离所有 transform 和 transition，让文字绝对静止，彻底杜绝 Chrome 动画抗锯齿切换导致的模糊！ */
  }
`;

const LegendSwatch = styled.span`
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  justify-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1.5px solid rgba(255, 255, 255, 0.45);
  box-sizing: border-box;

  /* SVG 内部图标样式 */
  svg {
    width: 1.15rem;
    height: 1.15rem;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease;
    z-index: 2;
  }

  /* 根据不同生态板块应用个性化基础材质 */
  ${({ $biomeKey }) => {
    switch ($biomeKey) {
      case 'forest': // 博客雨林：晶莹温润树叶晨露
        return `
          border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
          background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(220, 252, 231, 0.25) 30%, rgba(22, 163, 74, 0.15) 70%, rgba(21, 128, 61, 0.55) 100%);
          backdrop-filter: blur(3px);
          box-shadow: 
            inset 0 3px 5px rgba(255, 255, 255, 0.7),
            inset 0 -3px 8px rgba(21, 128, 61, 0.25),
            0 4px 14px rgba(22, 163, 74, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.35);
          color: rgba(21, 128, 61, 0.85);
          stroke: rgba(21, 128, 61, 0.85);

          &::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 5px;
            width: 10px;
            height: 5px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.65);
            transform: rotate(-15deg);
          }
        `;
      case 'snow': // 项目雪山：霜冻半透雪晶
        return `
          border-radius: 40% 60% 45% 55% / 55% 45% 55% 45%;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.35) 40%, rgba(186, 230, 253, 0.2) 70%, rgba(125, 211, 252, 0.4) 100%);
          backdrop-filter: blur(4px);
          box-shadow: 
            inset 0 4px 6px rgba(255, 255, 255, 0.8),
            inset 0 -3px 8px rgba(56, 189, 248, 0.15),
            0 4px 14px rgba(186, 230, 253, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.45);
          color: rgba(3, 105, 161, 0.8);
          stroke: rgba(3, 105, 161, 0.8);

          &::before {
            content: '';
            position: absolute;
            top: 3px;
            left: 6px;
            width: 8px;
            height: 4px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.7);
            transform: rotate(-10deg);
          }
        `;
      case 'ocean': // 首页海洋：深邃晶莹水滴
        return `
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(224, 242, 254, 0.25) 30%, rgba(14, 165, 233, 0.15) 75%, rgba(3, 105, 161, 0.55) 100%);
          backdrop-filter: blur(3px);
          box-shadow: 
            inset 0 3px 5px rgba(255, 255, 255, 0.7),
            inset 0 -3px 8px rgba(3, 105, 161, 0.25),
            0 4px 14px rgba(14, 165, 233, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.4);
          color: rgba(3, 105, 161, 0.85);
          stroke: rgba(3, 105, 161, 0.85);

          &::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 5px;
            width: 9px;
            height: 4px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.7);
            transform: rotate(-15deg);
          }
        `;
      case 'desert': // 图谱荒漠：温润琥珀/火漆印
        return `
          border-radius: 45% 45% 55% 55% / 50% 50% 50% 50%;
          background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(254, 243, 199, 0.3) 30%, rgba(245, 158, 11, 0.15) 75%, rgba(180, 83, 9, 0.5) 100%);
          backdrop-filter: blur(3px);
          box-shadow: 
            inset 0 3px 5px rgba(255, 255, 255, 0.7),
            inset 0 -3px 8px rgba(180, 83, 9, 0.25),
            0 4px 14px rgba(245, 158, 11, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.4);
          color: rgba(180, 83, 9, 0.85);
          stroke: rgba(180, 83, 9, 0.85);

          &::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 5px;
            width: 9px;
            height: 4px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.7);
            transform: rotate(-15deg);
          }
        `;
      case 'city': // 联系城市：微光信标/晨曦晶体
        return `
          border-radius: 55% 45% 50% 50% / 45% 55% 45% 55%;
          background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 237, 213, 0.3) 30%, rgba(249, 115, 22, 0.15) 75%, rgba(194, 65, 12, 0.5) 100%);
          backdrop-filter: blur(3px);
          box-shadow: 
            inset 0 3px 5px rgba(255, 255, 255, 0.7),
            inset 0 -3px 8px rgba(194, 65, 12, 0.25),
            0 4px 14px rgba(249, 115, 22, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.4);
          color: rgba(194, 65, 12, 0.85);
          stroke: rgba(194, 65, 12, 0.85);

          &::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 5px;
            width: 9px;
            height: 4px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.7);
            transform: rotate(-15deg);
          }
        `;
      case 'about': // 浮生道迹屿：神秘高雅的紫微帝星/灵台仙岛
        return `
          border-radius: 40% 40% 60% 40% / 40% 60% 40% 60%;
          background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.85) 0%, rgba(243, 232, 255, 0.3) 30%, rgba(168, 85, 247, 0.15) 75%, rgba(107, 33, 168, 0.55) 100%);
          backdrop-filter: blur(3px);
          box-shadow: 
            inset 0 3px 5px rgba(255, 255, 255, 0.7),
            inset 0 -3px 8px rgba(107, 33, 168, 0.25),
            0 4px 14px rgba(168, 85, 247, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.4);
          color: rgba(107, 33, 168, 0.85);
          stroke: rgba(107, 33, 168, 0.85);

          &::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 5px;
            width: 9px;
            height: 4px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.7);
            transform: rotate(-15deg);
          }
        `;
      default:
        return '';
    }
  }}

  /* Hover & Active 激活态（父卡片 hover 或选中时） */
  ${({ $biomeKey, $active }) => {
    let activeBg = '';
    let activeColor = '#ffffff';
    let activeShadow = '';
    let svgTransform = 'scale(1.15)';

    switch ($biomeKey) {
      case 'forest':
        activeBg = 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)';
        activeShadow = '0 6px 20px rgba(34, 197, 94, 0.35)';
        svgTransform = 'scale(1.18) rotate(12deg)';
        break;
      case 'snow':
        activeBg = 'linear-gradient(135deg, #e0f2fe 0%, #38bdf8 100%)';
        activeColor = '#0369a1';
        activeShadow = '0 6px 20px rgba(56, 189, 248, 0.25)';
        svgTransform = 'scale(1.18) rotate(45deg)';
        break;
      case 'ocean':
        activeBg = 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)';
        activeShadow = '0 6px 20px rgba(14, 165, 233, 0.35)';
        svgTransform = 'scale(1.18) rotate(-45deg)';
        break;
      case 'desert':
        activeBg = 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)';
        activeShadow = '0 6px 20px rgba(245, 158, 11, 0.32)';
        svgTransform = 'scale(1.18) rotate(15deg)';
        break;
      case 'city':
        activeBg = 'linear-gradient(135deg, #fb923c 0%, #c2410c 100%)';
        activeShadow = '0 6px 20px rgba(249, 115, 22, 0.32)';
        svgTransform = 'scale(1.18) translate(-1px, -1px)';
        break;
      case 'about':
        activeBg = 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)';
        activeShadow = '0 6px 20px rgba(168, 85, 247, 0.32)';
        svgTransform = 'scale(1.18) rotate(-10deg)';
        break;
      default:
        break;
    }

    const activeCSS = `
      background: ${activeBg};
      color: ${activeColor};
      stroke: ${activeColor};
      box-shadow: 
        inset 0 3px 6px rgba(255, 255, 255, 0.4),
        ${activeShadow},
        0 0 0 1.5px rgba(255, 255, 255, 0.7);
      border-color: rgba(255, 255, 255, 0.65);
      transform: scale(1.08);

      svg {
        transform: ${svgTransform};
        stroke: ${activeColor};
      }
    `;

    return `
      ${$active ? activeCSS : ''}
      
      button:hover & {
        ${activeCSS}
      }
    `;
  }}
`;

const getBiomeIcon = (key) => {
  switch (key) {
    case 'ocean':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case 'forest':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8.5C18.5 18 13.5 20 11 20z" />
          <path d="M19 2c-2.26 4.33-5.27 7.14-8 10" />
        </svg>
      );
    case 'desert':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      );
    case 'snow':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="12" y1="2" x2="12" y2="22" />
          <path d="m20 16-4-4 4-4" />
          <path d="m4 8 4 4-4 4" />
          <path d="m16 4-4 4-4-4" />
          <path d="m8 20 4-4 4 4" />
        </svg>
      );
    case 'city':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      );
    case 'about':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return null;
  }
};

const LegendText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  position: relative;
  z-index: 1;
  /* 去除之前过于弥散的光晕，改为极简的锐利白底描边，保持字体纯粹干脆 */
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.85);
`;

const LegendLabel = styled.span`
  font-size: 0.86rem;
  font-weight: 800;
  /* 同步图一的字间距，让字体显得更加舒展、圆润、大气 */
  letter-spacing: 0.08em;
  -webkit-font-smoothing: antialiased; /* 统一渲染策略，使深色字体边缘更平滑 */
`;

const LegendDescription = styled.span`
  color: rgba(7, 59, 76, 0.65);
  font-size: 0.68rem;
  line-height: 1.28;
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

const ControlPanel = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 100;
  width: 250px;
  padding: 0.85rem;
  border-radius: 10px;
  border: 1px solid rgba(0, 240, 255, 0.2);
  background: rgba(8, 12, 18, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 15px rgba(0, 240, 255, 0.05);
  color: #e0f2f1;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 0.76rem;
  pointer-events: all;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: border-color 0.3s ease;

  &:hover {
    border-color: rgba(0, 240, 255, 0.45);
  }

  h3 {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #00f0ff;
    text-shadow: 0 0 6px rgba(0, 240, 255, 0.35);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .mode-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.25rem;
  }

  button {
    background: rgba(0, 240, 255, 0.05);
    border: 1px solid rgba(0, 240, 255, 0.15);
    border-radius: 4px;
    color: rgba(224, 242, 241, 0.65);
    font-size: 0.66rem;
    font-weight: 700;
    padding: 0.35rem 0;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;

    &:hover {
      border-color: rgba(0, 240, 255, 0.4);
      color: #fff;
      background: rgba(0, 240, 255, 0.1);
    }

    &.active {
      background: rgba(0, 240, 255, 0.16);
      border-color: #00f0ff;
      color: #fff;
      box-shadow: 0 0 8px rgba(0, 240, 255, 0.25);
    }
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;

    label {
      font-size: 0.65rem;
      color: rgba(224, 242, 241, 0.5);
    }

    input {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(0, 240, 255, 0.15);
      border-radius: 4px;
      color: #fff;
      font-size: 0.7rem;
      padding: 0.25rem 0.4rem;
      outline: none;

      &:focus {
        border-color: #00f0ff;
      }
    }
  }

  .status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ef4444;
    box-shadow: 0 0 6px #ef4444;

    &.connected {
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }
  }

  .readout {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 0.35rem;
    font-family: monospace;
    font-size: 0.65rem;
    color: rgba(0, 240, 255, 0.8);
    line-height: 1.35;
  }
`;

const CameraPiP = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  width: 140px;
  height: 105px;
  border-radius: 8px;
  border: 1.5px solid rgba(0, 240, 255, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 100;
  background: #000;
  transform: scaleX(-1);
  pointer-events: none;
  
  canvas {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const FloatingCursor = styled.div`
  position: fixed;
  left: ${props => props.$left};
  top: ${props => props.$top};
  width: 10px;
  height: 10px;
  background: ${props => props.$isPinching ? '#10b981' : '#00f0ff'};
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 99999;
  pointer-events: none;
  box-shadow: 
    0 0 8px ${props => props.$isPinching ? '#10b981' : '#00f0ff'},
    0 0 16px ${props => props.$isPinching ? '#10b981' : '#00f0ff'};
  transition: background-color 0.15s, transform 0.1s;

  ${props => props.$isPinching && 'transform: translate(-50%, -50%) scale(0.75);'}

  &::before {
    content: '';
    position: absolute;
    top: -12px;
    left: -12px;
    right: -12px;
    bottom: -12px;
    border-radius: 50%;
    border: 1.5px solid rgba(0, 240, 255, 0.3);
    animation: cursorSpin 6s linear infinite;
  }

  &::after {
    content: '';
    position: absolute;
    top: -12px;
    left: -12px;
    right: -12px;
    bottom: -12px;
    border-radius: 50%;
    border: 2px solid #00f0ff;
    border-color: #00f0ff transparent transparent transparent;
    opacity: ${props => props.$dwellProgress > 0 ? 1 : 0};
    transform: rotate(${props => props.$dwellProgress * 3.6}deg);
    transition: opacity 0.1s;
  }

  @keyframes cursorSpin {
    to { transform: rotate(360deg); }
  }
`;


function HeroSection3D({ onActiveBiomeChange }) {
  const navigate = useNavigate();
  const [activeBiome, setActiveBiome] = useState(null);

  // Hand tracking states from context
  const {
    trackingMode,
    setTrackingMode,
    handDetected,
    cursor,
    isPinching,
    isFist,
    wsUrl,
    setWsUrl,
    isConnected,
    cameraActive,
    canvasRef,
  } = useHandTracking();

  const [dwellProgress, setDwellProgress] = useState(0);

  const handleActiveBiomeChange = useCallback((biomeKey) => {
    setActiveBiome(biomeKey);
    onActiveBiomeChange?.(biomeKey);
  }, [onActiveBiomeChange]);

  const handleNavigate = useCallback((href) => {
    navigate(href);
  }, [navigate]);

  const handleLegendClick = useCallback((biomeKey) => {
    const biome = BIOMES[biomeKey];
    if (!biome) return;

    handleActiveBiomeChange(biomeKey);
    window.setTimeout(() => navigate(biome.href), 220);
  }, [navigate, handleActiveBiomeChange]);

  // 1. Dwell Click timer logic
  useEffect(() => {
    if (trackingMode === TRACKING_MODES.MOUSE || !handDetected || !activeBiome) {
      setDwellProgress(0);
      return;
    }

    const duration = 1200; // 1.2s hover dwell duration
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setDwellProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        const biome = BIOMES[activeBiome];
        if (biome) {
          handleActiveBiomeChange(activeBiome);
          window.setTimeout(() => navigate(biome.href), 150);
        }
      }
    }, 16);

    return () => clearInterval(interval);
  }, [activeBiome, handDetected, trackingMode, navigate, handleActiveBiomeChange]);

  // 2. Pinch Click trigger logic
  useEffect(() => {
    if (trackingMode !== TRACKING_MODES.MOUSE && handDetected && activeBiome && isPinching) {
      const biome = BIOMES[activeBiome];
      if (biome) {
        handleActiveBiomeChange(activeBiome);
        window.setTimeout(() => navigate(biome.href), 150);
      }
    }
  }, [isPinching, activeBiome, handDetected, trackingMode, navigate, handleActiveBiomeChange]);

  const cursorLeft = `${(cursor.x + 1) * 50}%`;
  const cursorTop = `${(1 - cursor.y) * 50}%`;

  return (
    <HeroWrapper>
      <CanvasWrapper>
        <ErrorBoundary>
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
              onBiomeHover={handleActiveBiomeChange}
              onBiomeSelect={handleActiveBiomeChange}
              onNavigate={handleNavigate}
            />
            <HandHologram />
            <Preload all />
          </Suspense>
        </Canvas>
        </ErrorBoundary>
      </CanvasWrapper>

      {/* Floating HUD Cyber Cursor */}
      {handDetected && trackingMode !== TRACKING_MODES.MOUSE && (
        <FloatingCursor
          $left={cursorLeft}
          $top={cursorTop}
          $isPinching={isPinching}
          $dwellProgress={dwellProgress}
        />
      )}

      {/* Camera PiP Window */}
      {trackingMode === TRACKING_MODES.CAMERA && cameraActive && (
        <CameraPiP>
          <canvas ref={canvasRef} width="640" height="480" />
        </CameraPiP>
      )}

      {/* Sci-Fi Control Panel */}
      <ControlPanel>
        <h3>
          空间交互控制台
          <span className={`status-dot ${isConnected || (trackingMode === TRACKING_MODES.CAMERA && cameraActive) ? 'connected' : ''}`} />
        </h3>
        
        <div className="mode-row">
          <button
            className={trackingMode === TRACKING_MODES.MOUSE ? 'active' : ''}
            onClick={() => setTrackingMode(TRACKING_MODES.MOUSE)}
          >
            鼠标
          </button>
          <button
            className={trackingMode === TRACKING_MODES.CAMERA ? 'active' : ''}
            onClick={() => setTrackingMode(TRACKING_MODES.CAMERA)}
          >
            相机
          </button>
          <button
            className={trackingMode === TRACKING_MODES.WEBSOCKET ? 'active' : ''}
            onClick={() => setTrackingMode(TRACKING_MODES.WEBSOCKET)}
          >
            网口
          </button>
          <button
            className={trackingMode === TRACKING_MODES.SIMULATE ? 'active' : ''}
            onClick={() => setTrackingMode(TRACKING_MODES.SIMULATE)}
          >
            模拟
          </button>
        </div>

        {trackingMode === TRACKING_MODES.WEBSOCKET && (
          <div className="input-group">
            <label>WebSocket Server URL</label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
            />
          </div>
        )}

        <div className="readout">
          状态: {trackingMode.toUpperCase()}<br />
          手部侦测: {handDetected ? 'DETECTED' : 'NOT DETECTED'}<br />
          指针坐标: X:{cursor.x.toFixed(2)} Y:{cursor.y.toFixed(2)}<br />
          动作: {isPinching ? '捏合 (Click)' : isFist ? '握拳 (Drag)' : '悬停 (Hover)'}
          {dwellProgress > 0 && <><br />确认进度: {Math.round(dwellProgress)}%</>}
        </div>
      </ControlPanel>

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
          松果星寰仪
          <span className="en-sub">Pinecone Orrery · Aether Mirror</span>
        </HeroTitle>

        <HeroSubtitle
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.6 }}
        >
          此仪为以太交织而成的幻象之茧。本站的书卷手札、思维星图、炼金法阵与精神信标，皆被压缩并封印在这一颗缓缓流转的三维微型星体中。拨动星体，开启通往异世界的时空之门。
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
                $bgImage={biome.bgImage}
                onMouseEnter={() => handleActiveBiomeChange(biome.key)}
                onMouseLeave={() => handleActiveBiomeChange(null)}
                onClick={() => handleLegendClick(biome.key)}
              >
                <LegendSwatch
                  $biomeKey={biome.key}
                  $color={biome.color}
                  $glow={biome.glow}
                  $active={isActive}
                >
                  {getBiomeIcon(biome.key)}
                </LegendSwatch>
                <LegendText>
                  <LegendLabel>{biome.label}</LegendLabel>
                  <LegendDescription>{biome.description}</LegendDescription>
                </LegendText>
              </LegendItem>
            );
          })}
        </PlanetLegend>
      </Overlay>

      <HintText>🔮 拨动星体以旋转命运 · 滚动视界以缩放虚空 · 点击漂浮大陆以开启传送</HintText>

    </HeroWrapper>
  );
}

export default HeroSection3D;
