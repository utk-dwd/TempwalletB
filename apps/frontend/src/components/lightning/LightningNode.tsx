import React, { useState, useEffect } from 'react';
import LightningChannelForm from './LightningChannelForm';
import LightningChannelAccept from './LightningChannelAccept';
import LightningChannelDashboard from './LightningChannelDashboard';
import { Wallet } from '@/utils/types';

interface TempWallet {
  id: string;
  address: string;
  name?: string;
  network: string;
}

interface LightningNodeProps {
  walletAddress: string | null;
  userWallets: Wallet[];
  setNotification: (notification: { brief: string; full: string; type: 'error' | 'success' } | null) => void;
}

interface LightningTransaction {
  id: string;
  fromUser: string;
  toUser: string;
  amount: number;
  type: string;
  note?: string;
  createdAt: string;
  status: string;
}

interface PaymentRequest {
  id: string;
  fromUser: string;
  toUser: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

interface LightningChannel {
  id: string;
  channelNumber: string;
  user1Address: string;
  user2Address: string;
  user1MarginLeft: number;
  user2MarginLeft: number;
  status: string;
  transactionCount: number;
  createdAt: string;
  updatedAt: string;
  transactions: LightningTransaction[];
  requests: PaymentRequest[];
}

interface IncomingChannelRequest {
  id: string;
  channelNumber: string;
  user1Address: string;
  user2Address: string;
  user1MarginLeft: number;
  user2MarginLeft: number;
  status: string;
  createdAt: string;
}

const LightningNode: React.FC<LightningNodeProps> = ({ 
  walletAddress, 
  userWallets, 
  setNotification 
}) => {
  const [tempWallets, setTempWallets] = useState<TempWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [channels, setChannels] = useState<LightningChannel[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingChannelRequest[]>([]);
  const [activeChannel, setActiveChannel] = useState<LightningChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Backend API base URL
  // Use env if provided; fallback to direct backend without /api prefix
  // Backend serves routes at /lightning/... (no global /api prefix)
  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';

  useEffect(() => {
    fetchTempWallets();
    // Set up WebSocket for real-time notifications
    setupWebSocket();
  }, [userWallets, walletAddress]);

  useEffect(() => {
    if (selectedWallet) {
      fetchChannels();
      fetchIncomingRequests();
    }
  }, [selectedWallet]);

  const setupWebSocket = () => {
    // Mock WebSocket setup - replace with actual implementation
    console.log('Setting up WebSocket for Lightning notifications...');
  };

  const addNotification = (brief: string, full?: string, type: 'success' | 'error' = 'success') => {
    setNotification({
      brief,
      full: full || brief,
      type
    });
    
    // Also add to local notifications for the slide-in effect
    setNotifications(prev => [...prev.slice(-4), brief]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 3000);
  };

  const fetchTempWallets = async () => {
    try {
      // Convert real wallets to TempWallet format
      const wallets: TempWallet[] = userWallets.map((wallet) => ({
        id: wallet.id?.toString() || wallet.walletNumber?.toString() || '',
        address: wallet.address,
        name: `Wallet #${wallet.walletNumber}`,
        network: wallet.networkKey || 'BASE'
      }));
      
      setTempWallets(wallets);
      
      // Set default selected wallet to main wallet address or first available
      if (walletAddress && wallets.some(w => w.address === walletAddress)) {
        setSelectedWallet(walletAddress);
      } else if (wallets.length > 0 && !selectedWallet) {
        setSelectedWallet(wallets[0].address);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching temp wallets:', error);
      setLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      // Fetch channels for the selected wallet from backend
      const response = await fetch(`${API_BASE}/lightning/channels?userAddress=${selectedWallet}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const channelsData: LightningChannel[] = await response.json();
      setChannels(channelsData);

      // Keep activeChannel in sync with refreshed list
      if (channelsData.length > 0) {
        if (!activeChannel) {
          setActiveChannel(channelsData[0]);
        } else {
          const updated = channelsData.find(c => c.id === activeChannel.id);
          if (updated) setActiveChannel(updated);
        }
      } else {
        setActiveChannel(null);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      // Set empty channels on error
      setChannels([]);
      setActiveChannel(null);
    }
  };

  const fetchChannelDetails = async (channelId: string) => {
    try {
      const res = await fetch(`${API_BASE}/lightning/channel/${channelId}`);
      if (!res.ok) throw new Error(`Failed to fetch channel details: ${res.status}`);
      const details: LightningChannel = await res.json();
      setActiveChannel(details);
    } catch (err) {
      console.error('Error fetching channel details:', err);
    }
  };

  const fetchIncomingRequests = async () => {
    try {
      // Fetch pending channel invitations for the selected wallet
      const response = await fetch(`${API_BASE}/lightning/channels/pending?userAddress=${selectedWallet}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const requests: IncomingChannelRequest[] = await response.json();
      setIncomingRequests(requests);
    } catch (error) {
      console.error('Error fetching incoming requests:', error);
      // Set empty requests on error
      setIncomingRequests([]);
    }
  };

  const handleCreateChannel = async (data: {
    user1Address: string;
    user2Address: string;
    user1Margin: number;
    user2Margin: number;
  }) => {
    try {
      // Make actual API call to backend
      const response = await fetch(`${API_BASE}/lightning/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Channel creation response:', result);
      
      addNotification('⚡ Channel request sent!', `Lightning channel request sent to ${data.user2Address.slice(0, 8)}...`, 'success');
      await fetchChannels();
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating channel:', error);
      addNotification('❌ Failed to create channel', 'There was an error creating the Lightning channel. Please try again.', 'error');
    }
  };

  const handleAcceptChannel = async (channelId: string) => {
    try {
      // Call backend to accept the channel as the invited user (selectedWallet)
      const res = await fetch(`${API_BASE}/lightning/accept/${channelId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userAddress: selectedWallet })
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Accept failed: ${res.status} ${text}`);
      }
      console.log('Accepting channel request:', channelId);
      addNotification('Channel accepted!', 'Lightning channel has been accepted and is now active', 'success');
      await fetchIncomingRequests();
      await fetchChannels();
    } catch (error) {
      console.error('Error accepting channel:', error);
      addNotification('Failed to accept channel', 'There was an error accepting the channel', 'error');
    }
  };

  const handleRejectChannel = async (channelId: string) => {
    try {
      console.log('Rejecting channel request:', channelId);
      addNotification('Channel declined', 'Lightning channel request has been declined', 'success');
      await fetchIncomingRequests();
      await fetchChannels();
    } catch (error) {
      console.error('Error rejecting channel:', error);
      addNotification('Failed to reject channel', 'There was an error rejecting the channel', 'error');
    }
  };

  const handleSendPayment = async (data: {
    channelId: string;
    fromUser: string;
    toUser: string;
    amount: number;
    note?: string;
  }) => {
    try {
      // Call backend to process payment (4s simulated)
      const res = await fetch(`${API_BASE}/lightning/send-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Payment failed: ${res.status} ${text}`);
      }
      addNotification('💸 Payment sent!');
      // Refresh channel list and active channel details to update margins and recent activity
      await fetchChannels();
      await fetchChannelDetails(data.channelId);
    } catch (error) {
      console.error('Error sending payment:', error);
      addNotification('❌ Payment failed');
      throw error;
    }
  };

  const handleRequestPayment = async (data: {
    channelId: string;
    fromUser: string;
    toUser: string;
    amount: number;
    reason: string;
  }) => {
    try {
      const res = await fetch(`${API_BASE}/lightning/request-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Request failed: ${res.status} ${text}`);
      }
      addNotification('🙏 Payment request sent!');
      // Optional: refresh details so sender sees updated request list (even though only incoming are highlighted)
      await fetchChannels();
      await fetchChannelDetails(data.channelId);
    } catch (error) {
      console.error('Error requesting payment:', error);
      addNotification('❌ Request failed');
      throw error;
    }
  };

  const handleRefillMargin = async (data: {
    channelId: string;
    userAddress: string;
    amount: number;
  }) => {
    try {
      const res = await fetch(`${API_BASE}/lightning/refill-margin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Refill failed: ${res.status} ${text}`);
      }
      addNotification('⛽ Margin refilled!');
      await fetchChannels();
      await fetchChannelDetails(data.channelId);
    } catch (error) {
      console.error('Error refilling margin:', error);
      addNotification('❌ Refill failed');
      throw error;
    }
  };

  const handleRespondToRequest = async (requestId: string, response: 'ACCEPTED' | 'DECLINED') => {
    try {
      const url = `${API_BASE}/lightning/respond-request/${requestId}?userAddress=${selectedWallet}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Respond failed: ${res.status} ${text}`);
      }
      addNotification(response === 'ACCEPTED' ? '✅ Payment sent!' : '❌ Payment declined');
      await fetchChannels();
      if (activeChannel) await fetchChannelDetails(activeChannel.id);
    } catch (error) {
      console.error('Error responding to request:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Lightning Node...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* CSS Animations */}
      <style>
        {`
          @keyframes slide-in {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          .animate-slide-in {
            animation: slide-in 0.3s ease-out forwards;
          }
        `}
      </style>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className="bg-white/15 backdrop-blur-lg border border-white/20 rounded-lg px-4 py-3 text-white shadow-lg animate-slide-in"
          >
            {notification}
          </div>
        ))}
      </div>

      {/* Compact Header */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 mb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌩️</span>
              <div>
                <h1 className="text-xl font-bold text-white">Lightning Node</h1>
                <p className="text-xs text-gray-400">Instant payments on BASE</p>
              </div>
            </div>
            
            {/* Active Wallet Selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-300">Active Wallet:</label>
              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className="px-3 py-1.5 bg-white/5 border border-white/20 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tempWallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.address} className="bg-gray-900">
                    {wallet.name} ({wallet.address.slice(0, 6)}...{wallet.address.slice(-4)})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-gray-400">Active Channels</div>
              <div className="text-lg font-bold text-green-400">{channels.length}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Pending Requests</div>
              <div className="text-lg font-bold text-yellow-400">{incomingRequests.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Flex Layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel - Channel Management */}
        <div className="w-80 flex-shrink-0 space-y-4 overflow-y-auto">
          {/* Create Channel - Collapsible */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h3 className="font-semibold text-white">Create Lightning Channel</h3>
              </div>
              <span className={`text-white transition-transform ${showCreateForm ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {showCreateForm && (
              <div className="p-4 pt-0 border-t border-white/10">
                <LightningChannelForm
                  activeWalletAddress={selectedWallet}
                  onInitiate={handleCreateChannel}
                />
              </div>
            )}
          </div>

          {/* Incoming Requests */}
          {incomingRequests.length > 0 && (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                📥 Incoming Requests
              </h3>
              <div className="space-y-2">
                {incomingRequests.map((request) => (
                  <LightningChannelAccept
                    key={request.id}
                    channel={{
                      id: request.id,
                      channelNumber: request.channelNumber,
                      user1Address: request.user1Address,
                      user2Address: request.user2Address,
                      user1MarginLeft: request.user1MarginLeft,
                      user2MarginLeft: request.user2MarginLeft,
                      status: request.status || 'PENDING',
                      createdAt: request.createdAt
                    }}
                    userAddress={selectedWallet}
                    onAccept={handleAcceptChannel}
                    onReject={handleRejectChannel}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Channel List */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 flex-1">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              📋 My Channels
            </h3>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                    activeChannel?.id === channel.id
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Channel {channel.channelNumber}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      channel.status === 'ACTIVE'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {channel.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {channel.transactionCount} transactions • {new Date(channel.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}

              {channels.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <span className="text-xl mb-2 block">🌩️</span>
                  <p className="text-sm">No active channels</p>
                  <p className="text-xs">Channels will appear here once both users accept</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Active Channel Dashboard */}
        <div className="flex-1 min-w-0">
          {activeChannel ? (
            <div className="h-full overflow-y-auto">
              <LightningChannelDashboard
                channel={activeChannel}
                userAddress={selectedWallet}
                onSendPayment={handleSendPayment}
                onRequestPayment={handleRequestPayment}
                onRefillMargin={handleRefillMargin}
                onRespondToRequest={handleRespondToRequest}
              />
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <span className="text-4xl mb-3 block">⚡</span>
                <h3 className="text-lg font-semibold mb-2">No Channel Selected</h3>
                <p className="text-sm">Select a channel from the left panel or create a new one to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LightningNode;