// src/components/ThemeChanger.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ThemeChangerProps {
  onThemeChange: (bgImage: string) => void;
}

export default function ThemeChanger({ onThemeChange }: ThemeChangerProps) {
  const backgrounds = [
    '/assets/images/bg1.jpg',
    '/assets/images/bg2.jpg',
    '/assets/images/bg3.jpg',
  ];

  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  const handleChangeBackground = () => {
    const nextIndex = (currentBgIndex + 1) % backgrounds.length;
    setCurrentBgIndex(nextIndex);
    onThemeChange(backgrounds[nextIndex]);
  };

  return (
    <div className="theme-changer absolute top-4 right-4 z-10">
      <Button
        onClick={handleChangeBackground}
        className="bg-success-green text-white rounded-lg hover:bg-green-600"
      >
        Change Background
      </Button>
    </div>
  );
}