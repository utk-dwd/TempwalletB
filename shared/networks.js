"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NETWORKS = void 0;
exports.NETWORKS = {
    Avalanche: {
        name: 'Avalanche',
        chainId: 43114,
        rpcUrl: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
        paymasterApiKey: process.env.AVALANCHE_PAYMASTER_API_KEY || '',
        currencySymbol: 'AVAX',
        bundlerUrl: process.env.AVALANCHE_BUNDLER_URL || '',
        zerionChainId: 'avalanche',
        explorerUrl: 'https://snowtrace.io',
    },
    Ethereum: {
        name: 'Ethereum',
        chainId: 1,
        rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
        paymasterApiKey: process.env.ETHEREUM_PAYMASTER_API_KEY || '',
        currencySymbol: 'ETH',
        bundlerUrl: process.env.ETHEREUM_BUNDLER_URL || '',
        zerionChainId: 'ethereum',
        explorerUrl: 'https://etherscan.io',
    },
    Base: {
        name: 'Base',
        chainId: 8453,
        rpcUrl: process.env.BASE_RPC_URL || 'https://base.llamarpc.com',
        paymasterApiKey: process.env.BASE_PAYMASTER_API_KEY || '',
        currencySymbol: 'ETH',
        bundlerUrl: process.env.BASE_BUNDLER_URL || '',
        zerionChainId: 'base',
        explorerUrl: 'https://basescan.org',
    },
    Arbitrum: {
        name: 'Arbitrum',
        chainId: 42161,
        rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arbitrum.llamarpc.com',
        paymasterApiKey: process.env.ARBITRUM_PAYMASTER_API_KEY || '',
        currencySymbol: 'ETH',
        bundlerUrl: process.env.ARBITRUM_BUNDLER_URL || '',
        zerionChainId: 'arbitrum',
        explorerUrl: 'https://arbiscan.io',
    },
};
//# sourceMappingURL=networks.js.map