import { Html } from '@react-three/drei';
import styled, { keyframes } from 'styled-components';

const dropletBreathe = keyframes`
  0%, 100% {
    border-radius: 42% 58% 46% 54% / 48% 42% 58% 52%;
    transform: translate(24px, -50%) rotate(-1deg);
  }
  45% {
    border-radius: 55% 45% 58% 42% / 42% 56% 44% 58%;
    transform: translate(24px, -51%) rotate(1.2deg);
  }
  72% {
    border-radius: 48% 52% 41% 59% / 58% 45% 55% 42%;
    transform: translate(24px, -49%) rotate(-0.6deg);
  }
`;

const tideLine = keyframes`
  from { transform: translateX(-120%); }
  to { transform: translateX(180%); }
`;

const LabelWrap = styled.div`
  --label-glow: ${({ $glow }) => $glow};
  position: relative;
  width: 264px;
  min-height: 172px;
  padding: 1px;
  color: #e6f7ff;
  pointer-events: none;
  filter:
    drop-shadow(0 24px 34px rgba(4, 15, 25, 0.32))
    drop-shadow(0 0 18px color-mix(in srgb, var(--label-glow) 30%, transparent));
  animation: ${dropletBreathe} 5.6s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    left: -11px;
    top: 50%;
    width: 34px;
    height: 34px;
    transform: translateY(-50%) rotate(45deg);
    border-radius: 60% 40% 55% 45%;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.72), var(--label-glow));
    opacity: 0.76;
  }
`;

const LabelInner = styled.div`
  position: relative;
  min-height: inherit;
  padding: 1.25rem 1.35rem 1.18rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--label-glow) 36%, rgba(255, 255, 255, 0.18));
  border-radius: inherit;
  background:
    radial-gradient(circle at 26% 12%, color-mix(in srgb, var(--label-glow) 22%, transparent), transparent 36%),
    linear-gradient(135deg, rgba(10, 35, 45, 0.88), rgba(11, 24, 34, 0.76) 62%, rgba(8, 30, 36, 0.68));
  backdrop-filter: blur(18px) saturate(1.22);

  &::before {
    content: '';
    position: absolute;
    left: 1.3rem;
    right: 1.5rem;
    top: 1.08rem;
    height: 3px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--label-glow), rgba(255, 255, 255, 0.58), transparent 54%);
  }

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 55%;
    height: 100%;
    background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.12), transparent);
    animation: ${tideLine} 3.8s ease-in-out infinite;
  }
`;

const LabelContent = styled.div`
  position: relative;
  z-index: 1;
  padding-top: 1.6rem;
`;

const LabelTitle = styled.strong`
  display: block;
  color: color-mix(in srgb, var(--label-glow) 72%, #ffffff);
  font-size: 1.55rem;
  font-weight: 900;
  line-height: 1.12;
  letter-spacing: 0.04em;
  margin-bottom: 0.65rem;
`;

const LabelText = styled.span`
  display: block;
  color: rgba(226, 244, 255, 0.78);
  font-size: 0.88rem;
  line-height: 1.58;
`;

const LabelAction = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  margin-top: 0.9rem;
  color: color-mix(in srgb, var(--label-glow) 80%, #ffffff);
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;

  &::after {
    content: '';
    width: 20px;
    height: 1px;
    background: currentColor;
    opacity: 0.8;
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
            <LabelTitle>{config.label}</LabelTitle>
            <LabelText>{config.description}</LabelText>
            <LabelAction>Click to enter</LabelAction>
          </LabelContent>
        </LabelInner>
      </LabelWrap>
    </Html>
  );
}

export default BiomeLabel;
