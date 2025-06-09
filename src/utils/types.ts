// Type definitions for the dApp
// Dependency: typescript (^5.8.3) for type safety
// Integration: Defines Wallet type for tempwallet data

// src/utils/types.ts

// Define SDK types for clarity
export type SdkType = 'biconomy' | '0xgasless';

export interface TransactionStatus {
  state: 'idle' | 'pending' | 'success' | 'error';
  message?: string;
  txHash?: string;
  feeQuote?: string;
}

export interface TokenBalance {
  address: string;
  chainId: number;
  amount: string;
  decimals: number;
  formattedAmount: string;
  symbol?: string;
}

export interface Wallet {
  address: `0x${string}`;
  walletNumber: number;
  externalAccountNumber: number;
  index: number;
  sdk: SdkType; // <-- ADD THIS LINE
  transactionStatus?: TransactionStatus;
  balance: string;
  tokenBalance: string;
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
  walletNames: {};
}