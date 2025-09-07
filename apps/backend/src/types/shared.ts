export enum SupportedNetwork {
  Ethereum = 'Ethereum',
  Avalanche = 'Avalanche',
  Base = 'Base',
  Arbitrum = 'Arbitrum'
}

export interface TelegramRegistrationPayload {
  chatId: string;
  protectedData: string;
}

export interface NetworkConfig {
  name: string;
  chainId: number;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  bundlerUrl?: string;
  paymasterApiKey?: string;
}

export const NETWORKS: Record<SupportedNetwork, NetworkConfig> = {
  [SupportedNetwork.Ethereum]: {
    name: 'Ethereum',
    chainId: 1,
    symbol: 'ETH',
    rpcUrl: process.env.VITE_ETHEREUM_RPC || '',
    explorerUrl: 'https://etherscan.io'
  },
  [SupportedNetwork.Avalanche]: {
    name: 'Avalanche',
    chainId: 43114,
    symbol: 'AVAX',
    rpcUrl: process.env.VITE_AVALANCHE_RPC || '',
    explorerUrl: 'https://snowtrace.io',
    bundlerUrl: process.env.VITE_BUNDLER_URL,
    paymasterApiKey: process.env.VITE_BICONOMY_PAYMASTER_API_KEY_AVALANCHE
  },
  [SupportedNetwork.Base]: {
    name: 'Base',
    chainId: 8453,
    symbol: 'ETH',
    rpcUrl: process.env.VITE_BASE_RPC || '',
    explorerUrl: 'https://basescan.org',
    bundlerUrl: process.env.VITE_BUNDLER_URL,
    paymasterApiKey: process.env.VITE_BICONOMY_PAYMASTER_API_KEY_BASE
  },
  [SupportedNetwork.Arbitrum]: {
    name: 'Arbitrum',
    chainId: 42161,
    symbol: 'ETH',
    rpcUrl: process.env.VITE_ARBITRUM_RPC || '',
    explorerUrl: 'https://arbiscan.io',
    bundlerUrl: process.env.VITE_BUNDLER_URL,
    paymasterApiKey: process.env.VITE_BICONOMY_PAYMASTER_API_KEY_ARBITRUM
  }
};
