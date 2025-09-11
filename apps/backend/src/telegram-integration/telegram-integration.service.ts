import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AlchemyService } from '../alchemy.service.js';
import { SupportedNetwork } from '../types/shared.js';

@Injectable()
export class TelegramIntegrationService {
  private readonly logger = new Logger(TelegramIntegrationService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly alchemyService: AlchemyService,
  ) {}

  /**
   * Registers all existing wallets for a user with Alchemy webhooks
   * This is called when a user first connects their Telegram chat ID
   */
  async registerUserWalletsWithAlchemy(userId: string): Promise<void> {
    this.logger.log(`Starting retroactive wallet registration for user: ${userId}`);
    
    try {
      // Fetch all existing wallets for this user (including soft-deleted ones for completeness)
      const userWallets = await this.prismaService.tempWallet.findMany({
        where: {
          user_id: userId,
          deleted_at: null, // Only register active wallets
        },
        select: {
          id: true,
          address: true,
          network_key: true,
          wallet_number: true,
        },
      });

      if (userWallets.length === 0) {
        this.logger.log(`No existing wallets found for user: ${userId}`);
        return;
      }

      this.logger.log(`Found ${userWallets.length} existing wallets for user ${userId}. Starting Alchemy registration...`);

      let successCount = 0;
      let failureCount = 0;

      // Register each wallet with Alchemy webhook for its network
      for (const wallet of userWallets) {
        try {
          await this.alchemyService.addAddressToWebhook(
            wallet.address,
            wallet.network_key as SupportedNetwork
          );
          
          successCount++;
          this.logger.log(
            `Successfully registered wallet ${wallet.wallet_number} (${wallet.address}) on ${wallet.network_key} with Alchemy for user ${userId}`
          );
        } catch (error) {
          failureCount++;
          this.logger.error(
            `Failed to register wallet ${wallet.wallet_number} (${wallet.address}) on ${wallet.network_key} with Alchemy for user ${userId}:`,
            error
          );
          // Continue with other wallets even if one fails
        }
      }

      this.logger.log(
        `Completed retroactive wallet registration for user ${userId}. ` +
        `Success: ${successCount}, Failures: ${failureCount}, Total: ${userWallets.length}`
      );

    } catch (error) {
      this.logger.error(
        `Critical error during retroactive wallet registration for user ${userId}:`,
        error
      );
      // Don't throw - this shouldn't break the main telegram registration flow
    }
  }

  /**
   * Utility method to check if this is the user's first telegram registration
   */
  async isFirstTelegramRegistration(userId: string, newProtectedData: string): Promise<boolean> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { telegram_protected_data: true },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found during telegram registration check`);
        return false;
      }

      // If telegram_protected_data was null/empty and now we're setting it
      const isFirstTime = !user.telegram_protected_data && !!newProtectedData;
      
      this.logger.log(
        `Telegram registration check for user ${userId}: ` +
        `Previous data: ${user.telegram_protected_data ? 'EXISTS' : 'NULL'}, ` +
        `New data: ${newProtectedData ? 'EXISTS' : 'NULL'}, ` +
        `Is first time: ${isFirstTime}`
      );

      return isFirstTime;
    } catch (error) {
      this.logger.error(`Error checking first telegram registration for user ${userId}:`, error);
      return false; // Safe default - don't trigger retroactive registration on error
    }
  }
}
