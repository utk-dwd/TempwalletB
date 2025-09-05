// apps/backend/src/alchemy.module.ts
import { Module } from '@nestjs/common';
import { AlchemyService } from './alchemy.service.js';

@Module({
  providers: [AlchemyService],
  exports: [AlchemyService],
})
export class AlchemyModule {}