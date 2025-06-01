// src/components/layout/Header.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  walletAddress: string | null;
  walletName: string;
  name: string;
  profilePicture: string | null;
  onConnectWallet: () => void;
  onProfileClick: () => void;
  onEditProfile: (name: string, profilePicture: string | null) => void;
  onEditWalletName: (walletName: string) => void;
}

export function Header({
  walletAddress,
  walletName,
  name,
  profilePicture,
  onConnectWallet,
  onProfileClick,
  onEditProfile,
  onEditWalletName,
}: HeaderProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingWalletName, setIsEditingWalletName] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempProfilePicture, setTempProfilePicture] = useState<string | null>(profilePicture);
  const [tempWalletName, setTempWalletName] = useState(walletName);

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    onEditProfile(tempName, tempProfilePicture);
    setIsEditingProfile(false);
  };

  const handleEditWalletName = () => {
    setIsEditingWalletName(true);
  };

  const handleSaveWalletName = () => {
    onEditWalletName(tempWalletName);
    setIsEditingWalletName(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header className="h-28 bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl px-8 py-6 flex items-center justify-between">
      {/* Left Side: Avatar and Name */}
      <div className="flex items-center gap-3">
        {isEditingProfile ? (
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm text-text-primary bg-white border border-gray-300 rounded-lg px-2 py-1"
            />
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="text-xl font-medium text-text-primary px-2 py-1 rounded-lg bg-white border border-gray-300"
            />
            <Button onClick={handleSaveProfile} className="bg-success-green text-white rounded-lg hover:bg-green-600">
              Save
            </Button>
          </div>
        ) : (
          <div className="relative flex items-center gap-2">
            <Avatar className="bg-success-green w-24 h-24">
              {profilePicture ? (
                <AvatarImage src={profilePicture} alt="Profile Picture" />
              ) : (
                <AvatarFallback className="text-2xl">{name.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <p className="text-xl font-medium text-text-primary">Welcome {name}</p>
            <button
              onClick={handleEditProfile}
              className="absolute -top-2 -right-2 p-1 bg-white/30 rounded-full hover:bg-white/50"
            >
              <Pencil className="w-4 h-4 text-text-primary" />
            </button>
          </div>
        )}
      </div>

      {/* Right Side: Wallet Info or Connect Button and Profile Toggle */}
      <div className="flex items-center gap-2">
        {walletAddress ? (
          isEditingWalletName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempWalletName}
                onChange={(e) => setTempWalletName(e.target.value)}
                className="text-sm font-medium text-text-primary px-2 py-1 rounded-lg bg-white border border-gray-300"
              />
              <Button onClick={handleSaveWalletName} className="bg-success-green text-white rounded-lg hover:bg-green-600">
                Save
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="text-right">
                <p className="text-regular font-medium text-text-primary mb-3">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-5)}` : 'Not connected'}
                </p>
                <p className="text-xs text-text-secondary">{walletName || 'wallet-name'}</p>
              </div>
              <button
                onClick={handleEditWalletName}
                className="absolute -top-2 -right-7 p-8 bg-white/30 rounded-full hover:bg-white/50"
              >
                <Pencil className="w-4 h-4 text-text-primary" />
              </button>
            </div>
          )
        ) : (
          <Button onClick={onConnectWallet} className="bg-accent-orange text-white rounded-lg hover:bg-orange-600">
            Connect Wallet
          </Button>
        )}
        <button className="p-2 rounded-full hover:bg-gray-100" onClick={onProfileClick}>
          <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </header>
  );
}