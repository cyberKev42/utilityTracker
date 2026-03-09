import { useEffect, useRef } from 'react';
import { animate, useMotionValue } from 'framer-motion';

const MASK_URL =
  'https://framerusercontent.com/images/rR6HYXBrMmX4cRpXfXUOvpvpB0.png';
const NOISE_URL =
  'https://framerusercontent.com/images/rR6HYXBrMmX4cRpXfXUOvpvpB0.png';

function useAnimatedValue(from, to, duration, repeat) {
  const value = useMotionValue(from);
  useEffect(() => {
    const controls = animate(value, [from, to], {
      duration,
      repeat: Infinity,
      repeatType: repeat || 'mirror',
      ease: 'easeInOut',
    });
    return controls.stop;
  }, [value, from, to, duration, repeat]);
  return value;
}

export function EtherealShadow({
  color = 'rgba(120, 80, 255, 0.7)',
  animation = { scale: 60, speed: 50 },
  noise = { opacity: 0.4, scale: 1.2 },
  sizing = 'fill',
}) {
  const filterId = useRef(`ef-${Math.random().toString(36).slice(2)}`).current;

  const scale = (animation.scale ?? 60) / 100;
  const speed = (animation.speed ?? 50) / 100;

  // turbulence baseFrequency animation
  const freq1 = useAnimatedValue(
    0.003 + scale * 0.005,
    0.006 + scale * 0.008,
    4 + (1 - speed) * 8
  );
  const freq2 = useAnimatedValue(
    0.004 + scale * 0.004,
    0.008 + scale * 0.006,
    5 + (1 - speed) * 9
  );

  // displacement scale animation
  const dispScale = useAnimatedValue(
    80 + scale * 120,
    140 + scale * 180,
    3 + (1 - speed) * 6
  );

  useEffect(() => {
    const feTurb = document.getElementById(`${filterId}-turb`);
    const feDisp = document.getElementById(`${filterId}-disp`);
    if (!feTurb || !feDisp) return;

    const unsubFreq1 = freq1.on('change', () => {
      feTurb.setAttribute(
        'baseFrequency',
        `${freq1.get().toFixed(5)} ${freq2.get().toFixed(5)}`
      );
    });
    const unsubDisp = dispScale.on('change', () => {
      feDisp.setAttribute('scale', dispScale.get().toFixed(1));
    });

    return () => {
      unsubFreq1();
      unsubDisp();
    };
  }, [filterId, freq1, freq2, dispScale]);

  const objectFit = sizing === 'stretch' ? 'fill' : 'cover';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        width: '100%',
        height: '100%',
      }}
    >
      {/* SVG filter definition */}
      <svg
        style={{ position: 'absolute', width: 0, height: 0 }}
        aria-hidden="true"
      >
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              id={`${filterId}-turb`}
              type="turbulence"
              baseFrequency="0.005 0.006"
              numOctaves="3"
              seed="2"
              result="turbulence"
            />
            <feColorMatrix
              type="saturate"
              values="10"
              in="turbulence"
              result="coloredTurbulence"
            />
            <feDisplacementMap
              id={`${filterId}-disp`}
              in="SourceGraphic"
              in2="coloredTurbulence"
              scale="120"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
          </filter>
        </defs>
      </svg>

      {/* Colored shadow layer with mask */}
      <div
        style={{
          position: 'absolute',
          inset: '-10%',
          backgroundImage: `url(${MASK_URL})`,
          backgroundSize: objectFit === 'cover' ? 'cover' : '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: color,
          backgroundBlendMode: 'multiply',
          filter: `url(#${filterId})`,
          opacity: 1,
        }}
      />

      {/* Solid color layer underneath for base glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: color,
          opacity: 0.3,
          zIndex: -1,
        }}
      />

      {/* Noise overlay */}
      {noise && noise.opacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${NOISE_URL})`,
            backgroundSize: `${(noise.scale ?? 1) * 200}px`,
            opacity: noise.opacity ?? 0.4,
            mixBlendMode: 'overlay',
          }}
        />
      )}
    </div>
  );
}
