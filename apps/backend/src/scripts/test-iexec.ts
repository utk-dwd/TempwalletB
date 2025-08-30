// apps/backend/src/scripts/test-iexec.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IexecService } from '../iexec/iexec.service';
import { UsersService } from '../users/users.service';
import { TelegramRegistrationPayload } from '@tempwallet/shared';

async function testIExec() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const iexecService = app.get(IexecService);
  const usersService = app.get(UsersService);

  try {
    console.log('Testing iExec initialization...');
    if (!(iexecService as any).isInitialized) {
      throw new Error('IexecService not initialized');
    }
    const balance = await (iexecService as any).checkBalance();
    console.log(`sRLC balance: ${balance}`);
    if (parseInt(balance) === 0) {
      console.warn('No sRLC balance; ensure voucher is set up or wallet is funded');
    }

    const testUserId = 'your-test-user-id'; // Replace with real user ID
    const testChatId = '12345678'; // Replace with real chat ID
    console.log('Testing Telegram registration...');
    const payload: TelegramRegistrationPayload = { chatId: testChatId };
    await usersService.registerTelegram(testUserId, payload);
    console.log(`Telegram registration completed for user ${testUserId}`);

    const user = await usersService.findOneById(testUserId);
    if (!user?.telegram_protected_data) {
      throw new Error('Failed to retrieve protectedData for test user');
    }
    const protectedData = user.telegram_protected_data;

    console.log('Testing Telegram message send...');
    const response = await iexecService.sendMessage({
      protectedData,
      telegramContent: 'Test message from TempWallet',
      senderName: 'TempWallet Test',
      useVoucher: true,
    });

    console.log(`Message sent. Task ID: ${response.taskId}`);
    console.log(`Track: https://explorer.iex.ec/bellecour/task/${response.taskId}`);
  } catch (error) {
    console.error(`Error testing iExec: ${error.message}`, error.stack);
  } finally {
    await app.close();
  }
}

testIExec();