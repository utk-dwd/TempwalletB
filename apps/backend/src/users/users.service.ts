import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../types/prisma.js';
import { ConfigService } from '@nestjs/config';
import { TelegramRegistrationPayload } from '../types/shared.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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

  async registerTelegram(userId: string, payload: TelegramRegistrationPayload): Promise<void> {
    try {
      if (!payload.chatId || typeof payload.chatId !== 'string') {
        throw new Error('Invalid Telegram Chat ID');
      }
      // Dynamically import ESM-only iExec dataprotector when needed
      const { IExecDataProtectorCore, getWeb3Provider } = await import('@iexec/dataprotector');
      const privateKey = this.configService.get<string>('IEXEC_BACKEND_PRIVATE_KEY');
      if (!privateKey) {
        this.logger.error('IEXEC_BACKEND_PRIVATE_KEY not found');
        throw new Error('IEXEC_BACKEND_PRIVATE_KEY is required');
      }
      const dataProtector = new IExecDataProtectorCore(getWeb3Provider(privateKey));

      const protectedData = await dataProtector.protectData({
        data: { telegram_chatId: payload.chatId },
        name: `Telegram Chat ID for user ${userId}`,
        onStatusUpdate: ({ title, isDone }) => {
          this.logger.log(`ProtectData status: ${title} - ${isDone ? 'Done' : 'In progress'}`);
        },
      });
      const backendWallet = this.configService.get<string>('IEXEC_BACKEND_WALLET_ADDRESS');
      const appAddress = this.configService.get<string>('IEXEC_APP_ADDRESS') || '0x192C6f5AccE52c81Fcc2670f10611a3665AAA98F';
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
      await this.prisma.user.update({
        where: { id: userId },
        data: { telegram_protected_data: protectedData.address },
      });
      this.logger.log(`Telegram registration completed for user ${userId}: protectedData ${protectedData.address}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to register Telegram for user ${userId}: ${err.message}`, err.stack);
      throw error;
    }
  }
}