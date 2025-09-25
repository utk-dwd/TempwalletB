// @ts-nocheck
// NestJS Nitrolite (Yellow SDK) service placeholder – not wired into any module.
// Safe to keep in repo for reference; it won’t affect runtime.

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NitroliteService {
  private readonly logger = new Logger(NitroliteService.name);

  // Placeholder config for BASE – provide real values when wiring
  private readonly config = {
    chainId: 8453,
    custody: '0xCUSTODY_ADDRESS',
    adjudicator: '0xADJUDICATOR_ADDRESS',
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  };

  // Lazy init pattern to avoid loading SDK unless explicitly used
  private async getClient() {
    const nitro = await import('@erc7824/nitrolite');
    const viem = await import('viem');
    const { base } = await import('viem/chains');

    const publicClient = viem.createPublicClient({ chain: base, transport: viem.http(this.config.rpcUrl) });
    const walletClient = viem.createWalletClient({ chain: base, transport: viem.http(this.config.rpcUrl) as any });

    const client = new nitro.NitroliteClient({
      publicClient,
      walletClient,
      addresses: {
        custody: this.config.custody,
        adjudicator: this.config.adjudicator,
        guestAddress: '0x0000000000000000000000000000000000000000',
      },
      chainId: this.config.chainId,
      challengeDuration: 3600n,
    });

    return client;
  }

  // Methods below mirror expected SDK operations but are no-ops

  async getCustodyInfo() {
    this.logger.log('getCustodyInfo() called (placeholder)');
    return { available: '0', locked: '0' };
  }

  async prepareDeposit(_amount: string) {
    this.logger.log('prepareDeposit() called (placeholder)');
    return [];
  }

  async prepareDepositAndCreate(_amount: string, _allocA: string, _allocB: string) {
    this.logger.log('prepareDepositAndCreate() called (placeholder)');
    return [];
  }

  async prepareWithdraw(_amount: string) {
    this.logger.log('prepareWithdraw() called (placeholder)');
    return null;
  }
}
