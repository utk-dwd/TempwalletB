import React, { useState, useEffect } from 'react';

interface TransactionTimerProps {
  duration?: number; // Duration in seconds
  onComplete: () => void;
  isActive: boolean;
  message?: string;
  type?: 'payment' | 'refill' | 'request';
}

const TransactionTimer: React.FC<TransactionTimerProps> = ({
  duration = 4,
  onComplete,
  isActive,
  message = 'Processing transaction...',
  type = 'payment'
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    setTimeLeft(duration);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsAnimating(false);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isActive, duration, onComplete]);

  if (!isActive) {
    return null;
  }

  const getEmoji = () => {
    switch (type) {
      case 'payment': return '💸';
      case 'refill': return '⛽';
      case 'request': return '🙏';
      default: return '⏳';
    }
  };

  const getProgressPercentage = () => {
    return ((duration - timeLeft) / duration) * 100;
  };

  const getColorClasses = () => {
    switch (type) {
      case 'payment': return 'from-blue-500 to-blue-600 border-blue-300';
      case 'refill': return 'from-green-500 to-green-600 border-green-300';
      case 'request': return 'from-yellow-500 to-yellow-600 border-yellow-300';
      default: return 'from-gray-500 to-gray-600 border-gray-300';
    }
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 
      bg-white rounded-lg shadow-lg border-2 ${getColorClasses().split(' ').pop()}
      p-4 min-w-64 max-w-sm
      animate-slideInRight
    `}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl animate-bounce">{getEmoji()}</span>
        <span className="font-semibold text-gray-800">Processing Transaction</span>
      </div>

      {/* Message */}
      <p className="text-sm text-gray-600 mb-3">{message}</p>

      {/* Timer Display */}
      <div className="flex items-center justify-center mb-3">
        <div className={`
          relative w-16 h-16 rounded-full border-4 border-gray-200
          flex items-center justify-center
          ${isAnimating ? 'animate-pulse' : ''}
        `}>
          {/* Progress Ring */}
          <svg className="absolute inset-0 w-16 h-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className={`text-blue-500 transition-all duration-1000 ease-linear`}
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - getProgressPercentage() / 100)}`}
            />
          </svg>
          
          {/* Countdown Number */}
          <span className={`
            text-2xl font-bold text-gray-800 z-10
            ${isAnimating ? 'animate-bounce' : ''}
          `}>
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className={`
            h-2 rounded-full bg-gradient-to-r ${getColorClasses()}
            transition-all duration-1000 ease-linear
          `}
          style={{ width: `${getProgressPercentage()}%` }}
        ></div>
      </div>

      {/* Status Text */}
      <div className="text-center">
        <span className="text-xs text-gray-500">
          {timeLeft > 0 ? `${timeLeft} seconds remaining...` : 'Completing...'}
        </span>
      </div>

      {/* Animated Dots */}
      <div className="flex justify-center gap-1 mt-2">
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

// Add custom animation styles
const styles = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slideInRight {
    animation: slideInRight 0.3s ease-out;
  }
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default TransactionTimer;