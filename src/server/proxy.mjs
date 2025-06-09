//TempwalletB/src/server/proxy.mjs

import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3001;

// Avalanche Mainnet RPC Configuration
const AVALANCHE_MAINNET_CONFIG = {
  // Primary RPC (your GetBlock.io endpoint)
  primary: 'https://api.avax.network/ext/bc/C/rpc', 
  // Fallback RPCs for redundancy
  fallbacks: [
    // Official Avalanche RPC
    'https://avalanche-c-chain.publicnode.com', // Public node
    'https://rpc.ankr.com/avalanche' // Ankr RPC
  ],
  chainId: 43114,
  name: 'Avalanche Mainnet'
};

// Configure CORS with enhanced options
app.use(cors({
  origin: NODE_ENV === 'production' ? [
    'https://yourdomain.com', // Replace with your actual domain
    'https://app.yourdomain.com'
  ] : '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'alchemy-aa-sdk-version',
    'x-api-key',
    'x-request-id',
    'x-chain-id',
    'user-agent'
  ],
  credentials: false
}));

// Add request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.get('User-Agent')}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    network: AVALANCHE_MAINNET_CONFIG.name,
    chainId: AVALANCHE_MAINNET_CONFIG.chainId,
    timestamp: new Date().toISOString()
  });
});

// Network info endpoint
app.get('/network', (req, res) => {
  res.json({
    name: AVALANCHE_MAINNET_CONFIG.name,
    chainId: AVALANCHE_MAINNET_CONFIG.chainId,
    rpcUrl: AVALANCHE_MAINNET_CONFIG.primary,
    explorer: 'https://snowtrace.io'
  });
});

// Enhanced proxy middleware configuration
const proxyOptions = {
  target: AVALANCHE_MAINNET_CONFIG.primary,
  changeOrigin: true,
  secure: true, // Set to true for HTTPS targets
  timeout: 30000, // 30 second timeout
  proxyTimeout: 30000,
  
  // Request transformation
  onProxyReq: (proxyReq, req, res) => {
    // Forward important headers
    const headersToForward = [
      'alchemy-aa-sdk-version',
      'x-api-key',
      'x-request-id',
      'authorization'
    ];
    
    headersToForward.forEach(header => {
      if (req.headers[header]) {
        proxyReq.setHeader(header, req.headers[header]);
      }
    });

    // Set User-Agent for better RPC provider compatibility
    proxyReq.setHeader('User-Agent', 'Avalanche-Proxy-Server/1.0');
    
    // Log outgoing request
    console.log(`[PROXY] ${req.method} -> ${proxyReq.path}`);
  },

  // Response transformation
  onProxyRes: function(proxyRes, req, res) {
    // Enhanced CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, alchemy-aa-sdk-version, x-api-key, x-request-id, x-chain-id';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    proxyRes.headers['Access-Control-Max-Age'] = '86400'; // 24 hours

    // Add network identification headers
    proxyRes.headers['X-Network'] = AVALANCHE_MAINNET_CONFIG.name;
    proxyRes.headers['X-Chain-ID'] = AVALANCHE_MAINNET_CONFIG.chainId.toString();
    
    // Log response status
    console.log(`[PROXY] Response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
  },

  // Error handling
  onError: (err, req, res) => {
    console.error(`[PROXY ERROR] ${err.message}`);
    
    // Try fallback RPC if primary fails
    if (!req.retryCount) {
      req.retryCount = 0;
    }
    
    if (req.retryCount < AVALANCHE_MAINNET_CONFIG.fallbacks.length) {
      const fallbackUrl = AVALANCHE_MAINNET_CONFIG.fallbacks[req.retryCount];
      console.log(`[PROXY] Trying fallback RPC: ${fallbackUrl}`);
      
      // Update target and retry
      proxyOptions.target = fallbackUrl;
      req.retryCount++;
      
      // Recreate proxy with new target
      const fallbackProxy = createProxyMiddleware(proxyOptions);
      return fallbackProxy(req, res);
    }

    // All RPCs failed, return error
    res.status(503).json({
      error: 'RPC Service Unavailable',
      message: 'All Avalanche RPC endpoints are currently unavailable',
      network: AVALANCHE_MAINNET_CONFIG.name,
      chainId: AVALANCHE_MAINNET_CONFIG.chainId,
      timestamp: new Date().toISOString()
    });
  }
};

// Apply proxy to RPC routes
app.use('/rpc', createProxyMiddleware(proxyOptions));
app.use('/', createProxyMiddleware(proxyOptions));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Avalanche Mainnet Proxy Server Started
📡 Port: ${PORT}
🌐 Network: ${AVALANCHE_MAINNET_CONFIG.name}
🔗 Chain ID: ${AVALANCHE_MAINNET_CONFIG.chainId}
🎯 Primary RPC: ${AVALANCHE_MAINNET_CONFIG.primary}
📊 Health Check: http://localhost:${PORT}/health
  `);
  
  // Test primary RPC connection on startup
  fetch(AVALANCHE_MAINNET_CONFIG.primary, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_chainId',
      params: [],
      id: 1
    })
  })
  .then(res => res.json())
  .then(data => {
    const chainId = parseInt(data.result, 16);
    if (chainId === AVALANCHE_MAINNET_CONFIG.chainId) {
      console.log('✅ Primary RPC connection verified');
    } else {
      console.warn('⚠️  Chain ID mismatch - check RPC configuration');
    }
  })
  .catch(err => {
    console.error('❌ Failed to verify RPC connection:', err.message);
  });
});