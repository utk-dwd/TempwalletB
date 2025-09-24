export class PaymentRequestDto {
  channelId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  reason: string;
}

export class RespondToRequestDto {
  response: 'ACCEPTED' | 'DECLINED';
}