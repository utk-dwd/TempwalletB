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

export interface TokenDetails {
  address: string; // Token address (or 0xEeee... for native token)
  chainId: number;
  amount: string; // Balance in wei/token units
  decimals: number;
  formattedAmount: string; // Human-readable balance
  symbol?: string;
  iconUrl?: string; // Optional: for displaying token icon
}

export interface Wallet {
  balance: string;
  address: `0x${string}`;
  walletNumber: number;
  externalAccountNumber: number;
  index: number;
  transactionStatus?: TransactionStatus;
  allTokenBalances: TokenDetails[]; // Updated to hold all token balances
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