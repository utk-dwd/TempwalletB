import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ChannelStatus, TransactionType, RequestStatus } from '@prisma/client';
import { CreateChannelDto, SendPaymentDto, PaymentRequestDto } from './dto/index.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';

@Injectable()
export class LightningService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway
  ) {}

  // --- UI-only Settlement (in-memory prototype) ---
  private settlementStates: Map<string, {
    channelId: string;
    user1Address: string;
    user2Address: string;
    user1Initial: number;
    user2Initial: number;
    approvals: Record<string, boolean>; // addressLower -> approved
    status: 'OPEN' | 'CANCELLED' | 'FINALIZED';
    updatedAt: number;
  }> = new Map();

  async openSettlement(channelId: string, openedBy: string) {
    const channel = await this.prisma.lightningChannel.findUnique({ where: { id: channelId } });
    if (!channel) throw new NotFoundException('Channel not found');
    if (channel.status !== ChannelStatus.ACTIVE) throw new BadRequestException('Channel not active');
    const state = {
      channelId,
      user1Address: channel.user1Address,
      user2Address: channel.user2Address,
      user1Initial: channel.user1MarginLeft,
      user2Initial: channel.user2MarginLeft,
      approvals: {},
      status: 'OPEN' as const,
      updatedAt: Date.now()
    };
    this.settlementStates.set(channelId, state);
    return state;
  }

  async approveSettlement(channelId: string, address: string) {
    const state = this.settlementStates.get(channelId);
    if (!state) throw new NotFoundException('Settlement not open');
    if (state.status !== 'OPEN') return state;
    const addr = (address || '').toLowerCase();
    state.approvals[addr] = true;
    const u1 = state.user1Address.toLowerCase();
    const u2 = state.user2Address.toLowerCase();
    if (state.approvals[u1] && state.approvals[u2]) {
      state.status = 'FINALIZED';
      // Persistently close the channel to allow new channels between the same users
      try {
        await this.prisma.lightningChannel.update({
          where: { id: channelId },
          data: { status: ChannelStatus.CLOSED }
        });
      } catch (e) {
        // If the channel was already closed or missing, ignore
      }
    }
    state.updatedAt = Date.now();
    return state;
  }

  async cancelSettlement(channelId: string) {
    const state = this.settlementStates.get(channelId);
    if (!state) return { status: 'NONE' } as any;
    state.status = 'CANCELLED';
    state.updatedAt = Date.now();
    return state;
  }

  async getSettlement(channelId: string) {
    const state = this.settlementStates.get(channelId);
    if (!state) return { status: 'NONE' } as any;
    return state;
  }

  // Force-close a channel (dev utility)
  async closeChannel(channelId: string) {
    const channel = await this.prisma.lightningChannel.findUnique({ where: { id: channelId } });
    if (!channel) throw new NotFoundException('Channel not found');
    if (channel.status === ChannelStatus.CLOSED) return channel;
    return this.prisma.lightningChannel.update({ where: { id: channelId }, data: { status: ChannelStatus.CLOSED } });
  }

  // Force-close any PENDING/ACTIVE channel between two users (dev utility)
  async closeBetween(user1Address: string, user2Address: string) {
    const res = await this.prisma.lightningChannel.updateMany({
      where: {
        OR: [
          { user1Address, user2Address },
          { user1Address: user2Address, user2Address: user1Address },
        ],
        status: { in: [ChannelStatus.PENDING, ChannelStatus.ACTIVE] }
      },
      data: { status: ChannelStatus.CLOSED }
    });
    return { closedCount: res.count };
  }

  // Generate unique channel number
  private generateChannelNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `LC${timestamp}${random}`.toUpperCase();
  }

  // Create Lightning Channel
  async createChannel(createChannelDto: CreateChannelDto) {
    const { user1Address, user2Address, user1Margin, user2Margin } = createChannelDto;

    // Validate users can't create channel with themselves
    if (user1Address === user2Address) {
      throw new BadRequestException('Cannot create channel with yourself');
    }

    // Check if channel already exists between these users
    const existingChannel = await this.prisma.lightningChannel.findFirst({
      where: {
        OR: [
          { user1Address, user2Address },
          { user1Address: user2Address, user2Address: user1Address }
        ],
        status: { in: ['PENDING', 'ACTIVE'] }
      }
    });

    if (existingChannel) {
      throw new BadRequestException('Channel already exists between these users');
    }

    // Create new channel
    const channel = await this.prisma.lightningChannel.create({
      data: {
        channelNumber: this.generateChannelNumber(),
        user1Address,
        user2Address,
        user1MarginLeft: user1Margin,
        user2MarginLeft: user2Margin,
        status: ChannelStatus.PENDING
      }
    });

    // Send real-time notification to user2
    this.notificationsGateway.notifyChannelInvitation(user2Address, user1Address, channel);

    return channel;
  }

  // Accept channel invitation
  async acceptChannel(channelId: string, userAddress: string) {
    const channel = await this.prisma.lightningChannel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.status !== ChannelStatus.PENDING) {
      throw new BadRequestException('Channel is not in pending state');
    }

    if (channel.user2Address !== userAddress) {
      throw new BadRequestException('Only the invited user can accept this channel');
    }

    // Update channel to ACTIVE
    const updatedChannel = await this.prisma.lightningChannel.update({
      where: { id: channelId },
      data: { status: ChannelStatus.ACTIVE }
    });

    // Notify the original channel creator that it was accepted
    this.notificationsGateway.notifyChannelAccepted(channel.user1Address, userAddress, updatedChannel);

    return updatedChannel;
  }

  // Send payment with 4-second simulation
  async sendPayment(sendPaymentDto: SendPaymentDto) {
    const { channelId, fromUser, toUser, amount, note } = sendPaymentDto;

    const channel = await this.prisma.lightningChannel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.status !== ChannelStatus.ACTIVE) {
      throw new BadRequestException('Channel is not active');
    }

    // Determine sender's current margin
    const isUser1Sender = channel.user1Address === fromUser;
    const senderMargin = isUser1Sender ? channel.user1MarginLeft : channel.user2MarginLeft;

    if (senderMargin < amount) {
      throw new BadRequestException('Insufficient margin');
    }

  // Optional processing notification (no artificial delay)
  this.notificationsGateway.notifyTransactionProcessing(fromUser, amount, toUser);
  this.notificationsGateway.notifyTransactionProcessing(toUser, amount, fromUser);

    // Update channel balances and create transaction
    const updatedChannel = await this.prisma.$transaction(async (tx) => {
      // Update channel balances
      const newUser1Margin = isUser1Sender 
        ? channel.user1MarginLeft - amount 
        : channel.user1MarginLeft + amount;
      const newUser2Margin = isUser1Sender 
        ? channel.user2MarginLeft + amount 
        : channel.user2MarginLeft - amount;

      const updated = await tx.lightningChannel.update({
        where: { id: channelId },
        data: {
          user1MarginLeft: newUser1Margin,
          user2MarginLeft: newUser2Margin,
          transactionCount: { increment: 1 }
        }
      });

      // Create transaction record
      await tx.lightningTransaction.create({
        data: {
          channelId,
          fromUser,
          toUser,
          amount,
          type: TransactionType.PAYMENT,
          note
        }
      });

      return updated;
    });

    // Send real-time notifications after successful payment
    this.notificationsGateway.notifyPaymentReceived(toUser, fromUser, amount, updatedChannel.channelNumber);
    this.notificationsGateway.notifyPaymentSent(fromUser, toUser, amount, updatedChannel.channelNumber);

    return updatedChannel;
  }

  // Create payment request
  async createPaymentRequest(paymentRequestDto: PaymentRequestDto) {
    const { channelId, fromUser, toUser, amount, reason } = paymentRequestDto;

    const channel = await this.prisma.lightningChannel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.status !== ChannelStatus.ACTIVE) {
      throw new BadRequestException('Channel is not active');
    }

    const request = await this.prisma.paymentRequest.create({
      data: {
        channelId,
        fromUser,
        toUser,
        amount,
        reason
      }
    });

    // Send real-time notification to the recipient
    this.notificationsGateway.notifyPaymentRequest(toUser, fromUser, amount, reason, request.id);

    return request;
  }

  // Respond to payment request
  async respondToPaymentRequest(requestId: string, response: 'ACCEPTED' | 'DECLINED', userAddress: string) {
    const request = await this.prisma.paymentRequest.findUnique({
      where: { id: requestId },
      include: { channel: true }
    });

    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    if (request.toUser !== userAddress) {
      throw new BadRequestException('Only the recipient can respond to this request');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Request has already been responded to');
    }

    if (response === 'ACCEPTED') {
      // Detect if this is a margin refill request based on reason prefix
      const reason = (request.reason || '').trim().toUpperCase();
      const isMarginRefill = reason.startsWith('[MARGIN]');
      if (isMarginRefill) {
        // Refill the acceptor's margin (the recipient of the request)
        await this.refillMargin(request.channelId, request.toUser, request.amount);
      } else {
        // Process the payment (shift margin from acceptor to requester)
        await this.sendPayment({
          channelId: request.channelId,
          fromUser: request.toUser,
          toUser: request.fromUser,
          amount: request.amount,
          note: `Payment for: ${request.reason}`
        });
      }
    }

    // Update request status
    const updatedRequest = await this.prisma.paymentRequest.update({
      where: { id: requestId },
      data: {
        status: response === 'ACCEPTED' ? RequestStatus.ACCEPTED : RequestStatus.DECLINED,
        respondedAt: new Date()
      }
    });

    // Send notification to original requester
    if (response === 'ACCEPTED') {
      this.notificationsGateway.notifyRequestAccepted(request.fromUser, userAddress, request.amount);
    } else {
      this.notificationsGateway.notifyRequestDeclined(request.fromUser, userAddress, request.amount);
    }

    return updatedRequest;
  }

  // Get user's channels
  async getUserChannels(userAddress: string) {
    return this.prisma.lightningChannel.findMany({
      where: {
        OR: [
          { user1Address: userAddress },
          { user2Address: userAddress }
        ],
        status: ChannelStatus.ACTIVE // Only return active channels
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        requests: {
          where: { status: RequestStatus.PENDING }
        }
      }
    });
  }

  // Get pending channel invitations for a user
  async getPendingChannels(userAddress: string) {
    return this.prisma.lightningChannel.findMany({
      where: {
        user2Address: userAddress, // Only channels where user is the recipient
        status: ChannelStatus.PENDING
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get specific channel details
  async getChannelDetails(channelId: string) {
    return this.prisma.lightningChannel.findUnique({
      where: { id: channelId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        },
        requests: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  // Refill channel margin
  async refillMargin(channelId: string, userAddress: string, amount: number) {
    const channel = await this.prisma.lightningChannel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const isUser1 = channel.user1Address === userAddress;
    if (!isUser1 && channel.user2Address !== userAddress) {
      throw new BadRequestException('User not part of this channel');
    }

    // Simulate refill delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update margin and create transaction
    const updatedChannel = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.lightningChannel.update({
        where: { id: channelId },
        data: {
          user1MarginLeft: isUser1 ? { increment: amount } : undefined,
          user2MarginLeft: !isUser1 ? { increment: amount } : undefined,
          transactionCount: { increment: 1 }
        }
      });

      await tx.lightningTransaction.create({
        data: {
          channelId,
          fromUser: userAddress,
          toUser: userAddress,
          amount,
          type: TransactionType.REFILL,
          note: 'Margin refill'
        }
      });

      return updated;
    });

    return updatedChannel;
  }
}