// src/notifications/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TempWallet } from '../types/prisma.js';
import { SupportedNetwork } from '../types/shared.js'; // Import SupportedNetwork enum

// Lightning Network notification types
interface LightningNotificationPayload {
  type: LightningNotificationType;
  recipientAddress: string;
  senderAddress?: string;
  channelId?: string;
  channelNumber?: string;
  amount?: number;
  message: string;
  data?: any;
  timestamp: string;
}

enum LightningNotificationType {
  CHANNEL_INVITATION = '⚡ Channel invitation received',
  CHANNEL_ACCEPTED = '✅ Channel accepted',
  PAYMENT_RECEIVED = '💰 Payment received',
  PAYMENT_SENT = '💸 Payment sent',
  PAYMENT_REQUESTED = '🙏 Payment requested',
  REQUEST_ACCEPTED = '✅ Request accepted',
  REQUEST_DECLINED = '❌ Request declined',
  MARGIN_REFILLED = '⛽ Margin refilled',
  TRANSACTION_PROCESSING = '⏳ Transaction processing...'
}

// Define the shape of our balance update message
// --- UPDATED INTERFACE ---
interface BalanceUpdatePayload {
  walletAddress: string;
  networkKey: SupportedNetwork; // Use the enum for stronger typing
  message: string;
  // --- ADD NEW PROPERTIES ---
  token?: {
    symbol: string;
    amount: number | string; // Can be number from Alchemy, string if formatted
    decimals: number;
    contractAddress: string | null;
    name: string;
  };
  transactionHash?: string;
  fromAddress?: string;
  category?: string; // 'external', 'internal', 'token'
  // --- END ADD NEW PROPERTIES ---
}
// --- END UPDATED INTERFACE ---

@WebSocketGateway({
  cors: {
    origin: '*', // IMPORTANT: In production, change this to your frontend's URL
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_wallet')
  handleSubscribe(
    @MessageBody() walletAddress: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (walletAddress && typeof walletAddress === 'string') {
      const roomName = walletAddress.toLowerCase();
      client.join(roomName);
      console.log(`Client ${client.id} subscribed to room: ${roomName}`);
    }
  }

  // This function will be called by our webhook controller to send updates
  // --- UPDATED METHOD SIGNATURE AND LOGGING ---
  sendBalanceUpdate(payload: BalanceUpdatePayload) {
    const roomName = payload.walletAddress.toLowerCase();
    // Emits the event ONLY to clients in that room
    this.server.to(roomName).emit('balance_update', payload);
    // --- ENHANCED LOGGING ---
    console.log(
      `Sent 'balance_update' to room: ${roomName} | ` +
      `Network: ${payload.networkKey} | ` +
      `TxHash: ${payload.transactionHash} | ` +
      `Token: ${payload.token?.symbol || 'NATIVE'} (${payload.token?.amount}) | ` +
      `From: ${payload.fromAddress} | ` +
      `Category: ${payload.category}`
    );
    // --- END ENHANCED LOGGING ---
  }
  // --- END UPDATED METHOD ---

  broadcastWalletsUpdated(wallets: TempWallet[]) {
    this.server.emit('wallets_updated', wallets);
    console.log("Broadcasted 'wallets_updated' to all clients.");
  }

  // Lightning Network notification methods
  sendLightningNotification(payload: LightningNotificationPayload) {
    const roomName = payload.recipientAddress.toLowerCase();
    this.server.to(roomName).emit('lightning_notification', payload);
    console.log(
      `⚡ Lightning notification sent to ${roomName}: ${payload.type} | ${payload.message}`
    );
  }

  // Channel invitation notification
  notifyChannelInvitation(recipientAddress: string, senderAddress: string, channelData: any) {
    this.sendLightningNotification({
      type: LightningNotificationType.CHANNEL_INVITATION,
      recipientAddress,
      senderAddress,
      channelId: channelData.id,
      channelNumber: channelData.channelNumber,
      message: `New Lightning channel invitation from ${senderAddress.slice(0, 8)}...`,
      data: channelData,
      timestamp: new Date().toISOString()
    });
  }

  // Channel accepted notification
  notifyChannelAccepted(originalCreatorAddress: string, acceptorAddress: string, channelData: any) {
    this.sendLightningNotification({
      type: LightningNotificationType.CHANNEL_ACCEPTED,
      recipientAddress: originalCreatorAddress,
      senderAddress: acceptorAddress,
      channelId: channelData.id,
      channelNumber: channelData.channelNumber,
      message: `Channel ${channelData.channelNumber} accepted and is now active!`,
      data: channelData,
      timestamp: new Date().toISOString()
    });
  }

  // Payment received notification
  notifyPaymentReceived(recipientAddress: string, senderAddress: string, amount: number, channelNumber: string) {
    this.sendLightningNotification({
      type: LightningNotificationType.PAYMENT_RECEIVED,
      recipientAddress,
      senderAddress,
      amount,
      channelNumber,
      message: `💰 Received ${amount} BASE from ${senderAddress.slice(0, 8)}...`,
      timestamp: new Date().toISOString()
    });
  }

  // Payment sent confirmation
  notifyPaymentSent(senderAddress: string, recipientAddress: string, amount: number, channelNumber: string) {
    this.sendLightningNotification({
      type: LightningNotificationType.PAYMENT_SENT,
      recipientAddress: senderAddress,
      senderAddress,
      amount,
      channelNumber,
      message: `💸 Sent ${amount} BASE to ${recipientAddress.slice(0, 8)}...`,
      timestamp: new Date().toISOString()
    });
  }

  // Payment request notification
  notifyPaymentRequest(recipientAddress: string, senderAddress: string, amount: number, reason: string, requestId: string) {
    this.sendLightningNotification({
      type: LightningNotificationType.PAYMENT_REQUESTED,
      recipientAddress,
      senderAddress,
      amount,
      message: `🙏 Payment request: ${amount} BASE for "${reason}"`,
      data: { requestId, reason },
      timestamp: new Date().toISOString()
    });
  }

  // Request accepted notification
  notifyRequestAccepted(originalRequesterAddress: string, acceptorAddress: string, amount: number) {
    this.sendLightningNotification({
      type: LightningNotificationType.REQUEST_ACCEPTED,
      recipientAddress: originalRequesterAddress,
      senderAddress: acceptorAddress,
      amount,
      message: `✅ Payment request accepted! Received ${amount} BASE`,
      timestamp: new Date().toISOString()
    });
  }

  // Request declined notification
  notifyRequestDeclined(originalRequesterAddress: string, declinerAddress: string, amount: number) {
    this.sendLightningNotification({
      type: LightningNotificationType.REQUEST_DECLINED,
      recipientAddress: originalRequesterAddress,
      senderAddress: declinerAddress,
      amount,
      message: `❌ Payment request for ${amount} BASE was declined`,
      timestamp: new Date().toISOString()
    });
  }

  // Transaction processing notification (for 4-second timer)
  notifyTransactionProcessing(userAddress: string, amount: number, otherUserAddress: string) {
    this.sendLightningNotification({
      type: LightningNotificationType.TRANSACTION_PROCESSING,
      recipientAddress: userAddress,
      amount,
      message: `⏳ Processing payment of ${amount} BASE...`,
      data: { otherUser: otherUserAddress },
      timestamp: new Date().toISOString()
    });
  }

  // Margin refilled notification
  notifyMarginRefilled(userAddress: string, amount: number, channelNumber: string) {
    this.sendLightningNotification({
      type: LightningNotificationType.MARGIN_REFILLED,
      recipientAddress: userAddress,
      amount,
      channelNumber,
      message: `⛽ Added ${amount} BASE to channel ${channelNumber}`,
      timestamp: new Date().toISOString()
    });
  }

  // Subscribe to Lightning notifications for a specific wallet
  @SubscribeMessage('subscribe_lightning')
  handleLightningSubscribe(
    @MessageBody() walletAddress: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (walletAddress && typeof walletAddress === 'string') {
      const roomName = walletAddress.toLowerCase();
      client.join(roomName);
      console.log(`⚡ Client ${client.id} subscribed to Lightning notifications for: ${roomName}`);
    }
  }
}