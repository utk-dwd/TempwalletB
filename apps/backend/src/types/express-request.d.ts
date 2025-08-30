// backend/src/types/express-request.d.ts
import { Request } from 'express';
import { User as PrismaUser } from '@tempwallet/prisma';

declare global {
  namespace Express {
    interface Request {
      user: PrismaUser;
    }
  }
}