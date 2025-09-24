import React, { useState, useEffect } from 'react';
import BASEToken from './BASEToken';
import TransactionTimer from './TransactionTimer';
import PaymentRequestModal from './PaymentRequestModal.js';

interface LightningTransaction {
  id: string;
  fromUser: string;
  toUser: string;
  amount: number;
  type: string;
  note?: string;
  createdAt: string;
  status: string;
}

interface PaymentRequest {
  id: string;
  fromUser: string;
  toUser: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

interface LightningChannel {
  id: string;
  channelNumber: string;
  user1Address: string;
  user2Address: string;
  user1MarginLeft: number;
  user2MarginLeft: number;
  status: string;
  transactionCount: number;
  createdAt: string;
  updatedAt: string;
  transactions: LightningTransaction[];
  requests: PaymentRequest[];
}

interface LightningChannelDashboardProps {
  channel: LightningChannel;
  userAddress: string;
  onSendPayment: (data: {
    channelId: string;
    fromUser: string;
    toUser: string;
    amount: number;
    note?: string;
  }) => Promise<void>;
  onRequestPayment: (data: {
    channelId: string;
    fromUser: string;
    toUser: string;
    amount: number;
    reason: string;
  }) => Promise<void>;
  onRefillMargin: (data: {
    channelId: string;
    userAddress: string;
    amount: number;
  }) => Promise<void>;
  onRespondToRequest: (requestId: string, response: 'ACCEPTED' | 'DECLINED') => Promise<void>;
}

const LightningChannelDashboard: React.FC<LightningChannelDashboardProps> = ({
  channel,
  userAddress,
  onSendPayment,
  onRequestPayment,
  onRefillMargin,
  onRespondToRequest
}) => {
  const [sendAmount, setSendAmount] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [refillAmount, setRefillAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState<'payment' | 'refill' | 'request'>('payment');
  const [activeRequest, setActiveRequest] = useState<PaymentRequest | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAction, setSelectedAction] = useState<'send' | 'request' | 'refill' | null>(null);

  const isUser1 = channel.user1Address.toLowerCase() === userAddress.toLowerCase();
  const otherUserAddress = isUser1 ? channel.user2Address : channel.user1Address;
  const myMarginLeft = isUser1 ? channel.user1MarginLeft : channel.user2MarginLeft;
  const otherUserMarginLeft = isUser1 ? channel.user2MarginLeft : channel.user1MarginLeft;

  // Check for pending requests for this user
  const incomingRequests = channel.requests?.filter(
    req => req.toUser.toLowerCase() === userAddress.toLowerCase() && req.status === 'PENDING'
  ) || [];

  useEffect(() => {
    if (incomingRequests.length > 0 && !activeRequest) {
      setActiveRequest(incomingRequests[0]);
    }
  }, [incomingRequests, activeRequest]);

  const validateSendForm = () => {
    const newErrors: Record<string, string> = {};
    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      newErrors.sendAmount = 'Amount must be greater than 0';
    } else if (parseFloat(sendAmount) > myMarginLeft) {
      newErrors.sendAmount = `Insufficient margin (available: ${myMarginLeft} BASE)`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRequestForm = () => {
    const newErrors: Record<string, string> = {};
    if (!requestAmount || parseFloat(requestAmount) <= 0) {
      newErrors.requestAmount = 'Amount must be greater than 0';
    }
    if (!requestReason.trim()) {
      newErrors.requestReason = 'Reason is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRefillForm = () => {
    const newErrors: Record<string, string> = {};
    if (!refillAmount || parseFloat(refillAmount) <= 0) {
      newErrors.refillAmount = 'Amount must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendPayment = async () => {
    if (!validateSendForm()) return;

    setIsProcessing(true);
    setProcessingType('payment');

    try {
      await onSendPayment({
        channelId: channel.id,
        fromUser: userAddress,
        toUser: otherUserAddress,
        amount: parseFloat(sendAmount),
        note: sendNote.trim() || undefined
      });

      setSendAmount('');
      setSendNote('');
      setErrors({});
    } catch (error) {
      console.error('Payment failed:', error);
      setErrors({ send: 'Payment failed. Please try again.' });
    }
  };

  const handleRequestPayment = async () => {
    if (!validateRequestForm()) return;

    try {
      await onRequestPayment({
        channelId: channel.id,
        fromUser: userAddress,
        toUser: otherUserAddress,
        amount: parseFloat(requestAmount),
        reason: requestReason.trim()
      });

      setRequestAmount('');
      setRequestReason('');
      setErrors({});
    } catch (error) {
      console.error('Request failed:', error);
      setErrors({ request: 'Request failed. Please try again.' });
    }
  };

  const handleRefillMargin = async () => {
    if (!validateRefillForm()) return;

    setIsProcessing(true);
    setProcessingType('refill');

    try {
      await onRefillMargin({
        channelId: channel.id,
        userAddress,
        amount: parseFloat(refillAmount)
      });

      setRefillAmount('');
      setErrors({});
    } catch (error) {
      console.error('Refill failed:', error);
      setErrors({ refill: 'Refill failed. Please try again.' });
    }
  };

  const handleRequestResponse = async (response: 'ACCEPTED' | 'DECLINED') => {
    if (!activeRequest) return;

    try {
      await onRespondToRequest(activeRequest.id, response);
      setActiveRequest(null);
    } catch (error) {
      console.error('Response failed:', error);
    }
  };

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

  const getTransactionIcon = (transaction: LightningTransaction) => {
    if (transaction.type === 'REFILL') return '⛽';
    if (transaction.fromUser.toLowerCase() === userAddress.toLowerCase()) {
      return '💸'; // Sent
    }
    return '💰'; // Received
  };

  const getTransactionColor = (transaction: LightningTransaction) => {
    if (transaction.type === 'REFILL') return 'text-blue-600';
    if (transaction.fromUser.toLowerCase() === userAddress.toLowerCase()) {
      return 'text-red-600'; // Sent (negative)
    }
    return 'text-green-600'; // Received (positive)
  };

  const getTransactionAmount = (transaction: LightningTransaction) => {
    if (transaction.type === 'REFILL') return `+${transaction.amount}`;
    if (transaction.fromUser.toLowerCase() === userAddress.toLowerCase()) {
      return `-${transaction.amount}`;
    }
    return `+${transaction.amount}`;
  };

  return (
    <div className="space-y-4">
      {/* Transaction Timer Overlay */}
      <TransactionTimer
        isActive={isProcessing}
        duration={processingType === 'refill' ? 2 : 4}
        type={processingType}
        onComplete={() => setIsProcessing(false)}
        message={
          processingType === 'payment' 
            ? 'Processing Lightning payment...' 
            : processingType === 'refill'
            ? 'Adding margin to channel...'
            : 'Processing request...'
        }
      />

      {/* Payment Request Modal */}
      {activeRequest && (
        <PaymentRequestModal
          request={activeRequest}
          onAccept={() => handleRequestResponse('ACCEPTED')}
          onDecline={() => handleRequestResponse('DECLINED')}
          onClose={() => setActiveRequest(null)}
        />
      )}

      {/* Channel Header */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌩️</span>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Lightning Channel {channel.channelNumber}
              </h1>
              <p className="text-sm text-gray-300">
                📊 Transaction Counter: {channel.transactionCount} interactions
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              channel.status === 'ACTIVE' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
            }`}>
              {channel.status}
            </div>
          </div>
        </div>

        {/* User Balances */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">
              👤 {isUser1 ? 'You' : 'Other User'}
            </div>
            <div className="text-xs text-gray-500 font-mono mb-2">
              {formatAddress(channel.user1Address)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Margin Left:</span>
              <BASEToken 
                amount={channel.user1MarginLeft} 
                size="sm"
                className={myMarginLeft < 1 ? 'text-red-400' : 'text-green-400'}
              />
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">
              👤 {isUser1 ? 'Other User' : 'You'}
            </div>
            <div className="text-xs text-gray-500 font-mono mb-2">
              {formatAddress(channel.user2Address)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Margin Left:</span>
              <BASEToken 
                amount={channel.user2MarginLeft} 
                size="sm"
                className={otherUserMarginLeft < 1 ? 'text-red-400' : 'text-green-400'}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transaction History */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            📋 Recent Activity
          </h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {channel.transactions && channel.transactions.length > 0 ? (
              channel.transactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="bg-white/5 rounded-lg p-3 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {getTransactionIcon(transaction)}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {transaction.type === 'REFILL' ? 'Margin Refilled' : 
                           transaction.fromUser.toLowerCase() === userAddress.toLowerCase() 
                             ? 'Payment Sent' : 'Payment Received'}
                        </div>
                        {transaction.note && (
                          <div className="text-xs text-gray-400">{transaction.note}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${getTransactionColor(transaction)}`}>
                        {getTransactionAmount(transaction)} BASE
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(transaction.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <span className="text-2xl mb-2 block">💫</span>
                <p>No transactions yet</p>
                <p className="text-xs">Start by sending your first payment!</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Selector & Forms */}
        <div className="space-y-4">
          {/* Service Selector Dropdown */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              🔧 Lightning Services
            </h3>
            
            <select
              value={selectedAction || ''}
              onChange={(e) => setSelectedAction(e.target.value as 'send' | 'request' | 'refill' | null || null)}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-gray-900">Choose a service...</option>
              <option value="send" className="bg-gray-900">💸 Send Payment</option>
              <option value="request" className="bg-gray-900">🙏 Request Payment</option>
              <option value="refill" className="bg-gray-900">⛽ Refill Margin</option>
            </select>
          </div>

          {/* Dynamic Form Based on Selection */}
          {selectedAction === 'send' && (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                💸 Send Payment
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.5"
                      className="w-full px-3 py-2 pr-16 bg-white/5 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isProcessing}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <BASEToken size="xs" showSymbol />
                    </div>
                  </div>
                  {errors.sendAmount && (
                    <p className="text-red-400 text-xs mt-1">{errors.sendAmount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={sendNote}
                    onChange={(e) => setSendNote(e.target.value)}
                    placeholder="Coffee money"
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isProcessing}
                  />
                </div>

                <button
                  onClick={handleSendPayment}
                  disabled={isProcessing || !sendAmount}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    isProcessing || !sendAmount
                      ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isProcessing && processingType === 'payment' ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    'Send Now'
                  )}
                </button>
                {errors.send && (
                  <p className="text-red-400 text-xs">{errors.send}</p>
                )}
              </div>
            </div>
          )}

          {selectedAction === 'request' && (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                🙏 Request Payment
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      placeholder="0.3"
                      className="w-full px-3 py-2 pr-16 bg-white/5 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <BASEToken size="xs" showSymbol />
                    </div>
                  </div>
                  {errors.requestAmount && (
                    <p className="text-red-400 text-xs mt-1">{errors.requestAmount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Split dinner bill"
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  {errors.requestReason && (
                    <p className="text-red-400 text-xs mt-1">{errors.requestReason}</p>
                  )}
                </div>

                <button
                  onClick={handleRequestPayment}
                  disabled={!requestAmount || !requestReason.trim()}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    !requestAmount || !requestReason.trim()
                      ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  }`}
                >
                  Send Request
                </button>
                {errors.request && (
                  <p className="text-red-400 text-xs">{errors.request}</p>
                )}
              </div>
            </div>
          )}

          {selectedAction === 'refill' && (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                ⛽ Refill Margin
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Add Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={refillAmount}
                      onChange={(e) => setRefillAmount(e.target.value)}
                      placeholder="1.0"
                      className="w-full px-3 py-2 pr-16 bg-white/5 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isProcessing}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <BASEToken size="xs" showSymbol />
                    </div>
                  </div>
                  {errors.refillAmount && (
                    <p className="text-red-400 text-xs mt-1">{errors.refillAmount}</p>
                  )}
                </div>

                <button
                  onClick={handleRefillMargin}
                  disabled={isProcessing || !refillAmount}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    isProcessing || !refillAmount
                      ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isProcessing && processingType === 'refill' ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Refilling...
                    </div>
                  ) : (
                    'Refill Now'
                  )}
                </button>
                {errors.refill && (
                  <p className="text-red-400 text-xs">{errors.refill}</p>
                )}
              </div>
            </div>
          )}

          {/* Instructions when no service selected */}
          {!selectedAction && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
              <span className="text-2xl mb-2 block">⚡</span>
              <p className="text-blue-400 text-sm font-medium mb-1">Choose a Lightning Service</p>
              <p className="text-gray-300 text-xs">Select a service from the dropdown above to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LightningChannelDashboard;