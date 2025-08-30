// apps/backend/src/iexec/iexec.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IExecWeb3telegram, SendTelegramParams, SendTelegramResponse } from '@iexec/web3telegram';
import { IExecDataProtectorCore, getWeb3Provider } from '@iexec/dataprotector';
import { IExec } from 'iexec';
import { Wallet } from 'ethers';

@Injectable()
export class IexecService implements OnModuleInit {
  private readonly logger = new Logger(IexecService.name);
  private web3telegram: IExecWeb3telegram;
  private dataProtector: IExecDataProtectorCore;
  private iexec: IExec;
  private web3Provider: Wallet; // Add class property
  private isInitialized = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeIExec();
  }

  private async initializeIExec() {
    try {
      const privateKey = this.configService.get<string>('IEXEC_BACKEND_PRIVATE_KEY');
      if (!privateKey) {
        this.logger.error('IEXEC_BACKEND_PRIVATE_KEY not found. iExec notifications disabled.');
        throw new Error('IEXEC_BACKEND_PRIVATE_KEY is required');
      }

      this.web3Provider = getWeb3Provider(privateKey); // Store as class property
      this.web3telegram = new IExecWeb3telegram(this.web3Provider);
      this.dataProtector = new IExecDataProtectorCore(this.web3Provider);
      this.iexec = new IExec({ ethProvider: this.web3Provider });

      const voucherAddress = this.configService.get<string>('IEXEC_VOUCHER_ADDRESS');
      if (voucherAddress) {
        await this.iexec.account.approve(voucherAddress, "1000000");
        this.logger.log(`Approved voucher ${voucherAddress}`);
      }

      this.isInitialized = true;
      const address = await this.web3Provider.getAddress();
      this.logger.log(`Connected with wallet: ${address}`);
    } catch (error) {
      this.logger.error(`Failed to initialize iExec: ${error.message}`, error.stack);
      throw new Error('iExec initialization failed');
    }
  }

  async sendMessage(sendParams: SendTelegramParams): Promise<SendTelegramResponse> {
    if (!this.isInitialized) {
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
        const address = await this.web3Provider.getAddress();
        const { stake } = await this.iexec.account.checkBalance(address);
        const sRLC = stake.toString(); // Convert BN to string
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
      this.logger.log(`Track task: https://explorer.iex.ec/bellecour/task/${response.taskId}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send Telegram message: ${error.message}`, error.stack);
      throw error;
    }
  }

  async hasUserGrantedAccess(userAddress: string, protectedData: string): Promise<boolean> {
    if (!this.isInitialized) return false;
    try {
      const appAddress = this.configService.get<string>('IEXEC_APP_ADDRESS') || '0x192C6f5AccE52c81Fcc2670f10611a3665AAA98F';
      const grantedAccess = await this.dataProtector.getGrantedAccess({
        protectedData,
        authorizedApp: appAddress,
        authorizedUser: userAddress,
      });
      return !!grantedAccess;
    } catch (error) {
      this.logger.error(`Error checking granted access for user ${userAddress}: ${error.message}`, error.stack);
      return false;
    }
  }

  async checkBalance(): Promise<string> {
    if (!this.isInitialized) throw new Error('iExec service not initialized');
    const address = await this.web3Provider.getAddress();
    const { stake } = await this.iexec.account.checkBalance(address);
    return stake.toString(); // Convert BN to string
  }
}