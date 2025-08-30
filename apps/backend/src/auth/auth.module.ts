import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '@tempwallet/prisma';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    PassportModule,
    // This is the correct, asynchronous configuration
    JwtModule.registerAsync({
      imports: [ConfigModule], // 1. Make ConfigModule available inside JwtModule
      inject: [ConfigService],  // 2. Inject the ConfigService to read the .env file
      useFactory: async (configService: ConfigService) => ({
        // 3. Use the factory to return the configuration object
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '6h' }, // Set token expiration
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}