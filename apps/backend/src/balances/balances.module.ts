import { Module } from '@nestjs/common';
import { BalancesService } from './balances.service.js';
import { BalancesController } from './balances.controller.js';
import { PrismaModule } from '@tempwallet/prisma';


@Module({
  imports: [PrismaModule],
  controllers: [BalancesController],
  providers: [BalancesService],
  exports: [BalancesService], // Export for use in other modules (e.g., WalletsService)
})
export class BalancesModule {}