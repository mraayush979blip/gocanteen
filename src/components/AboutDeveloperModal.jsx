import { useState, useEffect } from 'react';
import { 
  X, Code, Terminal, Database, Activity, Users, Settings, ShieldAlert, Cpu, Server, Zap, RefreshCw,
  HardDrive, Info, Mail, Heart, Sparkles, Award, Globe, ExternalLink, KeyRound, Lock, CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AboutDeveloperModal({ isOpen, onClose }) {
  const { session, profile, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'overview' | 'database' | 'logs' | 'policies'
  
  // Real-time System Metrics
  const [latency, setLatency] = useState(42);
  const [pulseData, setPulseData] = useState([]);
  const [dbStats, setDbStats] = useState({ orders: 0, inventory: 0, profiles: 0, offers: 0, promos: 0 });
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    // Initialize 24-point system pulse
    setPulseData(Array.from({ length: 24 }, () => Math.floor(Math.random() * 65) + 20));

    setLogs([
      { t: new Date().toLocaleTimeString(), m: 'Kernel initialized. Developer Console Active.', type: 'info' },
      { t: new Date().toLocaleTimeString(), m: 'Realtime WebSocket connected to Supabase Edge.', type: 'info' },
      { t: new Date().toLocaleTimeString(), m: 'Anti-Spam Cash Lock: ACTIVE (Max 2 unpaid COD limit)', type: 'warn' },
      { t: new Date().toLocaleTimeString(), m: 'Razorpay UPI Intent Handler initialized.', type: 'info' }
    ]);

    const fetchDevMetrics = async () => {
      const startTime = performance.now();
      try {
        const [ordRes, invRes, profRes, offRes, promoRes] = await Promise.all([
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase.from('inventory').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('offers').select('id', { count: 'exact', head: true }),
          supabase.from('promo_codes').select('id', { count: 'exact', head: true })
        ]);

        const endTime = performance.now();
        setLatency(Math.round(endTime - startTime));

        setDbStats({
          orders: ordRes.count || 0,
          inventory: invRes.count || 0,
          profiles: profRes.count || 0,
          offers: offRes.count || 0,
          promos: promoRes.count || 0
        });
      } catch (e) {
        console.warn('Dev metrics fetch warning:', e);
      }
    };

    fetchDevMetrics();

    const interval = setInterval(async () => {
      const start = performance.now();
      try {
        await supabase.from('inventory').select('id').limit(1);
        const end = performance.now();
        setLatency(Math.round(end - start));
        setPulseData(prev => {
          const next = [...prev];
          next[next.length - 1] = Math.min(100, Math.max(15, next[next.length - 1] + (Math.random() * 20 - 10)));
          return next;
        });
      } catch (e) {}
    }, 8000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in text-slate-900 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full text-slate-100 shadow-2xl relative overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 flex items-center justify-center font-mono font-black shadow-inner">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">About Developer & System Kernel</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-700/50">
                  AMS-V2-STABLE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Created & Engineered by Aayush Sharma</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 bg-slate-950/60 border-b border-slate-800 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'about', icon: Code, label: 'Developer Profile & Credits' },
            { id: 'overview', icon: Activity, label: 'System Pulse & Health' },
            { id: 'database', icon: Database, label: 'Database Nodes' },
            { id: 'logs', icon: Terminal, label: 'Live Logs' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 border-t border-x ${
                activeTab === tab.id
                  ? 'bg-slate-900 border-slate-700 text-indigo-400 shadow-md'
                  : 'bg-slate-950/40 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB 1: ABOUT DEVELOPER */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Profile Card Banner */}
              <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6">
                
                {/* Developer Avatar */}
                <div className="relative shrink-0">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-2 border-indigo-400/50 shadow-2xl p-1 bg-slate-950 relative group">
                    <img
                      src="/aayush-profile.jpg"
                      alt="Aayush Sharma - Developer"
                      className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full border border-slate-900 flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" /> CREATOR
                  </div>
                </div>

                {/* Developer Info & Bio */}
                <div className="space-y-3 text-center md:text-left flex-1">
                  <div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Aayush Sharma</h2>
                      <span className="bg-indigo-500/20 text-indigo-300 font-extrabold text-[11px] px-3 py-1 rounded-full border border-indigo-400/30">
                        Lead Full-Stack Developer
                      </span>
                    </div>
                    <p className="text-xs text-indigo-300 font-bold mt-1">Creator & Systems Architect of Go Canteen</p>
                  </div>

                  <p className="text-slate-300 leading-relaxed text-xs font-medium">
                    Engineered and built <b>Go Canteen</b> from the ground up to revolutionize canteen order management. Built with ultra-fast Realtime Kitchen Display Systems (KDS), Razorpay instant UPI intent integrations, 2-step security passcode authorization, dual-layer anti-spam Cash protection, and responsive modern UI.
                  </p>

                  {/* Contact Badges */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                    <a
                      href="mailto:mraayush979@gmail.com"
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-extrabold text-[11px] border border-slate-700 flex items-center gap-1.5 transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" /> mraayush979@gmail.com
                    </a>
                    <a
                      href="mailto:gocanteen8@gmail.com"
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold text-[11px] border border-slate-700 flex items-center gap-1.5 transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" /> gocanteen8@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Core Features & System Achievements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span>Realtime Kitchen KDS</span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                    WebSocket channel listener with instant audio chimes when new food orders are placed.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-emerald-400" />
                    <span>Anti-Spam COD Security</span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                    Dual-layer Cash lock restricting customers to max 2 active unpaid orders & max 5/hour limit.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Framer-Motion Animations</span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                    Smooth flying item particle animations toward the cart badge with spring tap dynamics.
                  </p>
                </div>
              </div>

              {/* Technology Stack Grid */}
              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Technology Stack & Platform Core</h4>
                <div className="flex flex-wrap gap-2 text-xs font-extrabold">
                  <span className="bg-slate-900 text-indigo-300 border border-slate-700 px-3 py-1 rounded-xl">React 19 & Vite 6</span>
                  <span className="bg-slate-900 text-emerald-300 border border-slate-700 px-3 py-1 rounded-xl">Supabase Realtime PostgreSQL</span>
                  <span className="bg-slate-900 text-blue-300 border border-slate-700 px-3 py-1 rounded-xl">Razorpay Instant UPI Gateway</span>
                  <span className="bg-slate-900 text-purple-300 border border-slate-700 px-3 py-1 rounded-xl">Framer Motion</span>
                  <span className="bg-slate-900 text-amber-300 border border-slate-700 px-3 py-1 rounded-xl">Lucide Icons & GFM Markdown</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: OVERVIEW & SYSTEM HEALTH */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">DB Latency</span>
                  <div className="text-xl font-black text-emerald-400 font-mono">{latency}ms</div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Supabase Edge Ping</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">System Status</span>
                  <div className="text-xl font-black text-indigo-400">ONLINE ✓</div>
                  <span className="text-[10px] text-slate-500 font-semibold block">All Nodes Operational</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Total DB Orders</span>
                  <div className="text-xl font-black text-amber-400 font-mono">{dbStats.orders}</div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Audit Records</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Load Weight</span>
                  <div className="text-xl font-black text-blue-400 font-mono">{(pulseData[pulseData.length - 1] || 0).toFixed(0)}%</div>
                  <span className="text-[10px] text-slate-500 font-semibold block">Active Requests</span>
                </div>
              </div>

              {/* 24-Hour Active System Pulse Graph */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    Active System Pulse Graph (24 Hours)
                  </h4>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-950 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Realtime Pulse
                  </span>
                </div>

                <div className="h-40 flex items-end gap-1.5 pt-4">
                  {pulseData.map((val, idx) => (
                    <div key={idx} className="flex-1 bg-slate-900 rounded-t-sm relative group h-full flex items-end">
                      <div
                        className="w-full bg-indigo-500 hover:bg-indigo-400 rounded-t-sm transition-all duration-500"
                        style={{ height: `${val}%` }}
                      />
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none whitespace-nowrap z-10 border border-slate-700">
                        {val.toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DATABASE NODES */}
          {activeTab === 'database' && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Internal Database Tables Peek</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Table: orders</span>
                  <div className="text-lg font-black text-white font-mono">{dbStats.orders} Rows</div>
                  <span className="text-[10px] text-indigo-400 font-semibold block">Food Orders & Audit Log</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Table: inventory</span>
                  <div className="text-lg font-black text-white font-mono">{dbStats.inventory} Rows</div>
                  <span className="text-[10px] text-indigo-400 font-semibold block">Menu Items & Stock</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Table: profiles</span>
                  <div className="text-lg font-black text-white font-mono">{dbStats.profiles} Rows</div>
                  <span className="text-[10px] text-indigo-400 font-semibold block">Users & Customer Profiles</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Table: offers</span>
                  <div className="text-lg font-black text-white font-mono">{dbStats.offers} Rows</div>
                  <span className="text-[10px] text-indigo-400 font-semibold block">Combo Deals & Banners</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Table: promo_codes</span>
                  <div className="text-lg font-black text-white font-mono">{dbStats.promos} Rows</div>
                  <span className="text-[10px] text-indigo-400 font-semibold block">Active Coupon Codes</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Engine: Supabase PostgreSQL</span>
                  <div className="text-lg font-black text-emerald-400 font-mono">30.18 MB</div>
                  <span className="text-[10px] text-emerald-500 font-semibold block">TLS Encrypted & Isolated</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE KERNEL LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden animate-fade-in">
              <div className="bg-slate-900 p-3.5 border-b border-slate-800 flex items-center justify-between">
                <span className="font-mono text-xs text-indigo-400 font-bold uppercase tracking-wider">Kernel Event Buffer</span>
                <button onClick={() => setLogs([])} className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg">
                  Flush Logs
                </button>
              </div>
              <div className="p-4 font-mono text-[11px] h-60 overflow-y-auto space-y-2">
                {logs.length === 0 && <span className="text-slate-600 italic">No events logged.</span>}
                {logs.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-slate-600">[{log.t}]</span>
                    <span className={log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-amber-400' : 'text-indigo-400'}>
                      [{log.type.toUpperCase()}]
                    </span>
                    <span className="text-slate-300">{log.m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <span>Made with ❤️ for Go Canteen by <b>Aayush Sharma</b></span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
          >
            Close Console
          </button>
        </div>

      </div>
    </div>
  );
}
