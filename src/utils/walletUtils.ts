// src/utils/walletUtils.ts
import { createSmartAccountClient, PaymasterMode } from '@biconomy/account';
import { createPublicClient, http, isAddress, formatUnits, parseUnits, encodeFunctionData } from 'viem';
import { keccak256, AbiCoder } from 'ethers';
import { getProvider } from './provider';
import { Wallet, TransactionStatus, TokenDetails } from './types'; // Removed UserData as it's no longer sourced from localStorage
import { NetworkConfig } from './networks';
import analyticsService from '../services/analytics';
import { EventName } from './types';
import { supabase } from '../lib/supabaseClient'; // Import supabase client

const CONSTANT_MESSAGE = 'You are creating a new tempwallet, this will not cost you anything'; // Retained as per your request

export const signMessage = async (network: NetworkConfig): Promise<string> => {
  try {
    const provider = await getProvider(network);
    const signer = await provider.getSigner();
    return await signer.signMessage(CONSTANT_MESSAGE); // Using CONSTANT_MESSAGE without nonce
  } catch (error) {
    console.error('Failed to sign message:', error);
    throw new Error(`Message signing failed: ${error}`);
  }
};

// Removed getUserData as data is now fetched from Supabase
// export const getUserData = (): UserData => { ... };

// This function estimates gas fees
const estimateGasFeeInToken = async (
  smartAccount: any,
  tx: any,
  tokenAddress: string,
  tokenDecimals: number
): Promise<bigint> => {
  try {
    const gasEstimate = await smartAccount.estimateUserOperationGas({
      userOperation: await smartAccount.buildUserOperation([tx]),
    });
    return parseUnits("5", tokenDecimals);
  } catch (error) {
    console.warn('Could not estimate gas fee, using default reserve');
    return parseUnits("10", tokenDecimals);
  }
};

// Removed saveUserData as data is now saved to Supabase
// const saveUserData = (userData: UserData) => { ... };

const ERC20_ABI = [
  { name: 'balanceOf', inputs: [{ type: 'address', name: 'account' }], outputs: [{ type: 'uint256', name: '' }], stateMutability: 'view', type: 'function' },
  { name: 'transfer', inputs: [{ type: 'address', name: 'recipient' }, { type: 'uint256', name: 'amount' }], outputs: [{ type: 'bool', name: '' }], stateMutability: 'nonpayable', type: 'function' },
  { name: 'decimals', inputs: [], outputs: [{ type: 'uint8', name: '' }], stateMutability: 'view', type: 'function' },
  { name: 'symbol', inputs: [], outputs: [{ type: 'string', name: '' }], stateMutability: 'view', type: 'function' },
];

const getNextWalletNumber = (account: string): number => {
  // This counter is still local because it tracks the next *proposed* wallet number
  // The actual persistence is handled by the backend
  if (!account || !/^0x[a-fA-F0-9]{40}$/.test(account)) throw new Error(`Invalid account address: ${account}`);
  const key = `walletCounter_${account.toLowerCase()}`;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  const next = current + 1;
  localStorage.setItem(key, next.toString());
  return next;
};

const generateDeterministicIndex = async (walletNumber: number, network: NetworkConfig): Promise<number> => {
  try {
    const signature = await signMessage(network); // No nonce argument
    const hash = keccak256(AbiCoder.defaultAbiCoder().encode(['bytes', 'uint256'], [signature, walletNumber]));
    return parseInt(hash.slice(2, 10), 16);
  } catch (error) {
    console.error('Failed to generate deterministic index:', error);
    throw new Error(`Deterministic index generation failed: ${error}`);
  }
};

export const generateRandomIndex = async (network: NetworkConfig): Promise<{ index: number, walletNumber: number }> => {
  try {
    const signature = await signMessage(network); // No nonce argument
    const timestamp = Date.now();
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    const hash = keccak256(AbiCoder.defaultAbiCoder().encode(['bytes', 'uint256', 'uint32'], [signature, timestamp, randomBytes[0]]));
    const walletNumber = 1000 + (parseInt(hash.slice(10, 18), 16) % 999000);
    const indexHash = keccak256(AbiCoder.defaultAbiCoder().encode(['bytes', 'uint256'], [signature, walletNumber]));
    const index = parseInt(indexHash.slice(2, 10), 16);
    return { index, walletNumber };
  } catch (error) {
    console.error('Failed to generate random index:', error);
    throw new Error(`Random index generation failed: ${error}`);
  }
};

const ZERION_API_KEY = import.meta.env.VITE_ZERION_API_KEY;

export const fetchWalletAllBalances = async (address: string, network: NetworkConfig): Promise<TokenDetails[]> => {
  try {
    const originalUrl = `https://api.zerion.io/v1/wallets/${address}/positions/?filter[chain_ids]=${network.zerionChainId}&sort=value`;
    const proxyUrl = `/api/cors-proxy?url=${encodeURIComponent(originalUrl)}&authorization=${encodeURIComponent(`Basic ${btoa(ZERION_API_KEY + ':')}`)}`;
    
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Zerion API request failed with status ${response.status}`);
    }

    const { data } = await response.json();

    return data.map((position: any): TokenDetails | null => {
      if (!position.attributes.fungible_info?.implementations) {
        return null;
      }
      
      const implementations = position.attributes.fungible_info.implementations;

      const correctImplementation = implementations.find(
        (impl: any) => impl.chain_id === network.zerionChainId
      );
      
      const tokenAddress = correctImplementation?.address ?? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      

      return {
        address: tokenAddress,
        chainId: network.chainId,
        amount: position.attributes.quantity.int,
        decimals: position.attributes.quantity.decimals,
        formattedAmount: formatUnits(BigInt(position.attributes.quantity.int), position.attributes.quantity.decimals),
        symbol: position.attributes.fungible_info.symbol,
        iconUrl: position.attributes.fungible_info.icon?.url
      };
    }).filter((token: TokenDetails | null): token is TokenDetails => token !== null) ;
  } catch (error) {
    console.error('Failed to fetch token balances from Zerion:', error);
    return [];
  }
};

/**
 * Saves a new or updated wallet's details to the Supabase database via the Edge Function.
 * @param wallet The wallet object to save.
 * @param metamask_address The parent MetaMask address.
 * @returns The data returned from the Supabase insert/update operation, including the new wallet's ID.
 */
async function syncWalletToBackend(wallet: Wallet, metamask_address: string) {
  try {
    // Get the current Supabase session token for authorization
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;

    if (!accessToken) {
      throw new Error('No Supabase session found. User not authenticated.');
    }

    const response = await fetch('/functions/v1/temp-wallets', { // Call the deployed Edge Function
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}` // Use the Supabase session token
      },
      body: JSON.stringify({
        address: wallet.address,
        wallet_number: wallet.walletNumber,
        external_account_number: wallet.externalAccountNumber,
        index: wallet.index,
        network_key: wallet.networkKey,
        parent_metamask_address: metamask_address,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Failed to sync wallet to backend: ${errorBody.error || response.statusText}`);
    }
    const data = await response.json();
    console.log('Wallet synced to backend:', data);
    return data; // Return the full response data, which should include the wallet's Supabase ID
  } catch (error: any) {
    console.error('Backend sync failed for wallet:', wallet.address, error.message);
    throw error;
  }
}

/**
 * Saves the given token balances to the Supabase 'balances' table.
 * @param tempWalletId The ID of the temp_wallet the balances belong to.
 * @param balances An array of TokenDetails.
 */
async function saveBalancesToSupabase(tempWalletId: string, balances: TokenDetails[]) {
  try {
    const balancesToInsert = balances.map(balance => ({
      temp_wallet_id: tempWalletId,
      token_address: balance.address.toLowerCase(),
      chain_id: balance.chainId,
      amount: balance.amount,
      decimals: balance.decimals,
      formatted_amount: balance.formattedAmount,
      symbol: balance.symbol || 'N/A',
      last_updated: new Date().toISOString(),
    }));

    // Use upsert to handle updates for existing token balances and inserts for new ones
    const { error } = await supabase
      .from('balances')
      .upsert(balancesToInsert, { onConflict: 'temp_wallet_id,token_address,chain_id', ignoreDuplicates: false });

    if (error) {
      console.error('Error saving balances to Supabase:', error.message);
      throw error;
    }
    console.log('Balances saved/updated in Supabase for wallet ID:', tempWalletId);
  } catch (error: any) {
    console.error('Failed to save balances to Supabase:', error.message);
  }
}

const createSmartAccountBase = async (
  account: string,
  walletNumber: number,
  externalAccountNumber: number,
  network: NetworkConfig,
  isRandom: boolean = false
): Promise<Wallet> => {
  try {
      analyticsService.trackEvent(EventName.WALLET_CREATION_STARTED, {
          creationType: isRandom ? 'random' : 'deterministic',
          walletNumber,
          networkName: network.name,
      });

      if (!Number.isInteger(walletNumber) || walletNumber < 0) {
          throw new Error('Wallet number must be a non-negative integer');
      }

      const provider = await getProvider(network, account);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== account.toLowerCase()) {
          throw new Error('Signer address does not match the provided account');
      }

      const bundlerUrl = import.meta.env.VITE_BUNDLER_URL;
      if (!bundlerUrl || !network.paymasterApiKey || !network.rpcUrl) {
          throw new Error(`Missing environment variables for ${network.name}`);
      }
      
      const { index } = isRandom 
          ? await generateRandomIndex(network) // No nonce argument
          : { index: await generateDeterministicIndex(walletNumber, network) }; // No nonce argument

      const smartAccount = await createSmartAccountClient({
          signer,
          bundlerUrl,
          biconomyPaymasterApiKey: network.paymasterApiKey,
          chainId: network.chainId,
          index,
          rpcUrl: network.rpcUrl,
      });

      const accountAddress = await smartAccount.getAccountAddress();
      
      const initialBalances = await fetchWalletAllBalances(accountAddress, network);

      // Create a temporary wallet object for the frontend and for syncing
      const wallet: Wallet = {
          address: accountAddress,
          walletNumber,
          externalAccountNumber,
          index,
          networkKey: network.name as keyof typeof import('../utils/networks').NETWORKS,
          transactionStatus: { state: 'idle' },
          allTokenBalances: initialBalances,
          balance: initialBalances.find(t => t.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')?.formattedAmount || '0'
      };

      // Sync the new wallet to the Supabase backend and get its DB ID
      const syncedWalletData = await syncWalletToBackend(wallet, account);
      
      if (syncedWalletData && syncedWalletData.id) {
          wallet.id = syncedWalletData.id; // Assign the Supabase ID to the wallet object
          await saveBalancesToSupabase(syncedWalletData.id, initialBalances); // Save balances using the Supabase ID
      } else {
          console.warn('Wallet not synced to backend or missing ID, balances not saved to Supabase.');
      }

      analyticsService.trackEvent(EventName.WALLET_CREATION_SUCCESS, {
          walletAddress: accountAddress,
          walletNumber,
          index,
          networkName: network.name,
      });

      console.log(`Created smart account on ${network.name}:`, { address: accountAddress, walletNumber, id: wallet.id });
      return wallet;
  } catch (error) {
      analyticsService.trackEvent(EventName.WALLET_CREATION_FAILED, {
          errorMessage: String(error),
          creationType: isRandom ? 'random' : 'deterministic',
      });

      console.error('Failed to create smart account:', error);
      throw new Error(`Smart account creation failed: ${error}`);
  }
};

export const createSmartAccount = async (account: string, externalAccountNumber: number, network: NetworkConfig): Promise<Wallet> => {
    const walletNumber = getNextWalletNumber(account);
    return createSmartAccountBase(account, walletNumber, externalAccountNumber, network);
};

export const createSmartAccountWithCounter = async (account: string, walletNumber: number, externalAccountNumber: number, network: NetworkConfig): Promise<Wallet> => {
    return createSmartAccountBase(account, walletNumber, externalAccountNumber, network);
};

export const createRandomSmartAccount = async (account: string, externalAccountNumber: number, network: NetworkConfig): Promise<Wallet> => {
    const { walletNumber } = await generateRandomIndex(network); // No nonce argument
    // The local storage `getUserData` and `existingWallet` check removed here, as database handles uniqueness
    return createSmartAccountBase(account, walletNumber, externalAccountNumber, network, true);
};

export const sendTransaction = async (
  account: string,
  wallet: Wallet,
  to: string,
  amount: string,
  tokenDetails: TokenDetails,
  network: NetworkConfig
): Promise<TransactionStatus> => {
  try {
    analyticsService.trackEvent(EventName.TRANSACTION_INITIATED, {
      fromWalletAddress: wallet.address,
      tokenSymbol: tokenDetails.symbol,
      tokenAddress: tokenDetails.address,
      networkName: network.name,
    });

    if (!isAddress(to)) throw new Error('Invalid recipient address');

    analyticsService.trackEvent(EventName.TRANSACTION_VALIDATION_STARTED);

    const provider = await getProvider(network, account);
    const signer = await provider.getSigner();
    if ((await signer.getAddress()).toLowerCase() !== account.toLowerCase()) {
      throw new Error('Signer address does not match the provided account');
    }

    const bundlerUrl = import.meta.env.VITE_BUNDLER_URL;
    const paymasterApiKey = network.paymasterApiKey;
    const rpcUrl = network.rpcUrl;

    if (!bundlerUrl || !paymasterApiKey || !rpcUrl || !network.chainId) {
      throw new Error(
        `Missing configuration for ${network.name}: Ensure VITE_BUNDLER_URL, paymasterApiKey, rpcUrl, and chainId are set`
      );
    }

    const publicClient = createPublicClient({
      chain: network.viemChain,
      transport: http(rpcUrl),
    });

    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey: paymasterApiKey,
      chainId: network.chainId,
      index: wallet.index,
      rpcUrl,
    });

    let tx;
    let paymasterServiceData: any;
    let successMessage: string;
    const isNativeToken = tokenDetails.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const amountWei = parseUnits(amount, tokenDetails.decimals);

    if (amountWei <= 0) throw new Error('Amount must be positive');

    if (isNativeToken) {
      const balance = await publicClient.getBalance({ address: wallet.address as `0x${string}` });
      if (balance < amountWei) {
        throw new Error(`Insufficient ${network.currencySymbol} balance in smart account`);
      }
      tx = { to, value: amountWei };
      paymasterServiceData = { mode: PaymasterMode.SPONSORED };
      successMessage = `${network.currencySymbol} transaction sponsored successfully!`;
    } else {
      console.log('🔍 Token Details:', {
        address: tokenDetails.address,
        symbol: tokenDetails.symbol,
        decimals: tokenDetails.decimals,
        sendingAmount: amount,
        amountWei: amountWei.toString()
      });

      if (!isAddress(tokenDetails.address)) {
        throw new Error(`Invalid token address: ${tokenDetails.address}`);
      }

      const balance = await publicClient.readContract({
        address: tokenDetails.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [wallet.address],
      }) as bigint;

      console.log('💰 Balance Check:', {
        currentBalance: balance.toString(),
        formattedBalance: formatUnits(balance, tokenDetails.decimals),
        requiredAmount: amountWei.toString(),
        formattedRequired: amount
      });

      if (balance < amountWei) {
        throw new Error(`Insufficient ${tokenDetails.symbol} balance. Have: ${formatUnits(balance, tokenDetails.decimals)}, Need: ${amount}`);
      }

      const estimatedGasFee = await estimateGasFeeInToken(smartAccount, {
        to: tokenDetails.address as `0x${string}`,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [to, amountWei],
        }),
      }, tokenDetails.address, tokenDetails.decimals);

      console.log('⛽ Gas Fee Estimation:', {
        estimatedGasFee: estimatedGasFee.toString(),
        formattedGasFee: formatUnits(estimatedGasFee, tokenDetails.decimals),
        totalNeeded: (amountWei + estimatedGasFee).toString(),
        formattedTotalNeeded: formatUnits(amountWei + estimatedGasFee, tokenDetails.decimals)
      });

      const totalNeeded = amountWei + estimatedGasFee;
      if (balance < totalNeeded) {
        console.log('❌ Insufficient balance for ERC20 gas payment, falling back to SPONSORED mode');
        
        tx = {
          to: tokenDetails.address as `0x${string}`,
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [to, amountWei],
          }),
        };
        paymasterServiceData = { mode: PaymasterMode.SPONSORED };
        successMessage = `${tokenDetails.symbol} transaction sponsored successfully!`;
      } else {
        tx = {
          to: tokenDetails.address as `0x${string}`,
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [to, amountWei],
          }),
        };
        paymasterServiceData = { 
          mode: PaymasterMode.ERC20, 
          preferredToken: tokenDetails.address 
        };
        successMessage = `Transaction fee paid with ${tokenDetails.symbol}!`;
      }
    }

    console.log('📤 Transaction Config:', {
      paymasterMode: paymasterServiceData.mode,
      preferredToken: paymasterServiceData.preferredToken,
      network: network.name
    });

    analyticsService.trackEvent(EventName.TRANSACTION_MODE_SELECTED, {
      paymasterMode: paymasterServiceData.mode,
      preferredToken: paymasterServiceData.preferredToken,
    });

    const { waitForTxHash } = await smartAccount.sendTransaction(tx, { paymasterServiceData });
    const { transactionHash } = await waitForTxHash();
    
    analyticsService.trackEvent(EventName.TRANSACTION_SUCCESS, {
      transactionHash,
      fromWalletAddress: wallet.address,
      tokenSymbol: tokenDetails.symbol,
      networkName: network.name,
    });

    console.log('✅ Transaction Success:', {
      hash: transactionHash,
      wallet: wallet.address,
      to,
      amount,
      token: tokenDetails.symbol
    });

    try {
      // Save successful transaction to Supabase 'transactions' table
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          temp_wallet_id: wallet.id, // Ensure wallet.id is available from Supabase
          tx_hash: transactionHash,
          state: 'success',
          message: successMessage,
          token_symbol: tokenDetails.symbol,
          amount: amount,
          to_address: to,
        });
      if (error) {
        console.error('Failed to save transaction to Supabase:', error.message);
      }
    } catch (dbError) {
      console.error('Error saving transaction to database:', dbError);
    }

    return {
      state: 'success',
      txHash: transactionHash,
      message: successMessage,
    };
  } catch (error: any) {
    analyticsService.trackEvent(EventName.TRANSACTION_FAILED, {
      errorMessage: error.message || 'Failed to send transaction',
      fromWalletAddress: wallet.address,
      tokenSymbol: tokenDetails.symbol,
    });

    console.error('❌ Transaction Failed:', error);
    
    let errorMessage = error.message || 'Failed to send transaction';
    
    if (errorMessage.includes('AA33') && errorMessage.includes('not have enough token balance')) {
      errorMessage = `Insufficient ${tokenDetails.symbol} balance to pay gas fees. Try with a smaller amount or add more ${tokenDetails.symbol} to your wallet.`;
    } else if (errorMessage.includes('AA33')) {
      errorMessage = 'Transaction failed due to insufficient gas token balance. Try using sponsored mode.';
    }
    
    try {
      // Save failed transaction to Supabase 'transactions' table
      const { data, error: dbError } = await supabase
        .from('transactions')
        .insert({
          temp_wallet_id: wallet.id, // Ensure wallet.id is available from Supabase
          tx_hash: 'N/A', // No hash for transactions that failed before submission
          state: 'error',
          message: errorMessage,
          token_symbol: tokenDetails.symbol,
          amount: amount,
          to_address: to,
        });
      if (dbError) {
        console.error('Failed to save failed transaction to Supabase:', dbError.message);
      }
    } catch (e) {
      console.error('Error saving failed transaction to database:', e);
    }

    return { 
      state: 'error', 
      message: errorMessage 
    };
  }
};