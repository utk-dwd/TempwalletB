// Type definitions for the dApp
// Dependency: typescript (^5.8.3) for type safety
// Integration: Defines Wallet type for tempwallet data

// src/types/types.ts

export type SdkType = 'biconomy' | '0xgasless';


export interface TransactionStatus {
  state: 'idle' | 'pending' | 'success' | 'error';
  message?: string;
  txHash?: string;
  feeQuote?: string; // Fee in AVAX (sponsored) or USDC (ERC-20)
}

export interface TokenBalance {
  address: string; // Token address (or 0xEeee... for native token)
  chainId: number;
  amount: string; // Balance in wei/token units
  decimals: number;
  formattedAmount: string; // Human-readable balance
  symbol?: string; // Optional, from getSupportedTokens
}

export interface Wallet {
  address: `0x${string}`;
  walletNumber: number;
  externalAccountNumber: number;
  index: number;
  sdk: SdkType;
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