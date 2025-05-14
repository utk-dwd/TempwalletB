import { createSmartAccountClient, PaymasterMode, UserOpResponse } from '@biconomy/account';
import { avalancheFuji } from 'viem/chains';
import { createPublicClient, http, parseEther } from 'viem';
import { keccak256, AbiCoder } from 'ethers';
import { getProvider } from './provider';
import { Wallet } from './types';

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

// Function to get the next incremented wallet number
export const getNextWalletNumber = (): number => {
  const current = parseInt(localStorage.getItem('walletCounter') || '0', 10);
  const next = current + 1;
  localStorage.setItem('walletCounter', next.toString());
  console.log('Incremented wallet number:', next);
  return next;
};

// Function to generate deterministic index for tempwallet
export const generateDeterministicIndex = async (walletNumber: number): Promise<number> => {
  try {
    const signature = await signMessage();
    // Combine signature and wallet number to produce a deterministic index
    const hash = keccak256(
      AbiCoder.defaultAbiCoder().encode(['bytes', 'uint256'], [signature, walletNumber])
    );
    // Convert hash to a number (use first 4 bytes for simplicity)
    const index = parseInt(hash.slice(0, 10), 16);
    console.log('Generated deterministic index:', { signature, walletNumber, index });
    return index;
  } catch (error) {
    console.error('Failed to generate deterministic index:', error);
    throw new Error(`Deterministic index generation failed: ${error}`);
  }
};

// Function to create a tempwallet with incremental wallet number
export const createTempWallet = async (): Promise<Wallet> => {
  try {
    // Debug: Test network connectivity
    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(import.meta.env.VITE_AVALANCHE_FUJI_RPC), // Use CORS-compatible RPC
    });
    const blockNumber = await publicClient.getBlockNumber();
    console.log('Avalanche Fuji Block Number:', blockNumber);

    // Get MetaMask provider and signer
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    console.log('Signer Address:', signerAddress);

    // Load environment variables
    const bundlerUrl = import.meta.env.VITE_BUNDLER_URL;
    const paymasterApiKey = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY;
    const rpcUrl = import.meta.env.VITE_AVALANCHE_FUJI_RPC;

    // Validate environment variables
    if (!bundlerUrl || !paymasterApiKey || !rpcUrl) {
      throw new Error('Missing environment variables: Ensure VITE_BUNDLER_URL, VITE_BICONOMY_PAYMASTER_API_KEY, and VITE_AVALANCHE_FUJI_RPC are set in .env');
    }

    // Generate deterministic index using incremental wallet number
    const walletNumber = getNextWalletNumber();
    const index = await generateDeterministicIndex(walletNumber);

    // Create Biconomy smart account
    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey: paymasterApiKey,
      chainId: avalancheFuji.id,
      index,
      rpcUrl, // Provide RPC URL for chain queries
    });

    // Get the tempwallet address
    const accountAddress = await smartAccount.getAccountAddress();

    const wallet: Wallet = {
      address: accountAddress,
      walletNumber,
    };

    console.log('Created tempwallet:', {
      address: accountAddress,
      walletNumber,
      chainId: avalancheFuji.id,
      signerAddress,
    });

    return wallet;
  } catch (error) {
    console.error('Failed to create tempwallet:', error);
    throw new Error(`Tempwallet creation failed: ${error}`);
  }
};

// Function to create a tempwallet with a specific wallet number
export const createTempWalletWithNumber = async (walletNumber: number): Promise<Wallet> => {
  try {
    // Validate wallet number
    if (!Number.isInteger(walletNumber) || walletNumber < 0) {
      throw new Error('Wallet number must be a non-negative integer');
    }

    // Debug: Test network connectivity
    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(import.meta.env.VITE_AVALANCHE_FUJI_RPC), // Use CORS-compatible RPC
    });
    const blockNumber = await publicClient.getBlockNumber();
    console.log('Avalanche Fuji Block Number:', blockNumber);

    // Get MetaMask provider and signer
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    console.log('Signer Address:', signerAddress);

    // Load environment variables
    const bundlerUrl = import.meta.env.VITE_BUNDLER_URL;
    const paymasterApiKey = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY;
    const rpcUrl = import.meta.env.VITE_AVALANCHE_FUJI_RPC;

    // Validate environment variables
    if (!bundlerUrl || !paymasterApiKey || !rpcUrl) {
      throw new Error('Missing environment variables: Ensure VITE_BUNDLER_URL, VITE_BICONOMY_PAYMASTER_API_KEY, and VITE_AVALANCHE_FUJI_RPC are set in .env');
    }

    // Generate deterministic index using specified wallet number
    const index = await generateDeterministicIndex(walletNumber);

    // Create Biconomy smart account
    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey: paymasterApiKey,
      chainId: avalancheFuji.id,
      index,
      rpcUrl, // Provide RPC URL for chain queries
    });

    // Get the tempwallet address
    const accountAddress = await smartAccount.getAccountAddress();

    const wallet: Wallet = {
      address: accountAddress,
      walletNumber,
    };

    console.log('Created tempwallet with specific wallet number:', {
      address: accountAddress,
      walletNumber,
      chainId: avalancheFuji.id,
      signerAddress,
    });

    return wallet;
  } catch (error) {
    console.error('Failed to create tempwallet with specific wallet number:', error);
    throw new Error(`Tempwallet creation failed: ${error}`);
  }
};

// Function to send AVAX from a tempwallet
export const sendCrypto = async (
  wallet: Wallet,
  recipient: string,
  amount: string // Amount in AVAX (e.g., "0.01")
): Promise<string> => {
  try {
    // Validate inputs
    if (!recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid recipient address');
    }
    const amountWei = parseEther(amount);
    if (amountWei <= 0) {
      throw new Error('Amount must be positive');
    }

    // Debug: Test network connectivity
    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(import.meta.env.VITE_AVALANCHE_FUJI_RPC), // Use CORS-compatible RPC
    });
    const blockNumber = await publicClient.getBlockNumber();
    console.log('Avalanche Fuji Block Number:', blockNumber);

    // Get MetaMask provider and signer
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    console.log('Signer Address:', signerAddress);

    // Load environment variables
    const bundlerUrl = import.meta.env.VITE_BUNDLER_URL;
    const paymasterApiKey = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY;
    const rpcUrl = import.meta.env.VITE_AVALANCHE_FUJI_RPC;

    // Validate environment variables
    if (!bundlerUrl || !paymasterApiKey || !rpcUrl) {
      throw new Error('Missing environment variables: Ensure VITE_BUNDLER_URL, VITE_BICONOMY_PAYMASTER_API_KEY, and VITE_AVALANCHE_FUJI_RPC are set in .env');
    }

    // Generate deterministic index for the tempwallet
    const index = await generateDeterministicIndex(wallet.walletNumber);

    // Create Biconomy smart account
    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey: paymasterApiKey,
      chainId: avalancheFuji.id,
      index,
      rpcUrl, // Provide RPC URL for chain queries
    });

    // Verify the smart account address matches the wallet
    const accountAddress = await smartAccount.getAccountAddress();
    if (accountAddress.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('Smart account address does not match wallet address');
    }

    // Build transaction
    const tx = {
      to: recipient as `0x${string}`,
      value: amountWei,
      data: '0x',
    };

    // Send gasless transaction via user operation
    const userOpResponse: UserOpResponse = await smartAccount.sendTransaction(tx, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });

    // Wait for transaction hash
    const { transactionHash } = await userOpResponse.waitForTxHash();
    if (!transactionHash) {
      throw new Error('Failed to retrieve transaction hash');
    }

    console.log('Sent crypto from tempwallet:', {
      walletAddress: wallet.address,
      walletNumber: wallet.walletNumber,
      recipient,
      amount,
      transactionHash,
    });

    return transactionHash;
  } catch (error) {
    console.error('Failed to send crypto from tempwallet:', error);
    throw new Error(`Crypto send failed: ${error}`);
  }
};