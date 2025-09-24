import { Module } from '@nestjs/common';
import { LightningController } from './lightning.controller.js';
import { LightningService } from './lightning.service.js';
import { PrismaModule } from '../database/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [LightningController],
  providers: [LightningService],
  exports: [LightningService],
})
export class LightningModule {}