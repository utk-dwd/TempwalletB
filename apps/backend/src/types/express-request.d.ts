// backend/src/types/express-request.d.ts
import { Request } from 'express';
import { User as PrismaUser } from '../types/prisma.js';

declare global {
  namespace Express {
    interface Request {
      user: PrismaUser;
    }
  }
}