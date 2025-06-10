// proxy.mjs
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();
const PORT = 3001;

// The target RPC endpoint you want to proxy to.
// Make sure this is the correct endpoint for the network you are targeting (e.g., Avalanche Mainnet or Fuji Testnet).
const targetUrl = process.env.VITE_AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc';

// 1. Configure CORS Middleware
// This allows your frontend application (running on a different domain/port)
// to make requests to this proxy server.
app.use(cors({
  origin: '*', // Allows requests from any origin
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 2. Configure the Proxy Middleware
const proxyOptions = {
  target: targetUrl,
  changeOrigin: true, // Needed for virtual hosted sites
  pathRewrite: {
    '^/rpc': '', // Rewrites requests from '/rpc' to the root path of the target URL
  },
  onProxyReq: (proxyReq, req, res) => {
    // You can log or modify requests here if needed
    console.log(`Proxying request from ${req.ip} to ${targetUrl}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // This ensures CORS headers are always set on the response from the proxy
    res.setHeader('Access-Control-Allow-Origin', '*');
  },
  onError: (err, req, res) => {
    // Handle proxy errors
    console.error('Proxy Error:', err);
    res.writeHead(500, {
      'Content-Type': 'text/plain',
    });
    res.end('Something went wrong with the proxy.');
  }
};

// 3. Apply the proxy middleware to a specific path
app.use('/rpc', createProxyMiddleware(proxyOptions));

// 4. Start the server
app.listen(PORT, () => {
  console.log(`✅ Proxy server running on http://localhost:${PORT}`);
  console.log(`➡️  Forwarding /rpc requests to ${targetUrl}`);
});