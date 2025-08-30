// Type declaration for MetaMask's window.ethereum
// Dependency: None (TypeScript global augmentation)
// Integration: Declares window.ethereum for MetaMask compatibility
// Purpose: Fixes TypeScript error for window.ethereum in provider.ts

// Augment the Window interface to include ethereum property
interface Window {
    // MetaMask injects ethereum as an EIP-1193 provider
    // Use 'any' for simplicity, compatible with ethers@6.14.0
    ethereum?: any;
  }