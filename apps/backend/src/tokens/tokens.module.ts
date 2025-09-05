import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service.js';
import { TokensController } from './tokens.controller.js';
import { PrismaModule } from '@tempwallet/prisma'; 

@Module({
  imports: [PrismaModule], 
  controllers: [TokensController],
  providers: [TokensService],
})
export class TokensModule {}