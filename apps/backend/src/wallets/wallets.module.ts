//  TempwalletsB/apps/backend/src/wallets/wallets.module.ts

import { Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { PrismaModule } from '@tempwallet/prisma'; 
import { BalancesModule } from '../balances/balances.module';
import { AlchemyModule } from '../alchemy.module';

@Module({
  imports: [PrismaModule, BalancesModule, AlchemyModule], 
  controllers: [WalletsController],
  providers: [WalletsService],
})
export class WalletsModule {}