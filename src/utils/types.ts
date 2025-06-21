// src/types/types.ts
import { NETWORKS } from './networks';

export type SupportedNetwork = keyof typeof NETWORKS;

export interface TransactionStatus {
  state: 'idle' | 'pending' | 'success' | 'error';
  message?: string;
  txHash?: string;
  feeQuote?: string; 
}

export interface TokenDetails {
  address: string; 
  chainId: number;
  amount: string; 
  decimals: number;
  formattedAmount: string; 
  symbol?: string;
  iconUrl?: string;
}

export interface Wallet {
  balance: string;
  address: `0x${string}`;
  walletNumber: number;
  externalAccountNumber: number;
  index: number;
  networkKey: SupportedNetwork; // Keep track of the wallet's network
  transactionStatus?: TransactionStatus;
  allTokenBalances: TokenDetails[];
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