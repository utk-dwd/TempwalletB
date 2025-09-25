// Minimal local token store for demo USDC balances (frontend-only)

type USDCEntry = { address: string; amount: number };
type USDCConfig = {
  entries: USDCEntry[]; // up to two entries is enough for demo
  displayAddress: string | null; // which address to show in UI
};

const KEY = 'tw:usdcConfig';

const normalize = (addr: string) => (addr || '').trim().toLowerCase();

export function getUSDCConfig(): USDCConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as USDCConfig;
      // sanitize
      parsed.entries = (parsed.entries || []).map(e => ({
        address: e.address || '',
        amount: Number.isFinite(e.amount) ? e.amount : 0,
      }));
      parsed.displayAddress = parsed.displayAddress || null;
      return parsed;
    }
  } catch {}
  // default: two demo amounts with empty addresses
  const initial: USDCConfig = {
    entries: [
      { address: '', amount: 4.7 },
      { address: '', amount: 3.4 },
    ],
    displayAddress: null,
  };
  localStorage.setItem(KEY, JSON.stringify(initial));
  return initial;
}

export function setUSDCConfig(cfg: USDCConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
  try {
    const bc = new BroadcastChannel('tw-usdc');
    bc.postMessage({ type: 'config:update', payload: cfg });
    bc.close();
  } catch {}
}

export function setUSDCEntry(index: number, entry: USDCEntry) {
  const cfg = getUSDCConfig();
  const next = { ...cfg };
  next.entries = [...(cfg.entries || [])];
  next.entries[index] = { address: entry.address || '', amount: Number(entry.amount) || 0 };
  setUSDCConfig(next);
}

export function setUSDCDisplayAddress(addr: string | null) {
  const cfg = getUSDCConfig();
  setUSDCConfig({ ...cfg, displayAddress: addr && addr.trim() ? addr : null });
}

export function getUSDCBalanceFor(address?: string | null): number | null {
  if (!address) return null;
  const cfg = getUSDCConfig();
  const disp = normalize(cfg.displayAddress || '');
  const addrN = normalize(address);
  if (!disp || disp !== addrN) return null; // only show for the selected wallet
  const found = (cfg.entries || []).find(e => normalize(e.address) === addrN);
  return found ? Number(found.amount) || 0 : 0;
}

export function subscribeUSDCConfig(onChange: (cfg: USDCConfig) => void) {
  try {
    const bc = new BroadcastChannel('tw-usdc');
    const handler = (e: MessageEvent) => {
      if (!e || !e.data) return;
      if (e.data.type === 'config:update') onChange(e.data.payload as USDCConfig);
    };
    bc.addEventListener('message', handler);
    return () => {
      bc.removeEventListener('message', handler);
      bc.close();
    };
  } catch {
    return () => {};
  }
}
