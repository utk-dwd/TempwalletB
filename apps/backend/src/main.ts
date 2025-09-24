// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './types/prisma.js';

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function() {
  return this.toString();
};


async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  // Listen on all interfaces (IPv4 and IPv6)
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');
  
  const prismaService = app.get(PrismaService); 
  await prismaService.$connect(); 
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();