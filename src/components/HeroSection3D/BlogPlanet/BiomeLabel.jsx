import { Html } from '@react-three/drei';
import styled, { keyframes } from 'styled-components';

const gentleFloat = keyframes`
  0%, 100% { transform: translate(24px, -50%) translateY(0); }
  50% { transform: translate(24px, -50%) translateY(-6px); }
`;

const shimmer = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(200%); }
`;

const LabelWrap = styled.div`
  --label-glow: ${({ $glow }) => $glow};
  position: relative;
  width: 280px;
  min-height: 140px;
  pointer-events: none;
  animation: ${gentleFloat} 6s ease-in-out infinite;
  
  /* Pointing line connecting to the continent */
  &::before {
    content: '';
    position: absolute;
    left: -24px;
    top: 50%;
    width: 24px;
    height: 1px;
    background: var(--label-glow);
    opacity: 0.6;
  }
`;

const LabelInner = styled.div`
  position: relative;
  min-height: inherit;
  padding: 1.25rem 1.5rem 1.25rem 1.8rem;
  overflow: hidden;
  border-radius: 8px 16px 16px 8px;
  background: rgba(252, 253, 255, 0.65);
  backdrop-filter: blur(16px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 
    0 16px 32px rgba(12, 38, 50, 0.12),
    inset 0 1px 2px rgba(255, 255, 255, 0.9);
    
  /* Paper texture noise */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.35;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    mix-blend-mode: multiply;
    pointer-events: none;
  }

  /* Left colored accent line */
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, var(--label-glow), rgba(255, 255, 255, 0.2));
    box-shadow: 2px 0 8px color-mix(in srgb, var(--label-glow) 40%, transparent);
  }
`;

const LabelContent = styled.div`
  position: relative;
  z-index: 1;
`;

const LabelTag = styled.span`
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: var(--label-glow);
  text-transform: uppercase;
  margin-bottom: 0.4rem;
  opacity: 0.9;
  filter: brightness(0.8) contrast(1.2);
`;

const LabelTitle = styled.strong`
  display: block;
  color: #0c3848;
  font-size: 1.45rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 0.02em;
  margin-bottom: 0.5rem;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
`;

const LabelText = styled.span`
  display: block;
  color: rgba(12, 56, 72, 0.75);
  font-size: 0.85rem;
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const LabelAction = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #0c3848;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  position: relative;
  overflow: hidden;
  padding-bottom: 2px;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: var(--label-glow);
    opacity: 0.6;
  }
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
    animation: ${shimmer} 3s infinite;
  }
`;

function BiomeLabel({ config, position }) {
  if (!config || !position) return null;

  return (
    <Html
      position={position}
      zIndexRange={[30, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <LabelWrap $glow={config.glow}>
        <LabelInner>
          <LabelContent>
            <LabelTag>LOCATION MAP</LabelTag>
            <LabelTitle>{config.label}</LabelTitle>
            <LabelText>{config.description}</LabelText>
            <LabelAction>Click to enter →</LabelAction>
          </LabelContent>
        </LabelInner>
      </LabelWrap>
    </Html>
  );
}

export default BiomeLabel;

