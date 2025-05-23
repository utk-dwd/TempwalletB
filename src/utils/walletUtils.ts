// src/utils/walletUtils.ts
import { createSmartAccountClient, PaymasterMode } from '@biconomy/account';
import { avalancheFuji } from 'viem/chains';
import { createPublicClient, http, parseEther, isAddress, formatEther, formatUnits } from 'viem';
import { keccak256, AbiCoder } from 'ethers';
import { getProvider } from './provider';
import { Wallet, UserData, WalletAccount, TransactionStatus } from './types';

// Fixed message for deterministic signing
const CONSTANT_MESSAGE = 'TempWalletCreation';

// Function to sign a fixed message with MetaMask
export const signMessage = async (): Promise<string> => {
  try {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(CONSTANT_MESSAGE);
    console.log('Signed message:', { message: CONSTANT_MESSAGE, signature });
    return signature;
  } catch (error) {
    console.error('Failed to sign message:', error);
    throw new Error(`Message signing failed: ${error}`);
  }
};

// Function to get user data from localStorage
export const getUserData = (): UserData => {
  const data = localStorage.getItem('tempWalletUserData');
  return data ? JSON.parse(data) : { accounts: [], activeAccount: null };
};

// Function to save user data to localStorage
const saveUserData = (userData: UserData) => {
  localStorage.setItem('tempWalletUserData', JSON.stringify(userData));
};

// Function to get the next incremented wallet number for a specific account
export const getNextWalletNumber = (account: string): number => {
  if (!account || !/^0x[a-fA-F0-9]{40}$/.test(account)) {
    throw new Error(`Invalid account address: ${account}`);
  }
  const key = `walletCounter_${account.toLowerCase()}`;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  const next = current + 1;
  localStorage.setItem(key, next.toString());
  console.log('Incremented wallet number:', { account, key, current, next });
  return next;
};

// Function to generate deterministic index for temp wallet
export const generateDeterministicIndex = async (walletNumber: number): Promise<number> => {
  try {
    const signature = await signMessage();
    const hash = keccak256(
      AbiCoder.defaultAbiCoder().encode(['bytes', 'uint256'], [signature, walletNumber])
    );
    const index = parseInt(hash.slice(2, 10), 16);
    console.log('Generated deterministic index:', { signature, walletNumber, index });
    return index;
  } catch (error) {
    console.error('Failed to generate deterministic index:', error);
    throw new Error(`Deterministic index generation failed: ${error}`);
  }
};

// Function to get AVAX balance
export const getBalance = async (address: string): Promise<string> => {
  try {
    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(import.meta.env.VITE_AVALANCHE_FUJI_RPC),
    });
    const balance = await publicClient.getBalance({ address: address as `0x${string}` });
    return balance.toString(); // Balance in wei
  } catch (error) {
    console.error('Failed to get AVAX balance:', error);
    return '0';
  }
};

// Function to get USDC balance
export const getTokenBalance = async (address: string): Promise<string> => {
  try {
    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(import.meta.env.VITE_AVALANCHE_FUJI_RPC),
    });
    const usdcAddress = import.meta.env.VITE_USDC_ADDRESS;
    if (!usdcAddress) {
      throw new Error('USDC address not configured in .env');
    }
    const balance = await publicClient.readContract({
      address: usdcAddress,
      abi: [
        'function balanceOf(address) view returns (uint256)',
      ],
      functionName: 'balanceOf',
      args: [address],
    }) as bigint;
    return balance.toString(); // Balance in token units (6 decimals for USDC)
  } catch (error) {
    console.error('Failed to get USDC balance:', error);
    return '0';
  }
};

// Function to create a smart account with incremental counter
export const createSmartAccount = async (account: string, externalAccountNumber: number): Promise<Wallet> => {
  try {
    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(import.meta.env.VITE_AVALANCHE_FUJI_RPC),
    });
    const blockNumber = await publicClient.getBlockNumber();
    console.log('Avalanche Fuji Block Number:', blockNumber);

    const provider = await getProvider(account);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    if (signerAddress.toLowerCase() !== account.toLowerCase()) {
      throw new Error('Signer address does not match the provided account');
    }
    console.log('Signer Address:', signerAddress);

    const bundlerUrl = import.meta.env.VITE_BUNDLER_URL;
    const paymasterApiKey = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY;
    const rpcUrl = import.meta.env.VITE_AVALANCHE_FUJI_RPC;

    if (!bundlerUrl || !paymasterApiKey || !rpcUrl) {
      throw new Error(
        'Missing environment variables: Ensure VITE_BUNDLER_URL, VITE_BICONOMY_PAYMASTER_API_KEY, and VITE_AVALANCHE_FUJI_RPC are set in .env'
      );
    }

    const walletNumber = getNextWalletNumber(account);
    const index = await generateDeterministicIndex(walletNumber);

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey: paymasterApiKey,
      chainId: avalancheFuji.id,
      index,
      rpcUrl,
    });

    const accountAddress = await smartAccount.getAccountAddress();

    const userData = getUserData();
    let accountData = userData.accounts.find((acc) => acc.account.toLowerCase() === account.toLowerCase());
    if (!accountData) {
      accountData = { account, name: '', externalAccountNumber, wallets: [] };
      userData.accounts.push(accountData);
    }

    const wallet: Wallet = {
      address: accountAddress,
      walletNumber,
      externalAccountNumber,
      index,
      transactionStatus: { state: 'idle' },
      balance: await getBalance(accountAddress),
      tokenBalance: await getTokenBalance(accountAddress),
    };

    accountData.wallets.push(wallet);
    saveUserData(userData);

    console.log('Created smart account:', {
      address: accountAddress,
      walletNumber,
      externalAccountNumber,
      index,
      chainId: avalancheFuji.id,
      signerAddress,
    });
    return wallet;
  } catch (error) {
    console.error('Failed to create smart account:', error);
    throw new Error(`Smart account creation failed: ${error}`);
  }
};

// Function to create a smart account with a specific counter
export const createSmartAccountWithCounter = async (
  account: string,
  walletNumber: number,
  externalAccountNumber: number
): Promise<Wallet> => {
  try {
    if (!Number.isInteger(walletNumber) || walletNumber < 0) {
      throw new Error('Wallet number must be a non-negative integer');
    }

    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(import.meta.env.VITE_AVALANCHE_FUJI_RPC),
    });
    const blockNumber = await publicClient.getBlockNumber();
    console.log('Avalanche Fuji Block Number:', blockNumber);

    const provider = await getProvider(account);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    if (signerAddress.toLowerCase() !== account.toLowerCase()) {
      throw new Error('Signer address does not match the provided account');
    }
    console.log('Signer Address:', signerAddress);

    const bundlerUrl = import.meta.env.VITE_BUNDLER_URL;
    const paymasterApiKey = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY;
    const rpcUrl = import.meta.env.VITE_AVALANCHE_FUJI_RPC;

    if (!bundlerUrl || !paymasterApiKey || !rpcUrl) {
      throw new Error(
        'Missing environment variables: Ensure VITE_BUNDLER_URL, VITE_BICONOMY_PAYMASTER_API_KEY, and VITE_AVALANCHE_FUJI_RPC are set in .env'
      );
    }

    const index = await generateDeterministicIndex(walletNumber);

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey: paymasterApiKey,
      chainId: avalancheFuji.id,
      index,
      rpcUrl,
    });

    const accountAddress = await smartAccount.getAccountAddress();

    const userData = getUserData();
    let accountData = userData.accounts.find((acc) => acc.account.toLowerCase() === account.toLowerCase());
    if (!accountData) {
      accountData = { account, name: '', externalAccountNumber, wallets: [] };
      userData.accounts.push(accountData);
    }

    const wallet: Wallet = {
      address: accountAddress,
      walletNumber,
      externalAccountNumber,
      index,
      transactionStatus: { state: 'idle' },
      balance: await getBalance(accountAddress),
      tokenBalance: await getTokenBalance(accountAddress),
    };

    accountData.wallets.push(wallet);
    saveUserData(userData);

    console.log('Created smart account with specific wallet number:', {
      address: accountAddress,
      walletNumber,
      externalAccountNumber,
      index,
      chainId: avalancheFuji.id,
      signerAddress,
    });
    return wallet;
  } catch (error) {
    console.error('Failed to create smart account with specific wallet number:', error);
    throw new Error(`Smart account creation failed: ${error}`);
  }
};

// Function to send a transaction from a smart account
export const sendTransaction = async (
  account: string, // EOA address
  walletAddress: string, // Smart account address
  index: number, // Index for reinitializing smart account
  to: string, // Recipient address
  amount: string // Amount in AVAX
): Promise<TransactionStatus> => {
  try {
    if (!isAddress(to)) {
      throw new Error('Invalid recipient address');
    }
    const amountWei = parseEther(amount);
    if (amountWei <= 0) {
      throw new Error('Amount must be positive');
    }

    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(import.meta.env.VITE_AVALANCHE_FUJI_RPC),
    });
    const balance = await publicClient.getBalance({ address: walletAddress as `0x${string}` });
    if (balance < amountWei) {
      throw new Error('Insufficient balance in smart account');
    }

    const provider = await getProvider(account);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    if (signerAddress.toLowerCase() !== account.toLowerCase()) {
      throw new Error('Signer address does not match the provided account');
    }

    const bundlerUrl = import.meta.env.VITE_BUNDLER_URL;
    const paymasterApiKey = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY;
    const rpcUrl = import.meta.env.VITE_AVALANCHE_FUJI_RPC;

    if (!bundlerUrl || !paymasterApiKey || !rpcUrl) {
      throw new Error(
        'Missing environment variables: Ensure VITE_BUNDLER_URL, VITE_BICONOMY_PAYMASTER_API_KEY, and VITE_AVALANCHE_FUJI_RPC are set in .env'
      );
    }

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey: paymasterApiKey,
      chainId: avalancheFuji.id,
      index,
      rpcUrl,
    });

    const tx = {
      to,
      value: amountWei,
    };

    const { waitForTxHash } = await smartAccount.sendTransaction(tx, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    const { transactionHash } = await waitForTxHash();
    console.log('Transaction sent:', { transactionHash, walletAddress, to, amount });

    return {
      state: 'success',
      txHash: transactionHash,
      message: `Transaction successful: https://testnet.snowtrace.io/tx/${transactionHash}`,
    };
  } catch (error: any) {
    console.error('Failed to send transaction:', error);
    return {
      state: 'error',
      message: error.message || 'Failed to send transaction',
    };
  }
};