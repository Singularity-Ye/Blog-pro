import React, { useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import styled from 'styled-components';

const CircularContainer = styled(motion.div)`
  margin: 0 auto;
  border-radius: 50%;
  width: ${props => props.$width || '200px'};
  height: ${props => props.$height || '200px'};
  position: relative;
  font-weight: bold;
  color: ${props => props.$color || '#fff'};
  text-align: center;
  cursor: pointer;
  transform-origin: 50% 50%;
  -webkit-transform-origin: 50% 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Letter = styled.span`
  position: absolute;
  display: inline-block;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  font-size: ${props => props.$fontSize || '24px'};
  transition: all 0.5s cubic-bezier(0, 0, 0, 1);
`;

const getRotationTransition = (duration, from, loop = true) => ({
  from,
  to: from + 360,
  ease: 'linear',
  duration,
  type: 'tween',
  repeat: loop ? Infinity : 0
});

const getTransition = (duration, from) => ({
  rotate: getRotationTransition(duration, from),
  scale: {
    type: 'spring',
    damping: 20,
    stiffness: 300
  }
});

const CircularText = ({
  text,
  spinDuration = 20,
  onHover = 'speedUp',
  className = '',
  width = '200px',
  height = '200px',
  color = '#fff',
  fontSize = '24px',
  style
}) => {
  const letters = Array.from(text);
  const controls = useAnimation();
  const rotation = useMotionValue(0);

  useEffect(() => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start)
    });
  }, [spinDuration, text, onHover, controls, rotation]);

  const handleHoverStart = () => {
    const start = rotation.get();
    if (!onHover) return;

    let transitionConfig;
    let scaleVal = 1;

    switch (onHover) {
      case 'slowDown':
        transitionConfig = getTransition(spinDuration * 2, start);
        break;
      case 'speedUp':
        transitionConfig = getTransition(spinDuration / 4, start);
        break;
      case 'pause':
        transitionConfig = {
          rotate: { type: 'spring', damping: 20, stiffness: 300 },
          scale: { type: 'spring', damping: 20, stiffness: 300 }
        };
        scaleVal = 1;
        break;
      case 'goBonkers':
        transitionConfig = getTransition(spinDuration / 20, start);
        scaleVal = 0.8;
        break;
      default:
        transitionConfig = getTransition(spinDuration, start);
    }

    controls.start({
      rotate: start + 360,
      scale: scaleVal,
      transition: transitionConfig
    });
  };

  const handleHoverEnd = () => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start)
    });
  };

  return (
    <CircularContainer
      className={`circular-text ${className}`}
      style={{ rotate: rotation, ...style }}
      initial={{ rotate: 0 }}
      animate={controls}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      $width={width}
      $height={height}
      $color={color}
    >
      {letters.map((letter, i) => {
        const rotationDeg = (360 / letters.length) * i;
        const factor = Math.PI / letters.length;
        const x = factor * i;
        const y = factor * i;
        const transform = `rotateZ(${rotationDeg}deg) translate3d(${x}px, ${y}px, 0)`;

        return (
          <Letter
            key={i}
            style={{ transform, WebkitTransform: transform }}
            $fontSize={fontSize}
          >
            {letter}
          </Letter>
        );
      })}
    </CircularContainer>
  );
};

export default CircularText;
