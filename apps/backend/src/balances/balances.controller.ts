import { Controller, Post, Param, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { BalancesService } from './balances.service.js';
import type { Request } from 'express';

@Controller('balances')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('refresh/:id')
  async refresh(@Req() req: Request, @Param('id') id: string) {
    // Validate user owns the wallet
    const wallet = await this.balancesService.getWalletForUser(req.user.id, id);
    if (!wallet) {
      throw new NotFoundException('Wallet not found or not owned by user');
    }

    await this.balancesService.refreshBalances(id);
    return { message: 'Balances refreshed' };
  }
}