// @ts-nocheck
// Nitrolite (Yellow SDK) client bootstrap for BASE mainnet
// NOTE: This is a non-functional placeholder scaffold to document integration points.
// It is intentionally not imported anywhere so it will not affect runtime.
// You can wire it into your app when you're ready.

/*
High-level contract:
- Inputs: wallet provider (window.ethereum), counterparty address, BASE RPC URL, contract addresses
- Outputs: configured NitroliteClient instance and convenience helpers
- Error modes: network mismatch, missing provider, bad addresses
- Success: returns an object with methods but does not auto-run anything
*/

import type { WalletClient, PublicClient } from 'viem';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { base } from 'viem/chains';
import type { NitroliteClient as NitroliteClientType } from '@erc7824/nitrolite';
// Import type only to avoid tree-shaking issues; real import guarded below

// Lazy import pattern: keeps bundle lean and avoids runtime side-effects until explicitly used.
async function loadNitrolite() {
  const mod = await import('@erc7824/nitrolite');
  return mod;
}

export interface NitroliteAddresses {
  custody: `0x${string}`;
  adjudicator: `0x${string}`;
  tokenAddress: `0x${string}`; // e.g., USDC on Base
}

export interface CreateNitroliteOptions {
  rpcUrl: string; // BASE RPC URL
  counterpartyAddress: `0x${string}`;
  addresses: NitroliteAddresses;
  // Optional prebuilt clients for SSR/tests
  publicClient?: PublicClient;
  walletClient?: WalletClient;
}

export async function createNitroliteClient(opts: CreateNitroliteOptions): Promise<{
  nitroliteClient: NitroliteClientType;
  publicClient: PublicClient;
  walletClient: WalletClient;
  getUserAddress: () => Promise<`0x${string}`>;
}> {
  const { rpcUrl, counterpartyAddress, addresses } = opts;

  const publicClient =
    opts.publicClient ||
    createPublicClient({ chain: base, transport: http(rpcUrl) });

  // In browser only; if SSR, caller should pass walletClient
  const walletClient =
    opts.walletClient ||
    createWalletClient({ chain: base, transport: custom((globalThis as any).ethereum) });

  const { NitroliteClient } = await loadNitrolite();

  const nitroliteClient = new NitroliteClient({
    publicClient,
    walletClient,
    addresses: {
      custody: addresses.custody,
      adjudicator: addresses.adjudicator,
      guestAddress: counterpartyAddress,
      tokenAddress: addresses.tokenAddress,
    },
    chainId: base.id, // 8453
    challengeDuration: 3600n,
  });

  return {
    nitroliteClient,
    publicClient,
    walletClient,
    getUserAddress: async () => {
      const addrs = await walletClient.getAddresses();
      return addrs[0] as `0x${string}`;
    },
  };
}

// Convenience placeholders for AA transaction preparation. These mirror SDK methods but do nothing by default.
export const nitroliteAA = {
  // Prepare deposit transaction(s)
  prepareDeposit: async (client: NitroliteClientType, amount: bigint) => {
    // return client.txPreparer.prepareDepositTransactions(amount);
    // Placeholder: return empty array so it has no effect
    return [] as any[];
  },

  // Prepare deposit + create channel batch
  prepareDepositAndCreate: async (
    client: NitroliteClientType,
    amount: bigint,
    params: { initialAllocationAmounts: [bigint, bigint]; stateData?: `0x${string}` }
  ) => {
    // return client.txPreparer.prepareDepositAndCreateChannelTransactions(amount, params);
    return [] as any[];
  },

  // Prepare withdrawal
  prepareWithdraw: async (client: NitroliteClientType, amount: bigint) => {
    // return client.txPreparer.prepareWithdrawalTransaction(amount);
    return null as any;
  },
};

// All functions above are stubs. Wire them inside app flows when ready.
