// apps/backend/src/users/users.controller.ts
import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service.js';              // ✅ ADD .js extension
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';       // ✅ ADD .js extension
import { TelegramRegistrationPayload } from './dto/telegram-registration.dto.js'; // ✅ ADD .js extension

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Req() req: Request) {
    const user = req.user;
    await this.usersService.updateLastLogin(user.id);
    return user;
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
}