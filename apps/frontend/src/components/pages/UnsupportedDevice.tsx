import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';

export const UnsupportedDevice: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-black to-gray-900/20"></div>
      
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>

      {/* Main content */}
      <div className="relative z-10 max-w-8xl mx-auto text-center">
        
        {/* Icon section */}
        <div className="mb-12 flex items-center justify-center space-x-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-500 rounded-2xl flex items-center justify-center border border-gray-700 shadow-2xl">
              <Smartphone className="w-12 h-12 text-gray-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✕</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-0.5 bg-gray-600"></div>
            <div className="w-12 h-0.5 bg-gray-700"></div>
            <div className="w-8 h-0.5 bg-gray-800"></div>
          </div>
          
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <Monitor className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          </div>
        </div>

        {/* Main heading */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Desktop Required
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-gray-500 to-white mx-auto rounded-full"></div>
        </div>

        {/* Description
        <div className="mb-12">
          <p className="text-3xl text-gray-300 leading-relaxed max-w-lg mx-auto">
            This application requires a desktop environment for optimal performance and security.
          </p>
        </div> */}

        {/* Bottom text */}
        <div className="bg-gray-700/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 max-w-2xl mx-auto">
          <p className="text-gray-300 text-3xl leading-relaxed">
            <span className="text-white font-semibold">This Dapp is for Crypto Degens not rookies,</span>
            <br />
            <br />
            <span className="text-gray-200">Please visit on your desktop</span>
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-96 h-96 border border-gray-800/30 rounded-full"></div>
          <div className="absolute inset-8 border border-gray-800/20 rounded-full"></div>
          <div className="absolute inset-16 border border-gray-800/10 rounded-full"></div>
        </div>
      </div>

      {/* Bottom ambient glow */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-32 bg-gradient-to-t from-gray-900/30 to-transparent"></div>
    </div>
  );
};