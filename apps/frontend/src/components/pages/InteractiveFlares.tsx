// src/components/pages/InteractiveFlares.tsx
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function InteractiveFlares() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Correctly apply spring physics using the useSpring hook.
  // This creates a new MotionValue that smoothly follows the original mouse coordinates.
  const springConfig = { damping: 100, stiffness: 10, mass: 5 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  // useTransform now combines the two "sprung" motion values into a single background style.
  // We explicitly type the destructured array to help TypeScript.
  const flare1Background = useTransform(
    [mouseXSpring, mouseYSpring],
    ([x, y]: (number | string)[]) => `radial-gradient(600px at ${x}px ${y}px, rgba(29, 78, 216, 0.15), transparent 80%)`
  );

  const flare2Background = useTransform(
    [mouseXSpring, mouseYSpring],
    ([x, y]: (number | string)[]) => `radial-gradient(800px at ${x}px ${y}px, rgba(129, 140, 248, 0.1), transparent 80%)`
  );

  return (
    <div
      onMouseMove={(e) => {
        // Update the raw mouse position on every move.
        // The useSpring hook will handle the smooth transition automatically.
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }}
      className="fixed inset-0 -z-10" // Positioned behind all content
    >
      {/* Static background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black" />

      {/* Interactive flare 1 */}
      <motion.div
        style={{
          background: flare1Background,
        }}
        className="absolute inset-0"
      />

      {/* Interactive flare 2 (adds more color depth) */}
      <motion.div
        style={{
           background: flare2Background,
        }}
        className="absolute inset-0"
      />
    </div>
  );
}
