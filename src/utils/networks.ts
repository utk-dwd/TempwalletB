import { avalanche, mainnet, base, arbitrum } from 'viem/chains';

export interface NetworkConfig {
  name: string;
  chainId: number;
  viemChain: typeof avalanche | typeof mainnet | typeof base | typeof import('viem/chains').arbitrum;
  rpcUrl: string;
  explorerUrl: 'https://snowtrace.io' | 'https://etherscan.io' | 'https://basescan.org' | 'https://arbiscan.io';
  paymasterApiKey: string;
  currencySymbol: 'AVAX' | 'ETH'; // Base and Arbitrum use ETH
  zerionChainId: 'avalanche' | 'ethereum' | 'base' | 'arbitrum';
}

// Ensure you have these environment variables in your .env file
const VITE_AVALANCHE_RPC = import.meta.env.VITE_AVALANCHE_RPC;
const VITE_ETHEREUM_RPC = import.meta.env.VITE_ETHEREUM_RPC;
const VITE_BASE_RPC = import.meta.env.VITE_BASE_RPC;
const VITE_ARBITRUM_RPC = import.meta.env.VITE_ARBITRUM_RPC;
const VITE_BICONOMY_PAYMASTER_API_KEY_ARBITRUM = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY_ARBITRUM;
const VITE_BICONOMY_PAYMASTER_API_KEY_AVALANCHE = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY; // Assuming one key for now
const VITE_BICONOMY_PAYMASTER_API_KEY_ETHEREUM = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY_ETHEREUM;
const VITE_BICONOMY_PAYMASTER_API_KEY_BASE = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY_BASE;


export const NETWORKS: Record<string, NetworkConfig> = {
  Avalanche: {
    name: "Avalanche",
    chainId: 43114,
    viemChain: avalanche,
    rpcUrl: VITE_AVALANCHE_RPC,
    explorerUrl: "https://snowtrace.io",
    paymasterApiKey: VITE_BICONOMY_PAYMASTER_API_KEY_AVALANCHE,
    currencySymbol: "AVAX",
    zerionChainId: 'avalanche',
  },
  Ethereum: {
    name: "Ethereum",
    chainId: 1,
    viemChain: mainnet,
    rpcUrl: VITE_ETHEREUM_RPC,
    explorerUrl: "https://etherscan.io",
    paymasterApiKey: VITE_BICONOMY_PAYMASTER_API_KEY_ETHEREUM,
    currencySymbol: "ETH",
    zerionChainId: 'ethereum',
  },
  Base: {
    name: "Base",
    chainId: 8453,
    viemChain: base,
    rpcUrl: VITE_BASE_RPC,
    explorerUrl: "https://basescan.org",
    paymasterApiKey: VITE_BICONOMY_PAYMASTER_API_KEY_BASE,
    currencySymbol: "ETH",
    zerionChainId: 'base',
  },

  Arbitrum: {
    name: "Arbitrum",
    chainId: 42161,
    viemChain: arbitrum,
    rpcUrl: VITE_ARBITRUM_RPC,
    explorerUrl: "https://arbiscan.io",
    paymasterApiKey: VITE_BICONOMY_PAYMASTER_API_KEY_ARBITRUM,
    currencySymbol: "ETH",
    zerionChainId: 'arbitrum',
  },
  // Add more networks here as needed, e.g., Polygon, Arbitrum
};