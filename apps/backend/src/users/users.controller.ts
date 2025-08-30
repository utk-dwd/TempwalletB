// apps/backend/src/users/users.controller.ts
import { Controller, Get, Post, Req, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import { TelegramRegistrationPayload } from '@tempwallet/shared';

@UseGuards(JwtAuthGuard)
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
  async registerTelegram(@Req() req: Request, @Body() payload: TelegramRegistrationPayload) {
    const user = req.user;
    await this.usersService.registerTelegram(user.id, payload);
    return { status: 'success', message: 'Telegram chat ID registered' };
  }
}