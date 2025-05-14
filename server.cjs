const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enable CORS for requests from your Vite app (http://localhost:5173)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Get RPC URL from environment variables, with fallback to QuickNode
const RPC_URL = process.env.RPC_URL || 'https://go.getblock.io/485b6d8831b14ae686539e6adac5cf88/ext/bc/C/rpc';

app.post('/rpc', async (req, res) => {
  try {
    const response = await axios.post(RPC_URL, req.body, {
      headers: { 'Content-Type': 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    console.error('RPC Proxy Error:', error.message);
    res.status(500).json({ error: 'Failed to proxy RPC request' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`RPC Proxy Server running on port ${PORT}`);
});