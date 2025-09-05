import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';
import { PrismaModule } from '@tempwallet/prisma';
import { BalancesModule } from '../balances/balances.module.js';

@Module({
  imports: [PrismaModule, BalancesModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
