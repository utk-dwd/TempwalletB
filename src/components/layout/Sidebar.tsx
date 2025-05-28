// src/components/layout/Sidebar.tsx
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeItem: string;
  onNavClick: (item: string) => void;
}

export function Sidebar({ activeItem, onNavClick }: SidebarProps) {
  return (
    <div className="w-[280px] h-screen bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl p-4 flex flex-col">
      {/* Temp Wallet Logo */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-text-primary">tempwallets.com</h2>
      </div>

      {/* Navigation Items */}
      <nav className="space-y-2">
        <Button
          variant="ghost"
          className={`w-full justify-start h-10 px-3 py-2 rounded-lg ${
            activeItem === 'Dashboard'
              ? 'bg-orange-50 text-orange-600 border-l-2 border-orange-500'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onNavClick('Dashboard')}
        >
          Dashboard
        </Button>
        <Button
          variant="ghost"
          className={`w-full justify-start h-10 px-3 py-2 rounded-lg ${
            activeItem === 'Address Book' ? 'bg-orange-50 text-orange-600 border-l-2 border-orange-500' : 'hover:bg-gray-50'
          }`}
          onClick={() => onNavClick('Address Book')}
        >
          Address Book
        </Button>
        <Button
          variant="ghost"
          className={`w-full justify-start h-10 px-3 py-2 rounded-lg ${
            activeItem === 'History' ? 'bg-orange-50 text-orange-600 border-l-2 border-orange-500' : 'hover:bg-gray-50'
          }`}
          onClick={() => onNavClick('History')}
        >
          History
        </Button>
        <Button
          variant="ghost"
          className={`w-full justify-start h-10 px-3 py-2 rounded-lg ${
            activeItem === 'Settings' ? 'bg-orange-50 text-orange-600 border-l-2 border-orange-500' : 'hover:bg-gray-50'
          }`}
          onClick={() => onNavClick('Settings')}
        >
          Settings
        </Button>
      </nav>
      {/* Terms of Use at Bottom of Sidebar */}
      <Button
        variant="ghost"
        className={`w-full justify-start h-10 px-3 py-2 rounded-lg mt-auto ${
          activeItem === 'Terms of Use' ? 'bg-orange-50 text-orange-600 border-l-2 border-orange-500' : 'hover:bg-gray-50'
        }`}
        onClick={() => onNavClick('Terms of Use')}
      >
        Terms of Use
      </Button>
    </div>
  );
}