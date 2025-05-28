// src/utils/exportImport.ts
interface UserData {
  accounts: { account: string; name: string; wallets: any[] }[];
  activeAccount: string | null;
  walletNames?: Record<string, string>; // Map of wallet addresses to names
}

export function exportUserData(): boolean {
  try {
    const userData: UserData = JSON.parse(localStorage.getItem('tempWalletUserData') || '{}');
    const walletNames = JSON.parse(localStorage.getItem('tempWalletNames') || '{}');
    const exportData = { ...userData, walletNames };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'temp-wallet-data.json';
    link.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to export user data:', error);
    return false;
  }
}

export async function importUserData(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    const data: UserData = JSON.parse(text);
    if (data.accounts && Array.isArray(data.accounts)) {
      localStorage.setItem('tempWalletUserData', JSON.stringify(data));
      if (data.walletNames) {
        localStorage.setItem('tempWalletNames', JSON.stringify(data.walletNames));
      }
      return { success: true, message: 'Import successful' };
    } else {
      return { success: false, message: 'Invalid file format' };
    }
  } catch (error) {
    console.error('Failed to import user data:', error);
    return { success: false, message: 'Failed to import wallets' };
  }
}