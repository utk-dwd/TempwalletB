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
import { TempWallet } from '@tempwallet/prisma';
import { SupportedNetwork } from '@tempwallet/shared'; // Import SupportedNetwork enum

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
}