// /packages/shared/src/types.ts

// NOTE: This assumes `networks.ts` will eventually be part of your shared types
// or accessible in both environments. For now, copy the SupportedNetwork definition
// directly if NETWORKS is not intended to be shared immediately.
// If NETWORKS is meant to be truly shared, you might need a shared/utils/networks.ts
// and update the import accordingly.
// For simplicity in this phase, we'll hardcode the enum values as per your Prisma schema.

// Represents the networks supported in the application.
// This enum must match the `SupportedNetwork` enum defined in `prisma/schema.prisma`
// to ensure type consistency between your application code and the database.
export enum SupportedNetwork {
  Avalanche = 'Avalanche',
  Ethereum = 'Ethereum',
  Base = 'Base',
  Arbitrum = 'Arbitrum',
}

// Configuration for each supported network, shared between frontend and backend.
// This interface defines the structure for network-specific settings.
// Environment variables (e.g., rpcUrl, paymasterApiKey) are loaded at runtime in respective environments.
export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  paymasterApiKey: string;
  currencySymbol: string;
  zerionChainId: string;
  bundlerUrl: string; // Bundler URL, constructed from base URL and chain-specific keys
}

// Defines the status of a transaction, including its state, messages, and hash.
export interface TransactionStatus {
  state: 'idle' | 'pending' | 'success' | 'error';
  message?: string;
  txHash?: string;
  feeQuote?: string;
}

// Details for a specific token balance, including address, amount, and chain information.
export interface TokenDetails {
  address: string;
  chainId: number;
  amount: string; // Stored as string to handle large BigInt values
  decimals: number;
  formattedAmount: string;
  symbol?: string;
  iconUrl?: string;
}

// Represents a user's wallet, including its address, network, and associated token balances.
// This interface will largely align with your `TempWallet` Prisma model,
// but might have additional frontend-specific fields.
export interface Wallet {
  id?: string; // Optional for backend database ID
  balance: string;
  address: `0x${string}`;
  walletNumber: number;
  externalAccountNumber: number;
  index: number;
  networkKey: SupportedNetwork; // Connects to the SupportedNetwork enum
  transactionStatus?: TransactionStatus;
  allTokenBalances: TokenDetails[];
}

// Represents an account managed by the user, containing multiple wallets.
export interface WalletAccount {
  account: string;
  name: string;
  externalAccountNumber: number;
  wallets: Wallet[];
}

// Overall user data structure, including accounts and active selections.
export interface UserData {
  accounts: WalletAccount[];
  activeAccount: string | null;
  walletNames: Record<string, string>; // Updated to a more specific type: key is wallet address, value is name
}

// Enum for tracking various application events for analytics.
export enum EventName {
  // Wallet Connection
  WALLET_CONNECTION_ATTEMPTED = 'Wallet Connection Attempted',
  WALLET_CONNECTION_SUCCESS = 'Wallet Connection Success',
  WALLET_CONNECTION_FAILED = 'Wallet Connection Failed',
  NETWORK_SWITCH_REQUESTED = 'Network Switch Requested',
  NETWORK_ADDED = 'Network Added',

  // Wallet Creation
  WALLET_CREATION_STARTED = 'Wallet Creation Started',
  WALLET_CREATION_SUCCESS = 'Wallet Creation Success',
  WALLET_CREATION_FAILED = 'Wallet Creation Failed',

  // Transaction
  TRANSACTION_INITIATED = 'Transaction Initiated',
  TRANSACTION_VALIDATION_STARTED = 'Transaction Validation Started',
  TRANSACTION_MODE_SELECTED = 'Transaction Mode Selected',
  TRANSACTION_SUCCESS = 'Transaction Success',
  TRANSACTION_FAILED = 'Transaction Failed',

  // UI Interactions
  WALLET_SELECTED = 'Wallet Selected',
  WALLET_DESELECTED = 'Wallet Deselected',
  NETWORK_CHANGED = 'Network Changed',
  CREATE_WALLET_BUTTON_CLICKED = 'Create Wallet Button Clicked',
  ADDRESS_COPY_CLICKED = 'Address Copy Clicked',
  WALLET_SORT_CHANGED = 'Wallet Sort Changed',
  PROFILE_EDIT_STARTED = 'Profile Edit Started',
  PROFILE_NAME_CHANGED = 'Profile Name Changed',
  PROFILE_PICTURE_CHANGED = 'Profile Picture Changed',
  PROFILE_EDIT_SAVED = 'Profile Edit Saved',
  WALLET_NAME_EDIT_STARTED = 'Wallet Name Edit Started',
  WALLET_NAME_CHANGED = 'Wallet Name Changed',
  WALLET_NAME_EDIT_SAVED = 'Wallet Name Edit Saved',
  EXPORT_WALLETS_CLICKED = 'Export Wallets Clicked',
  IMPORT_WALLETS_CLICKED = 'Import Wallets Clicked',
  IMPORT_FILE_SELECTED = 'Import File Selected',
  LOGOUT_CLICKED = 'Logout Clicked',
  NAVIGATION_CLICKED = 'Navigation Clicked',
  POLICY_VIEWED = 'Policy Viewed',
}

// A generic properties object for events, allowing flexible key-value pairs.
export interface Properties {
  [key: string]: any;
}

// Specific properties for user profiles, typically used for analytics platforms like Mixpanel.
export interface UserProperties {
  $name?: string; // User's display name
  $email?: string; // User's email (if you ever collect it)
  profileName: string;
  walletAddress: string;
  totalWalletsCreated?: number;
  lastLogin?: Date;
}

export interface TelegramRegistrationPayload {
  chatId: string; // Telegram chat ID from @IExecWeb3TelegramBot
}