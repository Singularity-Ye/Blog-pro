import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import Marquee from '../components/Animations/Marquee';
import HeroSection3D from '../components/HeroSection3D';
import aquariumBackground from '../assets/backgrounds/magical_underwater_aquarium_fantasy_scene.png';

const HomeWrapper = styled.main`
  position: relative;
`;

const SnapSection = styled.section`
  position: relative;
  scroll-snap-align: start;
  scroll-snap-stop: always;

  &.hero-snap-section,
  &.content-snap-section {
    min-height: calc(100vh - 60px);
  }
`;

const ContentSection = styled.div`
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 60px);
  padding: clamp(4rem, 8vh, 7rem) 1rem;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(5, 8, 20, 0.58), rgba(5, 8, 20, 0.78)),
    radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.18), transparent 42%),
    url(${aquariumBackground});
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: -1px;
    height: clamp(120px, 18vh, 180px);
    background: linear-gradient(
      180deg,
      rgba(214, 246, 252, 0) 0%,
      rgba(37, 88, 116, 0.35) 38%,
      rgba(5, 8, 20, 0.92) 100%
    );
    pointer-events: none;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.075;
    background:
      repeating-radial-gradient(circle at 82% 18%, rgba(125, 211, 252, 0.7) 0 1px, transparent 1px 18px),
      repeating-linear-gradient(24deg, transparent 0 72px, rgba(125, 211, 252, 0.48) 72px 73px, transparent 73px 132px),
      radial-gradient(circle at 18% 74%, transparent 0 86px, rgba(125, 211, 252, 0.55) 87px 88px, transparent 89px 140px);
  }
`;

const DeepSeaInner = styled.div`
  position: relative;
  z-index: 1;
`;

const SectionHeader = styled.div`
  max-width: 860px;
  margin: 3.5rem auto 1.4rem;
  padding: 0 1rem;
`;

const SectionEyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.8rem;
  color: rgba(125, 211, 252, 0.8);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
`;

const SectionTitle = styled(motion.h2)`
  margin: 0;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid rgba(125, 211, 252, 0.2);
  color: #e6f7ff;
  font-size: clamp(1.45rem, 3vw, 2.1rem);
  font-weight: 900;
  letter-spacing: 0.03em;
`;

const RecentPosts = styled.section`
  max-width: 860px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const PostCard = styled(motion.article)`
  position: relative;
  overflow: hidden;
  background: rgba(5, 18, 34, 0.62);
  backdrop-filter: blur(16px);
  padding: 1.55rem 1.8rem 1.55rem 2rem;
  border-radius: 1rem;
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  margin-bottom: 1.25rem;
  cursor: pointer;
  border: 1px solid rgba(125, 211, 252, 0.18);
  transition: transform 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 1rem;
    bottom: 1rem;
    width: 3px;
    border-radius: 999px;
    background: linear-gradient(180deg, #67e8f9, rgba(139, 92, 246, 0.45));
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(115deg, rgba(255, 255, 255, 0.08), transparent 34%);
    opacity: 0.62;
  }

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(125, 211, 252, 0.42);
    box-shadow:
      0 20px 56px rgba(0, 0, 0, 0.38),
      0 0 28px rgba(34, 211, 238, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  h3,
  p,
  small {
    position: relative;
    z-index: 1;
  }

  h3 {
    color: #e6f7ff;
    margin-bottom: 0.55rem;
    font-size: 1.05rem;
    font-weight: 800;
  }

  p {
    color: rgba(226, 244, 255, 0.72);
    margin-bottom: 0.8rem;
    font-size: 0.9rem;
    line-height: 1.7;
  }

  small {
    color: rgba(125, 211, 252, 0.68);
    font-size: 0.78rem;
    letter-spacing: 0.08em;
  }
`;

const recentPosts = [
  {
    id: 1,
    title: 'React 开发技巧分享',
    excerpt: '记录一些 React 开发中常用的技巧、组件拆分和交互打磨经验。',
    date: '2024-02-19',
  },
  {
    id: 2,
    title: 'Framer Motion 动画笔记',
    excerpt: '把动效、节奏和页面状态过渡整理成更自然的前端动画实践。',
    date: '2024-02-18',
  },
];

function Home() {
  const wheelLockRef = useRef(false);
  const sectionRefs = useRef([]);

  useEffect(() => {
    document.documentElement.classList.add('home-scroll-snap');
    document.body.classList.add('home-scroll-snap-body');

    const getSections = () => sectionRefs.current.filter(Boolean);

    const getCurrentIndex = (sections) => {
      const targetScroll = window.scrollY + 60;
      let bestIndex = 0;
      let bestDistance = Infinity;

      sections.forEach((section, index) => {
        const distance = Math.abs(targetScroll - section.offsetTop);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      return bestIndex;
    };

    const scrollToSection = (sections, index) => {
      const target = sections[index];
      if (!target) return;

      window.scrollTo({
        top: Math.max(0, target.offsetTop - 60),
        behavior: 'smooth',
      });
    };

    const handleWheel = (event) => {
      if (window.innerWidth <= 768) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (Math.abs(event.deltaY) < 28) return;

      const sections = getSections();
      if (sections.length < 2) return;

      if (wheelLockRef.current) {
        event.preventDefault();
        return;
      }

      const current = getCurrentIndex(sections);
      const direction = event.deltaY > 0 ? 1 : -1;
      const next = Math.max(0, Math.min(sections.length - 1, current + direction));

      if (next === current) return;

      event.preventDefault();
      wheelLockRef.current = true;
      scrollToSection(sections, next);

      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, 720);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.documentElement.classList.remove('home-scroll-snap');
      document.body.classList.remove('home-scroll-snap-body');
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <HomeWrapper>
      <SnapSection
        className="hero-snap-section"
        ref={(element) => {
          sectionRefs.current[0] = element;
        }}
      >
        <HeroSection3D />
      </SnapSection>

      <SnapSection
        className="content-snap-section"
        ref={(element) => {
          sectionRefs.current[1] = element;
        }}
      >
        <ContentSection>
          <DeepSeaInner>
            <Marquee />

            <SectionHeader>
              <SectionEyebrow>Night Aquarium Archive</SectionEyebrow>
              <SectionTitle
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                深海日志
              </SectionTitle>
            </SectionHeader>

            <RecentPosts>
              {recentPosts.map((post, index) => (
                <PostCard
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <small>{post.date}</small>
                </PostCard>
              ))}
            </RecentPosts>
          </DeepSeaInner>
        </ContentSection>
      </SnapSection>
    </HomeWrapper>
  );
}

export default Home;
