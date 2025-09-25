import React, { useState, useEffect, useMemo } from 'react';
import BASEToken from './BASEToken';
import { getUSDCBalanceFor, subscribeUSDCConfig } from '@/services/localTokenStore';

interface TempWallet {
  id: string;
  address: string;
  network: string;
  // Add other wallet properties as needed
}

interface LightningChannelFormProps {
  activeWalletAddress: string;
  onInitiate: (channelData: {
    user1Address: string;
    user2Address: string;
    user1Margin: number;
    user2Margin: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

const LightningChannelForm: React.FC<LightningChannelFormProps> = ({
  activeWalletAddress,
  onInitiate,
  isLoading = false
}) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [user1Margin, setUser1Margin] = useState('');
  const [user2Margin, setUser2Margin] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);

  // Read available local balance for the active wallet (demo: wallets #3 and #7)
  useEffect(() => {
    setAvailableBalance(getUSDCBalanceFor(activeWalletAddress));
    const unsub = subscribeUSDCConfig(() => {
      setAvailableBalance(getUSDCBalanceFor(activeWalletAddress));
    });
    return () => { unsub && unsub(); };
  }, [activeWalletAddress]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!activeWalletAddress) {
      newErrors.activeWallet = 'No active wallet available';
    }

    if (!recipientAddress.trim()) {
      newErrors.recipientAddress = 'Please enter recipient wallet address';
    } else if (recipientAddress.trim().toLowerCase() === activeWalletAddress.toLowerCase()) {
      newErrors.recipientAddress = 'Cannot create channel with yourself';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress.trim())) {
      newErrors.recipientAddress = 'Invalid wallet address format';
    }

    if (!user1Margin || parseFloat(user1Margin) <= 0) {
      newErrors.user1Margin = 'Your margin must be greater than 0';
    } else if (availableBalance != null && parseFloat(user1Margin) > availableBalance) {
      newErrors.user1Margin = `Exceeds available balance (${availableBalance} max)`;
    }

    if (!user2Margin || parseFloat(user2Margin) <= 0) {
      newErrors.user2Margin = 'Other user margin must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onInitiate({
        user1Address: activeWalletAddress,
        user2Address: recipientAddress.trim(),
        user1Margin: parseFloat(user1Margin),
        user2Margin: parseFloat(user2Margin),
      });

      // Reset form on success
      setRecipientAddress('');
      setUser1Margin('');
      setUser2Margin('');
      setErrors({});
    } catch (error) {
      console.error('Failed to initiate channel:', error);
      setErrors({ submit: 'Failed to create channel. Please try again.' });
    }
  };

  const handleUser1MarginChange = (val: string) => {
    // Clamp to available balance if configured
    let next = val;
    const n = parseFloat(val);
    if (availableBalance != null && !Number.isNaN(n) && n > availableBalance) {
      next = String(availableBalance);
    }
    setUser1Margin(next);
    // Clear any previous error as user types; validation will re-run on submit
    setErrors((e) => ({ ...e, user1Margin: '' }));
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Active Wallet Display */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            👤 Your Active Wallet
          </label>
          <div className="w-full px-2.5 py-1.5 bg-white/5 border border-white/20 rounded-md text-white text-sm">
            {activeWalletAddress ? (
              <span className="font-mono">
                {activeWalletAddress.slice(0, 8)}...{activeWalletAddress.slice(-6)}
              </span>
            ) : (
              <span className="text-gray-400">No active wallet</span>
            )}
          </div>
          {errors.activeWallet && (
            <p className="text-red-400 text-xs mt-1">{errors.activeWallet}</p>
          )}
        </div>

        {/* Recipient Address */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            📧 Other User's Wallet Address
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x1234567890abcdef..."
            className="w-full px-2.5 py-1.5 bg-white/5 border border-white/20 rounded-md text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.recipientAddress && (
            <p className="text-red-400 text-xs mt-1">{errors.recipientAddress}</p>
          )}
        </div>

        {/* Your Margin */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            💰 Your Margin to Deposit
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max={availableBalance != null ? availableBalance : undefined}
              value={user1Margin}
              onChange={(e) => handleUser1MarginChange(e.target.value)}
              placeholder="5.0"
              className="w-full px-2.5 py-1.5 pr-12 bg-white/5 border border-white/20 rounded-md text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <BASEToken size="xs" showSymbol />
            </div>
          </div>
          {availableBalance != null && (
            <div className="mt-1 text-[11px] text-gray-400">
              Available: <span className="text-white">{availableBalance}</span>
            </div>
          )}
          {errors.user1Margin && (
            <p className="text-red-400 text-xs mt-1">{errors.user1Margin}</p>
          )}
        </div>

        {/* Other User's Margin */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            💸 Required Margin from Other User
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              value={user2Margin}
              onChange={(e) => setUser2Margin(e.target.value)}
              placeholder="3.0"
              className="w-full px-2.5 py-1.5 pr-12 bg-white/5 border border-white/20 rounded-md text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <BASEToken size="xs" showSymbol />
            </div>
          </div>
          {errors.user2Margin && (
            <p className="text-red-400 text-xs mt-1">{errors.user2Margin}</p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-md p-2">
            <p className="text-red-400 text-xs">{errors.submit}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !activeWalletAddress}
          className={`w-full py-2 px-3 rounded-md font-medium text-sm transition-colors ${
            isLoading || !activeWalletAddress
              ? 'bg-gray-600 cursor-not-allowed text-gray-400'
              : 'bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1">
              <span>⚡</span>
              Create Channel
            </div>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-3">
        <h4 className="text-xs font-medium text-blue-400 mb-1">💡 How it works:</h4>
        <ul className="text-xs text-gray-300 space-y-0.5">
          <li>• Both users deposit margins to create a shared channel</li>
          <li>• Make instant off-chain payments within the channel</li>
          <li>• Request payments from the other user</li>
          <li>• Refill margins anytime to continue trading</li>
        </ul>
      </div>
    </div>
  );
};

export default LightningChannelForm;