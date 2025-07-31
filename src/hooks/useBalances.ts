// src/hooks/useBalances.ts
import { useQuery } from '@tanstack/react-query'; // You need to install @tanstack/react-query if not already installed
import { supabase } from '../lib/supabaseClient';
import { TokenDetails } from '../utils/types'; // Assuming TokenDetails is defined here

/**
 * Custom hook to fetch balances for a specific temporary wallet from Supabase.
 * @param tempWalletId The Supabase ID of the temporary wallet.
 * @param enabled Boolean to control when the query runs (e.g., only when walletId is available).
 * @returns React Query object with data, isLoading, isError, etc.
 */
export const useBalances = (tempWalletId: string | undefined, enabled: boolean = true) => {
  return useQuery<TokenDetails[], Error>({
    queryKey: ['balances', tempWalletId], // Unique query key based on wallet ID
    queryFn: async () => {
      if (!tempWalletId) {
        throw new Error('tempWalletId is required to fetch balances.');
      }
      try {
        const { data, error } = await supabase
          .from('balances')
          .select('*') // Select all columns for balances
          .eq('temp_wallet_id', tempWalletId); // Filter by the temporary wallet's ID

        if (error) {
          console.error('Fetch balances error from Supabase:', error.message);
          throw error;
        }

        // Map the Supabase data to your TokenDetails interface
        return (data || []).map(b => ({
          address: b.token_address as `0x${string}`,
          chainId: b.chain_id,
          amount: b.amount,
          decimals: b.decimals,
          formattedAmount: b.formatted_amount,
          symbol: b.symbol,
          iconUrl: undefined, // Zerion provides icon, but not stored in DB currently.
        }));
      } catch (error: any) {
        console.error(`Error fetching balances for wallet ID ${tempWalletId}:`, error.message);
        throw error;
      }
    },
    enabled: !!tempWalletId && enabled, // Only run query if tempWalletId is provided and enabled is true
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    refetchOnWindowFocus: false, // Prevents refetching on window focus
  });
};