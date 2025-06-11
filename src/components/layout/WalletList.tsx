// src/components/layout/WalletList.tsx
import { Wallet, TransactionStatus } from '@/utils/types';
// import SendTransactionForm from '@/components/SendTransactionForm';
import { formatEther, formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Copy, Trash } from 'lucide-react';

interface WalletListProps {
  wallets: Wallet[];
  activeAccount: string | null;
  onSend: (wallet: Wallet, status: TransactionStatus) => void;
  onCopy: (address: string) => void;
  onDelete: (wallet: Wallet) => void;
  sendWallet: Wallet | null;
  setSendWallet: (wallet: Wallet | null) => void;
}

export function WalletList({ wallets, activeAccount, onSend, onCopy, onDelete, sendWallet, setSendWallet }: WalletListProps) {
  if (wallets.length === 0) {
    return <p>No smart accounts created for this wallet.</p>;
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Your Temporary Wallets</h3>
      <div className="flex justify-between mb-4">
        <div className="space-x-2">
          <Button className="bg-success-green text-white rounded-lg">+ New tempwallet</Button>
          <Button className="bg-success-green text-white rounded-lg">+ New Random tempwallet</Button>
          <Button className="bg-success-green text-white rounded-lg">+ New custom tempwallet</Button>
        </div>
        <Button className="bg-success-green text-white rounded-lg">Avalanche</Button>
      </div>
      {wallets.map((wallet) => (
        <div key={`${wallet.address}-${wallet.walletNumber}`} className="wallet-item bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p>
              External Account {wallet.externalAccountNumber} - Counter: {wallet.walletNumber} - Address: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              <span className="balance ml-2">
                AVAX: {wallet.balance ? formatEther(BigInt(wallet.balance)) : '0'} | USDC: {wallet.tokenBalance ? formatUnits(BigInt(wallet.tokenBalance), 6) : '0'}
              </span>
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => onCopy(wallet.address)}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              className="bg-success-green text-white rounded-lg"
              onClick={() => setSendWallet(wallet)}
              disabled={wallet.transactionStatus?.state === 'pending'}
            >
              Send
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-danger-red"
              onClick={() => onDelete(wallet)}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
          {wallet.transactionStatus && wallet.transactionStatus.state !== 'idle' && (
            <p className={`transaction-status ${wallet.transactionStatus.state} mt-2`}>
              {wallet.transactionStatus.state === 'success' ? (
                <a
                  href={`https://testnet.snowtrace.io/tx/${wallet.transactionStatus.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {wallet.transactionStatus.message}
                </a>
              ) : (
                wallet.transactionStatus.message
              )}
            </p>
          )}
          {/* {sendWallet && sendWallet.address === wallet.address && sendWallet.walletNumber === wallet.walletNumber && (
            <SendTransactionForm
              account={activeAccount || ''}
              walletAddress={wallet.address}
              index={wallet.index}
              onSend={(status) => onSend(wallet, status)}
              onClose={() => setSendWallet(null)}
              balance={wallet.balance || '0'}
            />
          )} */}
        </div>
      ))}
    </div>
  );
}