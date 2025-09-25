// @ts-nocheck
// ClearNode connection scaffolding for Nitrolite off-chain messaging
// NOTE: Placeholder only – not imported in the app. Safe to keep in repo without side effects.

import type { WebSocket as WS } from 'ws';

// Use native browser WebSocket if available, fallback to 'ws' type
const WebSocketImpl: any = (typeof WebSocket !== 'undefined' ? WebSocket : null) as unknown as WS;

export interface ClearNodeOptions {
  url?: string; // default mainnet
  jwtStorageKey?: string; // where JWT is cached
}

export class ClearNodeClient {
  private ws: any | null = null;
  private url: string;
  private jwtKey: string;

  constructor(opts?: ClearNodeOptions) {
    this.url = opts?.url || 'wss://clearnet.yellow.com/ws';
    this.jwtKey = opts?.jwtStorageKey || 'clearnode_jwt';
  }

  connect() {
    // No-op placeholder: return a fake socket-like object to avoid side effects
    this.ws = {
      readyState: 0,
      send: (_: any) => {},
      close: () => {},
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
    };
    return this.ws;
  }

  async authenticate(address: string) {
    // Placeholder – pretend to auth and set fake JWT
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.jwtKey, 'FAKE.JWT.TOKEN');
      }
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  send(_payload: any) {
    // swallow messages in placeholder
  }

  dispose() {
    this.ws = null;
  }
}
