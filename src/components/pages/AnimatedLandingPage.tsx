// src/components/pages/AnimatedLandingPage.tsx
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FiEyeOff } from 'react-icons/fi';
import { InteractiveFlares } from './InteractiveFlares';

interface AnimatedLandingPageProps {
  onComplete: () => void;
}

export function AnimatedLandingPage({ onComplete }: AnimatedLandingPageProps) {
  const containerControls = useAnimation();
  const backFaceControls = useAnimation();
  const [isExiting, setIsExiting] = useState(false);

  // --- ANIMATION SEQUENCE ---
  useEffect(() => {
    if (isExiting) return; // Don't run entry animation if exiting

    const sequence = async () => {
      // 1. The container scales up and fades in.
      await containerControls.start({
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: 'easeOut' },
      });

      // 2. Just before the flip, allow the back face to be rendered.
      await backFaceControls.start({ opacity: 1 });

      // 3. The container flips.
      await containerControls.start({
        rotateY: 180,
        transition: { duration: 1, ease: 'easeInOut', delay: 1.5 },
      });
    };
    sequence();
  }, [containerControls, backFaceControls, isExiting]);

  // --- EXIT LOGIC ---
  useEffect(() => {
    const handleExit = () => {
      setIsExiting(true);
    };

    const timer = setTimeout(handleExit, 4000);
    window.addEventListener('scroll', handleExit, { once: true });
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleExit);
    };
  }, []); // This effect should only run once

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-transparent relative overflow-hidden"
    >
      <InteractiveFlares />

      {/* FIX: This outer motion.div now controls the fade-out, leaving the dark background intact. */}
      <motion.div
        style={{ perspective: '1200px' }}
        variants={{
          visible: { opacity: 1 },
          hidden: { opacity: 0, transition: { duration: 0.8, ease: 'easeOut' } },
        }}
        initial="visible"
        animate={isExiting ? 'hidden' : 'visible'}
        onAnimationComplete={(definition) => {
          if (definition === 'hidden') {
            onComplete();
          }
        }}
      >
        <motion.div
          className="flipper-container"
          initial={{ opacity: 0, scale: 0.8, rotateY: 0 }}
          animate={containerControls}
        >
          {/* Back Face: TempWallets Text - controlled with separate animation */}
          <motion.div
            className="flipper-face flipper-back"
            initial={{ opacity: 0 }} // Starts completely invisible
            animate={backFaceControls}
          >
            <h1 className="logo-text-3d">TempWallets</h1>
          </motion.div>

          {/* Front Face: Incognito Logo */}
          <div className="flipper-face flipper-front">
            <div className="logo-3d-effect">
              <FiEyeOff size={128} className="text-gray-400" />
            </div>
            <div className="static-glossy-overlay" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
