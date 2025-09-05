import { Controller, Post, Get, Delete, Param, Body, UseGuards, Query, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { WalletsService } from './wallets.service.js';
import { CreateWalletDto } from './dto/create-wallet.dto.js'; // Will create this next
import type { Request } from 'express'; // Use 'import type' for isolatedModules
import { SupportedNetwork } from '@tempwallet/shared';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: Request, @Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.createWallet(req.user, createWalletDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Req() req: Request,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('network_key') networkKey?: SupportedNetwork,
  ) {
    return this.walletsService.findUserWallets(req.user.id, { page, limit, networkKey });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    return this.walletsService.deleteWallet(req.user.id, id);
  }
}