export class SendPaymentDto {
  channelId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  note?: string;
}