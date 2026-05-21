import { useEffect, useRef } from 'react';

const TextPressure = ({
  text = 'HELLO!',
  fontFamily = 'Inter',
  fontUrl = 'https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2',
  width = true,
  weight = true,
  italic = true,
  flex = true,
  stroke = true,
  scale = false,
  textColor = 'rgba(0, 122, 255, 0.3)',
  strokeColor = '#0041AA',
  className = '',
  minFontSize = 120,
  charsPerLine = 8,
}) => {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const spansRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const cursorRef = useRef({ x: 0, y: 0 });

  const chars = text.split('');

  const dist = (a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      cursorRef.current.x = e.clientX;
      cursorRef.current.y = e.clientY;
    };
    const handleTouchMove = (e) => {
      const t = e.touches[0];
      cursorRef.current.x = t.clientX;
      cursorRef.current.y = t.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    if (containerRef.current) {
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = left + width / 2;
      mouseRef.current.y = top + height / 2;
      cursorRef.current.x = mouseRef.current.x;
      cursorRef.current.y = mouseRef.current.y;
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useEffect(() => {
    let rafId;
    const animate = () => {
      mouseRef.current.x += (cursorRef.current.x - mouseRef.current.x) / 15;
      mouseRef.current.y += (cursorRef.current.y - mouseRef.current.y) / 15;

      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        const maxDist = Math.min(200, titleRect.width / 3);

        spansRef.current.forEach((span) => {
          if (!span) return;

          const rect = span.getBoundingClientRect();
          const charCenter = {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
          };

          const d = dist(mouseRef.current, charCenter);
          const getAttr = (distance, minVal, maxVal) => {
            if (distance > maxDist) return minVal;
            const val = maxVal - Math.abs((maxVal * distance) / maxDist);
            return Math.max(minVal, val + minVal);
          };

          const wdth = width ? Math.floor(getAttr(d, 5, 200)) : 100;
          const wght = weight ? Math.floor(getAttr(d, 100, 900)) : 400;
          const italVal = italic ? getAttr(d, 0, 1).toFixed(2) : 0;

          const fontSize = getAttr(d, 120, 200);

          const colorIntensity = getAttr(d, 0, 1);
          const r = 0;
          const g = Math.round(122 - (122 - 65) * colorIntensity);
          const b = Math.round(255 - (255 - 170) * colorIntensity);
          const opacity = 0.3 + (0.7 * colorIntensity);

          span.style.opacity = opacity;
          span.style.color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
          span.style.fontSize = `${fontSize}px`;
          span.style.fontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;
        });
      }

      rafId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(rafId);
  }, [width, weight, italic, chars.length]);

  const dynamicClassName = [className, flex ? 'flex' : '', stroke ? 'stroke' : '']
    .filter(Boolean)
    .join(' ');

  // 将文字分成多行
  const lines = text.split('').reduce((acc, char, i) => {
    const lineIndex = Math.floor(i / charsPerLine);
    if (!acc[lineIndex]) acc[lineIndex] = [];
    acc[lineIndex].push(char);
    return acc;
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'transparent',
      }}
    >
      <style>{`
        @font-face {
          font-family: '${fontFamily}';
          src: url('${fontUrl}');
          font-style: normal;
        }

        .flex {
          display: flex;
          justify-content: space-between;
        }

        .stroke span {
          position: relative;
          color: ${textColor};
        }

        .stroke span::after {
          content: attr(data-char);
          position: absolute;
          left: 0;
          top: 0;
          color: transparent;
          z-index: -1;
          -webkit-text-stroke-width: 3px;
          -webkit-text-stroke-color: ${strokeColor};
        }

        .text-pressure-title {
          color: ${textColor};
        }
      `}</style>

      <h1
        ref={titleRef}
        className={`text-pressure-title ${dynamicClassName}`}
        style={{
          fontFamily,
          textTransform: 'uppercase',
          fontSize: minFontSize,
          lineHeight: 1.2,
          transform: `scale(1, 1)`,
          transformOrigin: 'center top',
          margin: 0,
          textAlign: 'center',
          userSelect: 'none',
          fontWeight: 100,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        {lines.map((line, lineIndex) => (
          <div
            key={lineIndex}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.3rem',
            }}
          >
            {line.map((char, charIndex) => (
              <span
                key={lineIndex * charsPerLine + charIndex}
                ref={(el) => (spansRef.current[lineIndex * charsPerLine + charIndex] = el)}
                data-char={char}
                style={{
                  display: 'inline-block',
                  color: stroke ? undefined : textColor
                }}
              >
                {char}
              </span>
            ))}
          </div>
        ))}
      </h1>
    </div>
  );
};

export default TextPressure; 