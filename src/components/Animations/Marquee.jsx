import React, { useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import githubAvatar from '../../assets/images/github.png';
import bilibiliAvatar from '../../assets/images/bilibili.png';
import cloudmusicAvatar from '../../assets/images/cloudmusic.png';

const scrollX = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(calc(-100% - 1.6rem)); }
`;

const MarqueeContainer = styled.div`
  position: relative;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  padding: clamp(2.2rem, 5vh, 4rem) 0 1.2rem;
  overflow: hidden;
  background: transparent;
  display: flex;
  flex-direction: column;
  z-index: 10;
  pointer-events: none;
  mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
`;

const MarqueeTrack = styled.div`
  display: flex;
  gap: 1.6rem;
  width: max-content;
  pointer-events: all;

  &:has(.social-card:hover) > div {
    animation-play-state: paused;
  }
`;

const MarqueeGroup = styled.div`
  display: flex;
  gap: 1.6rem;
  flex-shrink: 0;
  min-width: 100%;
  animation: ${scrollX} 38s linear infinite;
`;

const CardLink = styled.a`
  text-decoration: none;
  display: block;
`;

const Card = styled(motion.div)`
  position: relative;
  width: 320px;
  height: 108px;
  border-radius: 20px;
  background: rgba(5, 18, 34, 0.62);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(125, 211, 252, 0.18);
  display: flex;
  align-items: center;
  padding: 0 1.25rem;
  gap: 1rem;
  overflow: hidden;
  cursor: pointer;
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.35s ease, box-shadow 0.35s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    background: radial-gradient(
      360px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
      ${({ $color }) => $color}2e,
      transparent 42%
    );
    opacity: 0;
    transition: opacity 0.28s ease;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: 19px;
    pointer-events: none;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 35%);
    z-index: 0;
  }

  &:hover {
    transform: translateY(-25px) scale(1.1) rotate(${({ $rotate }) => $rotate || '-3deg'});
    border-color: ${({ $color }) => $color};
    box-shadow:
      0 24px 54px rgba(0, 0, 0, 0.42),
      0 0 34px ${({ $color }) => $color}44,
      inset 0 1px 0 rgba(255, 255, 255, 0.08);

    &::before {
      opacity: 1;
    }

    .platform-icon {
      border-color: ${({ $color }) => $color}88;
      transform: translateY(-10px) scale(1.35) rotate(-20deg);
    }

    .avatar-img {
      border-color: ${({ $color }) => $color};
      box-shadow: 0 0 20px ${({ $color }) => $color}44;
      transform: translateY(-15px) scale(1.26) rotate(20deg);
    }

    .platform-name {
      transform: translateX(4px);
    }
  }
`;

const PlatformIcon = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.25s ease;
  z-index: 1;
  background: rgba(232, 250, 255, 0.9);
  border: 1px solid rgba(125, 211, 252, 0.2);
  padding: 6px;
`;

const InfoCol = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  z-index: 1;
`;

const PlatformName = styled.span`
  font-size: 1rem;
  font-weight: 800;
  color: #e6f7ff;
  letter-spacing: 0.02em;
  margin-bottom: 0.22rem;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
`;

const Username = styled.span`
  font-size: 0.78rem;
  color: rgba(226, 244, 255, 0.68);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Avatar = styled.img`
  width: 54px;
  height: 54px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(125, 211, 252, 0.2);
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.25s ease, box-shadow 0.25s ease;
  z-index: 1;
`;

const socialItems = [
  {
    id: 'github',
    icon: 'https://github.githubassets.com/favicon.ico',
    avatar: githubAvatar,
    text: 'GitHub',
    username: '@Singularity_Ye',
    link: 'https://github.com/Singularity-Ye',
    cardBg: '#67e8f9',
  },
  {
    id: 'bilibili',
    icon: 'https://www.bilibili.com/favicon.ico',
    avatar: bilibiliAvatar,
    text: 'Bilibili',
    username: '@该用户暂未注册',
    link: 'https://space.bilibili.com/346029390',
    cardBg: '#f0abfc',
  },
  {
    id: 'cloudmusic',
    icon: 'https://s1.music.126.net/style/favicon.ico',
    avatar: cloudmusicAvatar,
    text: '网易云音乐',
    username: '@深海歌单漂流中',
    link: 'https://music.163.com/#/playlist?id=2217283396',
    cardBg: '#fb7185',
  },
];

function InteractiveCard({ item, index }) {
  const cardRef = useRef(null);

  const handleMouseMove = (event) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
    cardRef.current.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;

    cardRef.current.style.setProperty('--mouse-x', '50%');
    cardRef.current.style.setProperty('--mouse-y', '50%');
  };

  return (
    <CardLink href={item.link} target="_blank" rel="noopener noreferrer">
      <Card
        ref={cardRef}
        className="social-card"
        $color={item.cardBg}
        $rotate={index % 2 === 0 ? '-4deg' : '4deg'}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <PlatformIcon className="platform-icon" src={item.icon} alt={item.text} />
        <InfoCol>
          <PlatformName className="platform-name">{item.text}</PlatformName>
          <Username>{item.username}</Username>
        </InfoCol>
        <Avatar className="avatar-img" src={item.avatar} alt={`${item.text} avatar`} />
      </Card>
    </CardLink>
  );
}

function Marquee() {
  const groupItems = [...socialItems, ...socialItems];

  return (
    <MarqueeContainer>
      <MarqueeTrack>
        <MarqueeGroup>
          {groupItems.map((item, index) => (
            <InteractiveCard key={`group1-${item.id}-${index}`} item={item} index={index} />
          ))}
        </MarqueeGroup>

        <MarqueeGroup aria-hidden="true">
          {groupItems.map((item, index) => (
            <InteractiveCard key={`group2-${item.id}-${index}`} item={item} index={index} />
          ))}
        </MarqueeGroup>
      </MarqueeTrack>
    </MarqueeContainer>
  );
}

export default Marquee;
