// frontend/src/components/TelegramRegistration.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { TelegramRegistrationPayload } from '../types/shared.js';

// Telegram Logo SVG Component with official Telegram blue
const TelegramLogo = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-6 h-6"
    fill="#0088cc"
  >
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const TelegramRegistration: React.FC = () => {
  const [chatId, setChatId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validation function for Chat ID
  const validateChatId = (value: string): boolean => {
    const numberRegex = /^\d{10}$/;
    return numberRegex.test(value);
  };

  // Handle input change with validation
  const handleChatIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow numeric input
    if (/^\d*$/.test(value)) {
      setChatId(value);
      
      // Clear previous errors when user starts typing
      if (error && value.length > 0) {
        setError('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!chatId.trim()) {
      setError('Please enter your Telegram Chat ID');
      return;
    }

    if (!validateChatId(chatId)) {
      setError('Chat ID must be exactly 10 digits');
      return;
    }

    setIsLoading(true);

    try {
      const payload: TelegramRegistrationPayload = {
        chatId: chatId.trim(),
        protectedData: '' // Add protectedData to match interface
      };
      await api.post('/auth/register-telegram', payload);
      setMessage('Telegram Chat ID registered successfully!');
      setChatId('');
    } catch (err) {
      setError('Failed to register Telegram Chat ID. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-90 shadow-xl border border-white/20 bg-white/10 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="flex items-center">
          {/* <div className="w-15 h-10 bg-white/30 rounded-full flex items-center justify-center border border-white/20">
            <TelegramLogo />
          </div> */}
          <div className="text-center">
            <CardTitle className="text-xl font-semibold text-white mb-1">
              Telegram Notifications
            </CardTitle>
            <CardDescription className="text-sm text-white/80">
              Connect your Telegram to receive wallet notifications
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <p className="text-sm text-white/80 text-center leading-relaxed">
            Get your Chat ID from{' '}
            <a
              href="https://t.me/iEXECweb3TelegramBot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              @iEXECweb3TelegramBot
              <ExternalLink className="w-4 h-4" />
            </a>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chatId" className="text-sm font-medium text-white/90 block text-center">
              Telegram Chat ID
            </Label>
            <Input
              id="chatId"
              type="tel"
              value={chatId}
              onChange={handleChatIdChange}
              placeholder="Enter 10-digit Chat ID"
              className="h-10 text-sm px-4 border-white/30 focus:border-blue-400/30 focus:ring-blue-400/30 bg-white/10 text-white placeholder:text-white/60 text-center"
              disabled={isLoading}
              maxLength={10}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-10 bg-[#0088cc] hover:bg-[#0077b3] text-white text-sm font-medium transition-all duration-200 hover:transform hover:translateY(-1px) hover:shadow-md"
            disabled={isLoading || !chatId.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <TelegramLogo />
                <span className="mr-5">Register Telegram</span>
              </>
            )}
          </Button>
        </form>

        {/* Success Message */}
        {message && (
          <Alert className="border-green-400/50 bg-green-500/10 py-3 border border-white/20">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300 text-sm ml-2">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="border-red-400/50 bg-red-500/10 py-3 border border-white/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300 text-sm ml-2">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default TelegramRegistration;