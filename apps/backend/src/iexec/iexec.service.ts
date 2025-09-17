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

      // Handle SSL/TLS issues in production
      if (process.env.NODE_ENV === 'production' && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
        this.logger.warn('Production environment detected. If SSL errors occur, consider setting NODE_TLS_REJECT_UNAUTHORIZED=0');
      }

      this.logger.debug('Attempting to load @iexec/dataprotector');
      const { IExecDataProtectorCore, getWeb3Provider: getWeb3ProviderDataProtector } = await import('@iexec/dataprotector').catch(
        (err) => {
          this.logger.error('Failed to import @iexec/dataprotector:', err.message, err.stack);
          throw err;
        },
      );
      this.logger.debug('Successfully loaded @iexec/dataprotector');

      this.logger.debug('Attempting to load @iexec/web3telegram');
      const { IExecWeb3telegram, getWeb3Provider } = await import('@iexec/web3telegram').catch((err) => {
        this.logger.error('Failed to import @iexec/web3telegram:', err.message, err.stack);
        throw err;
      });
      this.logger.debug('Successfully loaded @iexec/web3telegram');
      
      
      const dataProtectorProvider = getWeb3ProviderDataProtector(privateKey);
      
   
      this.web3Provider = getWeb3Provider(privateKey);


      this.web3telegram = new IExecWeb3telegram(this.web3Provider, {
        dappWhitelistAddress: '0x53AFc09a647e7D5Fa9BDC784Eb3623385C45eF89',
      });
      

      this.dataProtector = new IExecDataProtectorCore(dataProtectorProvider);

      this.isInitialized = true;
      const address = await this.web3Provider.getAddress();
      this.logger.log(`Connected with wallet: ${address} on Arbitrum network`);
      
      // Verify network connectivity
      try {
        const network = await this.web3Provider.provider?.getNetwork();
        this.logger.log(`Network confirmed: Chain ID ${network?.chainId}`);
      } catch (networkError) {
        this.logger.warn('Could not verify network, but continuing initialization');
      }
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
    if (!sendParams.protectedData || !sendParams.telegramContent) {
      throw new Error('Missing required parameters: protectedData, telegramContent');
    }
    if (Buffer.from(sendParams.telegramContent).length > 512 * 1024) {
      throw new Error('telegramContent exceeds 512 KB limit');
    }

    try {
      this.logger.log(`Sending Telegram message to protectedData: ${sendParams.protectedData}`);
      
      // KISS: Fetch contacts first to verify access (from official iExec example)
      const contacts = await this.web3telegram.fetchMyContacts();
      this.logger.log(`Found ${contacts.length} contacts`);
      
      if (contacts.length === 0) {
        throw new Error("No contacts available. Ensure you have been granted access to protected data.");
      }
      
      // FIXED: Case-insensitive comparison (KISS principle)
      const targetContact = contacts.find(contact => 
        contact.address.toLowerCase() === sendParams.protectedData.toLowerCase()
      );
      
      if (!targetContact) {
        this.logger.error(`Protected data ${sendParams.protectedData} not found in contacts. Available contacts: ${contacts.map(c => c.address).join(', ')}`);
        throw new Error(`No access to protected data ${sendParams.protectedData}. Contact not found in authorized list.`);
      }
      
      this.logger.log(`Contact verified. Sending message to: ${targetContact.address}`);
      
      // Follow official iExec example - use verified contact address
      const response = await this.web3telegram.sendTelegram({
        protectedData: targetContact.address,
        telegramContent: sendParams.telegramContent,
        senderName: sendParams.senderName || 'TempWallet', // REQUIRED parameter
        workerpoolMaxPrice: (sendParams.workerpoolMaxPrice ?? 0.1) * 1e9, // Convert to nRLC
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
      const appAddress = this.configService.get<string>('IEXEC_APP_ADDRESS') || '0x53AFc09a647e7D5Fa9BDC784Eb3623385C45eF89';
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

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}