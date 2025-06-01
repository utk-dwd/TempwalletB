// src/components/layout/ProfileDropdown.tsx
import { Button } from '@/components/ui/button';

interface ProfileDropdownProps {
  address: string | null;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
  feedback: { type: 'success' | 'error'; message: string } | null;
}

export function ProfileDropdown({ address, onExport, onImport, onLogout, feedback }: ProfileDropdownProps) {
  return (
    <div className="absolute top-[calc(100%+0.5rem)] right-4 bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl p-4 flex flex-col gap-2 z-10">
      <p className="text-sm text-text-primary">
        Address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
      </p>
      <p className="text-sm text-text-primary">Full Address: {address || 'Not connected'}</p>
      <Button
        className="bg-accent-orange text-white rounded-lg hover:bg-orange-600"
        onClick={() => {
          console.log('Export Wallets button clicked, triggering onExport'); // More specific log
          onExport();
        }}
      >
        Export Wallets
      </Button>
      <label className="import-button bg-accent-orange text-white text-regular rounded-lg hover:bg-orange-600 px-15 flex items-center justify-center cursor-pointer">
        Import Wallets
        <input type="file" accept=".json" onChange={onImport} style={{ display: 'none' }} />
      </label>
      <Button className="bg-danger-red text-white rounded-lg hover:bg-red-600" onClick={onLogout}>
        Logout
      </Button>
      {feedback && (
        <p className={`text-sm ${feedback.type === 'success' ? 'text-success-green' : 'text-danger-red'}`}>
          {feedback.message}
        </p>
      )}
    </div>
  );
}