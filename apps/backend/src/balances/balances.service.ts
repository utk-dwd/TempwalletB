import { Injectable, NotFoundException, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config'; // Removed Zerion API Key dependency
// import axios from 'axios'; // Removed Zerion API client dependency
import { PrismaService, TempWallet, SupportedNetwork } from '@tempwallet/prisma';
// import { TokenDetails, NETWORKS, NetworkConfig } from '@tempwallet/shared'; // Removed Zerion related imports

@Injectable()
export class BalancesService {
  private readonly logger = new Logger(BalancesService.name); // Add Logger

  // constructor(
  //   private readonly prisma: PrismaService,
  //   private readonly configService: ConfigService, // Removed Zerion API Key injection
  // ) {
  //   // Removed Zerion API Key loading and validation
  // }

  // --- REMOVED ZERION LOGIC ---
  // private getZerionAuthHeader(): string { ... }
  // async fetchWalletAllBalances(address: string, network: NetworkConfig): Promise<TokenDetails[]> { ... }
  // --- END REMOVED ZERION LOGIC ---

  constructor(private readonly prisma: PrismaService) {} // Simplified constructor

  /**
   * Refreshes and updates the balances for a specific wallet ID in the database.
   * Currently, this just logs that a refresh was triggered.
   * In the future, this could process data received from Alchemy directly.
   */
  async refreshBalances(walletId: string): Promise<void> {
    try {
      const wallet = await this.prisma.tempWallet.findUnique({ 
        where: { id: walletId },
        select: { id: true, address: true, network_key: true, user_id: true }
      });
      
      if (!wallet) {
        this.logger.warn(`Attempted to refresh balances for non-existent wallet ID: ${walletId}`);
        return;
      }

      this.logger.log(`Balance refresh triggered for wallet ID: ${walletId} (Address: ${wallet.address}, Network: ${wallet.network_key}, User: ${wallet.user_id}). This is a placeholder; actual balance update logic would go here.`);
      
      // In a full implementation, you might parse the `activity` data passed from the webhook
      // and update the database directly based on that, rather than fetching from an external API.
      // For now, we just log that the refresh was initiated by the webhook.

      // If you had specific database updates based on Alchemy data, they would go here.
      // Example placeholder for potential future logic (requires passing activity data):
      /*
      if (alchemyActivityData) {
         const upsertPromises = alchemyActivityData.map(activity => 
           this.prisma.balance.upsert({
             // ... upsert logic based on activity ...
           })
         );
         await this.prisma.$transaction(upsertPromises);
      }
      */
    } catch (error: any) {
      this.logger.error(`Failed to refresh balances for wallet ID ${walletId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Finds a wallet by its address and network, then triggers a balance refresh.
   * This is the primary method used by the webhook controller.
   * Uses case-insensitive SQL query to handle address case variations.
   */
  async refreshBalancesByAddress(walletAddress: string, networkKey: SupportedNetwork): Promise<(TempWallet & { user: { telegram_protected_data: string | null } }) | null> {
    this.logger.log(`Webhook triggered refresh for Address: ${walletAddress}, Network: ${networkKey}`);
    
    try {
      // Use a case-insensitive lookup to handle checksum vs lowercase address forms
      const wallet = await this.prisma.tempWallet.findFirst({
        where: {
          address: { equals: walletAddress, mode: 'insensitive' },
          network_key: networkKey,
          deleted_at: null,
        },
        include: {
          user: {
            select: {
              id: true,
              telegram_protected_data: true,
            },
          },
        },
      });

      // ✅ Fixed: Just check if wallet is null
      if (!wallet) {
        this.logger.log(`Webhook received for untracked wallet: ${walletAddress} on ${networkKey}. Ignoring.`);
        return null;
      }

      // Enhanced logging with user context
      this.logger.log(`Webhook triggered refresh for Address: ${walletAddress}, Network: ${networkKey}, User ID: ${wallet.user?.id || 'unknown'}, Wallet ID: ${wallet.id}`);

      await this.refreshBalances(wallet.id);
      this.logger.log(`Successfully processed balance refresh for wallet: ${wallet.id} (Address: ${wallet.address})`);
      
      return wallet;
    } catch (error: any) {
      this.logger.error(`Failed to refresh balances for ${walletAddress} on ${networkKey}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Retrieves a specific wallet for a given user.
   */
  async getWalletForUser(userId: string, walletId: string): Promise<TempWallet | null> {
    return this.prisma.tempWallet.findFirst({
      where: { id: walletId, user_id: userId, deleted_at: null },
    });
  }
}