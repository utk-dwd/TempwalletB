import React from 'react';

interface BASETokenProps {
  amount?: number | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showSymbol?: boolean;
  className?: string;
}

const BASEToken: React.FC<BASETokenProps> = ({ 
  amount, 
  size = 'sm', 
  showSymbol = true, 
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <img 
        src="/base-logo.svg" 
        alt="BASE" 
        className={sizeClasses[size]}
      />
      {(amount !== undefined || showSymbol) && (
        <span className={`font-medium text-blue-600 ${textSizeClasses[size]}`}>
          {amount !== undefined ? `${amount} BASE` : 'BASE'}
        </span>
      )}
    </div>
  );
};

export default BASEToken;