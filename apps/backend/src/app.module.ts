import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TempWalletsModule } from './temp-wallets/temp-wallets.module';
import { BalancesModule } from './balances/balances.module';
import { AlchemyService } from './alchemy.service';
import { TransactionsModule } from './transactions/transactions.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { WalletsModule } from './wallets/wallets.module';
import { TokensModule } from './tokens/tokens.module';
import { CorsProxyController } from './cors-proxy/cors-proxy.controller'; 
import { TestController } from './test/test.controller';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { WebhooksModule } from './webhooks/webhooks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { IexecModule } from './iexec/iexec.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    UsersModule,
    TempWalletsModule,
    BalancesModule,
    TransactionsModule,
    AuthModule,
    WalletsModule,
    TokensModule,
    WebhooksModule,
    NotificationsModule,
    IexecModule,
  ],
  controllers: [AppController, HealthController, CorsProxyController, TestController],
  providers: [AppService, AlchemyService],
})
export class AppModule {}