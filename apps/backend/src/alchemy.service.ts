import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Alchemy, Network } from 'alchemy-sdk';
import { SupportedNetwork, NETWORKS } from '@tempwallet/shared';

@Injectable()
export class AlchemyService implements OnModuleInit {
  private readonly logger = new Logger(AlchemyService.name);
  private alchemyInstances: Map<SupportedNetwork, Alchemy> = new Map();
  private webhookIds: Map<SupportedNetwork, string> = new Map();

  constructor(private readonly configService: ConfigService) {
    // Initialize webhook IDs from environment variables (per-network)
    this.webhookIds.set(SupportedNetwork.Avalanche, this.configService.get<string>('ALCHEMY_WEBHOOK_ID_AVALANCHE') || '');
    this.webhookIds.set(SupportedNetwork.Ethereum, this.configService.get<string>('ALCHEMY_WEBHOOK_ID_ETHEREUM') || '');
    this.webhookIds.set(SupportedNetwork.Base, this.configService.get<string>('ALCHEMY_WEBHOOK_ID_BASE') || '');
    this.webhookIds.set(SupportedNetwork.Arbitrum, this.configService.get<string>('ALCHEMY_WEBHOOK_ID_ARBITRUM') || '');

    // Initialize Alchemy instances for each network
    const supportedNetworks = Object.keys(NETWORKS) as SupportedNetwork[];
    for (const networkKey of supportedNetworks) {
      try {
        const apiKey = this.configService.get<string>(`ALCHEMY_API_KEY_${networkKey.toUpperCase()}`) || this.configService.get<string>('ALCHEMY_API_KEY');
        const authToken = this.configService.get<string>(`ALCHEMY_AUTH_TOKEN_${networkKey.toUpperCase()}`) || this.configService.get<string>('ALCHEMY_AUTH_TOKEN');
        const alchemyNetwork = this.mapToAlchemyNetwork(networkKey);

        if (!apiKey) {
          this.logger.warn(`No Alchemy API key for ${networkKey}. Skipping initialization for that network.`);
          continue;
        }

        const instance = new Alchemy({ apiKey, authToken, network: alchemyNetwork });
        this.alchemyInstances.set(networkKey, instance);
        this.logger.log(`Initialized Alchemy SDK for ${networkKey}`);
      } catch (err) {
        this.logger.error(`Failed to initialize Alchemy for network ${networkKey}: ${err}`);
      }
    }
  }

  onModuleInit() {
    // no-op; initialization done in constructor to allow throwing early if required
  }

  private mapToAlchemyNetwork(networkKey: SupportedNetwork): Network {
    switch (networkKey) {
      case SupportedNetwork.Avalanche:
        return Network.AVAX_MAINNET;
      case SupportedNetwork.Ethereum:
        return Network.ETH_MAINNET;
      case SupportedNetwork.Base:
        return Network.BASE_MAINNET;
      case SupportedNetwork.Arbitrum:
        return Network.ARB_MAINNET;
      default:
        throw new Error(`Unsupported network for Alchemy SDK: ${networkKey}`);
    }
  }

  private async getCurrentWebhookAddresses(alchemy: Alchemy, webhookId: string): Promise<string[]> {
    try {
      const response = await alchemy.notify.getAllWebhooks();
      const specificWebhook = response.webhooks.find(wh => wh.id === webhookId);
      if (specificWebhook && 'addresses' in specificWebhook) {
        return (specificWebhook as any).addresses || [];
      }
      return [];
    } catch (error) {
      this.logger.error('Error fetching webhook addresses:', error as any);
      return [];
    }
  }

  async addAddressToWebhook(address: string, networkKey: SupportedNetwork): Promise<void> {
    const alchemy = this.alchemyInstances.get(networkKey);
    const webhookId = this.webhookIds.get(networkKey);

    if (!alchemy) {
      this.logger.error(`No Alchemy instance found for network: ${networkKey}.`);
      return;
    }

    if (!webhookId) {
      this.logger.error(`No Webhook ID configured for network: ${networkKey}.`);
      return;
    }

    try {
      await alchemy.notify.updateWebhook(webhookId, {
        addAddresses: [address.toLowerCase()],
      });
      this.logger.log(`Successfully added ${address} to ${networkKey} webhook (${webhookId})`);
    } catch (error: any) {
      this.logger.error(`Failed to add address ${address} to ${networkKey} webhook (${webhookId}): ${error.message}`, error.stack);
    }
  }

  async removeAddressFromWebhook(address: string, networkKey: SupportedNetwork): Promise<void> {
    const alchemy = this.alchemyInstances.get(networkKey);
    const webhookId = this.webhookIds.get(networkKey);

    if (!alchemy) {
      this.logger.error(`No Alchemy instance found for network: ${networkKey}.`);
      return;
    }

    if (!webhookId) {
      this.logger.error(`No Webhook ID configured for network: ${networkKey}.`);
      return;
    }

    try {
      await alchemy.notify.updateWebhook(webhookId, {
        removeAddresses: [address.toLowerCase()],
      });
      this.logger.log(`Successfully removed ${address} from ${networkKey} webhook (${webhookId})`);
    } catch (error: any) {
      this.logger.error(`Failed to remove address ${address} from ${networkKey} webhook (${webhookId}): ${error.message}`, error.stack);
    }
  }
}
