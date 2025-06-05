// src/components/layout/Header.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAnimeAvatarUrl } from '@/server/animeAvatarService'; // Using the updated service

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

  const [animeAvatarUrl, setAnimeAvatarUrl] = useState<string | null>(null);
   // On mount, fetch the anime avatar (only if no profilePicture is set)
   useEffect(() => {
    if (!profilePicture && !tempProfilePicture) {
      // Directly get the full URL from the service
      const newAnimeAvatarUrl = getAnimeAvatarUrl(name); // Pass name or other params as needed
      console.log('[HEADER] Setting anime avatar URL to:', newAnimeAvatarUrl);
      setAnimeAvatarUrl(newAnimeAvatarUrl);
    } else if (profilePicture || tempProfilePicture) {
      if (animeAvatarUrl) { // Only clear if it was previously set
        console.log('[HEADER] User picture present, clearing anime avatar URL.');
        setAnimeAvatarUrl(null);
      }
    }
  }, [name, profilePicture, tempProfilePicture, animeAvatarUrl]); // Added animeAvatarUrl to deps to avoid clearing if already null

  // Use this helper to decide which avatar image to show
  const avatarSrc = isEditingProfile
    ? tempProfilePicture || animeAvatarUrl || null
    : profilePicture || animeAvatarUrl || null;



  return (
    <header className="h-28 bg-[var(--overlay)] backdrop-blur-[var(--blur)] rounded-xl px-8 py-6 flex items-center justify-between">
    {/* Left Side: Avatar and Name */}
    <div className="flex items-center gap-3">
      {isEditingProfile ? (
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="px-3 py-2 bg-transparent text-white border border-white/20 rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-white"
          />
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            className="px-3 py-2 bg-transparent text-white border border-white/20 rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-white"
          />
          <Button
            onClick={handleSaveProfile}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 transition-colors"
          >
            Save
          </Button>
        </div>
      ) : (
        <div className="relative flex items-center gap-2">
          <Avatar className="bg-success-green w-24 h-24">
            {avatarSrc ? (
              <AvatarImage src={avatarSrc} alt="Profile Picture" className="object-cover w-full h-full -top-0" />
            ) : (
              <AvatarFallback className="text-2xl">{name.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          <p className="text-xl font-medium text-white">Welcome {name}</p>
          <button
            onClick={handleEditProfile}
            className="absolute top-[0.5rem] -right-2 p-1 bg-white/30 rounded-full hover:bg-white/50"
          >
            <Pencil className="w-4 h-4 text-white" />
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
                className="px-3 py-2 bg-transparent text-white border border-white/20 rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-white"
              />
              <Button
                onClick={handleSaveWalletName}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 transition-colors"
              >
                Save
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="text-left">
                <p className="text-regular font-medium text-white mb-3">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-5)}` : 'Not connected'}
                </p>
                <p className="text-xs text-white">{walletName || 'wallet-name'}</p>
              </div>
              <button
                onClick={handleEditWalletName}
                className="absolute top-[1rem] right-[calc(var(--spacing)*7)] p-[calc(var(--spacing)*1)] bg-white/30 rounded-full hover:bg-white/50"
              >
                <Pencil className="w-4 h-4 text-white" />
              </button>
            </div>
          )
        ) : (
          <Button
            onClick={onConnectWallet}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 transition-colors"
          >
            Connect Wallet
          </Button>
        )}
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 transition-colors"
          onClick={onProfileClick}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </header>
  );
}