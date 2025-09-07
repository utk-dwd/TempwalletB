// apps/backend/src/webhooks/webhooks.controller.ts
import { Controller, Post, Body, HttpCode, Header, Logger } from '@nestjs/common';
import { BalancesService } from '../balances/balances.service.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';
import { IexecService } from '../iexec/iexec.service.js';
import { SupportedNetwork } from '../types/shared.js';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private processedTxHashes = new Set<string>(); // In-memory deduplication

  constructor(
    private readonly balancesService: BalancesService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly iexecService: IexecService,
  ) {}

  private mapAlchemyNetworkToEnum(network: string): SupportedNetwork | null {
    switch (network) {
      case 'AVALANCHE_MAINNET':
      case 'AVAX_MAINNET':
        return SupportedNetwork.Avalanche;
      case 'ETH_MAINNET':
        return SupportedNetwork.Ethereum;
      case 'BASE_MAINNET':
        return SupportedNetwork.Base;
      case 'ARB_MAINNET':
        return SupportedNetwork.Arbitrum;
      default:
        this.logger.warn(`Unknown Alchemy network: ${network}`);
        return null;
    }
  }

  @Post('alchemy-activity')
  @HttpCode(200)
  @Header('Content-Type', 'application/json')
  async handleAlchemyWebhook(@Body() payload: any) {
    this.logger.log('Received webhook from Alchemy', JSON.stringify(payload, null, 2));

    const activities = payload.event?.activity;
    const network = payload.event?.network;

    if (activities && Array.isArray(activities) && network) {
      const networkKey = this.mapAlchemyNetworkToEnum(network);
      if (!networkKey) {
        this.logger.log(`Unsupported network: ${network}. Ignoring.`);
        return { status: 'received_unsupported_network' };
      }

      activities.forEach(async (activity, index) => {
        try {
          this.logger.debug(`Processing activity ${index + 1}/${activities.length}`, activity);
          const toAddress = activity.toAddress; // Keep original case - no lowercase conversion
          const txHash = activity.hash;

          // Skip if transaction hash was already processed
          if (this.processedTxHashes.has(txHash)) {
            this.logger.debug(`Skipping duplicate transaction: ${txHash}`);
            return;
          }

          if (toAddress && (activity.category === 'token' || activity.category === 'internal' || activity.category === 'external')) {
            let tokenInfo = {
              symbol: 'NATIVE',
              amount: activity.value || 0,
              decimals: activity.rawContract?.decimals || 18,
              contractAddress: null,
              name: 'Native Token',
            };

            if (activity.category === 'token') {
              tokenInfo.symbol = activity.erc20Token?.symbol || activity.rawContract?.address?.slice(0, 6) + '...';
              tokenInfo.amount = activity.value || 0;
              tokenInfo.decimals = activity.erc20Token?.decimals || activity.rawContract?.decimals || 18;
              tokenInfo.contractAddress = activity.erc20Token?.contractAddress || activity.rawContract?.address || null;
              tokenInfo.name = activity.erc20Token?.name || 'Unknown ERC20 Token';
            } else if (activity.category === 'external' || activity.category === 'internal') {
              tokenInfo.amount = activity.value || parseInt(activity.rawContract?.rawValue || '0', 16) / Math.pow(10, tokenInfo.decimals);
              tokenInfo.decimals = activity.rawContract?.decimals || 18;
            }

            const updatedWallet = await this.balancesService.refreshBalancesByAddress(toAddress, networkKey);

            if (updatedWallet) {
              this.notificationsGateway.sendBalanceUpdate({
                walletAddress: toAddress,
                networkKey: networkKey,
                message: `New transaction detected for wallet #${updatedWallet.wallet_number}`,
                token: tokenInfo,
                transactionHash: activity.hash,
                fromAddress: activity.fromAddress,
                category: activity.category,
              });
              this.logger.log(`Balance update notification sent for ${toAddress} on ${networkKey}`);

              try {
                const protectedData = updatedWallet.user.telegram_protected_data;
                if (protectedData) {
                  this.logger.log(`Sending Telegram notification for wallet ${toAddress} to protectedData ${protectedData}`);
                  
                  // Format the message with better formatting
                  const messageContent = `🔔 New Transaction on ${networkKey}!\n\n` +
                                         `💰 Amount: ${tokenInfo.amount} ${tokenInfo.symbol}\n` +
                                         `📬 To: ${toAddress.slice(0, 10)}...${toAddress.slice(-8)}\n` +
                                         `📤 From: ${activity.fromAddress?.slice(0, 10)}...${activity.fromAddress?.slice(-8)}\n` +
                                         `🔗 TxHash: ${activity.hash?.slice(0, 10)}...${activity.hash?.slice(-8)}\n` +
                                         `📋 Type: ${activity.category}`;
                  
                  // Send via iExec with error handling
                  const response = await this.iexecService.sendMessage({
                    protectedData,
                    senderName: 'TempWallet Alert',
                    telegramContent: messageContent,
                    useVoucher: true,
                  });
                  this.logger.log(`iExec Telegram notification sent for wallet ${toAddress}. Task ID: ${response.taskId}`);
                  // Mark transaction as processed
                  this.processedTxHashes.add(txHash);
                } else {
                  this.logger.debug(`Wallet ${toAddress} owner has not registered Telegram notifications.`);
                }
              } catch (iexecError) {
                const err = iexecError as Error;
                this.logger.error(`Failed to send iExec Telegram notification for wallet ${toAddress}: ${err.message}`);
              }
            } else {
              this.logger.debug(`Activity for ${toAddress} on ${networkKey} received, but wallet not found in DB.`);
            }
          } else {
            this.logger.debug(`Activity ${index + 1} ignored (not incoming funds or unsupported category)`, activity);
          }
        } catch (err) {
          const error = err as Error;
          this.logger.error(`Error processing activity ${index + 1} for ${networkKey}: ${error.message}`);
        }
      });
      this.logger.log(`Finished processing ${activities.length} activities for network ${networkKey}`);
    } else {
      this.logger.warn('Received Alchemy webhook with missing or invalid activities/network data.', { activities, network });
    }

    return { status: 'received' };
  }
}

