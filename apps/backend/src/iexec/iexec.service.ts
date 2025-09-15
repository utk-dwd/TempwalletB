// apps/backend/src/iexec/iexec.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IExec } from 'iexec';
import { Wallet } from 'ethers';
import { SendTelegramParams, SendTelegramResponse } from './iexec.types.js'; // Use separate types file

@Injectable()
export class IexecService implements OnModuleInit {
  private readonly logger = new Logger(IexecService.name);
  private web3telegram: any;
  private dataProtector: any;
  private iexec: IExec | null = null;
  private web3Provider: Wallet | null = null;
  private isInitialized = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeIExec();
  }

  private async initializeIExec() {
    try {
      const privateKey = this.configService.get<string>('IEXEC_BACKEND_PRIVATE_KEY');
      if (!privateKey) {
        this.logger.warn('IEXEC_BACKEND_PRIVATE_KEY not found. iExec notifications disabled.');
        return; // Allow partial initialization
      }

      this.logger.debug('Attempting to load @iexec/dataprotector');
      const { IExecDataProtectorCore, getWeb3Provider } = await import('@iexec/dataprotector').catch(
        (err) => {
          this.logger.error('Failed to import @iexec/dataprotector:', err.message, err.stack);
          throw err;
        },
      );
      this.logger.debug('Successfully loaded @iexec/dataprotector');
      this.web3Provider = getWeb3Provider(privateKey);

      this.logger.debug('Attempting to load @iexec/web3telegram');
      const { IExecWeb3telegram } = await import('@iexec/web3telegram').catch((err) => {
        this.logger.error('Failed to import @iexec/web3telegram:', err.message, err.stack);
        throw err;
      });
      this.logger.debug('Successfully loaded @iexec/web3telegram');
      this.web3telegram = new IExecWeb3telegram(this.web3Provider);
      this.dataProtector = new IExecDataProtectorCore(this.web3Provider);

      this.logger.debug('Attempting to load iexec');
      const { IExec } = await import('iexec').catch((err) => {
        this.logger.error('Failed to import iexec:', err.message, err.stack);
        throw err;
      });
      this.logger.debug('Successfully loaded iexec');
      this.iexec = new IExec({ ethProvider: this.web3Provider });

      const voucherAddress = this.configService.get<string>('IEXEC_VOUCHER_ADDRESS');
      if (voucherAddress) {
        await this.iexec.account.approve(voucherAddress, '1000000');
        this.logger.log(`Approved voucher ${voucherAddress}`);
      }

      this.isInitialized = true;
      const address = await this.web3Provider.getAddress();
      this.logger.log(`Connected with wallet: ${address}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to initialize iExec: ${err.message}`, err.stack);
      this.isInitialized = false;
      this.logger.warn('iExec initialization failed, but service will continue without iExec functionality.');
    }
  }

  async sendMessage(sendParams: SendTelegramParams): Promise<SendTelegramResponse> {
    if (!this.isInitialized || !this.web3telegram) {
      throw new Error('iExec service not initialized');
    }
    if (!sendParams.protectedData || !sendParams.senderName || !sendParams.telegramContent) {
      throw new Error('Missing required parameters: protectedData, senderName, telegramContent');
    }
    if (Buffer.from(sendParams.telegramContent).length > 512 * 1024) {
      throw new Error('telegramContent exceeds 512 KB limit');
    }

    try {
      if (!sendParams.useVoucher) {
        const address = await this.web3Provider!.getAddress();
        const { stake } = await this.iexec!.account.checkBalance(address);
        const sRLC = stake.toString();
        if (parseInt(sRLC) === 0) {
          throw new Error('Insufficient sRLC balance');
        }
      }
      this.logger.log(`Sending Telegram message to protectedData: ${sendParams.protectedData}`);
      const response = await this.web3telegram.sendTelegram({
        ...sendParams,
        useVoucher: sendParams.useVoucher ?? true,
        dataMaxPrice: sendParams.dataMaxPrice ?? 42,
        appMaxPrice: sendParams.appMaxPrice ?? 42,
        workerpoolMaxPrice: sendParams.workerpoolMaxPrice ?? 42,
      });
      this.logger.log(`Telegram message sent. Task ID: ${response.taskId}`);
      this.logger.log(`Track task: https://explorer.iex.ec/arbitrum-mainnet/task/${response.taskId}`);
      return response;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to send Telegram message: ${err.message}`, err.stack);
      throw error;
    }
  }

  async hasUserGrantedAccess(userAddress: string, protectedData: string): Promise<boolean> {
    if (!this.isInitialized || !this.dataProtector) {
      this.logger.warn('iExec service not initialized; returning false for access check');
      return false;
    }
    try {
      const appAddress = this.configService.get<string>('IEXEC_APP_ADDRESS') || '0xb1C58D942BDD6890FB2945e78ff482280955c8C7';
      const grantedAccess = await this.dataProtector.getGrantedAccess({
        protectedData,
        authorizedApp: appAddress,
        authorizedUser: userAddress,
      });
      return !!grantedAccess;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error checking granted access for user ${userAddress}: ${err.message}`, err.stack);
      return false;
    }
  }

  async checkBalance(): Promise<string> {
    if (!this.isInitialized || !this.iexec) {
      throw new Error('iExec service not initialized');
    }
    const address = await this.web3Provider!.getAddress();
    const { stake } = await this.iexec.account.checkBalance(address);
    return stake.toString();
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}