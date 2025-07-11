// src/components/pages/AnimatedLandingPage.tsx
import { useState, useEffect } from 'react';

// --- Mobile Detection Hook (Integrated directly into this file) ---
const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
}


// --- The Main Landing Page Component ---
interface AnimatedLandingPageProps {
  onComplete: () => void;
}

export function AnimatedLandingPage({ onComplete }: AnimatedLandingPageProps) {
  // --- STATE MANAGEMENT ---
  const isMobile = useIsMobile();
  const [displayText, setDisplayText] = useState('TempWallets');
  const [isExiting, setIsExiting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  // --- MOUSE TRACKING FOR DESKTOP ---
  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMobile]);

  // --- MAIN ANIMATION AND EXIT LOGIC ---
  useEffect(() => {
    if (isMobile) {
      // On mobile, show the logo briefly, then display the 'not available' message and pause.
      const timer = setTimeout(() => {
        setDisplayText('Tempwallets is not available for this device');
      }, 2500); // Show message after 2.5 seconds
      return () => clearTimeout(timer);
    } else {
      // On desktop, start the exit process after 4 seconds.
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onComplete, 500);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, onComplete]);

  // --- RENDER ---
  return (
    <div
      className={`loading-screen ${isExiting ? 'fade-out' : ''}`}
      style={{
        '--mouseX': `${mousePosition.x}%`,
        '--mouseY': `${mousePosition.y}%`,
      } as React.CSSProperties}
    >
      <div className="background-glares">
        <div className="glare glare-1"></div>
        <div className="glare glare-2"></div>
        <div className="glare glare-3"></div>
      </div>

      <h1
        className={`tempwallets-logo ${displayText !== 'TempWallets' ? 'mobile-text' : ''}`}
      >
        {displayText}
      </h1>
    </div>
  );
}