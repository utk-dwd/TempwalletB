// Main export file for @tempwallet/shared package
// Re-export everything from types and networks

// Re-export all types and enums
export * from './types.js';
export * from './networks.js';

// Named exports for convenience
export { SupportedNetwork, EventName } from './types.js';
export { NETWORKS } from './networks.js';

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
} from './types.js';
