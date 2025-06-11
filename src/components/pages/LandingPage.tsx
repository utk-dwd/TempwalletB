// src/components/pages/LandingPage.tsx
import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface LandingPageProps {
  onComplete: () => void;
}

const LightningBackground = () => (
  <motion.div
    className="absolute inset-0"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { duration: 1, repeat: Infinity, repeatType: 'reverse' } }}
    style={{
      background: 'linear-gradient(45deg, #F8F9FA, #E5E7EB)',
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-orange/20 to-transparent animate-pulse" />
  </motion.div>
);

const DispersionText = () => (
  <motion.h1
    className="text-6xl font-bold text-text-primary"
    initial={{ opacity: 1, scale: 1 }}
    animate={{
      opacity: 0,
      scale: 1.2,
      transition: { duration: 1, delay: 1.5 },
    }}
    style={{ filter: 'blur(0px)' }}
    onAnimationComplete={() => {}}
  >
    TempWallets
  </motion.h1>
);

export function LandingPage({ onComplete }: LandingPageProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-primary-bg relative overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0, transition: { duration: 0.5, delay: 2.5 } }}
    >
      <LightningBackground />
      <DispersionText />
    </motion.div>
  );
}