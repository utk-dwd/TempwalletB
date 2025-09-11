import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { PrismaService } from '../types/prisma.js';
import { TelegramIntegrationModule } from '../telegram-integration/telegram-integration.module.js';

@Module({
  imports: [TelegramIntegrationModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
})
export class UsersModule {}
