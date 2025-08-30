import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Wallet } from '../utils/types';
import { NetworkConfig } from '../utils/networks';

// The URL of your NestJS backend
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface BalanceUpdate {
  walletAddress: string;
  networkKey: string;
  message: string;
}

export const useWalletUpdates = (wallets: Wallet[], selectedNetwork: NetworkConfig) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<BalanceUpdate | null>(null);

  // Effect to establish and manage the socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server!');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server.');
      setIsConnected(false);
    });
    
    // Listen for the 'balance_update' event from the server
    newSocket.on('balance_update', (update: BalanceUpdate) => {
      console.log('📢 Received balance update:', update);
      setLastUpdate(update);
    });

    // Cleanup when the component is unmounted
    return () => {
      newSocket.disconnect();
    };
  }, []); // The empty array ensures this runs only once

  // Effect to subscribe to wallet rooms whenever the list of wallets changes
  useEffect(() => {
    if (socket && isConnected && wallets.length > 0) {
      console.log('Subscribing to wallet rooms...');
      wallets.forEach(wallet => {
        socket.emit('subscribe_wallet', wallet.address.toLowerCase());
      });
    }
  }, [socket, isConnected, wallets]); 

  return {
    isConnected,
    lastUpdate,
  };
};