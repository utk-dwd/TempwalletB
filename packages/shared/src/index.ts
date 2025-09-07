// Main export file for @tempwallet/shared package
// Re-export everything from types and networks

// Re-export all types and enums
export * from './types';
export * from './networks';

// Named exports for convenience
export { SupportedNetwork, EventName } from './types';
export { NETWORKS } from './networks';

// Type-only exports for commonly used interfaces
export type { 
  NetworkConfig, 
  TokenDetails, 
  Wallet, 
  WalletAccount, 
  UserData,
  TransactionStatus,
  Properties,
  UserProperties,
  TelegramRegistrationPayload
} from './types';
