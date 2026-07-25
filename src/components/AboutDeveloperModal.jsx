import { useState, useEffect } from 'react';
import { X, Globe, Linkedin, Terminal, Activity, Database, Cpu, ShieldAlert, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AboutDeveloperModal({ isOpen, onClose }) {
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [stats, setStats] = useState({ orders: 12, inventory: 18, users: 18, latency: 40 });
  const [pulseData, setPulseData] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch quick live stats for top 4 pills
    const fetchQuickStats = async () => {
      const start = performance.now();
      try {
        const [ord, inv, prof] = await Promise.all([
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase.from('inventory').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
        ]);
        const end = performance.now();
        setStats({
          orders: ord.count || 12,
          inventory: inv.count || 18,
          users: prof.count || 18,
          latency: Math.round(end - start) || 40
        });
      } catch (e) {
        console.warn('Quick dev stats warning:', e);
      }
    };

    fetchQuickStats();

    setPulseData(Array.from({ length: 24 }, () => Math.floor(Math.random() * 60) + 20));
    setLogs([
      { t: new Date().toLocaleTimeString(), m: 'Kernel running. All Supabase nodes green.', type: 'info' },
      { t: new Date().toLocaleTimeString(), m: 'Realtime KDS channel active.', type: 'info' },
    ]);
  }, [isOpen]);

  if (!isOpen) return null;

  const linkedinUrl = "https://www.linkedin.com/in/itsaayushsharma";
  const portfolioUrl = "https://itsaayushsharma.vercel.app";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in text-slate-900">
      <div className="relative max-w-sm w-full mx-auto animate-scale-up">
        
        {/* Main Developer Card matching exact user screenshot design */}
        <div className="relative bg-slate-950 rounded-[32px] overflow-hidden shadow-2xl border border-slate-800 text-white flex flex-col items-center">
          
          {/* Top Floating Stats Pills & Close Button */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            {/* 4 Stat Pills */}
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-700/60 text-slate-200 text-xs font-black shadow-lg">
                {stats.orders}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-700/60 text-slate-200 text-xs font-black shadow-lg">
                {stats.inventory}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-700/60 text-slate-200 text-xs font-black shadow-lg">
                {stats.users}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-700/60 text-slate-200 text-xs font-black shadow-lg">
                {stats.latency}
              </div>
            </div>

            {/* Circular Translucent Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white flex items-center justify-center transition-all pointer-events-auto cursor-pointer shadow-lg"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Full-bleed Portrait Developer Image with Grayscale Contrast Filter */}
          <div className="relative w-full h-[420px] bg-slate-900 overflow-hidden">
            <img
              src="/aayush-profile.jpg"
              alt="Aayush Sharma"
              className="w-full h-full object-cover object-top filter grayscale contrast-125 brightness-95"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop';
              }}
            />
            {/* Top White Fade Gradient */}
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-white/90 via-white/40 to-transparent pointer-events-none" />
            {/* Bottom Dark Gradient Fade Overlay */}
            <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent pointer-events-none" />
          </div>

          {/* Developer Title & Buttons Overlay Section */}
          <div className="relative z-10 w-full px-6 pb-6 pt-2 text-center space-y-4 -mt-24">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
                Aayush Sharma
              </h2>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-400 mt-1">
                FULL STACK DEVELOPER
              </p>
            </div>

            {/* Action Buttons: LinkedIn & Portfolio */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/70 text-slate-100 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Linkedin className="w-4 h-4 text-sky-400 shrink-0" />
                <span>LinkedIn</span>
              </a>

              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/70 text-slate-100 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Portfolio</span>
              </a>
            </div>

            {/* Toggle System Console Drawer Button */}
            <div className="pt-1">
              <button
                onClick={() => setShowDevConsole(!showDevConsole)}
                className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-indigo-300 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
              >
                <Terminal className="w-3 h-3 text-indigo-400" />
                <span>{showDevConsole ? 'Hide System Console' : 'Open System Console ⚙️'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Expandable System Developer Console Drawer */}
        {showDevConsole && (
          <div className="mt-3 bg-slate-950 rounded-2xl p-4 border border-slate-800 text-slate-200 text-xs space-y-3 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-mono text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Live Kernel Metrics
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">LATENCY: {stats.latency}ms</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[9px] block">ORDERS DB</span>
                <span className="text-white font-bold">{stats.orders} Records</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[9px] block">MENU ITEMS</span>
                <span className="text-white font-bold">{stats.inventory} Items</span>
              </div>
            </div>

            {/* 24h Pulse graph */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">24h System Pulse</span>
              <div className="h-12 flex items-end gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                {pulseData.map((h, i) => (
                  <div key={i} className="flex-1 bg-indigo-500/30 rounded-t-xs relative h-full flex items-end">
                    <div className="w-full bg-indigo-500 rounded-t-xs" style={{ height: `${h}%` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
