import {
  createPublicClient,
  http,
  encodeFunctionData,
  encodePacked,
  keccak256,
  hashMessage,
  parseUnits,
  formatUnits
} from 'viem';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule'; 
import { PrismaService } from '@tempwallet/prisma';
import { BalancesService } from '../balances/balances.service';
import { PrepareTransactionDto, SubmitTransactionDto } from './dto/transaction.dto';
import axios from 'axios';
import { AbiCoder } from 'ethers';
import { NETWORKS } from '@tempwallet/shared';
import Mixpanel from 'mixpanel';
import { SupportedNetwork, NetworkConfig } from '@tempwallet/shared';

const ENTRY_POINT = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789';
const DUMMY_SIGNATURE = '0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000001c5b32F37F5beA87BDD5374eB2aC54eA8e000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000';

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

@Injectable()
export class TransactionsService {
  private mixpanel: Mixpanel.Mixpanel;

  constructor(
    private readonly prisma: PrismaService,
    private readonly balancesService: BalancesService,
    private readonly config: ConfigService,
  ) {
    const token = this.config.get('MIXPANEL_TOKEN') || '';
    this.mixpanel = Mixpanel.init(token);
  }

  async prepareTransaction(userId: string, dto: PrepareTransactionDto) {
    const wallet = await this.prisma.tempWallet.findUnique({
      where: { id: dto.temp_wallet_id },
    });
    if (!wallet || wallet.user_id !== userId) {
      throw new NotFoundException('Wallet not found or not owned by user');
    }

    const network = NETWORKS[dto.network_key];
    if (!network) throw new BadRequestException('Invalid network');

    const isNative = dto.token_address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

    const amountWei = parseUnits(dto.amount, isNative ? 18 : await this.getTokenDecimals(dto.token_address, network)); // Assume 18 for native

    const callData = isNative ? '0x' : encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [dto.to_address as `0x${string}`, amountWei],
    });

    let partialUserOp = {
      sender: wallet.address,
      nonce: await this.getNonce(wallet.address, network),
      initCode: '0x',
      callData: isNative ? '0x' : callData,
      paymasterAndData: '0x',
      signature: DUMMY_SIGNATURE,
    };

    // Estimate gas
    const gasEstimates = await this.estimateGas(partialUserOp, network);

    partialUserOp = { ...partialUserOp, ...gasEstimates };

    // Get paymasterAndData
    const paymasterData = await this.getPaymasterAndData(partialUserOp, network, {
      mode: isNative ? 'SPONSORED' : 'ERC20',
      preferredToken: dto.token_address,
      // Add tokenInfo if needed
    });

    partialUserOp.paymasterAndData = paymasterData.paymasterAndData;

    // Compute userOpHash
    const userOpHash = this.getUserOpHash(partialUserOp, BigInt(network.chainId));

    this.mixpanel.track('TRANSACTION_PREPARE_SUCCESS', { userId, walletAddress: wallet.address });

    return { userOp: partialUserOp, userOpHash };
  }

  async submitTransaction(userId: string, dto: SubmitTransactionDto) {
    const wallet = await this.prisma.tempWallet.findUnique({
      where: { id: dto.temp_wallet_id },
    });
    if (!wallet || wallet.user_id !== userId) {
      throw new NotFoundException('Wallet not found or not owned by user');
    }

    const network = NETWORKS[wallet.network_key as SupportedNetwork];

    const userOp = dto.user_op;
    userOp.signature = dto.signature;

    const txHash = await this.sendUserOp(userOp, network);

    const transaction = await this.prisma.transaction.create({
      data: {
        temp_wallet_id: dto.temp_wallet_id,
        tx_hash: txHash,
        state: 'success',
        message: 'Transaction successful',
        token_symbol: 'TODO', // Get from token
        amount: 'TODO',
        to_address: 'TODO',
      },
    });

    await this.balancesService.refreshBalances(dto.temp_wallet_id);

    this.mixpanel.track('TRANSACTION_SUCCESS', { userId, txHash });

    return transaction;
  }

  // Ported from walletUtils
  async estimateGasFeeInToken(userOp: any, tokenAddress: string, tokenDecimals: number, network: NetworkConfig): Promise<bigint> {
    try {
      const gasEstimate = await this.estimateGas(userOp, network);
      // Rough estimate as in original
      return parseUnits("5", tokenDecimals);
    } catch (error) {
      return parseUnits("10", tokenDecimals);
    }
  }

  private async getNonce(address: string, network: NetworkConfig) {
    const publicClient = createPublicClient({
      transport: http(network.rpcUrl),
    });
    // Assume getNonce from entryPoint or account
    // For Biconomy, use bundler API eth_getUserOperationNonce or from SDK
    // For simplicity, assume we call publicClient to get from account contract
    // Replace with actual
    return BigInt(0);
  }

  private async estimateGas(partialUserOp: any, network: NetworkConfig) {
    const url = network.bundlerUrl;
    const data = {
      method: 'eth_estimateUserOperationGas',
      params: [partialUserOp, ENTRY_POINT],
      id: Date.now(),
      jsonrpc: '2.0',
    };

    const response = await axios.post(url, data);
    if (!response.data.result) throw new BadRequestException('Gas estimation failed');
    return response.data.result;
  }

  private async getPaymasterAndData(partialUserOp: any, network: NetworkConfig, paymasterServiceData: any) {
    const url = `https://paymaster.biconomy.io/api/v1/${network.chainId}/${network.paymasterApiKey}`;
    const data = {
      method: 'pm_sponsorUserOperation',
      params: [partialUserOp, ENTRY_POINT, paymasterServiceData],
      id: Date.now(),
      jsonrpc: '2.0',
    };

    const response = await axios.post(url, data);
    if (!response.data.result) throw new BadRequestException('Paymaster data failed');
    return response.data.result;
  }

  private getUserOpHash(userOp: any, chainId: bigint) {
    const packed = encodePacked(
      ['address', 'uint256', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
      [userOp.sender, userOp.nonce, keccak256(userOp.initCode), keccak256(userOp.callData), userOp.callGasLimit, userOp.verificationGasLimit, userOp.preVerificationGas, userOp.maxFeePerGas, userOp.maxPriorityFeePerGas, keccak256(userOp.paymasterAndData)]
    );

    const enc = encodePacked(['bytes32', 'address', 'uint256'], [keccak256(packed), ENTRY_POINT, chainId]);

    return keccak256(enc);
  }

  private async sendUserOp(userOp: any, network: NetworkConfig) {
    const url = network.bundlerUrl;
    const data = {
      method: 'eth_sendUserOperation',
      params: [userOp, ENTRY_POINT],
      id: Date.now(),
      jsonrpc: '2.0',
    };

    const response = await axios.post(url, data);
    if (!response.data.result) throw new BadRequestException('Send UserOp failed');

    // Wait for txHash, use eth_getUserOperationReceipt or poll
    // For simplicity, assume we poll or return the userOpHash, but to get txHash, implement wait
    // Here, pseudo
    const txHash = await this.waitForTx(response.data.result, network);
    return txHash;
  }

  private async waitForTx(userOpHash: string, network: NetworkConfig) {
    // Poll bundler eth_getUserOperationReceipt
    // Implement loop
    // For example:
    for (let i = 0; i < 10; i++) {
      const receipt = await this.getReceipt(userOpHash, network);
      if (receipt && receipt.transactionHash) return receipt.transactionHash;
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new BadRequestException('Timeout waiting for tx');
  }

  private async getReceipt(userOpHash: string, network: NetworkConfig) {
    const url = network.bundlerUrl;
    const data = {
      method: 'eth_getUserOperationReceipt',
      params: [userOpHash],
      id: Date.now(),
      jsonrpc: '2.0',
    };

    const response = await axios.post(url, data);
    return response.data.result;
  }

  private async getTokenDecimals(tokenAddress: string, network: NetworkConfig) {
    const publicClient = createPublicClient({
      transport: http(network.rpcUrl),
    });
    return await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
    }) as number;
  }
}