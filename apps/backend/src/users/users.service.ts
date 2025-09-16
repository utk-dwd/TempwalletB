import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../types/prisma.js';
import { ConfigService } from '@nestjs/config';
import { TelegramRegistrationPayload } from '../types/shared.js';
import { TelegramIntegrationService } from '../telegram-integration/telegram-integration.service.js';
import { IexecService } from '../iexec/iexec.service.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly telegramIntegrationService: TelegramIntegrationService,
    private readonly iexecService: IexecService,
  ) {}

  async findOneByMetamaskAddress(metamask_address: string) {
    return this.prisma.user.findUnique({
      where: { metamask_address },
      select: {
        id: true,
        metamask_address: true,
        last_login: true,
        total_wallets_created: true,
        telegram_protected_data: true, 
      },
    });
  }

  async findOneById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        metamask_address: true,
        last_login: true,
        total_wallets_created: true,
        telegram_protected_data: true,
      },
    });
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { last_login: new Date() },
    });
  }

  /**
   * Check if user has telegram registered
   */
  async getTelegramStatus(userId: string): Promise<{ isRegistered: boolean; chatId?: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { telegram_protected_data: true },
      });

      const isRegistered = !!user?.telegram_protected_data;
      
      // If registered, try to get the chat ID (for display purposes)
      let chatId: string | undefined;
      if (isRegistered && user.telegram_protected_data) {
        try {
          // Attempt to fetch chat ID from protected data (optional, for display)
          // Note: This is a simplified approach - in production you might want to store this separately
          chatId = 'registered'; // For now, just indicate it's registered
        } catch (error) {
          this.logger.warn(`Could not retrieve chat ID for user ${userId}: ${error}`);
        }
      }

      this.logger.log(`Telegram status check for user ${userId}: ${isRegistered ? 'registered' : 'not registered'}`);
      
      return { isRegistered, chatId };
    } catch (error) {
      this.logger.error(`Failed to get telegram status for user ${userId}: ${error}`);
      throw error;
    }
  }

  /**
   * Update existing telegram registration with new chat ID
   */
  async updateTelegram(userId: string, payload: TelegramRegistrationPayload): Promise<void> {
    try {
      // Check if user has existing telegram registration
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { telegram_protected_data: true },
      });

      if (!user?.telegram_protected_data) {
        throw new Error('No existing telegram registration found for this user');
      }

      if (!payload.chatId || typeof payload.chatId !== 'string') {
        throw new Error('Invalid Telegram Chat ID');
      }

      // Create new protected data with updated chat ID
      const { IExecDataProtectorCore, getWeb3Provider } = await import('@iexec/dataprotector');
      const privateKey = this.configService.get<string>('IEXEC_BACKEND_PRIVATE_KEY');
      if (!privateKey) {
        this.logger.error('IEXEC_BACKEND_PRIVATE_KEY not found');
        throw new Error('IEXEC_BACKEND_PRIVATE_KEY is required');
      }
      
      // Initialize provider and DataProtector for Arbitrum
      const ethProvider = getWeb3Provider(privateKey, {
        host: 42161, // Arbitrum One
      });
      
      const dataProtector = new IExecDataProtectorCore(ethProvider);

      const protectedData = await dataProtector.protectData({
        data: { telegram_chatId: payload.chatId },
        name: `Updated Telegram Chat ID for user ${userId}`,
        uploadMode: 'arweave',
        onStatusUpdate: ({ title, isDone }) => {
          this.logger.log(`UpdateProtectData status: ${title} - ${isDone ? 'Done' : 'In progress'}`);
        },
      });

      const backendWallet = this.configService.get<string>('IEXEC_BACKEND_WALLET_ADDRESS');
      const appAddress = this.configService.get<string>('IEXEC_APP_ADDRESS') || '0x53AFc09a647e7D5Fa9BDC784Eb3623385C45eF89';
      if (!backendWallet) {
        throw new Error('IEXEC_BACKEND_WALLET_ADDRESS not configured');
      }

      await dataProtector.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: appAddress,
        authorizedUser: backendWallet,
        pricePerAccess: 0,
        numberOfAccess: 1000,
        onStatusUpdate: ({ title, isDone }) => {
          this.logger.log(`UpdateGrantAccess status: ${title} - ${isDone ? 'Done' : 'In progress'}`);
        },
      });

      // Update user's telegram_protected_data with new address
      await this.prisma.user.update({
        where: { id: userId },
        data: { telegram_protected_data: protectedData.address },
      });

      this.logger.log(`Telegram chat ID updated for user ${userId}: protectedData ${protectedData.address}`);

      // Send update confirmation message
      try {
        const updateMessage = `🔄 TempWallets Notification Update\n\n` +
                             `Your Telegram Chat ID has been successfully updated! ` +
                             `You will continue to receive transaction notifications for all your TempWallets.\n\n` +
                             `Stay secure! 🔐`;

        const updateResponse = await this.iexecService.sendMessage({
          protectedData: protectedData.address,
          senderName: 'TempWallet Update',
          telegramContent: updateMessage,
        });

        this.logger.log(`Update confirmation message sent successfully to user ${userId}. Task ID: ${updateResponse.taskId}`);
      } catch (messageError) {
        const err = messageError as Error;
        this.logger.error(
          `Failed to send update confirmation message to user ${userId}: ${err.message}`,
          err.stack
        );
        // Don't throw here - the update was successful, confirmation message is just a bonus
      }

    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to update Telegram for user ${userId}: ${err.message}`, err.stack);
      throw error;
    }
  }

  async registerTelegram(userId: string, payload: TelegramRegistrationPayload): Promise<void> {
    try {
      if (!payload.chatId || typeof payload.chatId !== 'string') {
        throw new Error('Invalid Telegram Chat ID');
      }

      // Check if this is the user's first telegram registration
      const isFirstRegistration = await this.telegramIntegrationService.isFirstTelegramRegistration(
        userId, 
        payload.chatId
      );

      // Dynamically import ESM-only iExec dataprotector when needed
      const { IExecDataProtectorCore, getWeb3Provider } = await import('@iexec/dataprotector');
      const privateKey = this.configService.get<string>('IEXEC_BACKEND_PRIVATE_KEY');
      if (!privateKey) {
        this.logger.error('IEXEC_BACKEND_PRIVATE_KEY not found');
        throw new Error('IEXEC_BACKEND_PRIVATE_KEY is required');
      }
      
      // Initialize provider and DataProtector for Arbitrum
      const ethProvider = getWeb3Provider(privateKey, {
        host: 42161, // Arbitrum One
      });
      
      const dataProtector = new IExecDataProtectorCore(ethProvider);

      const protectedData = await dataProtector.protectData({
        data: { telegram_chatId: payload.chatId },
        name: `Telegram Chat ID for user ${userId}`,
        uploadMode: 'arweave',
        onStatusUpdate: ({ title, isDone }) => {
          this.logger.log(`ProtectData status: ${title} - ${isDone ? 'Done' : 'In progress'}`);
        },
      });
      const backendWallet = this.configService.get<string>('IEXEC_BACKEND_WALLET_ADDRESS');
      const appAddress = this.configService.get<string>('IEXEC_APP_ADDRESS') || '0x53AFc09a647e7D5Fa9BDC784Eb3623385C45eF89';
      if (!backendWallet) {
        throw new Error('IEXEC_BACKEND_WALLET_ADDRESS not configured');
      }
      await dataProtector.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: appAddress,
        authorizedUser: backendWallet,
        pricePerAccess: 0,
        numberOfAccess: 1000,
        onStatusUpdate: ({ title, isDone }) => {
          this.logger.log(`GrantAccess status: ${title} - ${isDone ? 'Done' : 'In progress'}`);
        },
      });

      // Update user's telegram_protected_data
      await this.prisma.user.update({
        where: { id: userId },
        data: { telegram_protected_data: protectedData.address },
      });

      this.logger.log(`Telegram registration completed for user ${userId}: protectedData ${protectedData.address}`);

      // Send welcome message to user's Telegram
      try {
        const welcomeMessage = `🎉 Welcome to TempWallets.com!\n\n` +
                               `Your Telegram ID is successfully registered for transaction alerts. ` +
                               `You're all set to receive notifications for your TempWallets!\n\n` +
                               `You will now be notified whenever you receive crypto in any of your TempWallets.`;

        const welcomeResponse = await this.iexecService.sendMessage({
          protectedData: protectedData.address,
          senderName: 'TempWallet Welcome',
          telegramContent: welcomeMessage,
        });

        this.logger.log(`Welcome message sent successfully to user ${userId}. Task ID: ${welcomeResponse.taskId}`);
      } catch (welcomeError) {
        const err = welcomeError as Error;
        this.logger.error(
          `Failed to send welcome message to user ${userId}: ${err.message}`,
          err.stack
        );
        // Don't throw here - the registration was successful, welcome message is just a bonus
      }

      // If this is the first time registering telegram, register all existing wallets with Alchemy
      if (isFirstRegistration) {
        this.logger.log(`First-time telegram registration detected for user ${userId}. Triggering retroactive wallet registration...`);
        
        // Run this asynchronously to avoid blocking the main telegram registration response
        this.telegramIntegrationService.registerUserWalletsWithAlchemy(userId)
          .catch((error) => {
            this.logger.error(
              `Background wallet registration failed for user ${userId} after telegram registration:`,
              error
            );
            // Don't throw here - the main telegram registration was successful
          });
      } else {
        this.logger.log(`User ${userId} has previously registered telegram. Skipping retroactive wallet registration.`);
      }

    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to register Telegram for user ${userId}: ${err.message}`, err.stack);
      throw error;
    }
  }
}