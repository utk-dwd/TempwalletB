import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { NitroliteClient as _NitroliteClient } from '@erc7824/nitrolite';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LightningChannelForm from './LightningChannelForm';
import LightningChannelAccept from './LightningChannelAccept';
import LightningChannelDashboard from './LightningChannelDashboard';
import { Wallet } from '@/utils/types';
import { getUSDCBalanceFor, subscribeUSDCConfig } from '@/services/localTokenStore';
import { adjustUSDCForWalletNumber } from '@/services/localUSDCByNumber';

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
  const [localUSDC, setLocalUSDC] = useState<number | null>(null);
  // UI-only settlement state (two-party approval)
  const [pendingSettlement, setPendingSettlement] = useState<null | {
    channelId: string;
    user1Address: string;
    user2Address: string;
    user1Initial: number;
    user2Initial: number;
    approvals: Record<string, boolean>; // addressLower -> approved?
  }>(null);
  const settlementBCRef = useRef<BroadcastChannel | null>(null);

  // Backend API base URL
  // Use env if provided; fallback to direct backend without /api prefix
  // Backend serves routes at /lightning/... (no global /api prefix)
  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';

 
  useEffect(() => {
    if (import.meta.env.VITE_ENABLE_NITROLITE === 'true') {
      (async () => {
        try {
          const [{ createNitroliteClient }, { ClearNodeClient }] = await Promise.all([
            import('@/services/nitrolite/client'),
            import('@/services/nitrolite/clearnode'),
          ]);
        
          const cn = new ClearNodeClient();
          cn.connect(); // stub returns a fake socket-like object (no network)
          console.debug('[Nitrolite] SDK stubs present (feature-flag enabled).');
        } catch (e) {
          console.debug('[Nitrolite] Feature-flag enabled but stubs failed to load:', e);
        }
      })();
    }
  }, []);

  useEffect(() => {
    fetchTempWallets();
    // Set up WebSocket for real-time notifications
    setupWebSocket();
    // subscribe to USDC config changes
    const unsub = subscribeUSDCConfig(() => {
      setLocalUSDC(getUSDCBalanceFor(selectedWallet));
    });
    // BroadcastChannel for settlement coordination across tabs
    const bc = new BroadcastChannel('lightning_settlement');
    settlementBCRef.current = bc;
    bc.onmessage = (event) => {
      const msg = event.data || {};
      if (msg.type === 'settlement:open') {
        if (msg.payload && msg.payload.channelId) {
          setPendingSettlement(msg.payload);
        }
      } else if (msg.type === 'settlement:approve') {
        setPendingSettlement((curr) => {
          if (!curr || curr.channelId !== msg.channelId) return curr;
          const addr = (msg.address || '').toLowerCase();
          return { ...curr, approvals: { ...curr.approvals, [addr]: true } };
        });
      } else if (msg.type === 'settlement:cancel') {
        setPendingSettlement(null);
      }
    };
    // localStorage fallback for browsers/environments where BroadcastChannel is blocked or cross-origin quirks
    const LS_KEY = 'tw:settlement:signal';
    let lastSeen = localStorage.getItem(LS_KEY) || '';
    const lsHandler = () => {
      const raw = localStorage.getItem(LS_KEY) || '';
      if (!raw || raw === lastSeen) return;
      lastSeen = raw;
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'settlement:open' && msg.payload?.channelId) setPendingSettlement(msg.payload);
        if (msg.type === 'settlement:approve') setPendingSettlement((curr) => {
          if (!curr || curr.channelId !== msg.channelId) return curr;
          const addr = (msg.address || '').toLowerCase();
          return { ...curr, approvals: { ...curr.approvals, [addr]: true } };
        });
        if (msg.type === 'settlement:cancel') setPendingSettlement(null);
      } catch {}
    };
    window.addEventListener('storage', lsHandler);
    return () => { unsub(); bc.close(); settlementBCRef.current = null; window.removeEventListener('storage', lsHandler); };
  }, [userWallets, walletAddress]);

  useEffect(() => {
    if (selectedWallet) {
      fetchChannels();
      fetchIncomingRequests();
    }
    setLocalUSDC(getUSDCBalanceFor(selectedWallet));
  }, [selectedWallet]);

  // Lightweight polling to simulate real-time updates across windows (every 4s)
  useEffect(() => {
    if (!selectedWallet) return;
    const id = setInterval(() => {
      fetchChannels();
      fetchIncomingRequests();
      if (activeChannel) fetchChannelDetails(activeChannel.id);
    }, 4000);
    return () => clearInterval(id);
  }, [selectedWallet, activeChannel?.id]);

  // Background poll to detect an open settlement on the active channel and open modal
  useEffect(() => {
    if (!activeChannel?.id) return;
    let stopped = false;
    const fn = async () => {
      if (stopped) return;
      try {
        const res = await fetch(`${API_BASE}/lightning/settlement/${activeChannel.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.status === 'OPEN') {
          setPendingSettlement((curr) => {
            if (curr && curr.channelId === data.channelId) return curr; // already open
            return {
              channelId: data.channelId,
              user1Address: data.user1Address,
              user2Address: data.user2Address,
              user1Initial: data.user1Initial,
              user2Initial: data.user2Initial,
              approvals: data.approvals || {}
            };
          });
        } else if (data?.status === 'CANCELLED') {
          setPendingSettlement((curr) => (curr?.channelId === activeChannel.id ? null : curr));
        } else if (data?.status === 'FINALIZED') {
          // keep modal open so user sees approvals; it will show 'Both parties approved'
          setPendingSettlement((curr) => {
            if (!curr || curr.channelId !== data.channelId) return curr;
            return { ...curr, approvals: data.approvals || {} };
          });
        }
      } catch {}
    };
    const id = setInterval(fn, 3000);
    fn();
    return () => { stopped = true; clearInterval(id); };
  }, [activeChannel?.id]);

  const setupWebSocket = () => {
    // Mock WebSocket setup - replace with actual implementation
    console.log('Setting up WebSocket for Lightning notifications...');
  };

  // --- Local helpers for per-channel accounting locks (prevent double-counting across refreshes/tabs) ---
  type ChannelLock = { deducted?: boolean; finalized?: boolean };
  const LOCKS_KEY = 'tw:lightning:channelLocks:v1';
  const loadLocks = (): Record<string, ChannelLock> => {
    try {
      const raw = localStorage.getItem(LOCKS_KEY);
      if (raw) return JSON.parse(raw) as Record<string, ChannelLock>;
    } catch {}
    return {};
  };
  const saveLocks = (locks: Record<string, ChannelLock>) => {
    try { localStorage.setItem(LOCKS_KEY, JSON.stringify(locks)); } catch {}
  };
  const markLock = (channelId: string, patch: ChannelLock) => {
    const locks = loadLocks();
    const curr = locks[channelId] || {};
    locks[channelId] = { ...curr, ...patch };
    saveLocks(locks);
  };

  const findWalletNumber = (addr: string): number | null => {
    const a = (addr || '').toLowerCase();
    const found = userWallets.find(w => (w.address || '').toLowerCase() === a);
    return found?.walletNumber ?? null;
  };

  // Deduct initial margins from local USDC overlay at the moment a channel becomes ACTIVE (simulate locking funds)
  useEffect(() => {
    if (!channels || channels.length === 0) return;
    const locks = loadLocks();
    channels.forEach(ch => {
      if (ch.status !== 'ACTIVE') return;
      const lock = locks[ch.id] || {};
      if (lock.deducted) return; // already deducted
      // Deduct for any wallets present in this profile (user may have either/both parties locally)
      const wn1 = findWalletNumber(ch.user1Address);
      const wn2 = findWalletNumber(ch.user2Address);
      if (wn1 != null) adjustUSDCForWalletNumber(wn1, -Number(ch.user1MarginLeft || 0));
      if (wn2 != null) adjustUSDCForWalletNumber(wn2, -Number(ch.user2MarginLeft || 0));
      markLock(ch.id, { deducted: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels.map(c => `${c.id}:${c.status}`).join('|')]);

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
      
      let channelsData: LightningChannel[] = await response.json();
      // Hide channels already finalized locally (UI-only close)
      const locks = loadLocks();
      channelsData = channelsData.filter(c => !(locks[c.id]?.finalized));
      setChannels(channelsData);

      // Keep activeChannel in sync with refreshed list
      if (channelsData.length > 0) {
        if (!activeChannel) {
          setActiveChannel(channelsData[0]);
        } else {
          const updated = channelsData.find(c => c.id === activeChannel.id);
          if (updated) setActiveChannel(updated); else setActiveChannel(null);
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

  // Initiate UI-only settlement proposal (no backend call)
  const handleLeaveChannel = async (channel: LightningChannel) => {
    if (!channel) return;
    // Ask backend to open a settlement state so both profiles/tabs can poll
    try {
      await fetch(`${API_BASE}/lightning/settlement/open/${channel.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openedBy: selectedWallet })
      });
    } catch (e) {
      console.warn('Settlement open request failed, falling back to local broadcast', e);
    }
    // Also set local UI immediately for this tab and broadcast for same-profile tabs
    const payload = {
      channelId: channel.id,
      user1Address: channel.user1Address,
      user2Address: channel.user2Address,
      user1Initial: channel.user1MarginLeft,
      user2Initial: channel.user2MarginLeft,
      approvals: {}
    };
    setPendingSettlement(payload);
    const msg = { type: 'settlement:open', payload };
    settlementBCRef.current?.postMessage(msg);
    try { localStorage.setItem('tw:settlement:signal', JSON.stringify({ ...msg, ts: Date.now() })); } catch {}
  };

  const myAddressLower = useMemo(() => (selectedWallet || '').toLowerCase(), [selectedWallet]);
  const amUser1 = useMemo(() => pendingSettlement && pendingSettlement.user1Address.toLowerCase() === myAddressLower, [pendingSettlement, myAddressLower]);

  // TempService API (UI-only): different per user1/user2 for the active channel
  const tempServiceApi = useMemo(() => {
    if (!activeChannel || !selectedWallet) return null;
    const isU1 = activeChannel.user1Address.toLowerCase() === myAddressLower;
    const isU2 = activeChannel.user2Address.toLowerCase() === myAddressLower;
    if (!isU1 && !isU2) return null;
    const role = isU1 ? '1' : '2';
    const keyPart = `${(selectedWallet || '').slice(2, 10)}${activeChannel.id.slice(0, 6)}`;
    // Demo-style URI. Not an actual endpoint.
    return `tempservice://base/${activeChannel.channelNumber}?u=${role}&k=${keyPart}`;
  }, [activeChannel?.id, activeChannel?.channelNumber, myAddressLower, selectedWallet]);

  const copyTempServiceApi = async () => {
    if (!tempServiceApi) return;
    try {
      await navigator.clipboard.writeText(tempServiceApi);
      addNotification('🔗 TempService API copied');
    } catch {
      addNotification('❌ Copy failed', undefined, 'error');
    }
  };

  const approveSettlement = () => {
    if (!pendingSettlement) return;
    const updated = {
      ...pendingSettlement,
      approvals: { ...pendingSettlement.approvals, [myAddressLower]: true },
    };
    setPendingSettlement(updated);
    const msg = { type: 'settlement:approve', channelId: pendingSettlement.channelId, address: myAddressLower };
    settlementBCRef.current?.postMessage(msg);
    try { localStorage.setItem('tw:settlement:signal', JSON.stringify({ ...msg, ts: Date.now() })); } catch {}
    // Inform backend so other profiles poll and see it
    try {
      fetch(`${API_BASE}/lightning/settlement/approve/${pendingSettlement.channelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: selectedWallet })
      });
    } catch {}
  };

  const cancelSettlement = () => {
    const channelId = pendingSettlement?.channelId || activeChannel?.id;
    setPendingSettlement(null);
    const msg = { type: 'settlement:cancel' };
    settlementBCRef.current?.postMessage(msg);
    try { localStorage.setItem('tw:settlement:signal', JSON.stringify({ ...msg, ts: Date.now() })); } catch {}
    if (channelId) { try { fetch(`${API_BASE}/lightning/settlement/cancel/${channelId}`, { method: 'POST' }); } catch {} }
  };

  // While modal open, poll backend settlement state so other profiles see real-time approvals
  useEffect(() => {
    if (!pendingSettlement) return;
    let stopped = false;
    const fn = async () => {
      if (stopped) return;
      try {
        const res = await fetch(`${API_BASE}/lightning/settlement/${pendingSettlement.channelId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && (data.status === 'OPEN' || data.status === 'FINALIZED')) {
            setPendingSettlement((curr) => {
              if (!curr || curr.channelId !== data.channelId) return curr;
              return {
                channelId: data.channelId,
                user1Address: data.user1Address,
                user2Address: data.user2Address,
                user1Initial: data.user1Initial,
                user2Initial: data.user2Initial,
                approvals: data.approvals || {},
              } as any;
            });
            // If backend says FINALIZED, run finalize credit once.
            if (data.status === 'FINALIZED') {
              finalizeSettlementCredit(data.channelId);
            }
          }
        }
      } catch {}
    };
    const id = setInterval(fn, 3000);
    fn();
    return () => { stopped = true; clearInterval(id); };
  }, [pendingSettlement?.channelId]);

  // Finalize settlement: credit current margins back to local USDC and return to create channel view.
  const finalizeSettlementCredit = async (channelId: string) => {
    if (!channelId) return;
    const locks = loadLocks();
    const lock = locks[channelId] || {};
    if (lock.finalized) return; // already finalized locally
    // Find freshest channel state for amounts
    let ch: LightningChannel | null = null;
    try {
      const res = await fetch(`${API_BASE}/lightning/channel/${channelId}`);
      if (res.ok) ch = await res.json();
    } catch {}
    if (!ch) {
      // Fallback to what we have in state lists
      ch = channels.find(c => c.id === channelId) || activeChannel || null;
    }
    if (!ch) return;
    const wn1 = findWalletNumber(ch.user1Address);
    const wn2 = findWalletNumber(ch.user2Address);
    if (wn1 != null) adjustUSDCForWalletNumber(wn1, Number(ch.user1MarginLeft || 0));
    if (wn2 != null) adjustUSDCForWalletNumber(wn2, Number(ch.user2MarginLeft || 0));
    markLock(channelId, { finalized: true });
    // Refresh channels and shift UI to creation view
    try { await fetchChannels(); } catch {}
    setActiveChannel(null);
    setShowCreateForm(true);
    // Close modal locally
    setPendingSettlement(null);
    addNotification('✅ Channel settled', 'Balances updated based on final margins', 'success');
    // Notify other tabs to refresh wallets if they rely on server (optional, overlay updates are already broadcasted by service)
    try {
      const bc = new BroadcastChannel('tw-wallets');
      bc.postMessage({ type: 'wallets:refresh' });
      bc.close();
    } catch {}
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
        // If a previous channel exists PENDING/ACTIVE, try to force-close and retry once
        if (response.status === 400) {
          try {
            const params = new URLSearchParams({ a: data.user1Address, b: data.user2Address });
            const closeRes = await fetch(`${API_BASE}/lightning/close-between?${params.toString()}`, { method: 'PUT' });
            if (closeRes.ok) {
              const retry = await fetch(`${API_BASE}/lightning/channels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });
              if (retry.ok) {
                const result = await retry.json();
                addNotification('⚡ Channel request sent!', `Lightning channel request sent to ${data.user2Address.slice(0, 8)}...`, 'success');
                await fetchChannels();
                setShowCreateForm(false);
                return;
              }
            }
          } catch {}
        }
        // Fallthrough: show original error
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP error! status: ${response.status}${text ? ` - ${text}` : ''}`);
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
      // Deduct from local USDC overlay immediately for the refilling wallet
      const wn = findWalletNumber(data.userAddress);
      if (wn != null) adjustUSDCForWalletNumber(wn, -Number(data.amount || 0));
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
            <div className="text-center">
              <div className="text-xs text-gray-400">USDC (local)</div>
              <div className="text-lg font-bold text-blue-400">{localUSDC ?? '-'}</div>
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

          {/* TempService API - hidden by default, reveal on hover; click to copy */}
          {activeChannel && tempServiceApi && (
            <div className="relative group mt-2">
              <div
                className="transition-colors bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-3 cursor-pointer hover:bg-white/15"
                title="Click to copy"
                onClick={copyTempServiceApi}
              >
                <div className="text-xs text-gray-300 mb-1">TempService API</div>
                <div className="text-[11px] text-white font-mono truncate filter blur-sm group-hover:blur-none transition-all select-none">
                  {tempServiceApi}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">Hover to reveal • Click to copy</div>
              </div>
            </div>
          )}
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
                onLeaveChannel={handleLeaveChannel}
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

      {/* Settlement Modal (UI-only) */}
      <Dialog open={!!pendingSettlement} onOpenChange={(isOpen) => { if (!isOpen) cancelSettlement(); }}>
        {pendingSettlement && (
          <DialogContent className="bg-[var(--overlay)] backdrop-blur-[var(--blur)] rounded-xl p-6 border border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Settle Channel</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-300 mb-4">This is a UI-only prototype. No on-chain or backend action is performed.</p>
            {(() => {
              const approvals = pendingSettlement.approvals || {};
              const u1 = pendingSettlement.user1Address.toLowerCase();
              const u2 = pendingSettlement.user2Address.toLowerCase();
              const myApproved = approvals[myAddressLower] === true;
              const bothApproved = approvals[u1] === true && approvals[u2] === true;

              const channelForSettlement = (activeChannel && activeChannel.id === pendingSettlement.channelId)
                ? activeChannel
                : channels.find(c => c.id === pendingSettlement.channelId) || null;

              const computeGasSavedUSD = (ch: typeof activeChannel | null) => {
                if (!ch || !Array.isArray(ch.transactions)) return 0;
                const totalAmount = ch.transactions
                  .filter(t => t.type !== 'REFILL')
                  .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
                // $0.0000427 per 0.1 USDC ≈ 0.000427 per 1 USDC
                const perUnit = 0.0000427 / 0.1; // 0.000427 per 1.0
                return totalAmount * perUnit;
              };

              const gasSaved = computeGasSavedUSD(channelForSettlement);
              // Hardcoded demo Base chain tx hash (UI-only)
              const DEMO_BASE_TX_HASH = '0x5f4f3cfad12bfa667e0936f0e668a9e50e54f9b89b5fbb42f2f3a8e6f9465d8a';

              return (
                <>
                  {bothApproved && (
                    <div className="mb-4 p-3 rounded-md border border-green-500/40 bg-green-500/10 text-green-300">
                      Both parties approved — ready to finalize
                    </div>
                  )}
                  {channelForSettlement && (
                    <div className="mb-4 p-3 rounded-md border border-blue-500/40 bg-blue-500/10 text-blue-200">
                      Estimated Gas Fee Saved: <span className="font-semibold text-white">${gasSaved.toFixed(6)}</span>
                    </div>
                  )}
                  {bothApproved && (
                    <div className="mb-4 p-3 rounded-md border border-white/20 bg-white/5 text-gray-200">
                      <div className="text-xs text-gray-400 mb-1">Base Tx Hash</div>
                      <a
                        href={`https://basescan.org/tx/${DEMO_BASE_TX_HASH}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:underline font-mono text-xs break-all"
                      >
                        {DEMO_BASE_TX_HASH}
                      </a>
                    </div>
                  )}
                </>
              );
            })()}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between bg-white/5 rounded-md p-3 border border-white/10">
                <span className="text-gray-300">You will withdraw</span>
                <span className="font-medium">
                  {amUser1 ? pendingSettlement.user1Initial : pendingSettlement.user2Initial} BASE
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-md p-3 border border-white/10">
                <span className="text-gray-300">Counterparty will withdraw</span>
                <span className="font-medium">
                  {amUser1 ? pendingSettlement.user2Initial : pendingSettlement.user1Initial} BASE
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Approvals: {Object.keys(pendingSettlement.approvals).length} / 2
              </div>
            </div>
            {(() => {
              const approvals = pendingSettlement.approvals || {};
              const u1 = pendingSettlement.user1Address.toLowerCase();
              const u2 = pendingSettlement.user2Address.toLowerCase();
              const myApproved = approvals[myAddressLower] === true;
              const bothApproved = approvals[u1] === true && approvals[u2] === true;
              return (
                <DialogFooter className="flex gap-2 sm:justify-end">
                  {!bothApproved ? (
                    <>
                      <button onClick={cancelSettlement} className="px-4 py-2 rounded-md bg-gray-600/70 hover:bg-gray-600 text-white">Cancel</button>
                      {!myApproved && (
                        <button onClick={approveSettlement} className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white">Approve</button>
                      )}
                    </>
                  ) : (
                    <button onClick={() => finalizeSettlementCredit(pendingSettlement.channelId)} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">Finalize & Close</button>
                  )}
                </DialogFooter>
              );
            })()}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default LightningNode;