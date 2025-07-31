// src/components/layout/MainContent.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Added useCallback, useMemo
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NetworkConfig, NETWORKS } from '@/utils/networks';
import { Wallet, TransactionStatus, TokenDetails, SupportedNetwork } from '@/utils/types';
import { createRandomSmartAccount, createSmartAccount, createSmartAccountWithCounter, sendTransaction } from '@/utils/walletUtils';
import { ChevronRight, PlusCircle, Trash2, Wallet as WalletIcon, Coins, Loader2, RefreshCw } from 'lucide-react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useBalances } from '@/hooks/useBalances'; // Import the new hook
import { supabase } from '@/lib/supabaseClient'; // Import supabase client


interface MainContentProps {
  walletAddress: string | null;
  wallets: Wallet[];
  onWalletCreated: (wallet: Wallet) => void;
  onWalletDeleted: (walletId: string) => void; // Changed to walletId
  onTransactionSent: (wallet: Wallet, status: TransactionStatus) => void;
  setNotification: (notification: { brief: string; full: string; type: 'error' | 'success' } | null) => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  walletAddress,
  wallets,
  onWalletCreated,
  onWalletDeleted,
  onTransactionSent,
  setNotification,
}) => {
  const [newWalletNumber, setNewWalletNumber] = useState<string>('');
  const [selectedNetworkKey, setSelectedNetworkKey] = useState<SupportedNetwork>('Avalanche');
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendToAddress, setSendToAddress] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<TokenDetails | null>(null);
  const [isRefreshingAllBalances, setIsRefreshingAllBalances] = useState<boolean>(false); // New state for refreshing all


  // Memoize the network config for the selected network key
  const selectedNetwork = useMemo(() => NETWORKS[selectedNetworkKey], [selectedNetworkKey]);

  // Handle selected wallet change
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0]);
    } else if (selectedWallet && !wallets.some(w => w.id === selectedWallet.id)) { // Check by ID
      // If selected wallet was deleted, default to first available or null
      setSelectedWallet(wallets.length > 0 ? wallets[0] : null);
    }
  }, [wallets, selectedWallet]);

  // Use the useBalances hook for the selected wallet's balances
  // This will give real-time updates from Supabase
  const { data: currentWalletBalances, isLoading: isLoadingBalances, refetch: refetchCurrentWalletBalances } = useBalances(selectedWallet?.id, !!selectedWallet?.id);

  // Update selectedToken if selectedWallet or its balances change
  useEffect(() => {
    if (currentWalletBalances && currentWalletBalances.length > 0) {
      // Prioritize native token, otherwise first available
      const nativeToken = currentWalletBalances.find(t => t.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
      setSelectedToken(nativeToken || currentWalletBalances[0]);
    } else {
      setSelectedToken(null);
    }
  }, [currentWalletBalances]);


  const handleCreateWallet = async (type: 'random' | 'deterministic' | 'counter') => {
    if (!walletAddress) {
      setNotification({ brief: 'Wallet not connected', full: 'Please connect your MetaMask wallet first.', type: 'error' });
      return;
    }

    try {
      let newWallet: Wallet;
      const externalAccountNumber = 1; // Assuming primary MetaMask account is external account 1

      if (type === 'random') {
        newWallet = await createRandomSmartAccount(walletAddress, externalAccountNumber, selectedNetwork);
      } else if (type === 'deterministic') {
        if (!newWalletNumber || isNaN(parseInt(newWalletNumber))) {
          setNotification({ brief: 'Invalid number', full: 'Please enter a valid wallet number for deterministic creation.', type: 'error' });
          return;
        }
        newWallet = await createSmartAccountWithCounter(walletAddress, parseInt(newWalletNumber), externalAccountNumber, selectedNetwork);
      } else { // 'counter'
        newWallet = await createSmartAccount(walletAddress, externalAccountNumber, selectedNetwork);
      }

      onWalletCreated(newWallet);
      setSelectedWallet(newWallet); // Automatically select the new wallet
      setNewWalletNumber(''); // Clear input
      setNotification({ brief: 'Wallet Created', full: `New temporary wallet ${newWallet.address.slice(0, 6)}... created successfully!`, type: 'success' });
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      setNotification({ brief: 'Wallet Creation Failed', full: error.message || 'Failed to create temporary wallet.', type: 'error' });
    }
  };

  const handleDeleteWallet = async (wallet: Wallet) => {
    if (!wallet.id) { // Ensure wallet has a Supabase ID
      setNotification({ brief: 'Error', full: 'Cannot delete wallet: Missing database ID.', type: 'error' });
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to delete wallet ${wallet.address}? This cannot be undone.`);
    if (!confirmDelete) return;

    try {
      onWalletDeleted(wallet.id); // Pass wallet ID for deletion
      setNotification({ brief: 'Deleting Wallet', full: `Attempting to delete wallet ${wallet.address.slice(0, 6)}...`, type: 'success' });
    } catch (error: any) {
      console.error('Error deleting wallet:', error);
      setNotification({ brief: 'Wallet Deletion Failed', full: error.message || 'Failed to delete temporary wallet.', type: 'error' });
    }
  };

  const handleSendTransaction = async () => {
    if (!selectedWallet || !sendToAddress || !sendAmount || !selectedToken) {
      setNotification({ brief: 'Missing Info', full: 'Please fill all transaction fields.', type: 'error' });
      return;
    }
    if (!walletAddress) {
      setNotification({ brief: 'Wallet Not Connected', full: 'Please connect your MetaMask wallet.', type: 'error' });
      return;
    }

    setIsSending(true);
    setNotification({ brief: 'Sending Transaction', full: `Sending ${sendAmount} ${selectedToken.symbol} to ${sendToAddress.slice(0, 6)}...`, type: 'success' });

    try {
      const status = await sendTransaction(walletAddress, selectedWallet, sendToAddress, sendAmount, selectedToken, selectedNetwork);
      onTransactionSent(selectedWallet, status);
      setNotification({ brief: status.state === 'success' ? 'Transaction Success' : 'Transaction Failed', full: status.message || '', type: status.state === 'success' ? 'success' : 'error' });
      setSendToAddress('');
      setSendAmount('');
      // Refetch balances after successful transaction to update UI
      refetchCurrentWalletBalances(); 
    } catch (error: any) {
      console.error('Transaction error:', error);
      const errorMessage = error.message || 'Failed to send transaction.';
      setNotification({ brief: 'Transaction Failed', full: errorMessage, type: 'error' });
      onTransactionSent(selectedWallet, { state: 'error', message: errorMessage });
    } finally {
      setIsSending(false);
    }
  };

  // Function to refresh all wallet balances for the current user
  const handleRefreshAllBalances = async () => {
    if (!walletAddress) {
      setNotification({ brief: 'Wallet not connected', full: 'Please connect your MetaMask wallet first.', type: 'error' });
      return;
    }
    setIsRefreshingAllBalances(true);
    setNotification({ brief: 'Refreshing Balances', full: 'Fetching latest balances for all your wallets...', type: 'success' });

    try {
      const { data: currentWallets, error: fetchError } = await supabase
        .from('temp_wallets')
        .select('*')
        .eq('parent_metamask_address', walletAddress.toLowerCase())
        .is('deleted_at', null);

      if (fetchError) throw fetchError;

      const balancePromises = (currentWallets || []).map(async (tempWallet) => {
        const network = NETWORKS[tempWallet.network_key as SupportedNetwork];
        if (!network) {
          console.warn(`Unknown network key: ${tempWallet.network_key} for wallet ${tempWallet.address}`);
          return;
        }
        const fetchedBalances = await sendTransaction(
          walletAddress,
          {
            ...tempWallet, // Pass existing wallet data from DB fetch
            address: tempWallet.address as `0x${string}`,
            networkKey: tempWallet.network_key as SupportedNetwork,
            walletNumber: tempWallet.wallet_number,
            externalAccountNumber: tempWallet.external_account_number,
            allTokenBalances: [], // Placeholder, actual balances fetched below
            balance: '0', // Placeholder
          },
          '0x0000000000000000000000000000000000000000', // Dummy to address
          '0', // Dummy amount
          { address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', chainId: network.chainId, amount: '0', decimals: 18, formattedAmount: '0', symbol: 'ETH' }, // Dummy token details
          network
        );
        // We will need to re-fetch from Zerion and update Supabase
        const allFetchedBalances = await (await import('@/utils/walletUtils')).fetchWalletAllBalances(tempWallet.address, network);
        
        // This is a simplified direct update. In a real app, you'd have a specific Edge Function
        // or backend service to update balances safely. For this example, we'll do direct supabase update.
        const balancesToInsert = allFetchedBalances.map(balance => ({
          temp_wallet_id: tempWallet.id,
          token_address: balance.address.toLowerCase(),
          chain_id: balance.chainId,
          amount: balance.amount,
          decimals: balance.decimals,
          formatted_amount: balance.formattedAmount,
          symbol: balance.symbol || 'N/A',
          last_updated: new Date().toISOString(),
        }));

        const { error: upsertError } = await supabase
          .from('balances')
          .upsert(balancesToInsert, { onConflict: 'temp_wallet_id,token_address,chain_id', ignoreDuplicates: false });

        if (upsertError) {
          console.error(`Error upserting balances for wallet ${tempWallet.address}:`, upsertError.message);
        }
      });

      await Promise.allSettled(balancePromises); // Wait for all balance updates
      setNotification({ brief: 'Balances Refreshed', full: 'All wallet balances updated successfully!', type: 'success' });
      refetchCurrentWalletBalances(); // Refetch balances for the currently selected wallet
    } catch (error: any) {
      console.error('Error refreshing all balances:', error);
      setNotification({ brief: 'Refresh Failed', full: error.message || 'Failed to refresh all wallet balances.', type: 'error' });
    } finally {
      setIsRefreshingAllBalances(false);
    }
  };


  if (!walletAddress) {
    return (
      <Card className="flex-1 flex flex-col items-center justify-center bg-background/50 backdrop-blur-md border border-white/20 rounded-xl p-8 text-center">
        <h2 className="text-3xl font-bold text-text-primary mb-4">Connect Wallet to Get Started</h2>
        <p className="text-lg text-text-secondary mb-6">Please connect your MetaMask wallet to create and manage temporary wallets.</p>
        {/* The Header component handles the actual connect wallet button, so no button here */}
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
      {/* Left Column: Wallet Management */}
      <Card className="flex flex-col bg-background/50 backdrop-blur-md border border-white/20 rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-text-primary">Your Wallets</CardTitle>
          <Button onClick={handleRefreshAllBalances} disabled={isRefreshingAllBalances} className="text-xs px-2 py-1 h-auto">
            {isRefreshingAllBalances ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
            Refresh All
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {wallets.length === 0 ? (
            <p className="text-text-secondary">No temporary wallets created yet.</p>
          ) : (
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id} // Use Supabase ID as key
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedWallet?.id === wallet.id ? 'bg-primary/20 border border-primary text-primary-foreground' : 'bg-card/30 hover:bg-card/50 text-text-primary border border-transparent'
                  }`}
                  onClick={() => setSelectedWallet(wallet)}
                >
                  <div className="flex items-center gap-3">
                    <WalletIcon className="h-5 w-5" />
                    <div>
                      <p className="font-medium text-sm">
                        Wallet #{wallet.walletNumber} ({wallet.networkKey})
                      </p>
                      <p className="text-xs text-text-secondary">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-text-secondary hover:text-danger-red"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      handleDeleteWallet(wallet);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 mt-4">
          <div className="flex w-full gap-2">
            <Input
              placeholder="Deterministic # (optional)"
              type="number"
              value={newWalletNumber}
              onChange={(e) => setNewWalletNumber(e.target.value)}
              className="flex-1 bg-input-background text-text-primary border-input-border"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-text-primary border-input-border">
                  {selectedNetwork.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-dropdown-background border-dropdown-border">
                <DropdownMenuLabel className="text-text-secondary">Select Network</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-dropdown-separator" />
                {Object.values(NETWORKS).map((network) => (
                  <DropdownMenuItem
                    key={network.chainId}
                    onSelect={() => setSelectedNetworkKey(network.name as SupportedNetwork)}
                    className="text-text-primary hover:bg-accent-orange/20"
                  >
                    {network.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full">
            <Button
              onClick={() => handleCreateWallet('random')}
              disabled={!walletAddress}
              className="w-full bg-primary text-primary-foreground hover:bg-[#3C3AB4] hover:scale-[1.02] transition-transform"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Random
            </Button>
            <Button
              onClick={() => handleCreateWallet('counter')}
              disabled={!walletAddress}
              className="w-full bg-primary text-primary-foreground hover:bg-[#3C3AB4] hover:scale-[1.02] transition-transform"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Next Seq.
            </Button>
          </div>
          <Button
            onClick={() => handleCreateWallet('deterministic')}
            disabled={!walletAddress || !newWalletNumber}
            className="w-full bg-primary text-primary-foreground hover:bg-[#3C3AB4] hover:scale-[1.02] transition-transform"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Deterministic
          </Button>
        </CardFooter>
      </Card>

      {/* Right Column: Selected Wallet Details & Send */}
      <div className="flex flex-col gap-6">
        {selectedWallet ? (
          <>
            <Card className="bg-background/50 backdrop-blur-md border border-white/20 rounded-xl">
              <CardHeader>
                <CardTitle className="text-text-primary">
                  Selected Wallet ({selectedWallet.networkKey})
                </CardTitle>
                <CardDescription className="text-text-secondary">
                  {selectedWallet.address}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-text-primary">
                  <WalletIcon className="h-5 w-5" />
                  <p>Wallet Number: {selectedWallet.walletNumber}</p>
                </div>
                <div className="flex items-center gap-2 text-text-primary">
                  <Coins className="h-5 w-5" />
                  <p>Balances:</p>
                  {isLoadingBalances ? (
                    <span className="flex items-center text-text-secondary">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading balances...
                    </span>
                  ) : (
                    <div className="space-y-1">
                      {currentWalletBalances && currentWalletBalances.length > 0 ? (
                        currentWalletBalances.map((token) => (
                          <div key={token.address} className="flex items-center gap-2 text-text-primary text-sm">
                            {token.iconUrl && <img src={token.iconUrl} alt={token.symbol} className="h-4 w-4 rounded-full" />}
                            <span>{token.formattedAmount} {token.symbol}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-text-secondary text-sm">No balances found.</p>
                      )}
                    </div>
                  )}
                </div>
                {selectedWallet.transactionStatus && (
                  <div className={`flex items-center gap-2 text-sm font-medium ${selectedWallet.transactionStatus.state === 'success' ? 'text-success-green' : 'text-danger-red'}`}>
                    {selectedWallet.transactionStatus.state === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span>Tx Status: {selectedWallet.transactionStatus.message || selectedWallet.transactionStatus.state}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-background/50 backdrop-blur-md border border-white/20 rounded-xl">
              <CardHeader>
                <CardTitle className="text-text-primary">Send Transaction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="to-address" className="text-text-primary">To Address</Label>
                  <Input
                    type="text"
                    id="to-address"
                    placeholder="0x..."
                    value={sendToAddress}
                    onChange={(e) => setSendToAddress(e.target.value)}
                    className="bg-input-background text-text-primary border-input-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="amount" className="text-text-primary">Amount</Label>
                    <Input
                      type="number"
                      id="amount"
                      placeholder="0.0"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="bg-input-background text-text-primary border-input-border"
                    />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="token" className="text-text-primary">Token</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between text-text-primary border-input-border">
                          {selectedToken ? (
                            <>
                              {selectedToken.iconUrl && <img src={selectedToken.iconUrl} alt={selectedToken.symbol} className="h-5 w-5 rounded-full mr-2" />}
                              {selectedToken.symbol}
                            </>
                          ) : (
                            "Select Token"
                          )}
                          <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[calc(var(--radix-dropdown-menu-trigger-width))] bg-dropdown-background border-dropdown-border">
                        <DropdownMenuLabel className="text-text-secondary">Select Token</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-dropdown-separator" />
                        {currentWalletBalances && currentWalletBalances.length > 0 ? (
                          currentWalletBalances.map((token) => (
                            <DropdownMenuItem
                              key={token.address}
                              onSelect={() => setSelectedToken(token)}
                              className="flex items-center text-text-primary hover:bg-accent-orange/20"
                            >
                              {token.iconUrl && <img src={token.iconUrl} alt={token.symbol} className="h-4 w-4 rounded-full mr-2" />}
                              {token.symbol} ({token.formattedAmount})
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <DropdownMenuItem disabled className="text-text-secondary">No tokens available</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSendTransaction}
                  disabled={isSending || !selectedWallet || !sendToAddress || !sendAmount || !selectedToken}
                  className="w-full bg-primary text-primary-foreground hover:bg-[#3C3AB4] hover:scale-[1.02] transition-transform"
                >
                  {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Transaction
                </Button>
              </CardFooter>
            </Card>
          </>
        ) : (
          <Card className="col-span-2 flex-1 flex flex-col items-center justify-center bg-background/50 backdrop-blur-md border border-white/20 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-text-primary mb-3">No Wallet Selected</h3>
            <p className="text-md text-text-secondary">Select a wallet from the left or create a new one.</p>
          </Card>
        )}
      </div>
    </div>
  );
};