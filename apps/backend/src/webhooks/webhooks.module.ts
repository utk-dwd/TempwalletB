import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { BalancesModule } from '../balances/balances.module';
import { IexecModule } from '../iexec/iexec.module';

@Module({
  imports: [NotificationsModule, BalancesModule, IexecModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}