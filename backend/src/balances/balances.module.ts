import { Module } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { BalancesController } from './balances.controller';
import { PrismaModule } from '@prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BalancesController],
  providers: [BalancesService],
  exports: [BalancesService], // Export for use in other modules (e.g., WalletsService)
})
export class BalancesModule {}