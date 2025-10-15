import React, { useEffect, useMemo, useRef, useState } from 'react';

// Minimal Tetris-like animation: just falling blocks in a canvas for each player
function FallingBlocks({ seed }: { seed: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const W = (cvs.width = 200);
    const H = (cvs.height = 300);
    let t = 0;
    const rnd = (n: number) => {
      const x = Math.sin(seed + n) * 10000;
      return x - Math.floor(x);
    };
    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      // draw grid
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let x = 0; x < W; x += 20) ctx.fillRect(x, 0, 1, H);
      for (let y = 0; y < H; y += 20) ctx.fillRect(0, y, W, 1);
      // 5 blocks falling with different speeds
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(rnd(i + 1) * 10) * 20;
        const speed = 1 + (rnd(i + 2) * 2);
        const y = Math.floor(((t * speed) % (H / 20)) * 20);
        ctx.fillStyle = `hsl(${(i * 60) % 360}, 70%, 60%)`;
        ctx.fillRect(x, y, 20, 20);
      }
      t += 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [seed]);
  return <canvas ref={ref} className="rounded border border-white/10 bg-black/30" />;
}

function parseTempService(input: string): { channelNumber: string; role: 'u1'|'u2' } | null {
  try {
    // Example: tempservice://base/LC123...?u=1&k=... → role from u
    const url = new URL(input);
    const path = url.pathname.replace(/^\//, '');
    const u = url.searchParams.get('u');
    const role = u === '1' ? 'u1' : 'u2';
    return { channelNumber: path, role };
  } catch {
    return null;
  }
}

async function fetchJSON(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(()=>'')}`);
  return res.json();
}

export default function GameArena() {
  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';
  const [tempUri, setTempUri] = useState('');
  const [role, setRole] = useState<'u1'|'u2'|'none'>('none');
  const [channelId, setChannelId] = useState<string>('');
  const [channelNumber, setChannelNumber] = useState<string>('');
  const [u1, setU1] = useState<string>('');
  const [u2, setU2] = useState<string>('');
  const [score, setScore] = useState<{u1:number;u2:number}>({u1:0,u2:0});
  const [status, setStatus] = useState<'idle'|'running'|'stopped'|'none'>('none');
  const [loopOn, setLoopOn] = useState(false);

  const seed = useMemo(() => Math.floor(Math.random()*1e6), []);
  const pollRef = useRef<number | null>(null);
  const loopRef = useRef<number | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); if (loopRef.current) clearInterval(loopRef.current); }, []);

  const connect = async () => {
    const parsed = parseTempService(tempUri.trim());
    if (!parsed) throw new Error('Invalid TempService API format');
    setRole(parsed.role);
    setChannelNumber(parsed.channelNumber);

    // Resolve channelId from number
    const ch = await fetchJSON(`${API_BASE}/lightning/channel-by-number/${parsed.channelNumber}`);
    if (!ch?.id) throw new Error('Channel not found');
    setChannelId(ch.id);
    setU1(ch.user1Address);
    setU2(ch.user2Address);

    // Start (idempotent)
    await fetchJSON(`${API_BASE}/lightning/game/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId: ch.id, user1Address: ch.user1Address, user2Address: ch.user2Address })
    });

    // Poll game state
    pollRef.current = window.setInterval(async () => {
      try {
        const s = await fetchJSON(`${API_BASE}/lightning/game/${ch.id}`);
        if (s && s.status) {
          setScore(s.score || {u1:0,u2:0});
          setStatus(s.status);
          if (s.status !== 'running' && loopRef.current) {
            clearInterval(loopRef.current);
            loopRef.current = null;
            setLoopOn(false);
          }
        }
      } catch {}
    }, 1400);

    // Start loop only on u1
    if (parsed.role === 'u1') {
      setLoopOn(true);
      loopRef.current = window.setInterval(async () => {
        try {
          const who: 'u1'|'u2' = Math.random() < 0.5 ? 'u1' : 'u2';
          await fetchJSON(`${API_BASE}/lightning/game/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelId: ch.id, scorer: who })
          });
        } catch (e: any) {
          // Stop on insufficient margin (409 or message contains Insufficient)
          if (loopRef.current) { clearInterval(loopRef.current); loopRef.current = null; setLoopOn(false); }
        }
      }, 1200 + Math.floor(Math.random()*600));
    }
  };

  const stop = async () => {
    if (channelId) {
      try {
        await fetchJSON(`${API_BASE}/lightning/game/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId })
        });
      } catch {}
    }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (loopRef.current) { clearInterval(loopRef.current); loopRef.current = null; }
    setLoopOn(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
        <h2 className="text-white font-semibold mb-2">AI Tetris (Demo)</h2>
        <p className="text-gray-300 text-sm mb-3">Paste your TempService API below to join the same channel (u=1/u=2). Only user1 window drives scoring.</p>
        <input
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white"
          placeholder="tempservice://base/LCXXXXXX?u=1&k=..."
          value={tempUri}
          onChange={(e) => setTempUri(e.target.value)}
        />
        <div className="mt-3 flex gap-2">
          <button onClick={connect} className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white">Connect</button>
          <button onClick={stop} className="px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-700 text-white">Stop</button>
          <span className="text-gray-300 text-sm">Status: {status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold">Player 1</h3>
            <div className="text-blue-300">Score: {score.u1}</div>
          </div>
          <FallingBlocks seed={seed + 1} />
          <div className="text-xs text-gray-400 mt-2 break-all">{u1}</div>
          {role === 'u1' && loopOn && (
            <div className="text-[11px] text-yellow-300 mt-1">Scoring loop active…</div>
          )}
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold">Player 2</h3>
            <div className="text-blue-300">Score: {score.u2}</div>
          </div>
          <FallingBlocks seed={seed + 2} />
          <div className="text-xs text-gray-400 mt-2 break-all">{u2}</div>
        </div>
      </div>

      {channelNumber && (
        <div className="text-xs text-gray-400">Channel: {channelNumber} • Role: {role}</div>
      )}
    </div>
  );
}
