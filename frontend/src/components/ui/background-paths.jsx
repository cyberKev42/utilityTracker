import { motion } from 'framer-motion';

function FloatingPaths({ position }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M${-380 - i * 5 * position} ${-189 + i * 40}C${-380 - i * 5 * position} ${
      -189 + i * 40
    } ${-312 - i * 5 * position} ${216 - i * 40} ${152 - i * 5 * position} ${
      343 - i * 40
    }C${616 - i * 5 * position} ${470 - i * 40} ${684 - i * 5 * position} ${
      875 - i * 40
    } ${684 - i * 5 * position} ${875 - i * 40}`,
    width: 0.5 + i * 0.03,
    duration: 20 + Math.random() * 10,
    delay: Math.random() * 5,
  }));

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        color: 'inherit',
      }}
      viewBox="0 0 696 316"
      fill="none"
    >
      {paths.map((path) => (
        <motion.path
          key={path.id}
          d={path.d}
          stroke="currentColor"
          strokeWidth={path.width}
          strokeOpacity={0.3}
          initial={{ pathLength: 0.3, opacity: 0.3, pathOffset: 0 }}
          animate={{
            pathLength: [0.3, 1, 0.3],
            opacity: [0.3, 0.6, 0.3],
            pathOffset: [0, 1, 0],
          }}
          transition={{
            duration: path.duration,
            ease: 'linear',
            repeat: Infinity,
            delay: path.delay,
          }}
        />
      ))}
    </svg>
  );
}

export function BackgroundPaths({ color }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        color: color || 'currentColor',
      }}
    >
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />
    </div>
  );
}
