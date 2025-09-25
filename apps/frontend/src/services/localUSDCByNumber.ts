// Local, UI-less USDC mapping keyed by walletNumber with defaults:
// wallet #3 => 4.7 USDC, wallet #7 => 9.2 USDC
import type { Wallet } from '../utils/types';

const KEY = 'tw:usdcByNumber:v2';
const CH = 'tw-usdc-number-v2';

type MapType = Record<number, number>; // walletNumber -> amount

const DEFAULTS: MapType = { 3: 4.7, 7: 9.2 };

function clamp(val: any, decimals = 6) {
  const n = Number(val);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(decimals));
}

function loadMap(): MapType {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MapType;
      const normalized: MapType = {};
      Object.keys(parsed).forEach(k => {
        const wn = Number(k);
        if (Number.isInteger(wn) && wn >= 0) normalized[wn] = clamp(parsed[k]);
      });
      return { ...DEFAULTS, ...normalized };
    }
  } catch {}
  // Persist defaults on first load for predictability
  saveMap(DEFAULTS);
  return { ...DEFAULTS };
}

function saveMap(map: MapType) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {}
  try {
    const bc = new BroadcastChannel(CH);
    bc.postMessage({ type: 'usdc:number:update', payload: map });
    bc.close();
  } catch {}
}

export function getUSDCForWalletNumber(walletNumber: number): number | null {
  const map = loadMap();
  return map[walletNumber] != null ? clamp(map[walletNumber]) : null;
}

export function setUSDCForWalletNumber(walletNumber: number, amount: number) {
  const map = loadMap();
  map[walletNumber] = clamp(amount);
  saveMap(map);
}

export function setBatchUSDC(updates: Record<number, number>) {
  const map = loadMap();
  Object.entries(updates).forEach(([k, v]) => {
    const wn = Number(k);
    if (Number.isInteger(wn) && wn >= 0) map[wn] = clamp(v);
  });
  saveMap(map);
}

export function adjustUSDCForWalletNumber(walletNumber: number, delta: number) {
  const map = loadMap();
  const current = map[walletNumber] ?? 0;
  map[walletNumber] = clamp(current + Number(delta));
  saveMap(map);
}

export function applySettlementAbsolute(newAmounts: Record<number, number>) {
  // Set absolute amounts post-withdraw
  setBatchUSDC(newAmounts);
}

export function applySettlementDeltas(deltas: Record<number, number>) {
  const map = loadMap();
  Object.entries(deltas).forEach(([k, d]) => {
    const wn = Number(k);
    if (!Number.isInteger(wn) || wn < 0) return;
    const current = map[wn] ?? 0;
    map[wn] = clamp(current + Number(d));
  });
  saveMap(map);
}

export function subscribeUSDCNumberChanges(onChange: () => void) {
  try {
    const bc = new BroadcastChannel(CH);
    const handler = (e: MessageEvent) => {
      if (!e || !e.data) return;
      if (e.data.type === 'usdc:number:update') onChange();
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

export function overlayLocalUSDC(wallet: Wallet): Wallet {
  const wn = wallet.walletNumber;
  if (wn == null) return wallet;
  const amount = getUSDCForWalletNumber(wn);
  if (amount == null) return wallet;

  const decimals = 6;
  const micro = Math.round(amount * 10 ** decimals);
  const token = {
    address: '0xUSDC_LOCAL_DEMO',
    chainId: 0,
    amount: String(micro),
    decimals,
    formattedAmount: String(amount),
    symbol: 'USDC',
    iconUrl: undefined,
  } as any;

  const existing = wallet.allTokenBalances || [];
  const idx = existing.findIndex((t: any) => (t.symbol || '').toUpperCase() === 'USDC');
  const nextBalances = [...existing];
  if (idx >= 0) nextBalances[idx] = token; else nextBalances.push(token);
  return { ...wallet, allTokenBalances: nextBalances };
}
