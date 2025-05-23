// // src/components/SendTransactionForm.tsx

// src/components/SendTransactionForm.tsx
import { useState } from 'react';
import { sendTransaction } from '../utils/walletUtils';
import { TransactionStatus } from '../utils/types';
import { formatEther } from 'viem';

interface SendTransactionFormProps {
  account: string;
  walletAddress: string;
  index: number;
  onSend: (status: TransactionStatus) => void;
  onClose: () => void;
  balance: string;
}

function SendTransactionForm({ account, walletAddress, index, onSend, onClose, balance }: SendTransactionFormProps) {
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
        <input
          id="recipient"
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="0x..."
          disabled={isSending}
        />
        <label htmlFor="amount">Amount (AVAX)</label>
        <input
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
          <button type="submit" disabled={isSending || !to || !amount}>
            {isSending ? 'Sending...' : 'Send'}
          </button>
          <button type="button" onClick={onClose} disabled={isSending}>
            Cancel
          </button>
        </div>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default SendTransactionForm;



// import { useState, useEffect } from 'react';
// import { sendTransaction, getFeeQuote } from '../utils/walletUtils';
// import { TransactionStatus } from '../utils/types';
// import { createSmartAccountClient } from '@biconomy/account';
// import { avalancheFuji } from 'viem/chains';
// import { formatEther, formatUnits } from 'viem';
// import { getProvider } from '../utils/provider';

// interface SendTransactionFormProps {
//   account: string;
//   walletAddress: string;
//   index: number;
//   onSend: (status: TransactionStatus) => void;
//   onClose: () => void;
//   balance: string;
//   tokenBalance: string;
// }

// function SendTransactionForm({ account, walletAddress, index, onSend, onClose, balance, tokenBalance }: SendTransactionFormProps) {
//   const [to, setTo] = useState<string>('');
//   const [amount, setAmount] = useState<string>('');
//   const [paymasterMode, setPaymasterMode] = useState<'SPONSORED' | 'ERC20'>('SPONSORED');
//   const [feeQuote, setFeeQuote] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [isSending, setIsSending] = useState<boolean>(false);

//   useEffect(() => {
//     const fetchFeeQuote = async () => {
//       if (paymasterMode === 'ERC20') {
//         try {
//           const provider = await getProvider(account);
//           const signer = await provider.getSigner();
//           const smartAccount = await createSmartAccountClient({
//             signer,
//             bundlerUrl: import.meta.env.VITE_BUNDLER_URL,
//             biconomyPaymasterApiKey: import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY,
//             chainId: avalancheFuji.id,
//             index,
//             rpcUrl: import.meta.env.VITE_AVALANCHE_FUJI_RPC,
//           });
//           const userOp = await smartAccount.buildUserOp([{ to: walletAddress, value: 0n }]); // Dummy op
//           const quote = await getFeeQuote(smartAccount, userOp);
//           setFeeQuote(quote ? formatUnits(BigInt(quote.maxGasFee), 6) : null);
//         } catch (err) {
//           setFeeQuote(null);
//           setError('Failed to fetch USDC fee quote');
//         }
//       } else {
//         setFeeQuote(null); // No fee for sponsored
//       }
//     };
//     fetchFeeQuote();
//   }, [paymasterMode, index, account]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setIsSending(true);

//     try {
//       const status = await sendTransaction(account, walletAddress, index, to, amount, paymasterMode);
//       onSend(status);
//       if (status.state === 'success') {
//         setTo('');
//         setAmount('');
//       }
//     } catch (err: any) {
//       setError(err.message || 'Failed to send transaction');
//     } finally {
//       setIsSending(false);
//     }
//   };

//   return (
//     <div className="send-form">
//       <h3>Send Transaction</h3>
//       <p>AVAX Balance: {formatEther(BigInt(balance))} AVAX</p>
//       <p>USDC Balance: {formatUnits(BigInt(tokenBalance), 6)} USDC</p>
//       <form onSubmit={handleSubmit}>
//         <label htmlFor="recipient">Recipient Address</label>
//         <input
//           id="recipient"
//           type="text"
//           value={to}
//           onChange={(e) => setTo(e.target.value)}
//           placeholder="0x..."
//           disabled={isSending}
//         />
//         <label htmlFor="amount">Amount (AVAX)</label>
//         <input
//           id="amount"
//           type="number"
//           step="0.001"
//           min="0"
//           value={amount}
//           onChange={(e) => setAmount(e.target.value)}
//           placeholder="0.0"
//           disabled={isSending}
//         />
//         <label>Paymaster Mode</label>
//         <div className="paymaster-toggle">
//           <label>
//             <input
//               type="radio"
//               value="SPONSORED"
//               checked={paymasterMode === 'SPONSORED'}
//               onChange={() => setPaymasterMode('SPONSORED')}
//               disabled={isSending}
//             />
//             Sponsored (Free)
//           </label>
//           <label>
//             <input
//               type="radio"
//               value="ERC20"
//               checked={paymasterMode === 'ERC20'}
//               onChange={() => setPaymasterMode('ERC20')}
//               disabled={isSending}
//             />
//             Pay with USDC
//           </label>
//         </div>
//         {feeQuote && paymasterMode === 'ERC20' && <p>Estimated Fee: {feeQuote} USDC</p>}
//         {paymasterMode === 'SPONSORED' && <p>Estimated Fee: 0 AVAX (Sponsored)</p>}
//         <div className="send-form-buttons">
//           <button type="submit" disabled={isSending || !to || !amount || (paymasterMode === 'ERC20' && !feeQuote)}>
//             {isSending ? 'Sending...' : 'Send'}
//           </button>
//           <button type="button" onClick={onClose} disabled={isSending}>
//             Cancel
//           </button>
//         </div>
//       </form>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//     </div>
//   );
// }

// export default SendTransactionForm;