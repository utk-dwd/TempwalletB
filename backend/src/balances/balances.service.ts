import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@prisma/prisma.service';
import { TempWallet } from '@prisma/client';
import axios from 'axios';
import { TokenDetails, SupportedNetwork } from '@shared/types';
import { NETWORKS, NetworkConfig } from '@shared/networks';

@Injectable()
export class BalancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private getZerionAuthHeader() {
    const apiKey = this.config.get('ZERION_API_KEY');
    const authString = Buffer.from(`${apiKey}:`).toString('base64');
    return `Basic ${authString}`;
  }

  async getWalletForUser(userId: string, walletId: string): Promise<TempWallet | null> {
    return this.prisma.tempWallet.findFirst({
      where: { id: walletId, user_id: userId, deleted_at: null },
    });
  }

  async refreshBalances(walletId: string): Promise<void> {
    const wallet = await this.prisma.tempWallet.findUnique({
      where: { id: walletId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const network = NETWORKS[wallet.network_key as SupportedNetwork];
    const balances = await this.fetchWalletAllBalances(wallet.address, network);

    for (const balance of balances) {
      await this.prisma.balance.upsert({
        where: {
          temp_wallet_id_token_address: {
            temp_wallet_id: walletId,
            token_address: balance.address,
          },
        },
        update: {
          amount: balance.amount,
          decimals: balance.decimals,
          formatted_amount: balance.formattedAmount,
          symbol: balance.symbol,
          icon_url: balance.iconUrl,
          chain_id: balance.chainId,
        },
        create: {
          temp_wallet_id: walletId,
          token_address: balance.address,
          chain_id: balance.chainId,
          amount: balance.amount,
          decimals: balance.decimals,
          formatted_amount: balance.formattedAmount,
          symbol: balance.symbol,
          icon_url: balance.iconUrl,
        },
      });
    }
  }

  async fetchWalletAllBalances(address: string, network: NetworkConfig): Promise<TokenDetails[]> {
    const url = `https://api.zerion.io/v1/wallets/${address}/positions/?currency=usd&filter[chain_ids]=${network.zerionChainId}&filter[positions]=wallet&filter[trash]=false&sort=value`;
    const response = await axios.get(url, {
      headers: {
        Authorization: this.getZerionAuthHeader(),
        Accept: 'application/json',
      },
    });

    const positions = response.data.data || [];
    return positions.map((pos: any) => {
      const quantity = pos.attributes.quantity;
      const fungibleInfo = pos.attributes.fungible_info;
      const implementation = fungibleInfo.implementations[network.zerionChainId] || Object.values(fungibleInfo.implementations)[0];

      return {
        address: implementation?.address || '0x0000000000000000000000000000000000000000', // Native token fallback
        chainId: network.chainId,
        amount: quantity.int,
        decimals: quantity.decimals,
        formattedAmount: quantity.floating_point,
        symbol: fungibleInfo.symbol,
        iconUrl: fungibleInfo.icon?.url,
      };
    });
  }

  @Cron('0 */10 * * * *') // Every 10 minutes
  async refreshActiveWallets() {
    const activeWallets = await this.prisma.tempWallet.findMany({
      where: { deleted_at: null },
    });

    for (const wallet of activeWallets) {
      await this.refreshBalances(wallet.id);
    }
  }
}