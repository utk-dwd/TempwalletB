import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { TempWalletsModule } from './temp-wallets/temp-wallets.module.js';
import { BalancesModule } from './balances/balances.module.js';
import { AlchemyModule } from './alchemy.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health/health.controller.js';
import { WalletsModule } from './wallets/wallets.module.js';
import { TokensModule } from './tokens/tokens.module.js';
import { CorsProxyController } from './cors-proxy/cors-proxy.controller.js';
import { TestController } from './test/test.controller.js';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { WebhooksModule } from './webhooks/webhooks.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { IexecModule } from './iexec/iexec.module.js';
import { LightningModule } from './lightning/lightning.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    UsersModule,
    TempWalletsModule,
    BalancesModule,
    AlchemyModule,
    TransactionsModule,
    AuthModule,
    WalletsModule,
    TokensModule,
    WebhooksModule,
    NotificationsModule,
    IexecModule,
    LightningModule,
  ],
  controllers: [AppController, HealthController, CorsProxyController, TestController],
  providers: [AppService],
})
export class AppModule {}