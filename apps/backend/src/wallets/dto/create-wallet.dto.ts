import { IsString, IsInt, IsEnum, IsPositive } from 'class-validator';
import { SupportedNetwork } from '../../types/shared.js';

export class CreateWalletDto {
  @IsString()
  address: string;

  @IsInt()
  @IsPositive()
  walletNumber: number;

  @IsInt()
  @IsPositive()
  externalAccountNumber: number;

  @IsInt()
  @IsPositive()
  index: number;

  @IsEnum(SupportedNetwork)
  networkKey: SupportedNetwork;

  @IsString()
  parent_metamask_address: string;
}