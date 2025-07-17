// src/components/layout/Header.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil, AlertCircle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAnimeAvatarUrl } from '@/server/animeAvatarService';
import { HoverInfoBox } from '@/components/ui/HoverInfoBox';
import * as Tooltip from '@radix-ui/react-tooltip';
import analyticsService from '@/services/analytics';
import { EventName } from '@/utils/types';

interface HeaderProps {
  walletAddress: string | null;
  walletName: string;
  name: string;
  profilePicture: string | null;
  onConnectWallet: () => Promise<boolean>;
  onProfileClick: () => void;
  onEditProfile: (name: string, profilePicture: string | null) => void;
  onEditWalletName: (walletName: string) => void;
  setNotification: (notification: { brief: string; full: string; type: 'error' | 'success' } | null) => void;
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
  setNotification,
}: HeaderProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingWalletName, setIsEditingWalletName] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempProfilePicture, setTempProfilePicture] = useState<string | null>(profilePicture);
  const [tempWalletName, setTempWalletName] = useState(walletName);
  const [animeAvatarUrl, setAnimeAvatarUrl] = useState<string | null>(null);

  // On mount, fetch the anime avatar (only if no profilePicture is set)
  useEffect(() => {
    if (!profilePicture && !tempProfilePicture) {
      const newAnimeAvatarUrl = getAnimeAvatarUrl(name);
      console.log('[HEADER] Setting anime avatar URL to:', newAnimeAvatarUrl);
      setAnimeAvatarUrl(newAnimeAvatarUrl);
    } else if (profilePicture || tempProfilePicture) {
      if (animeAvatarUrl) {
        console.log('[HEADER] User picture present, clearing anime avatar URL.');
        setAnimeAvatarUrl(null);
      }
    }
  }, [name, profilePicture, tempProfilePicture, animeAvatarUrl]);

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    analyticsService.trackEvent(EventName.PROFILE_EDIT_STARTED);
  };

  const handleSaveProfile = () => {
    onEditProfile(tempName, tempProfilePicture);
    analyticsService.trackEvent(EventName.PROFILE_EDIT_SAVED);
    if (tempName !== name) {
      analyticsService.trackEvent(EventName.PROFILE_NAME_CHANGED, { characterCount: tempName.length });
    }
    if (tempProfilePicture !== profilePicture) {
      analyticsService.trackEvent(EventName.PROFILE_PICTURE_CHANGED);
    }
    setIsEditingProfile(false);
    setNotification({
      brief: 'Profile updated',
      full: 'Profile settings saved successfully',
      type: 'success',
    });
  };

  const handleEditWalletName = () => {
    setIsEditingWalletName(true);
    analyticsService.trackEvent(EventName.WALLET_NAME_EDIT_STARTED, { walletAddress });
  };

  const handleSaveWalletName = () => {
    onEditWalletName(tempWalletName);
    analyticsService.trackEvent(EventName.WALLET_NAME_EDIT_SAVED);
    if (tempWalletName !== walletName) {
      analyticsService.trackEvent(EventName.WALLET_NAME_CHANGED, { characterCount: tempWalletName.length });
    }
    setIsEditingWalletName(false);
    setNotification({
      brief: 'Wallet name updated',
      full: 'Wallet name saved successfully',
      type: 'success',
    });
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

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      setNotification({
        brief: 'MetaMask not found',
        full: 'Please install MetaMask and try again',
        type: 'error',
      });
      analyticsService.trackEvent(EventName.WALLET_CONNECTION_FAILED, {
        reason: 'MetaMask not installed',
      });
      return;
    }

    try {
      const connected = await onConnectWallet();
      if (connected) {
        setNotification({
          brief: 'Wallet connected',
          full: 'Successfully connected to MetaMask',
          type: 'success',
        });
        analyticsService.trackEvent(EventName.WALLET_CONNECTION_SUCCESS);
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setNotification({
          brief: 'Connection rejected',
          full: 'MetaMask connection failed: User rejected the request',
          type: 'error',
        });
        analyticsService.trackEvent(EventName.WALLET_CONNECTION_FAILED, {
          reason: 'User rejected request',
        });
      } else {
        setNotification({
          brief: 'Connection failed',
          full: err.message || 'Failed to connect to MetaMask',
          type: 'error',
        });
        analyticsService.trackEvent(EventName.WALLET_CONNECTION_FAILED, {
          reason: err.message || 'Unknown error',
        });
      }
    }
  };

  // Use this helper to decide which avatar image to show
  const avatarSrc = isEditingProfile
    ? tempProfilePicture || animeAvatarUrl || null
    : profilePicture || animeAvatarUrl || null;

  return (
    <header className="h-28 bg-[var(--overlay)] backdrop-blur-[var(--blur)] rounded-xl px-8 py-6 flex items-center justify-between ml-5 mr-5 mt-5 mb-3 border border-white/30">
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
            <Avatar className="bg-success-green w-18 h-18">
              {avatarSrc ? (
                <AvatarImage src={avatarSrc} alt="Profile Picture" className="object-cover w-full h-full -top-0" />
              ) : (
                <AvatarFallback className="text-2xl">{name.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <p className="text-xl font-medium text-white">Welcome {name}</p>
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={handleEditProfile}
                    className="absolute top-[1.3rem] -right-8 p-1 bg-white/30 rounded-full hover:bg-white/50"
                  >
                    <Pencil className="w-4 h-4 text-white" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-white/10 backdrop-blur-sm text-white p-2 rounded-md shadow-lg text-sm"
                    sideOffset={5}
                  >
                    <p>Edit</p>
                    <Tooltip.Arrow className="fill-white" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
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
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      onClick={handleEditWalletName}
                      className="absolute top-[2rem] right-[calc(var(--spacing)*4)] p-[calc(var(--spacing)*1)] bg-white/30 rounded-full hover:bg-white/50"
                    >
                      <Pencil className="w-4 h-4 text-white" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-white/10 backdrop-blur-sm text-white p-2 rounded-md shadow-lg text-sm"
                      sideOffset={5}
                      side="bottom"
                    >
                      <p>Edit</p>
                      <Tooltip.Arrow className="fill-white" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
          )
        ) : (
          <Button
            onClick={handleConnectWallet}
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