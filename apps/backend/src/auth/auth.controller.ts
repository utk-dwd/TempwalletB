import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

// Define a simple DTO for the request body
class AuthDto {
  metamask_address: string;
  signature: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() authDto: AuthDto) {
    return this.authService.validateUser(authDto.metamask_address, authDto.signature);
  }
}