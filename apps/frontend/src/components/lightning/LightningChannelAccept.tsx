import React, { useState } from 'react';
import BASEToken from './BASEToken';

interface LightningChannel {
  id: string;
  channelNumber: string;
  user1Address: string;
  user2Address: string;
  user1MarginLeft: number;
  user2MarginLeft: number;
  status: string;
  createdAt: string;
}

interface LightningChannelAcceptProps {
  channel: LightningChannel;
  userAddress: string;
  onAccept: (channelId: string) => Promise<void>;
  onReject: (channelId: string) => Promise<void>;
  isLoading?: boolean;
}

const LightningChannelAccept: React.FC<LightningChannelAcceptProps> = ({
  channel,
  userAddress,
  onAccept,
  onReject,
  isLoading = false
}) => {
  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);

  // Defensive checks to avoid runtime errors if data is incomplete
  const isInvitedUser = (channel.user2Address || '').toLowerCase() === (userAddress || '').toLowerCase();
  const otherUserAddress = isInvitedUser ? channel.user1Address : channel.user2Address;
  const yourRequiredMargin = isInvitedUser ? channel.user2MarginLeft : channel.user1MarginLeft;
  const otherUserMargin = isInvitedUser ? channel.user1MarginLeft : channel.user2MarginLeft;

  const handleAccept = async () => {
    setActionLoading('accept');
    try {
      await onAccept(channel.id);
    } catch (error) {
      console.error('Failed to accept channel:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    setActionLoading('reject');
    try {
      await onReject(channel.id);
    } catch (error) {
      console.error('Failed to reject channel:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatAddress = (address: string | undefined) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isInvitedUser) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600 text-center">
          You cannot accept this channel - you are not the invited user.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto border-2 border-yellow-200">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-3xl">⚡</span>
          <h2 className="text-xl font-bold text-gray-800">Channel Invitation</h2>
        </div>
        <div className="bg-yellow-100 border border-yellow-300 rounded-md p-2">
          <p className="text-yellow-800 text-sm font-medium">
            🔔 You have been invited to join a Lightning channel!
          </p>
        </div>
      </div>

      {/* Channel Details */}
      <div className="space-y-4 mb-6">
        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Channel Details</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Channel ID:</span>
              <span className="font-mono text-blue-600">{channel.channelNumber}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span>{formatDate(channel.createdAt)}</span>
            </div>
            
            <hr className="my-2" />
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">From:</span>
              <span className="font-mono">{formatAddress(otherUserAddress)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Their margin:</span>
              <BASEToken amount={otherUserMargin} size="sm" />
            </div>
            
            <hr className="my-2" />
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Your address:</span>
              <span className="font-mono">{formatAddress(userAddress)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Required margin:</span>
              <BASEToken amount={yourRequiredMargin} size="sm" />
            </div>
          </div>
        </div>

        {/* Total Channel Capacity */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-blue-800">Total Channel Capacity:</span>
            <BASEToken 
              amount={otherUserMargin + yourRequiredMargin} 
              size="md" 
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleReject}
          disabled={isLoading || actionLoading !== null}
          className={`flex-1 py-3 px-4 rounded-md font-medium text-white transition-colors ${
            isLoading || actionLoading !== null
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
          }`}
        >
          {actionLoading === 'reject' ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Rejecting...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>❌</span>
              Reject
            </div>
          )}
        </button>

        <button
          onClick={handleAccept}
          disabled={isLoading || actionLoading !== null}
          className={`flex-1 py-3 px-4 rounded-md font-medium text-white transition-colors ${
            isLoading || actionLoading !== null
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
          }`}
        >
          {actionLoading === 'accept' ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Accepting...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>✅</span>
              Accept & Create Channel
            </div>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
        <h4 className="text-sm font-medium text-blue-800 mb-1">📋 What happens next:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>✅ <strong>Accept:</strong> Channel becomes active, you can start trading</li>
          <li>❌ <strong>Reject:</strong> Channel invitation is declined</li>
          <li>⚡ <strong>Once active:</strong> Make instant payments within the channel</li>
          <li>🔄 <strong>No blockchain fees:</strong> All transactions are off-chain</li>
        </ul>
      </div>
    </div>
  );
};

export default LightningChannelAccept;