import { Html } from '@react-three/drei';

function BiomeLabel({ config, position }) {
  if (!config || !position) return null;

  return (
    <Html position={position} zIndexRange={[30, 0]}>
      <div
        style={{
          position: 'relative',
          minWidth: 220,
          maxWidth: 300,
          padding: '14px 16px 13px',
          border: '1px solid rgba(125, 211, 252, 0.28)',
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(9, 22, 38, 0.78), rgba(15, 23, 42, 0.66))',
          color: '#e6f7ff',
          fontSize: 13,
          lineHeight: 1.55,
          textAlign: 'left',
          backdropFilter: 'blur(18px) saturate(1.2)',
          boxShadow: `0 24px 60px rgba(2, 8, 23, 0.38), 0 0 24px ${config.glow}24, inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
          pointerEvents: 'none',
          transform: 'translate(22px, -50%)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 20,
            background: 'radial-gradient(circle at 18% 0%, rgba(125, 211, 252, 0.18), transparent 38%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              width: 34,
              height: 3,
              borderRadius: 999,
              marginBottom: 9,
              background: `linear-gradient(90deg, ${config.glow}, transparent)`,
              opacity: 0.92,
            }}
          />
          <strong
            style={{
              display: 'block',
              color: config.glow,
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: '0.02em',
              marginBottom: 6,
            }}
          >
            {config.label}
          </strong>
          <span
            style={{
              display: 'block',
              color: 'rgba(226, 244, 255, 0.78)',
              fontSize: 14,
              lineHeight: 1.58,
            }}
          >
            {config.description}
          </span>
          <span
            style={{
              display: 'block',
              marginTop: 11,
              color: 'rgba(125, 211, 252, 0.68)',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            Click to enter
          </span>
        </div>
      </div>
    </Html>
  );
}

export default BiomeLabel;
