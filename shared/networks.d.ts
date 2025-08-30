import { SupportedNetwork } from './types';
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
export declare const NETWORKS: Record<SupportedNetwork, NetworkConfig>;
