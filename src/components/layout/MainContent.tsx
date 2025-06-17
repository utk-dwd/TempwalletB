// src/components/layout/MainContent.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Copy, Send, Trash, RefreshCw, Funnel, Search  } from 'lucide-react';
import { createSmartAccount, createSmartAccountWithCounter, createRandomSmartAccount, sendTransaction, fetchWalletAllBalances } from '@/utils/walletUtils';
import { Wallet, TransactionStatus, TokenDetails } from '@/utils/types';
import { formatEther, formatUnits, parseEther } from 'viem';
import { HoverInfoBox } from '@/components/ui/HoverInfoBox'; 
import * as Tooltip from "@radix-ui/react-tooltip";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";



interface MainContentProps {
  walletAddress: string | null;
  wallets: Wallet[]; // This prop must be updated immutably by the parent component
  onWalletCreated: (wallet: Wallet) => void;
  onWalletDeleted: (wallet: Wallet) => void;
  onTransactionSent: (wallet: Wallet, status: TransactionStatus) => void;
}

type SortType = 'original' | 'walletNumber' | 'balance';

export function MainContent({ walletAddress, wallets, onWalletCreated, onWalletDeleted, onTransactionSent }: MainContentProps) {
  const [isCustomWalletModalOpen, setIsCustomWalletModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [customIndex, setCustomIndex] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

// Define a type for blockchains
type Blockchain = "Ethereum" | "Solana" | "Arbitrum" | "Base";

// State for blockchain text
const [blockchainStates, setBlockchainStates] = useState<Record<Blockchain, string>>({
  Ethereum: "Ethereum",
  Solana: "Solana",
  Arbitrum: "Arbitrum",
  Base: "Base",
});

// List of blockchains
const blockchains: Blockchain[] = ["Ethereum", "Solana", "Arbitrum", "Base"];

// Handle click on a blockchain item
const handleItemClick = (blockchain: Blockchain, event: React.MouseEvent) => {
  event.preventDefault();
  setBlockchainStates((prev) => ({
    ...prev,
    [blockchain]: "Coming Soon",
  }));
  setTimeout(() => {
    setBlockchainStates((prev) => ({
      ...prev,
      [blockchain]: blockchain,
    }));
  }, 3000);
};

// New state for Biconomy options
type BiconomyOption = '0xGasless' | 'Pimlico';
const [biconomyStates, setBiconomyStates] = useState<Record<BiconomyOption, string>>({
  '0xGasless': '0xGasless',
  Pimlico: 'Pimlico',
});
const biconomyOptions: BiconomyOption[] = ['0xGasless', 'Pimlico'];

 // New handleBiconomyClick for Biconomy options
 const handleBiconomyClick = (option: BiconomyOption, event: React.MouseEvent) => {
  event.preventDefault();
  setBiconomyStates((prev) => ({
    ...prev,
    [option]: 'Coming Soon',
  }));
  setTimeout(() => {
    setBiconomyStates((prev) => ({
      ...prev,
      [option]: option,
    }));
  }, 3000);
};

  const [sortType, setSortType] = useState<SortType>('original');
  const [displayedWallets, setDisplayedWallets] = useState<Wallet[]>(wallets);

  const [showCopiedPopup, setShowCopiedPopup] = useState(false);

  const handleCopySelectedWalletAddress = async () => {
    if (selectedWallet?.address) {
      try {
        await navigator.clipboard.writeText(selectedWallet.address);
        setShowCopiedPopup(true);
        setTimeout(() => setShowCopiedPopup(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
        setError('Failed to copy address');
      }
    }
  };

  // Add state for token selection
  const [selectedToken, setSelectedToken] = useState<TokenDetails | null>(null);

  const externalAccountNumber = walletAddress ? 1 : 0;

  // Effect to sort wallets when 'wallets' prop or 'sortType' changes.
  // For immediate updates upon wallet creation/deletion, the parent component
  // MUST update the 'wallets' prop with a new array reference.
  useEffect(() => {
    let sortedList = [...wallets]; // Create a new array from the wallets prop

    if (sortType === 'walletNumber') {
      sortedList.sort((a, b) => a.walletNumber - b.walletNumber);
    } else if (sortType === 'balance') {
      sortedList.sort((a, b) => {
        const balanceA = BigInt(a.balance || '0');
        const balanceB = BigInt(b.balance || '0');
        if (balanceB > balanceA) return 1; // Sort descending by balance
        if (balanceB < balanceA) return -1;
        return a.walletNumber - b.walletNumber; // Secondary sort by wallet number
      });
    }
    // If sortType is 'original', sortedList remains a copy of the wallets prop.
    setDisplayedWallets(sortedList);
  }, [wallets, sortType]); // Dependencies: wallets prop and sortType state

  const handleCreateNewTempWallet = async () => {
    if (!walletAddress) {
      setError('Please connect a wallet first');
      return;
    }
    try {
      const wallet = await createSmartAccount(walletAddress, externalAccountNumber);
      onWalletCreated(wallet); // Parent component needs to update its state immutably here
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet');
    }
  };

  const handleCreateRandomTempWallet = async () => {
    if (!walletAddress) {
      setError('Please connect a wallet first');
      return;
    }
    try {
      // Simply call createRandomSmartAccount - it will handle everything internally
      const wallet = await createRandomSmartAccount(walletAddress, externalAccountNumber);
      onWalletCreated(wallet);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create random wallet');
    }
  };

  const handleCreateCustomTempWallet = async () => {
    if (!walletAddress) {
      setError('Please connect a wallet first');
      setIsCustomWalletModalOpen(false);
      return;
    }
    const counter = parseInt(customIndex, 10);
    if (isNaN(counter) || counter < 0) {
      setError('Please enter a valid non-negative integer');
      return;
    }
    try {
      const wallet = await createSmartAccountWithCounter(walletAddress, counter, externalAccountNumber);
      onWalletCreated(wallet); // Parent component needs to update its state immutably here
      setError(null);
      setIsCustomWalletModalOpen(false);
      setCustomIndex('');
    } catch (err: any) {
      setError(err.message || 'Failed to create custom wallet');
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address).then(() => {
      setCopyFeedback('Address copied');
      setTimeout(() => setCopyFeedback(null), 2000);
    }).catch(() => {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = address;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopyFeedback('Address copied (fallback)');
        setTimeout(() => setCopyFeedback(null), 2000);
      } catch (err) {
        setCopyFeedback('Failed to copy address');
         setTimeout(() => setCopyFeedback(null), 2000);
      }
    });
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    onWalletDeleted(wallet); // Parent component needs to update its state immutably here
    if (selectedWallet?.address === wallet.address && selectedWallet?.walletNumber === wallet.walletNumber) {
      setSelectedWallet(null);
    }
  };


  

  // Update handleSendCrypto to pass selectedToken
const handleSendCrypto = async () => {
  if (!walletAddress || !selectedWallet) {
    setError('Please connect a wallet and select a wallet to send from');
    setIsSendModalOpen(false);
    return;
  }
  try {

    if (!selectedToken) {
      setError("Please select a token to send");
      return;
    }
    const status = await sendTransaction(
      walletAddress,
      selectedWallet.address,
      selectedWallet.index,
      recipient,
      amount,
      selectedToken // Pass the entire token object
    );
    onTransactionSent(selectedWallet, status);
    setError(null);
    setIsSendModalOpen(false);
    setRecipient('');
    setAmount('');
    await handleRefreshBalance(selectedWallet, true);
  } catch (err: any) {
    setError(err.message || 'Failed to send transaction');
  }
};

  const handleRefreshBalance = async (wallet: Wallet, isPostTransaction: boolean = false) => {
    try {
      const updatedBalances = await fetchWalletAllBalances(wallet.address);
      let updatedWallet = { ...wallet, allTokenBalances: updatedBalances };
      
      if (isPostTransaction && wallet.transactionStatus) {
          updatedWallet.transactionStatus = wallet.transactionStatus;
      } else if (!isPostTransaction) { // Only reset if it's a manual refresh, not post-tx
          updatedWallet.transactionStatus = {state: 'idle'};
      }
      // If it's post-transaction and there was no prior status, it's implicitly handled by onTransactionSent

      onWalletCreated(updatedWallet); // This effectively updates the wallet in the parent's list.
                                      // Parent needs to handle this immutably.
      if (selectedWallet?.address === wallet.address && selectedWallet?.walletNumber === wallet.walletNumber) {
        setSelectedWallet(updatedWallet); 
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh balance');
    }
  };
  
  const handleSortChange = () => {
    setSortType(currentSortType => {
      if (currentSortType === 'original') {
        return 'walletNumber';
      } else if (currentSortType === 'walletNumber') {
        return 'balance';
      } else if (currentSortType === 'balance') {
        return 'original';
      }
      return 'original'; 
    });
  };

  const getSortButtonLabel = () => {
    switch (sortType) {
      case 'walletNumber':
        return 'By Wallet #';
      case 'balance':
        return 'By Balance';
      case 'original':
      default:
        return 'Default Order';
    }
  };

  const totalBalances = wallets.reduce((acc, wallet) => {
    wallet.allTokenBalances.forEach(token => {
      const existing = acc.get(token.symbol || 'Unknown');
      if (existing) {
        acc.set(token.symbol || 'Unknown', { ...existing, amount: existing.amount + BigInt(token.amount) });
      } else {
        acc.set(token.symbol || 'Unknown', { amount: BigInt(token.amount), decimals: token.decimals });
      }
    });
    return acc;
  }, new Map<string, { amount: bigint; decimals: number }>());

  return (
    <>
    {/* Custom Scrollbar Styles */}
    <style>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 10px; /* Width of the scrollbar */
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(55, 65, 81, 0.3); /* Semi-transparent dark background for track - bg-gray-700 with opacity */
        border-radius: 10px;
        margin-top: 5px; /* Optional: space from top */
        margin-bottom: 5px; /* Optional: space from bottom */
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(209, 213, 219, 0.5); /* Semi-transparent light thumb - bg-gray-300 with opacity */
        border-radius: 10px;
        border: 2px solid transparent; /* Creates padding around thumb */
        background-clip: content-box; /* Clips the background to the content box, simulating border */
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.7); /* Darker thumb on hover - bg-gray-400 with opacity */
        background-clip: content-box;
      }
      /* For Firefox */
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(209, 213, 219, 0.5) rgba(55, 65, 81, 0.3); /* thumb track */
      }
    `}</style>
    <div className="bg-[var(--overlay)] border border-white/20 backdrop-blur-[var(--blur)] rounded-xl p-4 flex-1 flex flex-col h-full min-h-0 mb-5 ml-5 mr-5">
      {/* Top Strip */}
      <div className="flex items-center justify-between">
      <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <h2 className="text-xl font-semibold text-white cursor-pointer">
            Your Temporary Wallets (Gasless)
          </h2>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-white/10 backdrop-blur-sm text-white p-2 rounded-md shadow-lg box-shadow: 0 4px 6px rgba(0, 0, 0, 1) text-sm"
            sideOffset={5}
          >
            <p>This is a temporary wallet <br/>that requires no gas fees.</p>
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>

        <div className="flex items-center gap-2">
          <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
        <Button 
            onClick={handleSortChange} 
            className="px-4 py-2 bg-green-500/50 text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 transition-colors flex items-center w-[8rem]"
          >
            <Funnel className="w-4 h-4 mr-2" /> 
            <span>{getSortButtonLabel()}</span>
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-white/10 backdrop-blur-sm text-white p-2 rounded-md shadow-lg text-sm"
            sideOffset={5}
          >
            <p>Sort your wallets below {getSortButtonLabel()}</p>
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>


          <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
        <Button onClick={handleCreateNewTempWallet} className="px-4 py-2 bg-green-500/50 text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 transition-colors">
            + TempWallet
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-white/10 backdrop-blur-sm text-white p-2 rounded-md shadow-lg text-sm"
            sideOffset={5}
          >
            <p>This button will create a new smart wallet <br/>using your metamask signature and an index number.</p>
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>

          <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
        <Button onClick={handleCreateRandomTempWallet} className="px-4 py-2 bg-green-500/50 text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 transition-colors">
            + Random TempWallet
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-md shadow-lg text-sm"
            sideOffset={5}
          >
            <p>This button will create a new smart wallet using your <br/> metamask signature and a random index number.</p>
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>

          <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
        <Button
            onClick={() => setIsCustomWalletModalOpen(true)}
            className="px-4 py-2 bg-green-500/50 text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 transition-colors"
          >
            + Custom TempWallet
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-md shadow-lg text-sm"
            sideOffset={5}
          >
            <p>This button will create a new smart wallet using your <br/> metamask signature and a custom index number.</p>
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>

      <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="px-4 py-2 bg-green-500/50 text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 transition-colors flex items-center gap-2"
          >
            Avalanche <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="backdrop-blur-sm bg-gray-500/30 text-primary-foreground rounded-[var(--radius)] border-none"
        >
          {blockchains.map((blockchain) => (
            <DropdownMenuItem
              key={blockchain}
              className="px-4 py-2 hover:bg-gray-400/50 focus:bg-gray-400/50 transition-colors cursor-pointer"
              onClick={(event) => handleItemClick(blockchain, event)}
            >
              {blockchainStates[blockchain]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-md shadow-lg text-sm"
            sideOffset={5}
          >
            <p> Select a blockchain Network</p>
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>


    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
        <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="px-4 py-2 bg-green-500/50 text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 transition-colors flex items-center gap-2"
                >
                  Biconomy <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-gray-500/50 text-primary-foreground rounded-[var(--radius)] border-none"
              >
                {biconomyOptions.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    className="px-4 py-2 hover:bg-gray-400/50 focus:bg-gray-400/50 transition-colors cursor-pointer"
                    onClick={(event) => handleBiconomyClick(option, event)}
                  >
                    {biconomyStates[option] ?? option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-md shadow-lg text-sm"
            sideOffset={5}
          >
            <p> Select SDK to create TempWallets</p>
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>

        </div>
      </div>
      {/* Line Below Strip */}
      <div className="border-b border-white/20 my-4" />
      {/* Error Message & Feedback */}
      {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
      {copyFeedback && <p className="text-sm text-green-400 mb-2">{copyFeedback}</p>}


      {/* Wallet List and Balance Column */}
      <div className="flex flex-1 gap-4 min-h-0"> {/* Adjusted max-h if needed */}
        {/* Wallet List */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar min-h-0"> {/* Added custom-scrollbar class */}
          {displayedWallets.length === 0 ? (
            <div className="text-white text-center py-10">No wallets created yet.</div>
          ) : (
            displayedWallets.map((wallet) => (
              <div
                key={`${wallet.address}-${wallet.walletNumber}`} 
                className={`bg-[var(--overlay)] backdrop-blur-[var(--blur)] rounded-xl p-4 flex items-center justify-between border border-white/20 cursor-pointer transition-all duration-200 hover:border-white/40 ${
                  selectedWallet?.address === wallet.address && selectedWallet?.walletNumber === wallet.walletNumber
                    ? 'shadow-[0_0_15px_rgba(34,197,94,0.5)] border-green-500'
                    : ''
                }`}
                onClick={() => setSelectedWallet(wallet)}
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    Wallet #{wallet.walletNumber} 
                    <span className="text-xs text-blue-400 ml-2">
                      {wallet.walletNumber > 1000 ? '[Random]' : ' '}
                    </span>
                    <br />
                    <span className="text-xs text-gray-400">{wallet.address}</span>
                  </p>      
                  {wallet.transactionStatus && wallet.transactionStatus.state !== 'idle' && (
                    <p className={`text-xs mt-1 ${
                        wallet.transactionStatus.state === 'success' ? 'text-green-400' 
                        : wallet.transactionStatus.state === 'error' ? 'text-red-400' 
                        : 'text-yellow-400' 
                      }`}>
                      {wallet.transactionStatus.state === 'success' && wallet.transactionStatus.txHash ? (
                        <a
                          href={`https://snowtrace.io/tx/${wallet.transactionStatus.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-green-300"
                          onClick={(e) => e.stopPropagation()} 
                        >
                          {wallet.transactionStatus.message || 'Transaction successful'}
                        </a>
                      ) : (
                        wallet.transactionStatus.message || `Status: ${wallet.transactionStatus.state}`
                      )}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2"> 
                <HoverInfoBox infoText="Copy Address" position="bottom">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-white/10 text-white rounded-md hover:bg-white/20 p-2" 
                      onClick={(e) => { e.stopPropagation(); handleCopyAddress(wallet.address);}}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                </HoverInfoBox>

                  <HoverInfoBox infoText="Send Crypto" position="bottom">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/10 text-white rounded-md hover:bg-white/20 p-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWallet(wallet);
                      setIsSendModalOpen(true);
                    }}
                    title="Send Crypto"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  </HoverInfoBox>

                  <HoverInfoBox infoText="Delete Wallet" position="bottom">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/40 p-2"
                    onClick={(e) => { e.stopPropagation(); handleDeleteWallet(wallet);}}
                    title="Delete Wallet"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                  </HoverInfoBox>

                  <HoverInfoBox infoText="View on Explorer" position="bottom">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/10 text-white rounded-md hover:bg-white/20 p-2"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      window.open(`https://snowtrace.io/address/${wallet.address}`, '_blank');
                    }}
                    title="View on Snowtrace"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                  </HoverInfoBox>
                  <HoverInfoBox infoText="Refresh Balance" position="left">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/10 text-white rounded-md hover:bg-white/20 p-2"
                    onClick={(e) => { e.stopPropagation(); handleRefreshBalance(wallet);}}
                    title="Refresh Balance"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  </HoverInfoBox>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Balance Column */}
        <div className="w-[300px] bg-[var(--overlay)] backdrop-blur-[var(--blur)] rounded-xl p-4 flex flex-col">
          <div>
          <h3 className="text-lg font-semibold text-white">Total Portfolio</h3>
        {Array.from(totalBalances.entries()).map(([symbol, tokenData]) => (
            <p key={symbol} className="text-sm text-white mt-2">
                {symbol}: {formatUnits(tokenData.amount, tokenData.decimals)}
            </p>
        ))}
          </div>
          {selectedWallet && (
            <>
              <div className="border-b border-white/20 my-4" />
              <h3 className="text-lg font-semibold text-white">Selected Wallet #{selectedWallet.walletNumber}</h3>

              <p
                className="text-regular text-gray-400 cursor-pointer hover:text-accent-orange transition-colors"
                onClick={handleCopySelectedWalletAddress}
                title="Click to copy full address"
              >
                {selectedWallet.address.slice(0, 6)}.....{selectedWallet.address.slice(-8)}
              </p>
              {showCopiedPopup && (
                <div className="absolute -top-8 left-0 bg-success-green text-white text-xs px-2 py-1 rounded shadow-lg">
                  Copied!
                </div>
              )}

              {selectedWallet.allTokenBalances.map(token => (
              <p key={token.address} className="text-sm text-white mt-2 flex items-center">
              {token.iconUrl && <img src={token.iconUrl} alt={token.symbol} className="w-4 h-4 mr-2 rounded-full" />}
              {token.symbol}: {token.formattedAmount}
            </p>
          ))}
            </>
          )}
           {!selectedWallet && wallets.length > 0 && (
             <div className="mt-auto text-center text-gray-400 text-sm">
                Select a wallet to see its details.
            </div>
           )}
           <div className="mt-auto">
           <p className="text-xs text-gray-400">
              TempWallets.com is tested for Avalanche blockchain network with <b>$AVAX</b> and <b>$USDC</b> (while other tokens should be possible as well, but untested). We are in process of enabling other EVM chains and testing more ERC20 tokens in coming days.<br />
              Check <a href="https://bit.ly/pitchdeck-tempwallets" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Project Deck here</a>.<br />
              Talk to us on <a href="https://t.me/+jGONCu_VLqgwZTVl" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Telegram here</a>.<br />
              Explore and test this DApp responsibly.
          </p>
           </div> 
        </div>
      </div>

      {/* Custom Wallet Modal */}
      <Dialog open={isCustomWalletModalOpen} onOpenChange={setIsCustomWalletModalOpen}>
        <DialogContent className="bg-[var(--overlay)] backdrop-blur-[var(--blur)] rounded-xl p-6 bg-gray-500/50 border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Create Custom Temp Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="custom-index" className="text-sm font-medium text-white block mb-1">
                Wallet Index Number
              </label>
              <Input
                id="custom-index"
                type="number"
                min="0"
                value={customIndex}
                onChange={(e) => setCustomIndex(e.target.value)}
                className="mt-1 px-3 py-2 bg-transparent text-white placeholder-white/50 border border-white/20 rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] w-full"
                placeholder="Enter index (e.g., 1, 2, 3...)"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              onClick={() => {setIsCustomWalletModalOpen(false); setError(null);}}
              className="px-4 py-2 bg-red-500/60 text-primary-foreground rounded-[var(--radius)] hover:bg-red-500/80 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomTempWallet}
              className="px-4 py-2 bg-green-500/60 text-primary-foreground rounded-[var(--radius)] hover:bg-green-500/80 transition-colors"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Crypto Modal */}
      {/* Update the Send Crypto Modal in the return statement */}
      <Dialog open={isSendModalOpen} onOpenChange={(isOpen) => { setIsSendModalOpen(isOpen); if (!isOpen) setError(null); }}>
        <DialogContent className="bg-[var(--overlay)] backdrop-blur-[var(--blur)] rounded-xl p-6 bg-gray-800/50 border border-white/20">
          <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Send {selectedToken?.symbol || 'Crypto'} from Wallet #{selectedWallet?.walletNumber}
          </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="token" className="text-sm font-medium text-white block mb-1">
                Select Token
              </label>
              <select
                id="token"
                value={selectedToken?.address || ''}
                onChange={(e) => {
                  const token = selectedWallet?.allTokenBalances.find(t => t.address === e.target.value) || null;
                  setSelectedToken(token);
                }}
                className="mt-1 px-3 py-2 bg-transparent text-white border border-white/20 rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] w-full"
              >
                <option value="" disabled>Select a token</option>
                {selectedWallet?.allTokenBalances.map(token => (
                  <option key={token.address} value={token.address} className="bg-gray-800 text-white">
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="recipient" className="text-sm font-medium text-white block mb-1">
                Recipient Address
              </label>
              <Input
                id="recipient"
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-1 px-3 py-2 bg-transparent text-white placeholder-white/50 border border-white/20 rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] w-full"
                placeholder="0x..."
              />
            </div>
            <div>
            <label htmlFor="amount" className="text-sm font-medium text-white block mb-1">
              Crypto ({selectedToken?.symbol})
            </label>
            <Input
              id="amount"
              type="number"
              step={selectedToken ? 1 / (10 ** selectedToken.decimals) : '0.000001'}
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 px-3 py-2 bg-transparent text-white placeholder-white/50 border border-white/20 rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] w-full"
              placeholder="0.0"
              disabled={!selectedToken}
            />
                {selectedToken && (
                  <p className="text-xs text-gray-400 mt-1">
                    Available: {selectedToken.formattedAmount} {selectedToken.symbol}
                  </p>
                )}
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              onClick={() => { setIsSendModalOpen(false); setError(null); }}
              className="px-4 py-2 bg-red-500/60 text-primary-foreground rounded-[var(--radius)] hover:bg-red-500/80 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendCrypto}
              className="px-4 py-2 bg-green-500/60 text-primary-foreground rounded-[var(--radius)] hover:bg-green-500/80 transition-colors"
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}