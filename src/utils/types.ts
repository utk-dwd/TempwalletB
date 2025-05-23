// Type definitions for the dApp
// Dependency: typescript (^5.8.3) for type safety
// Integration: Defines Wallet type for tempwallet data

// src/types/types.ts
export interface TransactionStatus {
  state: 'idle' | 'pending' | 'success' | 'error';
  message?: string;
  txHash?: string;
  feeQuote?: string; // Fee in AVAX (sponsored) or USDC (ERC-20)
}

export interface Wallet {
  address: string;
  walletNumber: number;
  externalAccountNumber: number;
  index: number;
  transactionStatus?: TransactionStatus;
  balance?: string; // AVAX balance in wei
  tokenBalance?: string; // USDC balance in token units
}

export interface WalletAccount {
  account: string;
  name: string;
  externalAccountNumber: number;
  wallets: Wallet[];
}

export interface UserData {
  accounts: WalletAccount[];
  activeAccount: string | null;
}