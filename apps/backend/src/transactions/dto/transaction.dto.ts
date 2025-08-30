import { IsString, IsOptional, IsNumber, IsNotEmpty, IsNumberString, IsEnum, IsObject } from 'class-validator';
import { SupportedNetwork } from '@tempwallet/shared';

export class PrepareTransactionDto {
  @IsString()
  temp_wallet_id: string;

  @IsString()
  to_address: string;

  @IsNumberString()
  amount: string;

  @IsString()
  token_address: string; // '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' for native

  @IsEnum(SupportedNetwork)
  network_key: SupportedNetwork;
}

export class SubmitTransactionDto {
  @IsString()
  temp_wallet_id: string;

  @IsString()
  signature: string;

  @IsObject()
  user_op: any; // Partial UserOp from prepare
}