import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IexecService } from './iexec.service.js';

@Module({
  imports: [ConfigModule],
  providers: [IexecService],
  exports: [IexecService],
})
export class IexecModule {}