import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

// Styled Components
const CarouselWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 2rem auto;
  border-radius: 16px;
  overflow: hidden;
  background: var(--glass-bg-alt, rgba(20, 13, 8, 0.45));
  border: 1.5px solid var(--glass-border, rgba(216, 162, 71, 0.36));
  box-shadow: var(--glass-shadow, 0 20px 48px rgba(0, 0, 0, 0.24));
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    border-color: var(--glass-border-highlight, rgba(231, 199, 126, 0.7));
  }
`;

const ScrollContainer = styled.div`
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* Hide scrollbar for Firefox */
  -ms-overflow-style: none; /* Hide scrollbar for IE/Edge */
  -webkit-overflow-scrolling: touch;
  gap: 0;
  width: 100%;
  
  &::-webkit-scrollbar {
    display: none; /* Hide scrollbar for Chrome/Safari/Opera */
  }
`;

const Slide = styled.div`
  flex: 0 0 100%;
  width: 100%;
  scroll-snap-align: start;
  position: relative;
  aspect-ratio: 16 / 10;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: zoom-in;
`;

const CarouselImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  
  ${Slide}:hover & {
    transform: scale(1.03);
  }
`;

const ArrowButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(28, 18, 12, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border, rgba(216, 162, 71, 0.36));
  color: var(--text-accent, #ffe197);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  ${CarouselWrapper}:hover & {
    opacity: 0.9;
    pointer-events: auto;
  }

  &:hover {
    background: rgba(231, 199, 126, 0.2);
    border-color: var(--glass-border-highlight, rgba(231, 199, 126, 0.7));
    transform: translateY(-50%) scale(1.1);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  &.prev {
    left: 12px;
  }

  &.next {
    right: 12px;
  }
`;

const InfoBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(10, 8, 6, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 0.78rem;
  font-family: 'Outfit', sans-serif;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
  z-index: 8;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
`;

const ControlBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px 0 12px;
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 8;
  pointer-events: none;
`;

const IndicatorDot = styled.button`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin: 0 4px;
  padding: 0;
  border: none;
  cursor: pointer;
  pointer-events: auto;
  background: ${props => props.$active ? 'var(--text-accent, #ffe197)' : 'rgba(255, 255, 255, 0.35)'};
  transform: scale(${props => props.$active ? 1.3 : 1});
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 2px rgba(0,0,0,0.3);

  &:hover {
    background: ${props => props.$active ? 'var(--text-accent, #ffe197)' : 'rgba(255, 255, 255, 0.7)'};
    transform: scale(${props => props.$active ? 1.3 : 1.15});
  }
`;

const LightboxOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(10, 8, 6, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const LightboxContent = styled.div`
  position: relative;
  width: 90%;
  height: 80%;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
`;

const LightboxImage = styled(motion.img)`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const LightboxCloseBtn = styled.button`
  position: absolute;
  top: 24px;
  right: 24px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10001;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const LightboxArrowBtn = styled.button`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 20px;
  z-index: 10001;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    position: absolute;
    bottom: 40px;
    margin: 0;
    
    &.prev {
      left: 30%;
      transform: translateX(-50%);
    }
    
    &.next {
      right: 30%;
      transform: translateX(50%);
    }
  }
`;

const LightboxCaption = styled.div`
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  font-family: inherit;
  text-align: center;
  max-width: 80%;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
`;

const ToastTip = styled(motion.div)`
  position: absolute;
  bottom: 24px;
  background: rgba(0,0,0,0.7);
  color: rgba(255,255,255,0.85);
  font-size: 0.75rem;
  padding: 6px 12px;
  border-radius: 12px;
  pointer-events: none;
  z-index: 12;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
`;

export function ImageCarousel({ images }) {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showTip, setShowTip] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Auto-hide the tip after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowTip(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Track scrolling to update indicators
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    if (clientWidth === 0) return;
    const index = Math.round(scrollLeft / clientWidth);
    setActiveIndex(index);
  }, []);

  const scrollToSlide = (index) => {
    if (!containerRef.current) return;
    const { clientWidth } = containerRef.current;
    containerRef.current.scrollTo({
      left: index * clientWidth,
      behavior: 'smooth'
    });
  };

  const handlePrev = () => {
    const newIdx = activeIndex > 0 ? activeIndex - 1 : images.length - 1;
    scrollToSlide(newIdx);
  };

  const handleNext = () => {
    const newIdx = activeIndex < images.length - 1 ? activeIndex + 1 : 0;
    scrollToSlide(newIdx);
  };

  const handleImageClick = (idx) => {
    setLightboxIndex(idx);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  // Keyboard navigation for Lightbox
  const handleKeyDown = useCallback((e) => {
    if (lightboxIndex === null) return;
    if (e.key === 'ArrowLeft') {
      setLightboxIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
    } else if (e.key === 'ArrowRight') {
      setLightboxIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'Escape') {
      closeLightbox();
    }
  }, [lightboxIndex, images.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!images || images.length === 0) return null;

  return (
    <>
      <CarouselWrapper>
        <ScrollContainer ref={containerRef} onScroll={handleScroll}>
          {images.map((img, idx) => (
            <Slide key={idx} onClick={() => handleImageClick(idx)}>
              <CarouselImage src={img.src} alt={img.alt || `Slide ${idx + 1}`} loading="lazy" />
            </Slide>
          ))}
        </ScrollContainer>

        <InfoBadge>
          {activeIndex + 1} / {images.length}
        </InfoBadge>

        <ArrowButton className="prev" onClick={handlePrev} aria-label="Previous image">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </ArrowButton>

        <ArrowButton className="next" onClick={handleNext} aria-label="Next image">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </ArrowButton>

        <ControlBar>
          {images.map((_, idx) => (
            <IndicatorDot
              key={idx}
              $active={idx === activeIndex}
              onClick={() => scrollToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </ControlBar>

        <AnimatePresence>
          {showTip && (
            <ToastTip
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              💡 左右滑动或使用滚轮切换图片，点击可放大查看
            </ToastTip>
          )}
        </AnimatePresence>
      </CarouselWrapper>

      {/* Lightbox Modal using Portal */}
      <AnimatePresence>
        {lightboxIndex !== null && createPortal(
          <LightboxOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeLightbox}
          >
            <LightboxCloseBtn onClick={closeLightbox} aria-label="Close view">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </LightboxCloseBtn>

            <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }}>
              <LightboxArrowBtn className="prev" onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev > 0 ? prev - 1 : images.length - 1)); }} aria-label="Prev image">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </LightboxArrowBtn>

              <LightboxContent onClick={(e) => e.stopPropagation()}>
                <AnimatePresence mode="wait">
                  <LightboxImage
                    key={lightboxIndex}
                    src={images[lightboxIndex].src}
                    alt={images[lightboxIndex].alt}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  />
                </AnimatePresence>
              </LightboxContent>

              <LightboxArrowBtn className="next" onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev < images.length - 1 ? prev + 1 : 0)); }} aria-label="Next image">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </LightboxArrowBtn>
            </div>

            {images[lightboxIndex].alt && (
              <LightboxCaption onClick={(e) => e.stopPropagation()}>
                {images[lightboxIndex].alt}
              </LightboxCaption>
            )}
          </LightboxOverlay>,
          document.body
        )}
      </AnimatePresence>
    </>
  );
}

export default ImageCarousel;
