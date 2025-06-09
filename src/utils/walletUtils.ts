// src/utils/walletUtils.ts
import { createSmartAccountClient, PaymasterMode } from '@biconomy/account';
import { avalanche } from 'viem/chains';
import { createPublicClient, http, parseEther, isAddress, formatEther, formatUnits, parseUnits, encodeFunctionData, createWalletClient, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { keccak256, AbiCoder } from 'ethers';
import { getProvider } from './provider';
import { Wallet, UserData, WalletAccount, TransactionStatus, SdkType } from './types';
import { createSmartAccountClient as create0xGaslessSmartAccountClient } from '@0xgasless/smart-account';

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
  return data ? JSON.parse(data) : { 
    accounts: [], 
    activeAccount: null,
    walletNames: {}
  };
};

// Function to save user data to localStorage
const saveUserData = (userData: UserData) => {
  localStorage.setItem('tempWalletUserData', JSON.stringify(userData));
};

// Define USDC ABI as a constant for reuse
const USDC_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'balanceOf',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [
      { internalType: 'bool', name: '', type: 'bool' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

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

export const generateRandomIndex = async (): Promise<{ index: number, walletNumber: number }> => {
  try {
    const signature = await signMessage(); // Only signature call needed
    const timestamp = Date.now();
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    
    // Combine signature, timestamp, and random bytes for wallet number generation
    const hash = keccak256(
      AbiCoder.defaultAbiCoder().encode(
        ['bytes', 'uint256', 'uint32'], 
        [signature, timestamp, randomBytes[0]]
      )
    );
    
    // Generate random wallet number (use larger range to avoid conflicts)
    const walletNumber = 1000 + (parseInt(hash.slice(10, 18), 16) % 999000); // Range: 1000-999999
    
    // Calculate index directly using the SAME logic as generateDeterministicIndex
    // but without calling signMessage() again
    const indexHash = keccak256(
      AbiCoder.defaultAbiCoder().encode(['bytes', 'uint256'], [signature, walletNumber])
    );
    const index = parseInt(indexHash.slice(2, 10), 16);
    
    console.log('Generated random wallet number with deterministic index (single signature):', { 
      signature: signature.slice(0, 10) + '...', // Log only first part for privacy
      timestamp, 
      walletNumber, 
      index 
    });
    return { index, walletNumber };
  } catch (error) {
    console.error('Failed to generate random index:', error);
    throw new Error(`Random index generation failed: ${error}`);
  }
};

// Function to get AVAX balance
export const getBalance = async (address: string): Promise<string> => {
  try {
    const publicClient = createPublicClient({
      chain: avalanche, // Updated
      transport: http('VITE_AVALANCHE_RPC'), // Updated
    });
    const balance = await publicClient.getBalance({ address: address as `0x${string}` });
    return balance.toString(); // Balance in wei
  } catch (error) {
    console.error('Failed to get AVAX balance:', error);
    return '0';
  }
};


// Function to get USDC balance
export const getTokenBalance = async (address: `0x${string}`): Promise<string> => {
  try {
    const publicClient = createPublicClient({
      chain: avalanche, // Updated
      transport: http('VITE_AVALANCHE_RPC'), // Updated
    });
    const usdcAddress = import.meta.env.VITE_USDC_ADDRESS;
    if (!usdcAddress) {
      throw new Error('USDC address not configured in .env');
    }
    const balance = await publicClient.readContract({
      address: usdcAddress,
      abi: [
        {
          inputs: [
            {
              internalType: 'address',
              name: 'account',
              type: 'address',
            },
          ],
          name: 'balanceOf',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
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
      chain: avalanche, // Updated
      transport: http('VITE_AVALANCHE_RPC'), // Updated
    });
    const blockNumber = await publicClient.getBlockNumber();
    console.log('Avalanche Mainnet Block Number:', blockNumber); // Updated log

    const provider = await getProvider(account);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    if (signerAddress.toLowerCase() !== account.toLowerCase()) {
      throw new Error('Signer address does not match the provided account');
    }
    console.log('Signer Address:', signerAddress);

    const bundlerUrl = import.meta.env.VITE_BUNDLER_URL;
    const paymasterApiKey = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY;
    const rpcUrl = import.meta.env.VITE_AVALANCHE_RPC; // Updated

    if (!bundlerUrl || !paymasterApiKey || !rpcUrl) {
      throw new Error(
        'Missing environment variables: Ensure VITE_BUNDLER_URL, VITE_BICONOMY_PAYMASTER_API_KEY, and VITE_AVALANCHE_RPC are set in .env'
      );
    }

    const walletNumber = getNextWalletNumber(account);
    const index = await generateDeterministicIndex(walletNumber);

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey: paymasterApiKey,
      chainId: avalanche.id, // Updated
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
      sdk: 'biconomy',
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
      chainId: avalanche.id, // Updated
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
      chain: avalanche,
      transport: http('VITE_AVALANCHE_RPC'),
    });
    const blockNumber = await publicClient.getBlockNumber();
    console.log('Avalanche Block Number:', blockNumber);

    const provider = await getProvider(account);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    if (signerAddress.toLowerCase() !== account.toLowerCase()) {
      throw new Error('Signer address does not match the provided account');
    }
    console.log('Signer Address:', signerAddress);

    const bundlerUrl = import.meta.env.VITE_BUNDLER_URL;
    const paymasterApiKey = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY;
    const rpcUrl = import.meta.env.VITE_AVALANCHE_RPC;

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
      chainId: avalanche.id,
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
      sdk: 'biconomy', // <-- ADD THIS
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
      chainId: avalanche.id,
      signerAddress,
    });
    return wallet;
  } catch (error) {
    console.error('Failed to create smart account with specific wallet number:', error);
    throw new Error(`Smart account creation failed: ${error}`);
  }
};

// Function to create a smart account with random index but deterministic reproducibility
export const createRandomSmartAccount = async (account: string, externalAccountNumber: number): Promise<Wallet> => {
  try {
    // Generate random wallet number using MetaMask signature (only one signature needed)
    const { walletNumber, index } = await generateRandomIndex();

    // Check if this wallet number already exists
    const userData = getUserData();
    const accountData = userData.accounts.find((acc) => acc.account.toLowerCase() === account.toLowerCase());
    const existingWallet = accountData?.wallets.find(w => w.walletNumber === walletNumber);
    
    if (existingWallet) {
      throw new Error(`Wallet number ${walletNumber} already exists. This is extremely rare - please try again.`);
    }

    // Create the smart account directly without calling createSmartAccountWithCounter
    const publicClient = createPublicClient({
      chain: avalanche,
      transport: http('VITE_AVALANCHE_RPC'),
    });

    const provider = await getProvider(account);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    if (signerAddress.toLowerCase() !== account.toLowerCase()) {
      throw new Error('Signer address does not match the provided account');
    }

    const bundlerUrl = import.meta.env.VITE_BUNDLER_URL;
    const paymasterApiKey = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY;
    const rpcUrl = import.meta.env.VITE_AVALANCHE_RPC;

    if (!bundlerUrl || !paymasterApiKey || !rpcUrl) {
      throw new Error(
        'Missing environment variables: Ensure VITE_BUNDLER_URL, VITE_BICONOMY_PAYMASTER_API_KEY, and VITE_AVALANCHE_FUJI_RPC are set in .env'
      );
    }

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey: paymasterApiKey,
      chainId: avalanche.id,
      index,
      rpcUrl,
    });

    const accountAddress = await smartAccount.getAccountAddress();

    let updatedAccountData = accountData;
    if (!updatedAccountData) {
      updatedAccountData = { account, name: '', externalAccountNumber, wallets: [] };
      userData.accounts.push(updatedAccountData);
    }

    const wallet: Wallet = {
      address: accountAddress,
      walletNumber,
      externalAccountNumber,
      index,
      sdk: 'biconomy', // <-- ADD THIS
      transactionStatus: { state: 'idle' },
      balance: await getBalance(accountAddress),
      tokenBalance: await getTokenBalance(accountAddress),
    };

    updatedAccountData.wallets.push(wallet);
    saveUserData(userData);

    console.log('Created random smart account (deterministic, single signature):', {
      address: accountAddress,
      walletNumber,
      externalAccountNumber,
      index,
      chainId: avalanche.id,
      type: 'random'
    });
    return wallet;
  } catch (error) {
    console.error('Failed to create random smart account:', error);
    throw new Error(`Random smart account creation failed: ${error}`);
  }
};

// Add this new function to walletUtils.ts

// Updated create0xGaslessWallet function
// Updated create0xGaslessWallet function
export const create0xGaslessWallet = async (account: string, externalAccountNumber: number, privateKey?: string): Promise<Wallet> => {
  try {
    // Now Avalanche Mainnet is supported!
    const supportedChains = [1, 8453, 10, 42161, 137, 56, 43114]; // 43114 is Avalanche Mainnet
    const currentChainId = avalanche.id; // Updated
    
    if (!supportedChains.includes(currentChainId)) {
      throw new Error(`0xGasless does not support this network (chain ID: ${currentChainId}). Supported chains: Ethereum (1), Base (8453), Optimism (10), Arbitrum (42161), Polygon (137), BSC (56), Avalanche Mainnet (43114).`);
    }

    const userData = getUserData();
    const accountData = userData.accounts.find((acc) => acc.account.toLowerCase() === account.toLowerCase());

    // Check if a 0xGasless wallet already exists for this account
    if (accountData?.wallets.some(w => w.sdk === '0xgasless')) {
      throw new Error('A 0xGasless wallet already exists for this account.');
    }

    let viemClient;
    
    if (privateKey) {
      // Method 1: Create from private key (as shown in docs)
      const privateKeyAccount = privateKeyToAccount(privateKey as `0x${string}`);
      viemClient = createWalletClient({
        account: privateKeyAccount,
        chain: avalanche, // Updated
        transport: http('http://localhost:3001'),
      });
      
      // Verify the account matches
      if (viemClient.account.address.toLowerCase() !== account.toLowerCase()) {
        throw new Error('Private key does not match the provided account address');
      }
    } else {
      // Method 2: Use browser wallet (existing method)
      if (!window.ethereum) {
        throw new Error('Browser wallet (like MetaMask) is not installed.');
      }
      
      viemClient = createWalletClient({
        account: account as `0x${string}`,
        chain: avalanche, // Updated
        transport: custom(window.ethereum),
      });
    }

    const bundlerUrl = import.meta.env.VITE_0XGASLESS_BUNDLER_URL;
    if (!bundlerUrl) {
      throw new Error('Missing environment variable: VITE_0XGASLESS_BUNDLER_URL is not set.');
    }

    // Create smart account as per 0xGasless docs
    const smartAccount = await create0xGaslessSmartAccountClient({
      signer: viemClient,
      bundlerUrl,
      chainId: avalanche.id, // Updated - Explicitly add chainId
    });

    const accountAddress = await smartAccount.getAccountAddress();

    // For 0xGasless, we use a fixed walletNumber and index as it's a single deterministic account
    const walletNumber = 0;
    const index = 0;

    if (!accountData) {
      const newAccountData = { account, name: '', externalAccountNumber, wallets: [] };
      userData.accounts.push(newAccountData);
    }
    const currentAccountData = userData.accounts.find(acc => acc.account.toLowerCase() === account.toLowerCase())!;

    const wallet: Wallet = {
      address: accountAddress,
      walletNumber,
      externalAccountNumber,
      index,
      sdk: '0xgasless',
      transactionStatus: { state: 'idle' },
      balance: await getBalance(accountAddress),
      tokenBalance: await getTokenBalance(accountAddress),
    };

    currentAccountData.wallets.push(wallet);
    saveUserData(userData);

    console.log('Created 0xGasless smart account on Avalanche Mainnet:', {
      address: accountAddress,
      walletNumber,
      sdk: '0xgasless',
      method: privateKey ? 'private-key' : 'browser-wallet'
    });

    return wallet;
  } catch (error) {
    console.error('Failed to create 0xGasless smart account:', error);
    throw new Error(`0xGasless smart account creation failed: ${error}`);
  }
};

// Function to create a wallet from a specific wallet number (works for both random and sequential)
export const createWalletFromNumber = async (
  account: string,
  walletNumber: number,
  externalAccountNumber: number
): Promise<Wallet> => {
  try {
    // Use the deterministic index generation for reproducibility
    const index = await generateDeterministicIndex(walletNumber);
    return await createSmartAccountWithCounter(account, walletNumber, externalAccountNumber);
  } catch (error) {
    console.error('Failed to create wallet from number:', error);
    throw new Error(`Wallet creation from number failed: ${error}`);
  }
};

// Updated sendBiconomyTransaction function
export const sendBiconomyTransaction = async (
  account: string, // EOA address
  walletAddress: string, // Smart account address
  index: number, // Index for reinitializing smart account
  to: string, // Recipient address
  amount: string, // Amount in token units
  tokenType: 'AVAX' | 'USDC' // Token type
): Promise<TransactionStatus> => {
  try {
    if (!isAddress(to)) {
      throw new Error('Invalid recipient address');
    }
    const publicClient = createPublicClient({
      chain: avalanche, // Updated
      transport: http('VITE_AVALANCHE_RPC'),// Updated
    });
    const provider = await getProvider(account);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    if (signerAddress.toLowerCase() !== account.toLowerCase()) {
      throw new Error('Signer address does not match the provided account');
    }
    const bundlerUrl = import.meta.env.VITE_BUNDLER_URL;
    const paymasterApiKey = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY;
    const rpcUrl = import.meta.env.VITE_AVALANCHE_RPC; // Updated
    if (!bundlerUrl || !paymasterApiKey || !rpcUrl) {
      throw new Error(
        'Missing environment variables: Ensure VITE_BUNDLER_URL, VITE_BICONOMY_PAYMASTER_API_KEY, and VITE_AVALANCHE_RPC are set in .env'
      );
    }
    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey: paymasterApiKey,
      chainId: avalanche.id, // Updated
      index,
      rpcUrl,
    });

    let tx;
    if (tokenType === 'AVAX') {
      const amountWei = parseEther(amount);
      if (amountWei <= 0) {
        throw new Error('Amount must be positive');
      }
      const balance = await publicClient.getBalance({ address: walletAddress as `0x${string}` });
      if (balance < amountWei) {
        throw new Error('Insufficient AVAX balance in smart account');
      }
      tx = {
        to,
        value: amountWei,
      };
    } else if (tokenType === 'USDC') {
      const usdcAddress = import.meta.env.VITE_USDC_ADDRESS;
      if (!usdcAddress) {
        throw new Error('USDC address not configured in .env');
      }
      // Convert the amount to Wei (smallest USDC unit) by assuming 6 decimal places
      const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
      if (amountWei <= 0) {
        throw new Error('Amount must be positive');
      }
      const balance = await publicClient.readContract({
        address: usdcAddress,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      }) as bigint;
      if (balance < amountWei) {
        throw new Error('Insufficient USDC balance in smart account');
      }
      tx = {
        to: usdcAddress,
        data: encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [to, amountWei],
        }),
      };
    } else {
      throw new Error('Unsupported token type');
    }

    const { waitForTxHash } = await smartAccount.sendTransaction(tx, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    const { transactionHash } = await waitForTxHash();
    console.log('Transaction sent:', { transactionHash, walletAddress, to, amount, tokenType });

    return {
      state: 'success',
      txHash: transactionHash,
      message: `Transaction successful: https://snowtrace.io/tx/${transactionHash}`, // Updated to mainnet explorer
    };
  } catch (error: any) {
    console.error('Failed to send transaction:', error);
    return {
      state: 'error',
      message: error.message || 'Failed to send transaction',
    };
  }
};

// Add this new function to walletUtils.ts
// Updated send0xGaslessTransaction function
export const send0xGaslessTransaction = async (
  account: string, // EOA address
  walletAddress: string, // Smart account address
  to: string, // Recipient address
  amount: string, // Amount in token units
  tokenType: 'AVAX' | 'USDC', // Token type
  privateKey?: string // Optional private key
): Promise<TransactionStatus> => {
  try {
    if (!isAddress(to)) throw new Error('Invalid recipient address');

    let viemClient;
    
    if (privateKey) {
      // Method 1: Create from private key
      const privateKeyAccount = privateKeyToAccount(privateKey as `0x${string}`);
      viemClient = createWalletClient({
        account: privateKeyAccount,
        chain: avalanche, // Updated
        transport: http(),
      });
      
      // Verify the account matches
      if (viemClient.account.address.toLowerCase() !== account.toLowerCase()) {
        throw new Error('Private key does not match the provided account address');
      }
    } else {
      // Method 2: Use browser wallet
      if (!window.ethereum) {
        throw new Error('Browser wallet (like MetaMask) is not installed.');
      }
      
      viemClient = createWalletClient({
        account: account as `0x${string}`,
        chain: avalanche, // Updated
        transport: custom(window.ethereum),
      });
    }

    const bundlerUrl = import.meta.env.VITE_0XGASLESS_BUNDLER_URL;
    if (!bundlerUrl) {
      throw new Error('Missing VITE_0XGASLESS_BUNDLER_URL');
    }

    // Create smart account as per 0xGasless docs
    const smartAccount = await create0xGaslessSmartAccountClient({
      signer: viemClient,
      bundlerUrl,
      chainId: avalanche.id, // Updated
    });

    // Re-verify the smart account address to be sure
    const derivedAddress = await smartAccount.getAccountAddress();
    if (derivedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error("Signer does not match the provided 0xGasless wallet address.");
    }

    let tx;
    if (tokenType === 'AVAX') {
      const amountWei = parseEther(amount);
      if (amountWei <= 0) throw new Error('Amount must be positive');
      tx = { to, value: amountWei };
    } else if (tokenType === 'USDC') {
      const usdcAddress = import.meta.env.VITE_USDC_ADDRESS;
      if (!usdcAddress) throw new Error('USDC address not configured in .env');
      const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
      if (amountWei <= 0) throw new Error('Amount must be positive');
      tx = {
        to: usdcAddress,
        data: encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [to, amountWei],
        }),
      };
    } else {
      throw new Error('Unsupported token type');
    }

    const userOpResponse = await smartAccount.sendTransaction(tx);
    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log('0xGasless Transaction sent:', { transactionHash, walletAddress, to, amount, tokenType });

    return {
      state: 'success',
      txHash: transactionHash,
      message: `Transaction successful: https://snowtrace.io/tx/${transactionHash}`, // Updated to mainnet explorer
    };
  } catch (error: any) {
    console.error('Failed to send 0xGasless transaction:', error);
    return {
      state: 'error',
      message: error.message || 'Failed to send transaction',
    };
  }
};

// Helper function to validate private key format
export const validatePrivateKey = (privateKey: string): boolean => {
  try {
    // Remove 0x prefix if present
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    
    // Check if it's 64 hex characters
    if (cleanKey.length !== 64) return false;
    
    // Check if it's valid hex
    if (!/^[0-9a-fA-F]+$/.test(cleanKey)) return false;
    
    // Try to create account to validate
    privateKeyToAccount(`0x${cleanKey}`);
    return true;
  } catch {
    return false;
  }
};

// Helper function to get address from private key
export const getAddressFromPrivateKey = (privateKey: string): string => {
  try {
    const cleanKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const account = privateKeyToAccount(cleanKey as `0x${string}`);
    return account.address;
  } catch (error) {
    throw new Error('Invalid private key format');
  }
};