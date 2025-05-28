// src/components/SendTransactionForm.tsx
import { useState } from 'react';
import { sendTransaction } from '@/utils/walletUtils';
import { TransactionStatus } from '@/utils/types';
import { formatEther } from 'viem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SendTransactionFormProps {
  account: string;
  walletAddress: string;
  index: number;
  onSend: (status: TransactionStatus) => void;
  onClose: () => void;
  balance: string;
}

export default function SendTransactionForm({ account, walletAddress, index, onSend, onClose, balance }: SendTransactionFormProps) {
  const [to, setTo] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSending(true);

    try {
      const status = await sendTransaction(account, walletAddress, index, to, amount);
      onSend(status);
      if (status.state === 'success') {
        setTo('');
        setAmount('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send transaction');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="send-form">
      <h3>Send Transaction</h3>
      <p>AVAX Balance: {formatEther(BigInt(balance))} AVAX</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="recipient">Recipient Address</label>
        <Input
          id="recipient"
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="0x..."
          disabled={isSending}
        />
        <label htmlFor="amount">Amount (AVAX)</label>
        <Input
          id="amount"
          type="number"
          step="0.001"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          disabled={isSending}
        />
        <div className="send-form-buttons">
          <Button type="submit" disabled={isSending || !to || !amount}>
            {isSending ? 'Sending...' : 'Send'}
          </Button>
          <Button type="button" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
        </div>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}