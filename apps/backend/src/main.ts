// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from '@tempwallet/prisma';

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

  // Run on port 3001 to match frontend expectation
  const server = await app.listen(3001);
  
  const prismaService = app.get(PrismaService); 
  await prismaService.$connect(); 
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();