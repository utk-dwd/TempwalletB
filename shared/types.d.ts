export declare enum SupportedNetwork {
    Avalanche = "Avalanche",
    Ethereum = "Ethereum",
    Base = "Base",
    Arbitrum = "Arbitrum"
}
export interface NetworkConfig {
    name: string;
    chainId: number;
    rpcUrl: string;
    explorerUrl: string;
    paymasterApiKey: string;
    currencySymbol: string;
    zerionChainId: string;
    bundlerUrl: string;
}
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
    networkKey: SupportedNetwork;
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
    walletNames: Record<string, string>;
}
export declare enum EventName {
    WALLET_CONNECTION_ATTEMPTED = "Wallet Connection Attempted",
    WALLET_CONNECTION_SUCCESS = "Wallet Connection Success",
    WALLET_CONNECTION_FAILED = "Wallet Connection Failed",
    NETWORK_SWITCH_REQUESTED = "Network Switch Requested",
    NETWORK_ADDED = "Network Added",
    WALLET_CREATION_STARTED = "Wallet Creation Started",
    WALLET_CREATION_SUCCESS = "Wallet Creation Success",
    WALLET_CREATION_FAILED = "Wallet Creation Failed",
    TRANSACTION_INITIATED = "Transaction Initiated",
    TRANSACTION_VALIDATION_STARTED = "Transaction Validation Started",
    TRANSACTION_MODE_SELECTED = "Transaction Mode Selected",
    TRANSACTION_SUCCESS = "Transaction Success",
    TRANSACTION_FAILED = "Transaction Failed",
    WALLET_SELECTED = "Wallet Selected",
    WALLET_DESELECTED = "Wallet Deselected",
    NETWORK_CHANGED = "Network Changed",
    CREATE_WALLET_BUTTON_CLICKED = "Create Wallet Button Clicked",
    ADDRESS_COPY_CLICKED = "Address Copy Clicked",
    WALLET_SORT_CHANGED = "Wallet Sort Changed",
    PROFILE_EDIT_STARTED = "Profile Edit Started",
    PROFILE_NAME_CHANGED = "Profile Name Changed",
    PROFILE_PICTURE_CHANGED = "Profile Picture Changed",
    PROFILE_EDIT_SAVED = "Profile Edit Saved",
    WALLET_NAME_EDIT_STARTED = "Wallet Name Edit Started",
    WALLET_NAME_CHANGED = "Wallet Name Changed",
    WALLET_NAME_EDIT_SAVED = "Wallet Name Edit Saved",
    EXPORT_WALLETS_CLICKED = "Export Wallets Clicked",
    IMPORT_WALLETS_CLICKED = "Import Wallets Clicked",
    IMPORT_FILE_SELECTED = "Import File Selected",
    LOGOUT_CLICKED = "Logout Clicked",
    NAVIGATION_CLICKED = "Navigation Clicked",
    POLICY_VIEWED = "Policy Viewed"
}
export interface Properties {
    [key: string]: any;
}
export interface UserProperties {
    $name?: string;
    $email?: string;
    profileName: string;
    walletAddress: string;
    totalWalletsCreated?: number;
    lastLogin?: Date;
}
