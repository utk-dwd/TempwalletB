// Main export file for @tempwallet/prisma package
// Re-export Prisma client, services, and modules

// Re-export Prisma client and all generated types
export { PrismaClient } from '@prisma/client';
export type * from '@prisma/client';

// Re-export our custom services and modules
export { PrismaService } from './prisma.service.js';
export { PrismaModule } from './prisma.module.js';

// Re-export from client for convenience
export * from './client.js';
