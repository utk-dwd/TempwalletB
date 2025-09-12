// apps/backend/src/users/users.controller.ts
import { Controller, Get, Post, Put, Body, Req, UseGuards, Param } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service.js';              // ✅ ADD .js extension
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';       // ✅ ADD .js extension
import { TelegramRegistrationPayload } from './dto/telegram-registration.dto.js'; // ✅ ADD .js extension
import { TelegramIntegrationService } from '../telegram-integration/telegram-integration.service.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly telegramIntegrationService: TelegramIntegrationService,
  ) {}

  @Get('me')
  async getProfile(@Req() req: Request) {
    const user = req.user;
    await this.usersService.updateLastLogin(user.id);
    return user;
  }

  @Get('telegram/status')
  @UseGuards(JwtAuthGuard)
  async getTelegramStatus(@Req() req: Request) {
    const user = req.user;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await this.usersService.getTelegramStatus(user.id);
  }

  @Post('register-telegram')
  @UseGuards(JwtAuthGuard)
  async registerTelegram(@Req() req: Request, @Body() payload: TelegramRegistrationPayload) {
    const user = req.user;
    if (!user) {
      throw new Error('User not authenticated');
    }
    await this.usersService.registerTelegram(user.id, payload);
    return { status: 'success', message: 'Telegram chat ID registered' };
  }

  @Put('telegram')
  @UseGuards(JwtAuthGuard)
  async updateTelegram(@Req() req: Request, @Body() payload: TelegramRegistrationPayload) {
    const user = req.user;
    if (!user) {
      throw new Error('User not authenticated');
    }
    await this.usersService.updateTelegram(user.id, payload);
    return { status: 'success', message: 'Telegram chat ID updated' };
  }

  @Post('trigger-wallet-registration')
  @UseGuards(JwtAuthGuard)
  async triggerWalletRegistration(@Req() req: Request) {
    const user = req.user;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Trigger manual retroactive registration for testing/edge cases
    this.telegramIntegrationService.registerUserWalletsWithAlchemy(user.id)
      .catch((error) => {
        console.error(`Manual wallet registration failed for user ${user.id}:`, error);
      });
    
    return { 
      status: 'success', 
      message: 'Manual wallet registration triggered in background' 
    };
  }
}