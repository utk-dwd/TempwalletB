import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param, 
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { LightningService } from './lightning.service.js';
import { CreateChannelDto } from './dto/create-channel.dto.js';
import { SendPaymentDto } from './dto/send-payment.dto.js';
import { PaymentRequestDto, RespondToRequestDto } from './dto/payment-request.dto.js';

@Controller('lightning')
export class LightningController {
  constructor(private readonly lightningService: LightningService) {}

  // POST /lightning/channels - Create channel request (frontend expects this route)
  @Post('channels')
  @HttpCode(HttpStatus.CREATED)
  async createChannel(@Body() createChannelDto: CreateChannelDto) {
    return this.lightningService.createChannel(createChannelDto);
  }

  // POST /lightning/initiate - Create channel request (legacy route)
  @Post('initiate')
  @HttpCode(HttpStatus.CREATED)
  async initiateChannel(@Body() createChannelDto: CreateChannelDto) {
    return this.lightningService.createChannel(createChannelDto);
  }

  // POST /lightning/accept/:channelId - Accept channel invitation
  @Post('accept/:channelId')
  @HttpCode(HttpStatus.OK)
  async acceptChannel(
    @Param('channelId') channelId: string,
    @Body('userAddress') userAddress: string
  ) {
    return this.lightningService.acceptChannel(channelId, userAddress);
  }

  // POST /lightning/send-payment - Send payment with 4-second timer
  @Post('send-payment')
  @HttpCode(HttpStatus.OK)
  async sendPayment(@Body() sendPaymentDto: SendPaymentDto) {
    return this.lightningService.sendPayment(sendPaymentDto);
  }

  // POST /lightning/request-payment - Request funds from other user
  @Post('request-payment')
  @HttpCode(HttpStatus.CREATED)
  async requestPayment(@Body() paymentRequestDto: PaymentRequestDto) {
    return this.lightningService.createPaymentRequest(paymentRequestDto);
  }

  // PUT /lightning/respond-request/:requestId - Accept/decline request
  @Put('respond-request/:requestId')
  @HttpCode(HttpStatus.OK)
  async respondToRequest(
    @Param('requestId') requestId: string,
    @Body() respondDto: RespondToRequestDto,
    @Query('userAddress') userAddress: string
  ) {
    return this.lightningService.respondToPaymentRequest(
      requestId, 
      respondDto.response, 
      userAddress
    );
  }

  // POST /lightning/refill-margin - Add more BASE to channel
  @Post('refill-margin')
  @HttpCode(HttpStatus.OK)
  async refillMargin(
    @Body('channelId') channelId: string,
    @Body('userAddress') userAddress: string,
    @Body('amount') amount: number
  ) {
    return this.lightningService.refillMargin(channelId, userAddress, amount);
  }

  // GET /lightning/channels?userAddress=... - Get user's channels (query param version)
  @Get('channels')
  async getUserChannelsQuery(@Query('userAddress') userAddress: string) {
    return this.lightningService.getUserChannels(userAddress);
  }

  // GET /lightning/channels/pending?userAddress=... - Get pending channel invitations
  @Get('channels/pending')
  async getPendingChannels(@Query('userAddress') userAddress: string) {
    return this.lightningService.getPendingChannels(userAddress);
  }

  // GET /lightning/channels/:userAddress - Get user's channels (path param version)
  @Get('channels/:userAddress')
  async getUserChannels(@Param('userAddress') userAddress: string) {
    return this.lightningService.getUserChannels(userAddress);
  }

  // GET /lightning/channel/:channelId - Get specific channel details
  @Get('channel/:channelId')
  async getChannelDetails(@Param('channelId') channelId: string) {
    return this.lightningService.getChannelDetails(channelId);
  }

  // GET /lightning/channel-by-number/:channelNumber - Resolve channel by human-readable number
  @Get('channel-by-number/:channelNumber')
  async getChannelByNumber(@Param('channelNumber') channelNumber: string) {
    return this.lightningService.getChannelByNumber(channelNumber);
  }

  // GET /lightning/health - Health check endpoint
  @Get('health')
  getHealth() {
    return { 
      status: 'ok', 
      service: 'lightning',
      timestamp: new Date().toISOString()
    };
  }

  // --- UI-only Settlement (in-memory prototype) ---
  @Post('settlement/open/:channelId')
  @HttpCode(HttpStatus.OK)
  openSettlement(@Param('channelId') channelId: string, @Body('openedBy') openedBy: string) {
    return this.lightningService.openSettlement(channelId, openedBy);
  }

  @Post('settlement/approve/:channelId')
  @HttpCode(HttpStatus.OK)
  approveSettlement(@Param('channelId') channelId: string, @Body('address') address: string) {
    return this.lightningService.approveSettlement(channelId, address);
  }

  @Post('settlement/cancel/:channelId')
  @HttpCode(HttpStatus.OK)
  cancelSettlement(@Param('channelId') channelId: string) {
    return this.lightningService.cancelSettlement(channelId);
  }

  @Get('settlement/:channelId')
  getSettlement(@Param('channelId') channelId: string) {
    return this.lightningService.getSettlement(channelId);
  }

  // --- In-memory Game (AI Tetris demo) ---
  @Post('game/start')
  @HttpCode(HttpStatus.OK)
  startGame(
    @Body('channelId') channelId: string,
    @Body('user1Address') user1Address: string,
    @Body('user2Address') user2Address: string,
  ) {
    return this.lightningService.startGame(channelId, user1Address, user2Address);
  }

  @Post('game/score')
  @HttpCode(HttpStatus.OK)
  scoreGame(
    @Body('channelId') channelId: string,
    @Body('scorer') scorer: 'u1' | 'u2',
  ) {
    return this.lightningService.scoreGamePoint(channelId, scorer);
  }

  @Post('game/stop')
  @HttpCode(HttpStatus.OK)
  stopGame(@Body('channelId') channelId: string) {
    return this.lightningService.stopGame(channelId);
  }

  @Get('game/:channelId')
  getGame(@Param('channelId') channelId: string) {
    return this.lightningService.getGame(channelId);
  }

  // --- Dev utilities to unblock new channel creation when previous channel exists ---
  @Put('close/:channelId')
  @HttpCode(HttpStatus.OK)
  closeChannel(@Param('channelId') channelId: string) {
    return this.lightningService.closeChannel(channelId);
  }

  @Put('close-between')
  @HttpCode(HttpStatus.OK)
  closeBetween(
    @Query('a') a: string,
    @Query('b') b: string,
  ) {
    return this.lightningService.closeBetween(a, b);
  }
}