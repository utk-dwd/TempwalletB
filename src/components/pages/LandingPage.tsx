// src/components/pages/LandingPage.tsx
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FiEyeOff } from 'react-icons/fi'; // Using a popular icon library for the logo

interface AnimatedLandingPageProps {
  onComplete: () => void;
}

export function AnimatedLandingPage({ onComplete }: AnimatedLandingPageProps) {
  const [animationState, setAnimationState] = useState('intro');
  const controls = useAnimation();

  // Mouse tracking for light reflection
  const mouseX = useMotionValue(Infinity);
  const mouseY = useMotionValue(Infinity);

  const gradientX = useTransform(mouseX, (val) => `${val}px`);
  const gradientY = useTransform(mouseY, (val) => `${val}px`);

  // Animation sequence
  useEffect(() => {
    const sequence = async () => {
      await controls.start('visible');
      await controls.start('flip');
      setAnimationState('text');
      await controls.start('textVisible');
    };
    sequence();
  }, [controls]);

  // Timeout and scroll listener to end the animation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (animationState === 'text') {
        onComplete();
      }
    }, 6000);

    const handleScroll = () => {
      onComplete();
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [animationState, onComplete]);

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden"
      onMouseMove={(e) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: animationState === 'done' ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        style={{
          // @ts-ignore
          '--gradient-x': gradientX,
          '--gradient-y': gradientY,
        }}
        className="relative"
      >
        {/* Incognito Logo */}
        <motion.div
          style={{ perspective: '1000px' }}
          animate={controls}
          initial={{ opacity: 0, scale: 0.8 }}
          variants={{
            visible: { opacity: 1, scale: 1, transition: { duration: 1 } },
            flip: { rotateY: 90, transition: { duration: 0.5, delay: 2 } },
            hidden: { opacity: 0 },
          }}
        >
          <div className="relative text-gray-400 icon-glow-container">
            <FiEyeOff size={128} />
          </div>
        </motion.div>

        {/* TempWallets Text */}
        {animationState === 'text' && (
          <motion.h1
            className="text-6xl font-bold text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center"
            style={{ rotateY: -90 }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              rotateY: 0,
              transition: { duration: 0.5 },
            }}
          >
            <span className="gradient-text">TempWallets</span>
          </motion.h1>
        )}
      </motion.div>
    </motion.div>
  );
}