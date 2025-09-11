import { Module } from '@nestjs/common';
import { TelegramIntegrationService } from './telegram-integration.service.js';
import { PrismaModule } from '../database/prisma.module.js';
import { AlchemyModule } from '../alchemy.module.js';

@Module({
  imports: [PrismaModule, AlchemyModule],
  providers: [TelegramIntegrationService],
  exports: [TelegramIntegrationService],
})
export class TelegramIntegrationModule {}
