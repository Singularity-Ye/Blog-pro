import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence, useTransform, useMotionValue, animate } from 'framer-motion';
import Lanyard from '../components/Lanyard/Lanyard';
import FlowingMenu from '../components/Animations/FlowingMenu';
import Marquee from '../components/Animations/Marquee';
import VariableProximity from '../components/Animations/VariableProximity';
import CircularText from '../components/Animations/CircularText';
import CurvedLoop from '../components/Animations/CurvedLoop';

// 导入主页背景图作为 FlowingMenu 的精美胶囊封面
import forestImg from '../assets/images/home/card-forest.png';
import oceanImg from '../assets/images/home/card-ocean.png';
import snowImg from '../assets/images/home/card-snow.png';
import cityImg from '../assets/images/home/card-city.png';


// 导入名片正面与水色玻璃名片背景
import cardWateryImage from '../assets/images/contact/card_watery.jpg';
import cardBackImage from '../assets/images/contact/cardback_watery.jpg';
import avatarImage from '../assets/images/github.png';

// 导入生成的石灯笼、灯荷、荷叶与大背景分段图片
import stoneLanternImg from '../assets/images/contact/stone_lantern.png';
import glowingLotusImg from '../assets/images/contact/glowing_lotus.png';
import lilyPadImg from '../assets/images/contact/lily_pad.png';
import section01Img from '../assets/images/contact/section-01.png';
import section02Img from '../assets/images/contact/section-02.png';
import section03Img from '../assets/images/contact/section-03.png';

/* ─────────────────────────────────────────
   CSS 动画定义 & 青蛙邮差样式
   ───────────────────────────────────────── */
const textGlow = keyframes`
  0%, 100% {
    text-shadow: 0 0 10px rgba(231, 199, 126, 0.15), 0 0 20px rgba(90, 163, 143, 0.05);
  }
  50% {
    text-shadow: 0 0 20px rgba(231, 199, 126, 0.35), 0 0 35px rgba(90, 163, 143, 0.18);
  }
`;

const pulseDot = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 10px #10b981; }
`;

const LeftColumnWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  
  @media (min-width: 992px) {
    margin-top: 2.2rem;
  }
`;

const FrogSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: rgba(4, 12, 10, 0.35);
  border: 1px solid rgba(231, 199, 126, 0.12);
  border-radius: 20px;
  padding: 1.2rem;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 
    0 15px 30px rgba(0, 0, 0, 0.35),
    inset 0 1px 1px rgba(255, 255, 255, 0.03);
  width: 100%;
  pointer-events: auto;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
  }
`;

const FrogImageContainer = styled.div`
  width: 70px;
  height: 70px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const FrogImage = styled(motion.img)`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const FrogPlaceholderBox = styled.div`
  width: 100%;
  height: 100%;
  border: 1.5px dashed rgba(231, 199, 126, 0.3);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(231, 199, 126, 0.65);
  font-size: 0.65rem;
  gap: 4px;
  background: rgba(231, 199, 126, 0.05);
  text-align: center;
  font-weight: 700;
`;

const FrogSpeechBubble = styled(motion.div)`
  position: relative;
  background: #f5efe3;
  color: #0c1a15;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.55;
  flex: 1;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(12, 26, 21, 0.08);

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translateY(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: transparent #f5efe3 transparent transparent;
  }

  @media (max-width: 576px) {
    &::after {
      content: '';
      position: absolute;
      top: -12px;
      left: 50%;
      right: auto;
      transform: translateX(-50%);
      border-width: 6px;
      border-color: transparent transparent #f5efe3 transparent;
    }
  }
`;

const FROG_DIALOGS = {
  idle: '（端起竿子）呱……闲来无事，在池边垂钓。道友若有传音手札，投入池中便可！',
  hovered: '呱！别闹，惊走在下的鱼儿了！鱼儿游走就只能吃蚊子了……',
  typing: '嗯？看道友神色凝重、运笔如飞，是要给在下捎信去松果屋么？',
  submitting: '哟，飞剑传信落水了！看在下使一招【风生水起】，这就收线钓上来！',
  success: '（收进背篓）呱！手札已稳稳钓起！在下这就带回松果屋，请道友静候回音！'
};

/* ─────────────────────────────────────────
   Styled Components 样式设计
   ───────────────────────────────────────── */
const ContactWrapper = styled.div`
  height: 100vh;
  width: 100%;
  position: relative;
  background: #000000;
  color: #f5efe3;
  overflow: hidden;
`;

const CanvasBackground = styled.canvas`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  width: 100%;
  height: 100%;
`;

const SectionContainer = styled.section`
  position: relative;
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const StickyStage = styled.div`
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
`;

const SectionBackground = styled(motion.div)`
  position: absolute;
  inset: -10vh 0;
  background-image: url(${props => props.src});
  background-repeat: no-repeat;
  background-position: center center;
  background-size: cover;
  z-index: 0;
  pointer-events: none;
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: ${props => props.overlayGradient};
  }
`;

const StageContent = styled(motion.div)`
  width: 100%;
  max-width: 1300px;
  height: 100%;
  margin: 0 auto;
  padding: 6.5rem 2rem 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 3;
  pointer-events: auto;
`;

const Section2Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  width: 100%;
  align-items: center;

  @media (min-width: 992px) {
    grid-template-columns: 50% 50%;
  }
`;

const Section3Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.2rem;
  width: 100%;
  align-items: start;

  @media (min-width: 992px) {
    grid-template-columns: 55% 45%;
  }
`;

const ContactTitle = styled.h1`
  font-family: 'Outfit', 'Inter', "SF Pro", "Microsoft YaHei", sans-serif;
  font-size: 3.8rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  background: linear-gradient(135deg, #e7c77e 0%, #c49a45 50%, #5aa38f 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 1.2rem;
  padding-right: -0.28em;
  filter: drop-shadow(0 2px 10px rgba(231, 199, 126, 0.12));
  animation: ${textGlow} 6s infinite ease-in-out;

  @media (max-width: 768px) {
    font-size: 2.5rem;
    letter-spacing: 0.18em;
  }
`;

const PageTitleArea = styled.div`
  margin-bottom: 0.5rem;
  p {
    font-size: 0.95rem;
    color: rgba(245, 239, 227, 0.7);
    line-height: 1.7;
    margin-top: 0.5rem;
  }
`;

const FlowingMenuContainer = styled.div`
  background: rgba(4, 12, 10, 0.32);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(231, 199, 126, 0.12);
  border-radius: 24px;
  padding: 1.6rem;
  box-shadow: 
    0 30px 60px rgba(0, 0, 0, 0.45),
    inset 0 1px 1px rgba(255, 255, 255, 0.03);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  z-index: 12;
  pointer-events: auto;
  margin-top: 0.5rem;
`;

const FlowingMenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1.5px solid rgba(231, 199, 126, 0.1);
  padding-bottom: 0.8rem;

  h4 {
    font-size: 1.05rem;
    font-weight: 700;
    color: #e7c77e;
    letter-spacing: 0.05em;
    margin: 0;
  }

  span {
    font-size: 0.7rem;
    color: rgba(245, 239, 227, 0.35);
    font-family: monospace;
    text-transform: uppercase;
  }
`;

const FlowingMenuWrapper = styled.div`
  height: 240px;
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(231, 199, 126, 0.08);
`;

const GlassCardForm = styled.form`
  background: rgba(4, 12, 10, 0.45);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(231, 199, 126, 0.16);
  border-radius: 24px;
  padding: 2.2rem;
  box-shadow: 
    0 35px 70px rgba(0, 0, 0, 0.55),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  position: relative;
  z-index: 12;
  pointer-events: auto;
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1.5px solid rgba(231, 199, 126, 0.12);
  padding-bottom: 0.9rem;
  margin-bottom: 0.4rem;

  h3 {
    font-size: 1.2rem;
    font-weight: 700;
    color: #e7c77e;
    letter-spacing: 0.03em;
  }

  span {
    font-size: 0.72rem;
    color: rgba(245, 239, 227, 0.4);
    font-family: monospace;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  label {
    font-size: 0.78rem;
    color: rgba(231, 199, 126, 0.78);
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  input, textarea {
    background: transparent;
    border: none;
    border-bottom: 1.5px solid rgba(231, 199, 126, 0.22);
    border-radius: 0;
    padding: 0.7rem 0.2rem;
    color: #f5efe3;
    font-size: 0.92rem;
    outline: none;
    transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);

    &::placeholder {
      color: rgba(245, 239, 227, 0.35);
    }

    &:focus {
      border-bottom-color: rgba(231, 199, 126, 0.8);
      filter: drop-shadow(0 4px 10px rgba(231, 199, 126, 0.08));
      transform: translateY(-1px);
    }
  }

  textarea {
    resize: none;
    min-height: 110px;
    line-height: 1.6;
  }
`;

const SubmitButton = styled(motion.button)`
  height: 48px;
  background: linear-gradient(135deg, #b98234, #7b4a18);
  border: 1px solid rgba(255, 247, 223, 0.15);
  border-radius: 14px;
  color: #f5efe3;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 10px 25px rgba(123, 74, 24, 0.32);
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #c8923e, #8b5520);
    box-shadow: 0 12px 30px rgba(123, 74, 24, 0.45);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const ToastBox = styled(motion.div)`
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  background: rgba(10, 26, 20, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 16px;
  padding: 0.9rem 1.6rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  gap: 10px;
  color: #e0e7ff;
  font-size: 0.88rem;

  .toast-icon {
    font-size: 1.1rem;
    color: #10b981;
  }
`;

const MobileCardSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1rem 0;

  @media (min-width: 992px) {
    display: none;
  }
`;

const CardInstruction = styled.div`
  font-size: 0.75rem;
  color: rgba(231, 199, 126, 0.6);
  margin-top: 0.8rem;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(231, 199, 126, 0.05);
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(231, 199, 126, 0.1);
`;

const CardContainer3D = styled.div`
  perspective: 1000px;
  width: 250px;
  height: 324px;
  cursor: pointer;
`;

const FlipCard = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.flipped {
    transform: rotateY(180deg);
  }
`;

const CardFace = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
`;

const CardFront = styled(CardFace)`
  z-index: 2;
  transform: rotateY(0deg);
  background: rgba(4, 12, 10, 0.6);
  border: 1px solid rgba(231, 199, 126, 0.2);
`;

const CardBack = styled(CardFace)`
  transform: rotateY(180deg);
  background: rgba(3, 18, 14, 0.9);
  border: 1.5px solid rgba(231, 199, 126, 0.35);
  padding: 1.6rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #f5efe3;

  .header {
    font-size: 0.82rem;
    color: #e7c77e;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-align: center;
  }

  .divider {
    height: 1px;
    background: rgba(231, 199, 126, 0.15);
    margin: 0.6rem 0;
  }

  .rows {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.82rem;

    .label {
      color: rgba(245, 239, 227, 0.45);
      font-weight: 600;
    }

    .val {
      color: rgba(245, 239, 227, 0.9);
      font-weight: 700;
    }

    .status-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      margin-right: 6px;
      box-shadow: 0 0 8px #10b981;
      animation: ${pulseDot} 2s infinite;
    }
  }

  .footer-tag {
    font-size: 0.72rem;
    color: rgba(231, 199, 126, 0.5);
    text-align: center;
    font-family: monospace;
  }

  .slogan {
    font-size: 0.78rem;
    color: rgba(245, 239, 227, 0.7);
    line-height: 1.5;
    text-align: center;
    margin-top: 0.4rem;
  }
`;

const FloatingButtonGroup = styled(motion.div)`
  position: fixed;
  bottom: 6rem;
  right: 2rem;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  @media (max-width: 992px) {
    display: none;
  }
`;

const LanyardControlBtn = styled(motion.button)`
  background: rgba(6, 18, 14, 0.65);
  border: 1px solid rgba(231, 199, 126, 0.25);
  border-radius: 30px;
  color: #e7c77e;
  padding: 0.55rem 1.1rem;
  font-size: 0.75rem;
  cursor: pointer;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.25s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  &:hover {
    background: rgba(231, 199, 126, 0.18);
    border-color: #e7c77e;
    box-shadow: 0 4px 16px rgba(231, 199, 126, 0.15);
  }
`;

const DotNav = styled.div`
  position: fixed;
  right: 2.2rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  z-index: 10002;

  @media (max-width: 992px) {
    right: 1.2rem;
    gap: 0.9rem;
  }
`;

const NavDot = styled.button`
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1.5px solid rgba(231, 199, 126, 0.45);
  background: ${props => props.$active ? '#e7c77e' : 'transparent'};
  cursor: pointer;
  padding: 0;
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
  outline: none;
  box-shadow: ${props => props.$active ? '0 0 10px rgba(231, 199, 126, 0.8)' : 'none'};

  &:hover {
    transform: scale(1.3);
    border-color: #e7c77e;
    box-shadow: 0 0 8px rgba(231, 199, 126, 0.6);
  }
`;

/* ─────────────────────────────────────────
   萌系抠图组件 — 动态将白色背景过滤为透明的 Canvas 渲染器
   ───────────────────────────────────────── */
function TransparentImage({ src, avatarSrc = avatarImage, alt, className, style }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const bgImg = new Image();
    const avatarImg = new Image();
    
    let bgLoaded = false;
    let avatarLoaded = false;
    
    const draw = () => {
      if (!bgLoaded || !avatarLoaded) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const W = bgImg.width;
      const H = bgImg.height;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      
      // 1. 先在临时 canvas 抠图背景，防止误伤头像/文字
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = W;
      tempCanvas.height = H;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(bgImg, 0, 0);
      
      const imgData = tempCtx.getImageData(0, 0, W, H);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const dist = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);
        if (dist < 45) {
          data[i + 3] = 0;
        } else if (dist < 85) {
          const factor = (dist - 45) / 40;
          data[i + 3] = Math.round(data[i + 3] * factor);
        }
      }
      tempCtx.putImageData(imgData, 0, 0);
      
      // 2. 绘制透明底图
      ctx.drawImage(tempCanvas, 0, 0);
      
      // 3. 绘制自定义圆形头像
      const cx = W / 2;
      const cy = H * 0.327;
      const r = W * 0.141;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
      
      // 4. 绘制文字
      ctx.fillStyle = 'rgba(21, 80, 65, 0.88)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      const textX = W * 0.334;
      const lines = [
        '松果屋屋主（Singularity_Ye）',
        'y2915872819@gmail.com',
        '松果屋 · 探索与构建'
      ];

      // 动态调整字体大小以防止溢出槽线
      let fontSize = W * 0.038;
      const maxTextWidth = W * 0.48; // 可绘制的最大宽度，留出安全边距
      ctx.font = `bold ${fontSize}px "Inter", "SF Pro", "Microsoft YaHei", sans-serif`;
      while (lines.some(line => ctx.measureText(line).width > maxTextWidth) && fontSize > W * 0.02) {
        fontSize -= 0.5;
        ctx.font = `bold ${fontSize}px "Inter", "SF Pro", "Microsoft YaHei", sans-serif`;
      }

      // 写入信息槽
      ctx.fillText(lines[0], textX, H * 0.515);
      ctx.fillText(lines[1], textX, H * 0.630);
      ctx.fillText(lines[2], textX, H * 0.745);
    };
    
    bgImg.src = src;
    bgImg.crossOrigin = 'anonymous';
    bgImg.onload = () => { bgLoaded = true; draw(); };
    
    avatarImg.src = avatarSrc;
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.onload = () => { avatarLoaded = true; draw(); };
  }, [src, avatarSrc]);

  return <canvas ref={canvasRef} className={className} style={{ ...style, objectFit: 'contain' }} />;
}

/* ─────────────────────────────────────────
   主页面组件
   ───────────────────────────────────────── */
export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileFlipped, setMobileFlipped] = useState(false);
  const [frogState, setFrogState] = useState('idle');
  const [isLetterFlying, setIsLetterFlying] = useState(false);
  const [frogImageError, setFrogImageError] = useState(false);
 
  const canvasRef = useRef(null);

  const sec1Ref = useRef(null);
  const sec2Ref = useRef(null);
  const sec3Ref = useRef(null);

  const [activeSection, setActiveSection] = useState(0);
  const simulatedScrollY = useMotionValue(0);
  const isTransitioningRef = useRef(false);

  const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  useEffect(() => {
    const handleResize = () => {
      const newVh = window.innerHeight;
      setVh(newVh);
      simulatedScrollY.set(activeSection * newVh);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeSection, simulatedScrollY]);

  const transitionToSection = (index) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setActiveSection(index);

    animate(simulatedScrollY, index * vh, {
      duration: 1.1,
      ease: [0.76, 0, 0.24, 1] // easeInOutQuart
    }).then(() => {
      isTransitioningRef.current = false;
    });
  };

  const handleWheel = (e) => {
    if (e.defaultPrevented) return;
    if (isTransitioningRef.current) return;
    const deltaY = e.deltaY;
    if (Math.abs(deltaY) < 35) return;

    let target = activeSection;
    if (deltaY > 0) {
      if (activeSection < 2) target = activeSection + 1;
    } else {
      if (activeSection > 0) target = activeSection - 1;
    }

    if (target !== activeSection) {
      transitionToSection(target);
    }
  };

  const touchStartYRef = useRef(0);

  const handleTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (isTransitioningRef.current) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartYRef.current - touchEndY;
    if (Math.abs(diffY) < 50) return;

    let target = activeSection;
    if (diffY > 0) {
      if (activeSection < 2) target = activeSection + 1;
    } else {
      if (activeSection > 0) target = activeSection - 1;
    }

    if (target !== activeSection) {
      transitionToSection(target);
    }
  };

  const section1Opacity = useTransform(simulatedScrollY, [0, vh * 0.3, vh * 0.8], [1, 1, 0]);
  const section1Y = useTransform(simulatedScrollY, [0, vh * 0.8], [0, -80]);
  const section1Scale = useTransform(simulatedScrollY, [0, vh * 0.8], [1, 0.93]);
  const section1Filter = useTransform(simulatedScrollY, [0, vh * 0.8], ["blur(0px)", "blur(8px)"]);

  const sec2ContentOpacity = useTransform(simulatedScrollY, [vh * 0.3, vh * 1.0, vh * 1.7], [0, 1, 0]);
  const sec2ContentY = useTransform(simulatedScrollY, [vh * 0.3, vh * 1.0, vh * 1.7], [60, 0, -60]);
  const sec2ContentScale = useTransform(simulatedScrollY, [vh * 0.3, vh * 1.0, vh * 1.7], [0.93, 1, 0.93]);
  const sec2ContentFilter = useTransform(simulatedScrollY, [vh * 0.3, vh * 1.0, vh * 1.7], ["blur(8px)", "blur(0px)", "blur(8px)"]);

  const sec3ContentOpacity = useTransform(simulatedScrollY, [vh * 1.3, vh * 2.0], [0, 1]);
  const sec3ContentY = useTransform(simulatedScrollY, [vh * 1.3, vh * 2.0], [60, 0]);
  const sec3ContentScale = useTransform(simulatedScrollY, [vh * 1.3, vh * 2.0], [0.93, 1]);
  const sec3ContentFilter = useTransform(simulatedScrollY, [vh * 1.3, vh * 2.0], ["blur(8px)", "blur(0px)"]);

  const lanyardOpacity = useTransform(
    simulatedScrollY,
    [vh * 0.3, vh * 1.0, vh * 1.7],
    [0, 1, 0]
  );

  // 背景图片纵向视差动画
  const bg1Y = useTransform(simulatedScrollY, [0, vh], [-vh * 0.08, vh * 0.08]);
  const bg2Y = useTransform(simulatedScrollY, [0, vh, vh * 2], [-vh * 0.08, 0, vh * 0.08]);
  const bg3Y = useTransform(simulatedScrollY, [vh, vh * 2, vh * 3], [-vh * 0.08, 0, vh * 0.08]);

  // 背景透明度 (用于过渡黑底)
  const bg1Opacity = useTransform(simulatedScrollY, [0, vh * 0.5, vh * 0.9], [1, 1, 0]);
  const bg2Opacity = useTransform(simulatedScrollY, [vh * 0.2, vh * 0.5, vh * 1.0, vh * 1.5, vh * 1.8], [0, 0, 1, 0, 0]);
  const bg3Opacity = useTransform(simulatedScrollY, [vh * 1.2, vh * 1.5, vh * 2.0], [0, 0, 1]);

  const pageTranslationY = useTransform(simulatedScrollY, (val) => -val);

  const mindQuotes = [
    {
      link: '/blog',
      text: '叶间书林 · 博客',
      marqueeText: '叶间书林 / Whispering Leaves · 记录探索者的日常、心路与狂想碎片 · Whispering Leaves',
      image: forestImg
    },
    {
      link: '/graph',
      text: '星沙图原 · 图谱',
      marqueeText: '星沙图原 / Astral sands · Obsidian 知识图谱 of the Blog · Astral Sands Map',
      image: oceanImg
    },
    {
      link: '/projects',
      text: '万象熔炉 · 项目',
      marqueeText: '万象熔炉 / Forge of Visions · 炼金术士的大胆狂想与魔法造物展示 · Forge of Visions',
      image: snowImg
    },
    {
      link: '/about',
      text: '松果密室 · 关于',
      marqueeText: '松果密室 / Secret Chamber · 探索松果屋背后的世界观与屋主侧写 · Secret Chamber',
      image: cityImg
    }
  ];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 992);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Lock scrolling on document/body for virtual snapping
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    const particles = [];
    const sparkles = [];
    const ripples = [];
    let sec1ActiveOffset = 0;
    let sec2ActiveOffset = 0;

    let transparentLantern = null;
    let transparentLotus = null;
    let transparentLilyPad = null;

    const lanternImg = new Image();
    lanternImg.src = stoneLanternImg;
    lanternImg.onload = () => { transparentLantern = lanternImg; };

    const lotusImg = new Image();
    lotusImg.src = glowingLotusImg;
    lotusImg.onload = () => { transparentLotus = lotusImg; };

    const padImg = new Image();
    padImg.src = lilyPadImg;
    padImg.onload = () => { transparentLilyPad = padImg; };

    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.offsetWidth;
      height = parent.offsetHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    class Firefly {
      constructor() { this.reset(true); }
      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + Math.random() * 60;
        this.size = Math.random() * 2.8 + 1.2;
        this.speedY = -(Math.random() * 0.5 + 0.18);
        this.speedX = Math.random() * 0.25 - 0.125;
        this.wobbleSpeed = Math.random() * 0.02 + 0.005;
        this.wobbleValue = Math.random() * Math.PI * 2;
        this.color = Math.random() > 0.6 ? 'rgba(231, 199, 126, ' : 'rgba(90, 163, 143, ';
        this.alpha = Math.random() * 0.5 + 0.15;
      }
      update() {
        this.y += this.speedY;
        this.wobbleValue += this.wobbleSpeed;
        this.x += this.speedX + Math.sin(this.wobbleValue) * 0.22;
        if (this.y < -10) this.reset();
      }
      draw() {
        ctx.fillStyle = this.color + this.alpha + ')';
        ctx.shadowBlur = this.size * 2.5;
        ctx.shadowColor = this.color.includes('231') ? 'rgba(231,199,126,0.8)' : 'rgba(90,163,143,0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    class Sparkle {
      constructor(x, y, colorType = 'gold', customSize) {
        this.x = x;
        this.y = y;
        this.size = customSize || Math.random() * 2.8 + 1.2;
        this.life = 1.0;
        this.decay = Math.random() * 0.025 + 0.015;
        this.speedX = Math.random() * 1.0 - 0.5;
        this.speedY = Math.random() * 1.0 - 0.5 - (colorType === 'card' ? 0.25 : 0);
        this.colorType = colorType;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
      }
      draw() {
        let col = `rgba(231, 199, 126, ${this.life})`;
        let shadowCol = 'rgba(231, 199, 126, 0.8)';
        if (this.colorType === 'pine') {
          col = `rgba(90, 163, 143, ${this.life})`;
          shadowCol = 'rgba(90, 163, 143, 0.8)';
        } else if (this.colorType === 'card') {
          col = `rgba(251, 113, 133, ${this.life})`;
          shadowCol = 'rgba(251, 113, 133, 0.8)';
        }
        ctx.fillStyle = col;
        ctx.shadowBlur = this.size * 2;
        ctx.shadowColor = shadowCol;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    class Ripple {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 1;
        this.maxRadius = Math.random() * 60 + 50;
        this.life = 1.0;
        this.speed = Math.random() * 1.3 + 1.1;
      }
      update() {
        this.radius += this.speed;
        this.life = 1.0 - (this.radius / this.maxRadius);
      }
      draw() {
        if (this.life <= 0) return;
        ctx.strokeStyle = `rgba(90, 163, 143, ${this.life * 0.35})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    class Bubble {
      constructor() { this.reset(true); }
      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + Math.random() * 50;
        this.size = Math.random() * 3 + 1.2;
        this.speedY = -(Math.random() * 0.35 + 0.12);
        this.wobbleSpeed = Math.random() * 0.015 + 0.003;
        this.wobbleValue = Math.random() * Math.PI * 2;
        this.alpha = Math.random() * 0.28 + 0.06;
      }
      update() {
        this.y += this.speedY;
        this.wobbleValue += this.wobbleSpeed;
        this.x += Math.sin(this.wobbleValue) * 0.12;
        if (this.y < -10) this.reset();
      }
      draw() {
        ctx.strokeStyle = `rgba(90, 163, 143, ${this.alpha})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.55})`;
        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 萤灯/灯荷 (follows Section 2 water scroll)
    class LotusLantern {
      constructor() { this.reset(true); }
      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + Math.random() * 80;
        this.size = Math.random() * 15 + 20;
        this.speedY = -(Math.random() * 0.12 + 0.04);
        this.wobbleSpeed = Math.random() * 0.008 + 0.002;
        this.wobbleValue = Math.random() * Math.PI * 2;
        this.alpha = Math.random() * 0.45 + 0.4;
      }
      update() {
        this.y += this.speedY;
        this.x += Math.sin(this.wobbleValue) * 0.12;
        this.wobbleValue += this.wobbleSpeed;
        if (this.y < -30) this.reset();
      }
      draw() {
        ctx.save();
        const cx = this.x;
        const cy = this.y + sec2ActiveOffset; // Applied Section 2 parallax offset
        const r = this.size;
        ctx.shadowBlur = r * 2.5;
        ctx.shadowColor = 'rgba(231, 199, 126, 0.8)';
        if (transparentLotus) {
          ctx.globalAlpha = this.alpha;
          ctx.drawImage(transparentLotus, cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
        } else {
          ctx.fillStyle = `rgba(231, 199, 126, ${this.alpha})`;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // 荷叶 (follows Section 2 water scroll)
    class LilyPad {
      constructor() { this.reset(true); }
      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + Math.random() * 100;
        this.size = Math.random() * 30 + 35;
        this.speedY = -(Math.random() * 0.06 + 0.02);
        this.wobbleSpeed = Math.random() * 0.004 + 0.001;
        this.wobbleValue = Math.random() * Math.PI * 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.alpha = Math.random() * 0.35 + 0.25;
      }
      update() {
        this.y += this.speedY;
        this.x += Math.sin(this.wobbleValue) * 0.08;
        this.wobbleValue += this.wobbleSpeed;
        if (this.y < -80) this.reset();
      }
      draw() {
        ctx.save();
        const cx = this.x;
        const cy = this.y + sec2ActiveOffset; // Applied Section 2 parallax offset
        const r = this.size;
        ctx.shadowBlur = r * 0.3;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        if (transparentLilyPad) {
          ctx.globalAlpha = this.alpha;
          ctx.translate(cx, cy);
          ctx.rotate(this.rotation);
          ctx.drawImage(transparentLilyPad, -r, -r, r * 2, r * 2);
        } else {
          ctx.fillStyle = `rgba(16, 58, 44, ${this.alpha})`;
          ctx.strokeStyle = `rgba(90, 163, 143, ${this.alpha * 1.5})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const wedgeAngle = 0.4;
          const startAngle = this.rotation + wedgeAngle;
          const endAngle = this.rotation + Math.PI * 2 - wedgeAngle;
          ctx.arc(cx, cy, r, startAngle, endAngle);
          ctx.lineTo(cx, cy);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    for (let i = 0; i < 28; i++) particles.push(new Firefly());
    const bubbles = [];
    for (let i = 0; i < 12; i++) bubbles.push(new Bubble());
    const lotuses = [];
    for (let i = 0; i < 6; i++) lotuses.push(new LotusLantern());
    const lilyPads = [];
    for (let i = 0; i < 7; i++) lilyPads.push(new LilyPad());

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (Math.random() < 0.28) sparkles.push(new Sparkle(x, y, Math.random() > 0.5 ? 'gold' : 'pine'));
    };
    canvas.parentElement.addEventListener('mousemove', handleMouseMove);

    const handleMouseClick = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('.social-card')) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ripples.push(new Ripple(x, y));
      for (let i = 0; i < 8; i++) sparkles.push(new Sparkle(x, y, 'pine', Math.random() * 2 + 1));
    };
    canvas.parentElement.addEventListener('click', handleMouseClick);

    const handleCardDrag = (e) => {
      const { x, y } = e.detail;
      sparkles.push(new Sparkle(x, y, 'card', Math.random() * 3.5 + 2));
      sparkles.push(new Sparkle(x, y, 'card', Math.random() * 2 + 1));
    };
    window.addEventListener('card-drag', handleCardDrag);

    const handleCardSwing = (e) => {
      const { x, y } = e.detail;
      if (Math.random() < 0.45) sparkles.push(new Sparkle(x, y, 'card', Math.random() * 2 + 1));
    };
    window.addEventListener('card-swing', handleCardSwing);

    // canopy hanging lantern (follows Section 1 canopy scroll)
    const drawHangingLantern = () => {
      const w = width;
      if (w < 992) return;
      ctx.save();
      ctx.strokeStyle = 'rgba(231, 199, 126, 0.14)';
      ctx.lineWidth = 1.2;
      const lx = w * 0.82;
      const lyOffset = sec1ActiveOffset;
      ctx.beginPath();
      ctx.moveTo(lx, 0 + lyOffset);
      ctx.lineTo(lx, 120 + lyOffset);
      ctx.stroke();
      ctx.fillStyle = 'rgba(3, 18, 14, 0.75)';
      ctx.strokeStyle = 'rgba(231, 199, 126, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx - 22, 120 + lyOffset);
      ctx.lineTo(lx + 22, 120 + lyOffset);
      ctx.lineTo(lx + 12, 110 + lyOffset);
      ctx.lineTo(lx - 12, 110 + lyOffset);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(231, 199, 126, 0.04)';
      ctx.beginPath();
      ctx.moveTo(lx - 16, 120 + lyOffset);
      ctx.lineTo(lx + 16, 120 + lyOffset);
      ctx.lineTo(lx + 10, 165 + lyOffset);
      ctx.lineTo(lx - 10, 165 + lyOffset);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(3, 18, 14, 0.85)';
      ctx.beginPath();
      ctx.moveTo(lx - 10, 165 + lyOffset);
      ctx.lineTo(lx + 10, 165 + lyOffset);
      ctx.lineTo(lx + 6, 172 + lyOffset);
      ctx.lineTo(lx - 6, 172 + lyOffset);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      const time = Date.now() * 0.0018;
      const candleGlow = 0.5 + Math.sin(time) * 0.12 + Math.random() * 0.03;
      ctx.shadowBlur = 45;
      ctx.shadowColor = 'rgba(231, 199, 126, 0.85)';
      ctx.fillStyle = `rgba(231, 199, 126, ${candleGlow * 0.65})`;
      ctx.beginPath();
      ctx.arc(lx, 142 + lyOffset, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#fff7df';
      ctx.fillStyle = `rgba(255, 247, 223, ${candleGlow * 0.9})`;
      ctx.beginPath();
      ctx.arc(lx, 142 + lyOffset, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const scrollY = simulatedScrollY.get();

      sec1ActiveOffset = -scrollY;
      sec2ActiveOffset = height - scrollY;

      if (Math.random() < 0.015) {
        const rx = Math.random() * width;
        const ry = Math.random() * height;
        ripples.push(new Ripple(rx, ry));
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.update();
        if (r.life <= 0) ripples.splice(i, 1); else r.draw();
      }
      lilyPads.forEach(lp => { lp.update(); lp.draw(); });
      lotuses.forEach(l => { l.update(); l.draw(); });
      bubbles.forEach(b => { b.update(); b.draw(); });
      particles.forEach(p => { p.update(); p.draw(); });
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.update();
        if (s.life <= 0) sparkles.splice(i, 1); else s.draw();
      }
      drawHangingLantern();

      // stone lantern (follows Section 2 water scroll)
      const drawStoneLantern = () => {
        if (!transparentLantern) return;
        if (width < 992) return;
        ctx.save();
        const time = Date.now() * 0.0012;
        const hoverOffset = Math.sin(time) * 4;
        const lw = 200;
        const lh = 250;
        const lx = width - lw - 50;
        const ly = height - lh - 50 + hoverOffset + sec2ActiveOffset;
        ctx.shadowBlur = 80;
        ctx.shadowColor = 'rgba(231, 199, 126, 0.45)';
        ctx.fillStyle = 'rgba(231, 199, 126, 0.05)';
        ctx.beginPath();
        ctx.arc(lx + lw/2, ly + lh/2, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.88;
        ctx.drawImage(transparentLantern, lx, ly, lw, lh);
        ctx.restore();
      };
      drawStoneLantern();

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('card-drag', handleCardDrag);
      window.removeEventListener('card-swing', handleCardSwing);
      if (canvas.parentElement) {
        canvas.parentElement.removeEventListener('mousemove', handleMouseMove);
        canvas.parentElement.removeEventListener('click', handleMouseClick);
      }
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    setIsLetterFlying(true);
    setFrogState('submitting');
    
    // 1.2s后手札落水，被青蛙钓起
    setTimeout(() => {
      setIsLetterFlying(false);
      setFrogState('success');
    }, 1200);

    // 3.2s后重置表单和青蛙状态
    setTimeout(() => {
      setIsSubmitting(false);
      setToastMsg('手札已收纳！青蛙邮差已将信件钓入背篓，正捎回松果屋...');
      setShowToast(true);
      setFormData({ name: '', email: '', message: '' });
      setFrogState('idle');
    }, 3200);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleResetLanyard = () => {
    if (typeof window !== 'undefined' && window.__resetLanyard) {
      window.__resetLanyard();
      setToastMsg('卡片已平稳收回！');
      setShowToast(true);
    }
  };

  return (
    <ContactWrapper
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 魔法 Canvas 互动粒子背景 (fixed globally) */}
      <CanvasBackground ref={canvasRef} />

      {/* 3D 挂绳 Canvas (PC 载入, overlayed interactive zIndex) */}
      {!isMobile && (
        <motion.div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: activeSection === 1 ? 25 : 1,
            opacity: lanyardOpacity,
            pointerEvents: activeSection === 1 ? 'auto' : 'none',
          }}
        >
          <Lanyard position={[0, 0, 30]} gravity={[0, -40, 0]} interactive={activeSection === 1} />
        </motion.div>
      )}

      {/* PC 端交互悬浮控制按钮组 */}
      {!isMobile && (
        <FloatingButtonGroup
          style={{
            zIndex: activeSection === 1 ? 26 : 1,
            opacity: lanyardOpacity,
            pointerEvents: activeSection === 1 ? 'auto' : 'none'
          }}
        >
          <LanyardControlBtn
            onClick={handleResetLanyard}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            🔄 拉回卡片 (Reset)
          </LanyardControlBtn>
          <LanyardControlBtn
            onClick={() => {
              if (typeof window !== 'undefined' && window.__flipLanyard) {
                window.__flipLanyard();
              }
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            🔄 翻转卡牌 (Flip)
          </LanyardControlBtn>
        </FloatingButtonGroup>
      )}

      {/* Toast 提示 */}
      <AnimatePresence>
        {showToast && (
          <ToastBox
            initial={{ opacity: 0, y: -40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
          >
            <span className="toast-icon">✉</span>
            <span>{toastMsg}</span>
          </ToastBox>
        )}
      </AnimatePresence>

      {/* 纵向虚拟滑动的画卷容器 */}
      <motion.div
        style={{
          y: pageTranslationY,
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {/* Section 1: 月夜林间入口 */}
      <SectionContainer ref={sec1Ref} style={{ zIndex: 10 }}>
        <StickyStage>
          <SectionBackground
            style={{ y: bg1Y, opacity: bg1Opacity }}
            src={section01Img}
            overlayGradient="linear-gradient(to bottom, rgba(3, 18, 14, 0.15) 0%, rgba(1, 4, 3, 0.28) 70%, rgba(0, 0, 0, 0.55) 100%)"
          />
          <StageContent style={{ opacity: section1Opacity, y: section1Y, scale: section1Scale, filter: section1Filter }}>
            <PageTitleArea style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
              <ContactTitle style={{ textAlign: 'center' }}>
                <VariableProximity
                  label="CONTACT"
                  containerRef={sec1Ref}
                  radius={250}
                  falloff="exponential"
                  fromFontVariationSettings="'wght' 300, 'opsz' 8"
                  toFontVariationSettings="'wght' 900, 'opsz' 40"
                />
              </ContactTitle>
              <p style={{ fontSize: '1.15rem', color: 'rgba(245, 239, 227, 0.85)', marginTop: '1.5rem', lineHeight: '1.8' }}>
                如果你想拜访松果屋，可以将一封手札轻送入池。在荷叶上悠闲垂钓的魔法青蛙，会用它的灵动钓竿，慢悠悠地为你钩起探索者的神秘名片。
              </p>
              <div style={{ marginTop: '3.5rem', fontSize: '0.82rem', color: 'rgba(231, 199, 126, 0.65)', letterSpacing: '0.2em' }}>
                👇 向下滚动，滑向池塘深处
              </div>
            </PageTitleArea>
          </StageContent>

          {/* Golden flowing Bezier text stream */}
          <div style={{ position: 'absolute', bottom: '2rem', left: 0, width: '100%', zIndex: 12, pointerEvents: 'auto' }}>
            <CurvedLoop
              marqueeText="✦ SLIDE INTO THE DEEP POND ✦ WHISPER TO THE FROG ✦ DROP A NOTE ✦ EXPLORE MY WORK ✦"
              speed={1.5}
              curveAmount={60}
              fontSize="1.05rem"
              fill="rgba(231, 199, 126, 0.45)"
              minHeight="80px"
              interactive={true}
            />
          </div>
        </StickyStage>
      </SectionContainer>

      {/* Section 2: 池塘主舞台 */}
      <SectionContainer ref={sec2Ref} style={{ zIndex: 20 }}>
        <StickyStage>
          <SectionBackground
            style={{ y: bg2Y, opacity: bg2Opacity }}
            src={section02Img}
            overlayGradient="linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, rgba(3, 18, 14, 0.2) 20%, rgba(1, 4, 3, 0.25) 80%, rgba(0, 0, 0, 0.5) 100%)"
          />
          <StageContent style={{ opacity: sec2ContentOpacity, y: sec2ContentY, scale: sec2ContentScale, filter: sec2ContentFilter }}>
            {isMobile ? (
              <MobileCardSection style={{ margin: 0 }}>
                <CardContainer3D onClick={() => setMobileFlipped(!mobileFlipped)}>
                  <FlipCard className={mobileFlipped ? 'flipped' : ''}>
                    <CardFront>
                      <TransparentImage src={cardWateryImage} alt="Contact Card Front" style={{ width: '100%', height: '100%' }} />
                    </CardFront>
                    <CardBack style={{
                      backgroundImage: `url(${cardBackImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '2rem 1.2rem',
                      textAlign: 'center',
                      border: 'none',
                      boxShadow: 'none',
                    }}>
                      <div className="header" style={{ fontSize: '1.25rem', color: '#e7c77e', fontWeight: 'bold', marginBottom: '0.2rem', letterSpacing: '0.15em' }}>池畔手札</div>
                      <div className="divider" style={{ width: '60%', height: '1.2px', background: 'rgba(231, 199, 126, 0.22)', margin: '0.2rem 0 1.2rem' }}></div>
                      <div className="letter-content" style={{ fontSize: '0.78rem', color: 'rgba(245, 239, 227, 0.95)', lineHeight: '1.75', margin: '0' }}>
                        <p style={{ margin: '0.4rem 0' }}>谢谢你沿着粼粼水光，叩开这扇隐秘的林间之门。</p>
                        <p style={{ margin: '0.4rem 0' }}>愿你在喧嚣的世界里，能拥有一方安静的池塘；</p>
                        <p style={{ margin: '0.4rem 0' }}>愿你拥有睡到自然醒的清晨，和没有烦扰的温热午后，</p>
                        <p style={{ margin: '0.4rem 0' }}>走过的旅途都有清风与暖阳。</p>
                        <p style={{ margin: '0.4rem 0' }}>如果累了，不妨在池塘边听听蛙鸣，</p>
                        <p style={{ margin: '0.4rem 0' }}>松果屋会在这里，慢慢守候每一个漂流的故事。</p>
                      </div>
                      <div className="divider" style={{ width: '60%', height: '1px', background: 'rgba(231, 199, 126, 0.1)', margin: '1.2rem 0 0.4rem' }}></div>
                      <div className="signature" style={{ fontSize: '0.82rem', color: '#e7c77e', fontStyle: 'italic' }}>—— 见习魔法师 · Singularity_Ye</div>
                    </CardBack>
                  </FlipCard>
                </CardContainer3D>
                <CardInstruction>
                  👆 点击卡牌进行 3D 翻转
                </CardInstruction>
              </MobileCardSection>
            ) : (
              <Section2Grid>
                <div style={{ paddingRight: '2rem', position: 'relative' }}>
                  {/* Decorative Rotating Circular Badge */}
                  <div style={{ position: 'absolute', top: '-110px', left: '0', pointerEvents: 'auto', zIndex: 10 }}>
                    <CircularText
                      text="EXPLORER*PROFILE*PINE*CONE*CONTACT*"
                      spinDuration={25}
                      onHover="speedUp"
                      width="100px"
                      height="100px"
                      color="rgba(231, 199, 126, 0.45)"
                      fontSize="9px"
                    />
                  </div>
                  <h2 style={{ fontSize: '2.1rem', color: '#e7c77e', marginBottom: '1.5rem', marginTop: '1rem', fontFamily: 'Outfit, sans-serif', fontWeight: 800, letterSpacing: '0.05em' }}>
                    池畔信亭 · 探索者侧写
                  </h2>
                  <p style={{ fontSize: '1.02rem', color: 'rgba(245, 239, 227, 0.8)', lineHeight: '1.8', marginBottom: '1.2rem' }}>
                    在青蛙旅人悠闲低垂的钓线末端，正悬挂着一枚水纹潋滟的魔法琉璃名片。
                  </p>
                  <p style={{ fontSize: '1.02rem', color: 'rgba(245, 239, 227, 0.8)', lineHeight: '1.8', marginBottom: '2.2rem' }}>
                    试着用鼠标轻轻拖曳、甩动它，在泛起波光的魔法水面激起阵阵涟漪。卡片的另一面，则静静镌刻着屋主对来访者的温和祝福与真挚期盼。
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(231, 199, 126, 0.65)', fontSize: '0.85rem' }}>
                    🖱️ 试着甩动或点击右侧悬挂的卡牌
                  </div>
                </div>
                <div style={{ position: 'relative', height: '400px' }} />
              </Section2Grid>
            )}
          </StageContent>
        </StickyStage>
      </SectionContainer>

      {/* Section 3: 水岸手札区 */}
      <SectionContainer ref={sec3Ref} $last style={{ zIndex: 30 }}>
        <StickyStage>
          <SectionBackground
            style={{ y: bg3Y, opacity: bg3Opacity }}
            src={section03Img}
            overlayGradient="linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, rgba(3, 18, 14, 0.15) 20%, rgba(0, 0, 0, 0.5) 100%)"
          />
          <StageContent style={{ opacity: sec3ContentOpacity, y: sec3ContentY, scale: sec3ContentScale, filter: sec3ContentFilter }}>
            <Section3Grid>
              <LeftColumnWrapper>
                <GlassCardForm onSubmit={handleSubmit}>
                  <FormHeader>
                    <h3>投递手札</h3>
                    <span>pinecone-post v1.3</span>
                  </FormHeader>
                  <FormGroup>
                    <label htmlFor="name">来信署名 / Name</label>
                    <input 
                      id="name" 
                      type="text" 
                      placeholder="你想让我怎么称呼你..." 
                      value={formData.name} 
                      onChange={handleChange} 
                      onFocus={() => setFrogState('typing')}
                      onBlur={() => setFrogState('idle')}
                      required 
                    />
                  </FormGroup>
                  <FormGroup>
                    <label htmlFor="email">回信地址 / Email</label>
                    <input 
                      id="email" 
                      type="email" 
                      placeholder="方便我回信的联系方式..." 
                      value={formData.email} 
                      onChange={handleChange} 
                      onFocus={() => setFrogState('typing')}
                      onBlur={() => setFrogState('idle')}
                      required 
                    />
                  </FormGroup>
                  <FormGroup>
                    <label htmlFor="message">纸短情长 / Message</label>
                    <textarea 
                      id="message" 
                      placeholder="写下你的留言、合作意图或小秘密..." 
                      value={formData.message} 
                      onChange={handleChange} 
                      onFocus={() => setFrogState('typing')}
                      onBlur={() => setFrogState('idle')}
                      required 
                    />
                  </FormGroup>
                  <SubmitButton type="submit" disabled={isSubmitting || !formData.name || !formData.email || !formData.message} whileTap={{ scale: 0.97 }}>
                    {isSubmitting ? <span>✉ 放入池塘中...</span> : <span>🛶 放入池塘 (投递手札)</span>}
                  </SubmitButton>
                </GlassCardForm>

                {/* 提交表单下方的青蛙邮差占位与气泡 */}
                <FrogSection
                  onMouseEnter={() => { if (frogState === 'idle') setFrogState('hovered'); }}
                  onMouseLeave={() => { if (frogState === 'hovered') setFrogState('idle'); }}
                >
                  <FrogImageContainer>
                    {!frogImageError ? (
                      <FrogImage
                        src="/assets/images/contact/frog_postman.png"
                        alt="青蛙邮差"
                        onError={() => setFrogImageError(true)}
                        animate={frogState === 'submitting' ? { y: [0, -10, 0] } : frogState === 'success' ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : { y: [0, -4, 0] }}
                        transition={frogState === 'submitting' ? { duration: 0.5, repeat: Infinity } : frogState === 'success' ? { duration: 0.6 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ) : (
                      <FrogPlaceholderBox>
                        <div style={{ fontSize: '1.6rem' }}>🐸</div>
                        <span>青蛙邮差</span>
                      </FrogPlaceholderBox>
                    )}
                  </FrogImageContainer>
                  <FrogSpeechBubble
                    animate={frogState !== 'idle' ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 0.2 }}
                  >
                    {FROG_DIALOGS[frogState]}
                  </FrogSpeechBubble>
                </FrogSection>
              </LeftColumnWrapper>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', height: '100%', justifyContent: 'center' }}>
                <FlowingMenuContainer style={{ marginTop: 0 }}>
                  <FlowingMenuHeader>
                    <h4>狂想碎片 / Fragments of Visions</h4>
                    <span>Hover to read thoughts</span>
                  </FlowingMenuHeader>
                  <FlowingMenuWrapper>
                    <FlowingMenu items={mindQuotes} speed={18} textColor="#f5efe3" bgColor="transparent" marqueeBgColor="#e7c77e" marqueeTextColor="#03120d" borderColor="rgba(231, 199, 126, 0.12)" />
                  </FlowingMenuWrapper>
                </FlowingMenuContainer>
                <div style={{ pointerEvents: 'auto', zIndex: 13 }}><Marquee /></div>
              </div>
            </Section3Grid>
          </StageContent>
        </StickyStage>
      </SectionContainer>
      </motion.div>

      {/* 侧边圆点导航栏 */}
      <DotNav>
        {[0, 1, 2].map((idx) => (
          <NavDot
            key={idx}
            $active={activeSection === idx}
            onClick={() => transitionToSection(idx)}
            title={`第 ${idx + 1} 幕`}
          />
        ))}
      </DotNav>

      {/* 传音手札折叠飞向池塘（青蛙）的奥术特效 */}
      <AnimatePresence>
        {isLetterFlying && (
          <motion.div
            style={{
              position: 'fixed',
              left: '30%',
              top: '55%',
              zIndex: 99999,
              width: '70px',
              height: '45px',
              background: '#fbf5e6',
              border: '1.5px solid #b45309',
              borderRadius: '6px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7c2d12',
              fontSize: '0.7rem',
              fontWeight: '800',
              letterSpacing: '1px',
              pointerEvents: 'none',
              fontFamily: 'Georgia, serif'
            }}
            initial={{ scale: 1, x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{
              scale: [1, 1.2, 0.4, 0],
              x: [0, 100, 240, 360],
              y: [0, -180, -60, 80],
              rotate: [0, 45, 180, 360],
              opacity: [1, 1, 0.8, 0]
            }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          >
            ✉ 手札
          </motion.div>
        )}
      </AnimatePresence>
    </ContactWrapper>
  );
}
