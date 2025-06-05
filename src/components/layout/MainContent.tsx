// src/components/layout/MainContent.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Copy, Send, Trash, RefreshCw } from 'lucide-react';
import { createSmartAccount, createSmartAccountWithCounter, getBalance, getTokenBalance, sendTransaction } from '@/utils/walletUtils';
import { Wallet, TransactionStatus } from '@/utils/types';
import { formatEther, formatUnits, parseEther } from 'viem';

interface MainContentProps {
  walletAddress: string | null;
  wallets: Wallet[];
  onWalletCreated: (wallet: Wallet) => void;
  onWalletDeleted: (wallet: Wallet) => void;
  onTransactionSent: (wallet: Wallet, status: TransactionStatus) => void;
}

export function MainContent({ walletAddress, wallets, onWalletCreated, onWalletDeleted, onTransactionSent }: MainContentProps) {
  const [isCustomWalletModalOpen, setIsCustomWalletModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [customIndex, setCustomIndex] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const externalAccountNumber = walletAddress ? 1 : 0;

  const handleCreateNewTempWallet = async () => {
    if (!walletAddress) {
      setError('Please connect a wallet first');
      return;
    }
    try {
      const wallet = await createSmartAccount(walletAddress, externalAccountNumber);
      onWalletCreated(wallet);
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
      const randomCounter = Math.floor(Math.random() * 1000);
      const wallet = await createSmartAccount(walletAddress, randomCounter);
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
      onWalletCreated(wallet);
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
      setCopyFeedback('Failed to copy address');
    });
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    onWalletDeleted(wallet);
  };

  const handleSendCrypto = async () => {
    if (!walletAddress || !selectedWallet) {
      setError('Please connect a wallet and select a wallet to send from');
      setIsSendModalOpen(false);
      return;
    }
    try {
      const status = await sendTransaction(
        walletAddress,
        selectedWallet.address,
        selectedWallet.index,
        recipient,
        amount
      );
      onTransactionSent(selectedWallet, status);
      setError(null);
      setIsSendModalOpen(false);
      setRecipient('');
      setAmount('');
      const updatedBalance = await getBalance(selectedWallet.address);
      const updatedTokenBalance = await getTokenBalance(selectedWallet.address);
      const updatedWallet = { ...selectedWallet, balance: updatedBalance, tokenBalance: updatedTokenBalance };
      onWalletCreated(updatedWallet);
    } catch (err: any) {
      setError(err.message || 'Failed to send transaction');
    }
  };

  const handleRefreshBalance = async (wallet: Wallet) => {
    try {
      const updatedBalance = await getBalance(wallet.address);
      const updatedTokenBalance = await getTokenBalance(wallet.address);
      const updatedWallet = { ...wallet, balance: updatedBalance, tokenBalance: updatedTokenBalance };
      onWalletCreated(updatedWallet); // Update wallet with new balances
      if (selectedWallet?.address === wallet.address && selectedWallet?.walletNumber === wallet.walletNumber) {
        setSelectedWallet(updatedWallet); // Update selected wallet
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh balance');
    }
  };

  const totalAvaxBalance = wallets.reduce((sum, wallet) => {
    return sum + (wallet.balance ? BigInt(wallet.balance) : BigInt(0));
  }, BigInt(0));

  const totalUsdcBalance = wallets.reduce((sum, wallet) => {
    return sum + (wallet.tokenBalance ? BigInt(wallet.tokenBalance) : BigInt(0));
  }, BigInt(0));

  return (
    <div className="bg-[var(--overlay)] backdrop-blur-[var(--blur)] rounded-xl p-4 flex-1 flex flex-col">
      {/* Top Strip */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Your Temporary Wallets</h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateNewTempWallet} className="px-4 py-2 bg-green-500/50 text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 transition-colors">
            + Create new temp wallet
          </Button>
          <Button onClick={handleCreateRandomTempWallet} className="px-4 py-2 bg-green-500/50 text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 transition-colors">
            + Create new random temp wallet
          </Button>
          <Button
            onClick={() => setIsCustomWalletModalOpen(true)}
            className="px-4 py-2 bg-green-500/50 text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 transition-colors"
          >
            + Create new custom temp wallet
          </Button>
          <Button className="px-4 py-2 bg-green-500/50 text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 transition-colors">
            Avalanche
          </Button>
        </div>
      </div>
      {/* Line Below Strip */}
      <div className="border-b border-white/20 my-4" />
      {/* Error Message */}
      {error && <p className="text-sm text-white">{error}</p>}
      {copyFeedback && <p className="text-sm text-white">{copyFeedback}</p>}

      {/* Wallet List and Balance Column */}
      <div className="flex flex-1 gap-4 max-h-[calc(100vh-200px)]">
        {/* Wallet List */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {wallets.length === 0 ? (
            <div className="text-white">No wallets created yet.</div>
          ) : (
            wallets.map((wallet) => (
              <div
                key={`${wallet.address}-${wallet.walletNumber}`}
                className={`bg-[var(--overlay)] backdrop-blur-[var(--blur)] rounded-xl p-4 flex items-center justify-between border border-white/20 ${
                  selectedWallet?.address === wallet.address && selectedWallet?.walletNumber === wallet.walletNumber
                    ? 'shadow-[0_0_15px_rgba(2,9,9,0.9)]'
                    : ''
                }`}
                onClick={() => setSelectedWallet(wallet)}
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    Wallet {wallet.walletNumber} - {wallet.address}
                  </p>
                  {wallet.transactionStatus && wallet.transactionStatus.state !== 'idle' && (
                    <p className={`text-sm ${wallet.transactionStatus.state === 'success' ? 'text-success-green' : 'text-danger-red'}`}>
                      {wallet.transactionStatus.state === 'success' ? (
                        <a
                          href={`https://testnet.snowtrace.io/tx/${wallet.transactionStatus.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-white"
                        >
                          {wallet.transactionStatus.message}
                        </a>
                      ) : (
                        wallet.transactionStatus.message
                      )}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 gap-x-4 w-20 mr-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/20 text-white rounded-[var(--radius)] hover:bg-white/30"
                    onClick={() => handleCopyAddress(wallet.address)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/20 text-white rounded-[var(--radius)] hover:bg-white/30"
                    onClick={() => {
                      setSelectedWallet(wallet);
                      setIsSendModalOpen(true);
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/20 text-danger-red rounded-[var(--radius)] hover:bg-white/30"
                    onClick={() => handleDeleteWallet(wallet)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/20 text-white rounded-[var(--radius)] hover:bg-white/30"
                    onClick={() => handleRefreshBalance(wallet)}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Balance Column */}
        <div className="w-[300px] bg-[var(--overlay)] backdrop-blur-[var(--blur)] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white">Total Balance</h3>
          <p className="text-sm text-white mt-2">
            AVAX: {formatEther(totalAvaxBalance)} AVAX
          </p>
          <p className="text-sm text-white">
            USDC: {formatUnits(totalUsdcBalance, 6)} USDC
          </p>
          {selectedWallet && (
            <>
              <h3 className="text-lg font-semibold text-white mt-4">Selected Wallet Balance</h3>
              <p className="text-sm text-white mt-2">
                AVAX: {selectedWallet.balance ? formatEther(BigInt(selectedWallet.balance)) : '0'} AVAX
              </p>
              <p className="text-sm text-white">
                USDC: {selectedWallet.tokenBalance ? formatUnits(BigInt(selectedWallet.tokenBalance), 6) : '0'} USDC
              </p>
            </>
          )}
        </div>
      </div>

      {/* Custom Wallet Modal */}
      <Dialog open={isCustomWalletModalOpen} onOpenChange={setIsCustomWalletModalOpen}>
        <DialogContent className="bg-[var(--overlay)] backdrop-blur-[var(--blur)] rounded-xl p-6 bg-gray-500/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Create Custom Temp Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="custom-index" className="text-sm font-medium text-white">
                Index Number
              </label>
              <Input
                id="custom-index"
                type="number"
                min="0"
                value={customIndex}
                onChange={(e) => setCustomIndex(e.target.value)}
                className="mt-2 px-3 py-2 bg-transparent text-white placeholder-white/50 border border-white/20 rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="Enter index number"
              />
            </div>
            {error && <p className="text-sm text-white">{error}</p>}
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              onClick={() => setIsCustomWalletModalOpen(false)}
              className="px-4 py-2 bg-red-500/40 text-primary-foreground rounded-[var(--radius)] hover:bg-red-500/80  transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomTempWallet}
              className="px-4 py-2 bg-green-500/40 text-primary-foreground rounded-[var(--radius)] hover:bg-green-500/80 transition-colors"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Crypto Modal */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="bg-[var(--overlay)] backdrop-blur-[var(--blur)] rounded-xl p-6 bg-gray-500/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Send Crypto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="recipient" className="text-sm font-medium text-white">
                Recipient Address
              </label>
              <Input
                id="recipient"
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-2 px-3 py-2 bg-transparent text-white placeholder-white/50 border border-white/20 rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="0x..."
              />
            </div>
            <div>
              <label htmlFor="amount" className="text-sm font-medium text-white">
                Amount (AVAX)
              </label>
              <Input
                id="amount"
                type="number"
                step="0.001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 px-3 py-2 bg-transparent text-white placeholder-white/50 border border-white/20 rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="0.0"
              />
              {selectedWallet?.balance && (
                <p className="text-xs text-white mt-1">
                  Available: {formatEther(BigInt(selectedWallet.balance))} AVAX
                </p>
              )}
            </div>
            {error && <p className="text-sm text-white">{error}</p>}
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              onClick={() => setIsSendModalOpen(false)}
              className="px-4 py-2 bg-red-300/50 text-primary-foreground rounded-[var(--radius)] hover:bg-red-500/80 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendCrypto}
              className="px-4 py-2 bg-green-300/50 text-primary-foreground rounded-[var(--radius)] hover:bg-green-500/80 transition-colors"
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}