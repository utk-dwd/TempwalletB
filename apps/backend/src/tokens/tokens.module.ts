import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service.js';
import { TokensController } from './tokens.controller.js';
import { PrismaModule } from '../types/prisma.js'; 

@Module({
  imports: [PrismaModule], 
  controllers: [TokensController],
  providers: [TokensService],
})
export class TokensModule {}