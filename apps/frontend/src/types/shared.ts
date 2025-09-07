export interface TelegramRegistrationPayload {
  chatId: string;
  protectedData: string;
}

export enum SupportedNetwork {
  Ethereum = 'ethereum',
  Avalanche = 'avalanche',
  Base = 'base',
  Arbitrum = 'arbitrum'
}

// Add any other types frontend needs
