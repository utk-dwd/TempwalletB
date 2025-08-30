import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { PrepareTransactionDto, SubmitTransactionDto } from './dto/transaction.dto'; // Create these
import type { Request } from 'express';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('prepare')
  prepare(@Req() req: Request, @Body() dto: PrepareTransactionDto) {
    return this.transactionsService.prepareTransaction(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('submit')
  submit(@Req() req: Request, @Body() dto: SubmitTransactionDto) {
    return this.transactionsService.submitTransaction(req.user.id, dto);
  }
}