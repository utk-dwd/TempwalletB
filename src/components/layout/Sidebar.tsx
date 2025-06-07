// src/components/layout/Sidebar.tsx
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeItem: string;
  onNavClick: (item: string) => void;
}

export function Sidebar({ activeItem, onNavClick }: SidebarProps) {
  const navItems = ['Dashboard', 'Address Book', 'History', 'Settings', 'Terms of Use'];

  return (
    <div className="sidebar w-[280px] h-auto p-4 flex flex-col rounded-xl mb-5 mt-5 ml-5 border border-white/20">
      {/* Temp Wallet Logo */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-sidebar-foreground">tempwallets.com</h2>
      </div>

      {/* Navigation Items */}
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <Button
            key={item}
            variant="ghost"
            className={`sidebar-item w-full justify-start h-10 px-3 py-2 text-sidebar-foreground ${
              activeItem === item ? 'active' : ''
            } ${item === 'Terms of Use' ? 'mt-auto' : ''}`}
            onClick={() => onNavClick(item)}
          >
            {item}
          </Button>
        ))}
      </nav>
    </div>
  );
}