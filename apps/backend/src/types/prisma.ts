// Backend Prisma imports - using direct imports to avoid workspace dependency issues

import { PrismaClient } from '@prisma/client';

export { PrismaService } from '../database/prisma.service.js';
export { PrismaModule } from '../database/prisma.module.js';

// Re-export types from Prisma client
export type {
  User,
  TempWallet,
  Transaction
} from '@prisma/client';

// Re-export PrismaClient
export { PrismaClient };

// Re-export SupportedNetwork from shared
export { SupportedNetwork } from './shared.js';