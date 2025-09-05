import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { BalancesModule } from '../balances/balances.module.js';
import { IexecModule } from '../iexec/iexec.module.js';

@Module({
  imports: [NotificationsModule, BalancesModule, IexecModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}