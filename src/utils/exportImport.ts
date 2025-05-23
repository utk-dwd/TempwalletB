// src/utils/exportImport.ts
import { UserData, WalletAccount, Wallet } from '../utils/types';
import { getProvider } from './provider';
import { getUserData } from './walletUtils';

// Sanitized export data interface (excludes sensitive fields)
interface ExportData {
  accounts: {
    account: string;
    name: string;
    externalAccountNumber: number;
    wallets: {
      address: string;
      walletNumber: number;
      externalAccountNumber: number;
      index: number;
    }[];
  }[];
  activeAccount: string | null;
}

// Export user data as a downloadable JSON file
export const exportUserData = (): boolean => {
  try {
    const userData = JSON.parse(localStorage.getItem('tempWalletUserData') || '{}') as UserData;
    if (!userData.accounts || !Array.isArray(userData.accounts)) {
      throw new Error('No wallet data to export');
    }

    // Sanitize data: exclude sensitive fields
    const exportData: ExportData = {
      accounts: userData.accounts.map((account) => ({
        account: account.account,
        name: account.name,
        externalAccountNumber: account.externalAccountNumber,
        wallets: account.wallets.map((wallet) => ({
          address: wallet.address,
          walletNumber: wallet.walletNumber,
          externalAccountNumber: wallet.externalAccountNumber,
          index: wallet.index,
        })),
      })),
      activeAccount: userData.activeAccount,
    };

    // Create JSON blob
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Trigger download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const link = document.createElement('a');
    link.href = url;
    link.download = `temp_wallet_export_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
};

// Import user data from a JSON file
export const importUserData = async (file: File): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate file size (<1MB)
    if (file.size > 1024 * 1024) {
      return { success: false, message: 'File too large (max 1MB)' };
    }

    // Read file
    const text = await file.text();
    const importedData = JSON.parse(text) as ExportData;

    // Validate structure
    if (!importedData.accounts || !Array.isArray(importedData.accounts)) {
      return { success: false, message: 'Invalid file format: Missing accounts' };
    }
    for (const account of importedData.accounts) {
      if (
        !account.account ||
        !/^0x[a-fA-F0-9]{40}$/.test(account.account) ||
        typeof account.name !== 'string' ||
        typeof account.externalAccountNumber !== 'number' ||
        !Array.isArray(account.wallets)
      ) {
        return { success: false, message: 'Invalid file format: Malformed account data' };
      }
      for (const wallet of account.wallets) {
        if (
          !wallet.address ||
          !/^0x[a-fA-F0-9]{40}$/.test(wallet.address) ||
          typeof wallet.walletNumber !== 'number' ||
          typeof wallet.externalAccountNumber !== 'number' ||
          typeof wallet.index !== 'number'
        ) {
          return { success: false, message: 'Invalid file format: Malformed wallet data' };
        }
      }
    }

    // Get current MetaMask account
    const provider = await getProvider();
    const accounts = await provider.send('eth_accounts', []);
    const currentAccount = accounts[0]?.toLowerCase();
    if (!currentAccount) {
      return { success: false, message: 'No MetaMask account connected' };
    }

    // Verify at least one account matches
    const matchingAccount = importedData.accounts.find(
      (acc) => acc.account.toLowerCase() === currentAccount
    );
    if (!matchingAccount) {
      return { success: false, message: 'No matching MetaMask account in imported data' };
    }

    // Merge with existing localStorage data
    const existingData = getUserData();
    const newUserData: UserData = {
      accounts: [...existingData.accounts],
      activeAccount: currentAccount,
    };

    // Add or update imported accounts
    for (const importedAccount of importedData.accounts) {
      const existingAccountIndex = newUserData.accounts.findIndex(
        (acc) => acc.account.toLowerCase() === importedAccount.account.toLowerCase()
      );
      if (existingAccountIndex === -1) {
        // Add new account
        newUserData.accounts.push({
          account: importedAccount.account,
          name: importedAccount.name,
          externalAccountNumber: importedAccount.externalAccountNumber,
          wallets: importedAccount.wallets.map((wallet) => ({
            address: wallet.address,
            walletNumber: wallet.walletNumber,
            externalAccountNumber: wallet.externalAccountNumber,
            index: wallet.index,
            transactionStatus: { state: 'idle' },
            balance: '0',
            tokenBalance: '0',
          })),
        });
      } else {
        // Update existing account
        const existingAccount = newUserData.accounts[existingAccountIndex];
        existingAccount.name = importedAccount.name;
        existingAccount.externalAccountNumber = importedAccount.externalAccountNumber;
        // Merge wallets, avoiding duplicates
        for (const importedWallet of importedAccount.wallets) {
          const walletExists = existingAccount.wallets.some(
            (w) =>
              w.address.toLowerCase() === importedWallet.address.toLowerCase() &&
              w.walletNumber === importedWallet.walletNumber
          );
          if (!walletExists) {
            existingAccount.wallets.push({
              address: importedWallet.address,
              walletNumber: importedWallet.walletNumber,
              externalAccountNumber: importedWallet.externalAccountNumber,
              index: importedWallet.index,
              transactionStatus: { state: 'idle' },
              balance: '0',
              tokenBalance: '0',
            });
          }
        }
      }
    }

    // Save merged data
    localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
    return { success: true, message: 'Wallets imported successfully' };
  } catch (error: any) {
    console.error('Import failed:', error);
    return { success: false, message: error.message || 'Failed to import wallets' };
  }
};