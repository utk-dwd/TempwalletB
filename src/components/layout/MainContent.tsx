// src/components/layout/MainContent.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Copy, Send, Trash } from 'lucide-react';
import { createSmartAccount, createSmartAccountWithCounter, getBalance, getTokenBalance, sendTransaction } from '@/utils/walletUtils';
import { Wallet, TransactionStatus } from '@/utils/types';
import { formatEther, formatUnits, parseEther } from 'viem';

interface MainContentProps {
  walletAddress: string | null;
  wallets: Wallet[]; // Add wallets prop
  onWalletCreated: (wallet: Wallet) => void;
  onWalletDeleted: (wallet: Wallet) => void; // Add onWalletDeleted prop
  onTransactionSent: (wallet: Wallet, status: TransactionStatus) => void; // Add onTransactionSent prop
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

  const externalAccountNumber = walletAddress ? 1 : 0; // Simplified for demo

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
      const randomCounter = Math.floor(Math.random() * 1000); // Random counter between 0 and 999
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
      // Refresh balances after sending
      const updatedBalance = await getBalance(selectedWallet.address);
      const updatedTokenBalance = await getTokenBalance(selectedWallet.address);
      const updatedWallet = { ...selectedWallet, balance: updatedBalance, tokenBalance: updatedTokenBalance };
      onWalletCreated(updatedWallet); // Update wallet with new balances
    } catch (err: any) {
      setError(err.message || 'Failed to send transaction');
    }
  };

  const totalAvaxBalance = wallets.reduce((sum, wallet) => {
    return sum + (wallet.balance ? BigInt(wallet.balance) : BigInt(0));
  }, BigInt(0));

  const totalUsdcBalance = wallets.reduce((sum, wallet) => {
    return sum + (wallet.tokenBalance ? BigInt(wallet.tokenBalance) : BigInt(0));
  }, BigInt(0));

  return (
    <div className="bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl p-4 flex-1 flex flex-col">
      {/* Top Strip */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Your Temporary Wallets</h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateNewTempWallet} className="bg-success-green text-white rounded-lg hover:bg-green-600">
            + Create new temp wallet
          </Button>
          <Button onClick={handleCreateRandomTempWallet} className="bg-success-green text-white rounded-lg hover:bg-green-600">
            + Create new random temp wallet
          </Button>
          <Button
            onClick={() => setIsCustomWalletModalOpen(true)}
            className="bg-success-green text-white rounded-lg hover:bg-green-600"
          >
            + Create new custom temp wallet
          </Button>
          <Button className="bg-success-green text-white rounded-lg hover:bg-green-600">
            Avalanche
          </Button>
        </div>
      </div>
      {/* Line Below Strip */}
      <div className="border-b border-white/20 my-4" />
      {/* Error Message */}
      {error && <p className="text-sm text-danger-red">{error}</p>}
      {copyFeedback && <p className="text-sm text-success-green">{copyFeedback}</p>}

      {/* Wallet List and Balance Column */}
      <div className="flex flex-1 gap-4">
        {/* Wallet List */}
        <div className="flex-1 space-y-4 overflow-y-auto">
          {wallets.length === 0 ? (
            <div className="text-text-primary">No wallets created yet.</div>
          ) : (
            wallets.map((wallet) => (
              <div
                key={`${wallet.address}-${wallet.walletNumber}`}
                className="bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Wallet {wallet.walletNumber} - {wallet.address}
                  </p>
                  {wallet.transactionStatus && wallet.transactionStatus.state !== 'idle' && (
                    <p className={`text-sm ${wallet.transactionStatus.state === 'success' ? 'text-success-green' : 'text-danger-red'}`}>
                      {wallet.transactionStatus.state === 'success' ? (
                        <a
                          href={`https://testnet.snowtrace.io/tx/${wallet.transactionStatus.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {wallet.transactionStatus.message}
                        </a>
                      ) : (
                        wallet.transactionStatus.message
                      )}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/20 text-text-primary rounded-lg hover:bg-white/30"
                    onClick={() => handleCopyAddress(wallet.address)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/20 text-text-primary rounded-lg hover:bg-white/30"
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
                    className="bg-white/20 text-danger-red rounded-lg hover:bg-white/30"
                    onClick={() => handleDeleteWallet(wallet)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Balance Column */}
        <div className="w-[300px] bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-text-primary">Total Balance</h3>
          <p className="text-sm text-text-primary mt-2">
            AVAX: {formatEther(totalAvaxBalance)} AVAX
          </p>
          <p className="text-sm text-text-primary">
            USDC: {formatUnits(totalUsdcBalance, 6)} USDC
          </p>
        </div>
      </div>

      {/* Custom Wallet Modal */}
      <Dialog open={isCustomWalletModalOpen} onOpenChange={setIsCustomWalletModalOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-text-primary">Create Custom Temp Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="custom-index" className="text-sm font-medium text-text-primary">
                Index Number
              </label>
              <Input
                id="custom-index"
                type="number"
                min="0"
                value={customIndex}
                onChange={(e) => setCustomIndex(e.target.value)}
                className="mt-1 bg-white/20 text-text-primary border border-white/20 rounded-lg"
                placeholder="Enter index number"
              />
            </div>
            {error && <p className="text-sm text-danger-red">{error}</p>}
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              onClick={() => setIsCustomWalletModalOpen(false)}
              className="bg-danger-red text-white rounded-lg hover:bg-red-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomTempWallet}
              className="bg-success-green text-white rounded-lg hover:bg-green-600"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Crypto Modal */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-text-primary">Send Crypto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="recipient" className="text-sm font-medium text-text-primary">
                Recipient Address
              </label>
              <Input
                id="recipient"
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-1 bg-white/20 text-text-primary border border-white/20 rounded-lg"
                placeholder="0x..."
              />
            </div>
            <div>
              <label htmlFor="amount" className="text-sm font-medium text-text-primary">
                Amount (AVAX)
              </label>
              <Input
                id="amount"
                type="number"
                step="0.001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 bg-white/20 text-text-primary border border-white/20 rounded-lg"
                placeholder="0.0"
              />
              {selectedWallet?.balance && (
                <p className="text-xs text-text-secondary mt-1">
                  Available: {formatEther(BigInt(selectedWallet.balance))} AVAX
                </p>
              )}
            </div>
            {error && <p className="text-sm text-danger-red">{error}</p>}
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              onClick={() => setIsSendModalOpen(false)}
              className="bg-danger-red text-white rounded-lg hover:bg-red-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendCrypto}
              className="bg-success-green text-white rounded-lg hover:bg-green-600"
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}