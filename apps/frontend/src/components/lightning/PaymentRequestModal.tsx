import React from 'react';
import BASEToken from './BASEToken';

interface PaymentRequest {
  id: string;
  fromUser: string;
  toUser: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

interface PaymentRequestModalProps {
  request: PaymentRequest;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
}

const PaymentRequestModal: React.FC<PaymentRequestModalProps> = ({
  request,
  onAccept,
  onDecline,
  onClose
}) => {
  const formatAddress = (address: string) => 
    `${address.slice(0, 8)}...${address.slice(-6)}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/15 backdrop-blur-lg border border-white/20 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <h3 className="text-lg font-semibold text-white">Payment Request</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">From:</span>
              <span className="text-sm font-mono text-white">
                {formatAddress(request.fromUser)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Amount:</span>
              <BASEToken amount={request.amount} size="sm" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Reason:</span>
              <span className="text-sm text-white text-right max-w-48 break-words">
                {request.reason}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Requested:</span>
              <span className="text-xs text-gray-500">
                {formatDate(request.createdAt)}
              </span>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-yellow-400 text-lg">⚡</span>
              <div>
                <p className="text-yellow-400 font-medium text-sm mb-1">
                  Lightning Network Payment
                </p>
                <p className="text-gray-300 text-xs leading-relaxed">
                  This payment will be processed instantly through your Lightning channel. 
                  Make sure you have sufficient margin before accepting.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onDecline}
            className="py-3 px-4 rounded-md font-medium transition-colors border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="py-3 px-4 rounded-md font-medium transition-colors bg-green-600 hover:bg-green-700 text-white"
          >
            Accept & Pay
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Payment will be processed with a 4-second confirmation timer
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentRequestModal;