//  TempwalletsB/apps/backend/src/wallets/wallets.module.ts

import { Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller.js';        // ✅ ADD .js extension
import { WalletsService } from './wallets.service.js';              // ✅ ADD .js extension
import { PrismaService } from '@tempwallet/prisma';
import { BalancesModule } from '../balances/balances.module.js';    // ✅ ADD missing import
import { AlchemyModule } from '../alchemy.module.js';               // ✅ ADD missing import

@Module({
  imports: [BalancesModule, AlchemyModule],                         // ✅ ADD missing modules
  controllers: [WalletsController],
  providers: [WalletsService, PrismaService],
})
export class WalletsModule {}