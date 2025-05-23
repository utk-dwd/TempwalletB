import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Configure CORS with specific headers
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'alchemy-aa-sdk-version',
    'x-api-key',
    'x-request-id'
  ]
}));

// Proxy middleware configuration
const proxyOptions = {
  target: 'https://go.getblock.io/485b6d8831b14ae686539e6adac5cf88/ext/bc/C',
  changeOrigin: true,
  secure: false,
  onProxyReq: (proxyReq, req, res) => {
    // Forward all headers from the original request
    if (req.headers['alchemy-aa-sdk-version']) {
      proxyReq.setHeader('alchemy-aa-sdk-version', req.headers['alchemy-aa-sdk-version']);
    }
  },
  onProxyRes: function(proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, alchemy-aa-sdk-version, x-api-key, x-request-id';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
  }
};

// Apply proxy to all routes
app.use('/', createProxyMiddleware(proxyOptions));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 