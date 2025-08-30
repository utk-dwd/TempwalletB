import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { TokensController } from './tokens.controller';
import { PrismaModule } from '@tempwallet/prisma'; 

@Module({
  imports: [PrismaModule], 
  controllers: [TokensController],
  providers: [TokensService],
})
export class TokensModule {}