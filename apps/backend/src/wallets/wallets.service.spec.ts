// src/wallets/wallets.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@tempwallet/prisma';
import { BalancesService } from '../balances/balances.service.js';
import { TempWallet, User, SupportedNetwork, Prisma } from '@tempwallet/prisma';
import { CreateWalletDto } from './dto/create-wallet.dto.js';
import Mixpanel from 'mixpanel';
import { NETWORKS } from '@tempwallet/shared';

@Injectable()
export class WalletsService {
  private mixpanel: Mixpanel.Mixpanel;

  constructor(
    private readonly prisma: PrismaService,
    private readonly balancesService: BalancesService,
    private readonly config: ConfigService,
  ) {
    const token = this.config.get('MIXPANEL_TOKEN') || '';
    this.mixpanel = Mixpanel.init(token);
  }

  async createWallet(user: User, dto: CreateWalletDto): Promise<TempWallet> {
    const wallet = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { total_wallets_created: { increment: 1 } },
      });

      // Map the DTO fields to the Prisma schema's snake_case
      return tx.tempWallet.create({
        data: {
          address: dto.address,
          wallet_number: dto.walletNumber,
          external_account_number: dto.externalAccountNumber,
          index: dto.index,
          network_key: dto.networkKey,
          parent_metamask_address: dto.parent_metamask_address,
          user_id: user.id,
        },
      });
    });

    // Trigger balance fetch
    await this.balancesService.refreshBalances(wallet.id);

    // Analytics
    this.mixpanel.track('WALLET_CREATION_SUCCESS', {
      userId: user.id,
      walletAddress: wallet.address,
      network: dto.networkKey,
    });

    return wallet;
  }

  async findUserWallets(userId: string, options: { page: number; limit: number; networkKey?: SupportedNetwork }): Promise<{ data: TempWallet[]; total: number }> {
    const { page, limit, networkKey } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.TempWalletWhereInput = {
      user_id: userId,
      deleted_at: null,
      ...(networkKey && { network_key: networkKey }),
    };

    const [total, data] = await Promise.all([
      this.prisma.tempWallet.count({ where }),
      this.prisma.tempWallet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'asc' },
        include: {
          balances: true,
          transactions: true,
        },
      }),
    ]);

    return { data, total };
  }

  async deleteWallet(userId: string, walletId: string): Promise<TempWallet> {
    const wallet = await this.prisma.tempWallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet || wallet.user_id !== userId) {
      throw new NotFoundException('Wallet not found or does not belong to the user.');
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Soft delete wallet
      await tx.tempWallet.update({
        where: { id: walletId },
        data: { deleted_at: now },
      });

      // Cascade soft delete to balances and transactions
      await tx.balance.updateMany({
        where: { temp_wallet_id: walletId },
        data: { deleted_at: now },
      });

      await tx.transaction.updateMany({
        where: { temp_wallet_id: walletId },
        data: { deleted_at: now },
      });
    });

    // Analytics
    this.mixpanel.track('WALLET_DELETION', {
      userId: userId,
      walletAddress: wallet.address,
    });

    return wallet;
  }
}