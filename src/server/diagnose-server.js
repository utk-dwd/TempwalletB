// diagnose-server.js - Run this to check server status

import net from 'net';

function checkPort(port, host = 'localhost') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(3000);
    
    socket.on('connect', () => {
      console.log(`✅ Port ${port} is open on ${host}`);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      console.log(`❌ Port ${port} timed out on ${host}`);
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', (err) => {
      console.log(`❌ Port ${port} is closed on ${host} - ${err.message}`);
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

async function diagnose() {
  console.log('🔍 Diagnosing proxy server...\n');
  
  // Check if port 3001 is open
  const isPortOpen = await checkPort(3001);
  
  if (!isPortOpen) {
    console.log('\n💡 Troubleshooting steps:');
    console.log('1. Make sure you started the proxy server: node proxy.mjs');
    console.log('2. Check if another process is using port 3001');
    console.log('3. Try using a different port');
    return;
  }
  
  // Try to make HTTP requests
  try {
    console.log('\n🌐 Testing HTTP endpoints...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3001/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint working:', healthData);
    } else {
      console.log('❌ Health endpoint failed:', healthResponse.status);
    }
    
    // Test RPC endpoint
    const rpcResponse = await fetch('http://localhost:3001/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: ['0xc8a4e34C534c7738CE6c4f20E212c71cB9D8Cb19', 'latest'],
        id: 1
      })
    });
    
    if (rpcResponse.ok) {
      const rpcData = await rpcResponse.json();
      console.log('✅ RPC endpoint working:', rpcData);
    } else {
      console.log('❌ RPC endpoint failed:', rpcResponse.status);
      const text = await rpcResponse.text();
      console.log('Response:', text);
    }
    
  } catch (error) {
    console.log('❌ HTTP request failed:', error.message);
  }
}

diagnose();