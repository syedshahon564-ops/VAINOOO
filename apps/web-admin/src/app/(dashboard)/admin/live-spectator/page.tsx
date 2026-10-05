'use client';

import React, { useState, useEffect } from 'react';
import { Video, Bot, Crosshair, AlertCircle, RefreshCw, Radio } from 'lucide-react';

export default function LiveSpectatorPage() {
  const [killfeed, setKillfeed] = useState<any[]>([
    {
      killerIgn: 'BDX_STRIKER',
      victimIgn: 'Viper_99',
      weapon: 'M1887',
      isHeadshot: true,
      time: 'Just now',
    },
    {
      killerIgn: 'Silent_Sniper',
      victimIgn: 'Shadow_Rider',
      weapon: 'AWM',
      isHeadshot: true,
      time: '12s ago',
    },
    {
      killerIgn: 'Ghost_OP',
      victimIgn: 'Dragon_BD',
      weapon: 'MP40',
      isHeadshot: false,
      time: '25s ago',
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-neon-cyan" /> Autonomous Live Spectator Feed
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time emulator stream & OCR optical character recognition parser.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> Spectator Active • 60 FPS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stream Canvas Mockup */}
        <div className="lg:col-span-8 glass-panel p-4 border border-white/10 space-y-3">
          <div className="relative aspect-video rounded-xl bg-black/80 border border-white/10 overflow-hidden flex flex-col justify-between p-4">
            {/* Top Game UI Overlay Simulation */}
            <div className="flex items-center justify-between z-10">
              <div className="px-3 py-1 rounded bg-black/60 backdrop-blur-md text-[11px] text-white font-mono border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>FF CUSTOM ROOM #42 • ALIVE: 18 • KILLS: 30</span>
              </div>
              <div className="text-[11px] font-mono text-neon-cyan bg-black/60 px-2.5 py-1 rounded border border-cyan/20">
                OCR: ACTIVE
              </div>
            </div>

            {/* Center Crosshair View */}
            <div className="self-center text-center space-y-2 opacity-60">
              <Crosshair className="w-16 h-16 text-gold/40 mx-auto animate-spin-slow" />
              <p className="text-xs font-mono text-gray-400">
                [ADB CONTROLLER ATTACHED: SPECTATOR SLOT 1]
              </p>
            </div>

            {/* Bottom Stream Status */}
            <div className="flex items-center justify-between text-[11px] text-gray-400 z-10 bg-black/60 px-3 py-1.5 rounded backdrop-blur-md border border-white/10 font-mono">
              <span>Resolution: 1920x1080 @ 60 FPS</span>
              <span>Parser: PaddleOCR v2.8 (Latency: 42ms)</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span>Observer Fleet: Node 01 (Dhaka Datacenter)</span>
            <button className="text-gold hover:underline flex items-center gap-1 font-semibold">
              <RefreshCw className="w-3.5 h-3.5" /> Reconnect Video Stream
            </button>
          </div>
        </div>

        {/* Live Parsed OCR Kill-Feed */}
        <div className="lg:col-span-4 glass-panel p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-gold" /> OCR Kill-Feed Stream
            </h3>
            <span className="text-[10px] text-gray-400">Auto-Refreshed</span>
          </div>

          <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
            {killfeed.map((kill, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-400">{kill.killerIgn}</span>
                  <span className="text-[10px] text-gray-500">{kill.time}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    Eliminated <b className="text-rose-400">{kill.victimIgn}</b>
                  </span>
                  <span className="font-mono text-gray-300 font-bold">[{kill.weapon}]</span>
                </div>
                {kill.isHeadshot && (
                  <div className="pt-1">
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-widest">
                      Headshot
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
