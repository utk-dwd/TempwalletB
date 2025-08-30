// src/components/pages/AnimatedLandingPage.tsx
import { useState, useEffect } from 'react';

// --- Mobile Detection Hook (No changes needed here) ---
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
  const [isExiting, setIsExiting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  // --- MOUSE TRACKING FOR DESKTOP ---
  useEffect(() => {
    if (isMobile) return; // Keep this as is: no mouse tracking on mobile.

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

  // --- MODIFIED ANIMATION AND EXIT LOGIC ---
  useEffect(() => {
    if (isMobile) {
      // 1. If on mobile, call onComplete immediately.
      onComplete();
      return; // Stop further execution for mobile.
    }

    // On desktop, the original logic remains.
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 500); // Call onComplete after the fade-out animation.
    }, 4000);

    return () => clearTimeout(timer);
  }, [isMobile, onComplete]);

  // 2. Render nothing on mobile.
  // This prevents any flash of the landing page before the logic above runs.
  if (isMobile) {
    return null;
  }

  // --- RENDER (This part now only runs on desktop) ---
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

      <h1 className="tempwallets-logo">
        TempWallets
      </h1>
    </div>
  );
}