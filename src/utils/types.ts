// Type definitions for the dApp
// Dependency: typescript (^5.8.3) for type safety
// Integration: Defines Wallet type for tempwallet data
export interface Wallet {
  address: string; // Tempwallet address
  walletNumber: number; // Wallet number for deterministic creation
}