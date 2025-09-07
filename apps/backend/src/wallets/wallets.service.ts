import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService, TempWallet, User} from '../types/prisma.js';
import { BalancesService } from '../balances/balances.service.js';
import { CreateWalletDto } from './dto/create-wallet.dto.js';
import * as Mixpanel from 'mixpanel';
import { NETWORKS } from '../types/shared.js';
import { AlchemyService } from '../alchemy.service.js';
import { SupportedNetwork } from '../types/shared.js';
 
@Injectable()
export class WalletsService {
  private mixpanel: Mixpanel.Mixpanel;
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly balancesService: BalancesService,
    private readonly config: ConfigService,
    private readonly alchemyService: AlchemyService, // Already correctly injected
  ) {
    const token = this.config.get('MIXPANEL_TOKEN') || '';
    this.mixpanel = Mixpanel.init(token);
  }

  private findByAddressAndNetwork(address: string, networkKey: SupportedNetwork) {
    return this.prisma.tempWallet.findFirst({
      where: {
        address: { equals: address, mode: 'insensitive' },
        network_key: networkKey,
        deleted_at: null,
      },
    });
  }

  async createWallet(user: User, dto: CreateWalletDto): Promise<TempWallet> {
    // Prevent case-variant duplicates for the same network (DB unique is case-sensitive)
    const existing = await this.prisma.tempWallet.findFirst({
      where: {
        address: { equals: dto.address, mode: 'insensitive' },
        network_key: dto.networkKey,
      },
    });
    if (existing) {
      throw new ConflictException('Wallet already exists for this address and network');
    }

    const wallet = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { total_wallets_created: { increment: 1 } },
      });

      const createdWallet = await tx.tempWallet.create({
        data: {
          // Keep original casing for display; lookups use case-insensitive matching
          address: dto.address,
          wallet_number: dto.walletNumber,
          external_account_number: dto.externalAccountNumber,
          index: dto.index,
          network_key: dto.networkKey,
          parent_metamask_address: dto.parent_metamask_address,
          user_id: user.id,
        },
      });

      // NOTE: The balance fetching inside the transaction has been moved out
      // to prevent potential deadlocks and keep the transaction swift.
      return createdWallet;
    });

    // Register the wallet address with Alchemy webhook (best-effort)
    try {
      await this.alchemyService.addAddressToWebhook(wallet.address, wallet.network_key as SupportedNetwork);
      this.logger.log(`Registered wallet ${wallet.address} for ${wallet.network_key} notifications.`);
    } catch (err) {
      this.logger.error(`Failed to register wallet ${wallet.address} for ${wallet.network_key} notifications: ${err}`);
      // proceed — wallet creation itself shouldn't fail because of webhook issues
    }

    // Trigger asynchronous balance refresh for the newly created wallet
    try {
      await this.balancesService.refreshBalances(wallet.id);
    } catch (err) {
      this.logger.error(`Failed to trigger balance refresh for wallet ${wallet.id}: ${err}`);
    }

    this.mixpanel.track('WALLET_CREATION_SUCCESS', {
      userId: user.id,
      walletAddress: wallet.address,
      network: dto.networkKey,
    });

    return wallet;
  }

  async findUserWallets(userId: string, options: { page: number; limit: number; networkKey?: SupportedNetwork }): Promise<{ data: TempWallet[]; total: number }> {
    // This function remains unchanged.
    const { page, limit, networkKey } = options;
    const skip = (page - 1) * limit;

    const where = {
      user_id: userId,
      deleted_at: null,
      network_key: networkKey,
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

    // Soft-delete wallet and cascade soft-delete to balances and transactions in a single transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.tempWallet.update({
        where: { id: walletId },
        data: { deleted_at: now },
      });

      await tx.balance.updateMany({
        where: { temp_wallet_id: walletId },
        data: { deleted_at: now },
      });

      await tx.transaction.updateMany({
        where: { temp_wallet_id: walletId },
        data: { deleted_at: now },
      });
    });

    // --- NEW: Unregister wallet address from Alchemy webhook (best-effort)
    try {
      await this.alchemyService.removeAddressFromWebhook(wallet.address, wallet.network_key as SupportedNetwork);
      this.logger.log(`Unregistered wallet ${wallet.address} from ${wallet.network_key} notifications.`);
    } catch (error) {
      this.logger.error(`Failed to unregister wallet ${wallet.address} from ${wallet.network_key} notifications: ${error}`);
      // proceed — deletion has already been applied
    }

    // Analytics
    this.mixpanel.track('WALLET_DELETION', {
      userId: userId,
      walletAddress: wallet.address,
      network: wallet.network_key,
    });

    return wallet;
  }
}