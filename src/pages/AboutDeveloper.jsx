import { useState, useEffect } from 'react';
import { ArrowLeft, Globe, Linkedin, Mail, Code2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function FlipBox({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 rounded-[14px] bg-white/10 backdrop-blur-xl border border-white/20 text-white font-mono font-black text-sm flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] shadow-inner shadow-white/10 select-none relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 mix-blend-overlay"></div>
        <span className="relative z-10 drop-shadow-md">{value}</span>
      </div>
      {label && <span className="text-[8px] font-black tracking-widest text-white/50 uppercase">{label}</span>}
    </div>
  );
}

export default function AboutDeveloper() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 10);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ms = Math.floor((time.getMilliseconds() % 1000) / 10).toString().padStart(2, '0');

  const linkedinUrl = "https://in.linkedin.com/in/aayush-sharma-2013d";
  const portfolioUrl = "https://itsaayushsharma.vercel.app";

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-between font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden">
      
      {/* Immersive Background Glows & Image */}
      <div className="absolute inset-0 z-0 bg-slate-950">
        <img
          src="/aayush-profile.jpg"
          alt="Aayush Sharma"
          className="w-full h-full object-cover object-top filter brightness-90 animate-[pulse_10s_ease-in-out_infinite_alternate]"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop';
          }}
        />
        {/* Neutral Gradients to blend and make text readable (No blue tint) */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-slate-950 via-slate-950/60 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 inset-x-0 h-[32rem] bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none"></div>
      </div>

      {/* Top Header Layer */}
      <div className="relative z-20 w-full p-6 sm:p-8 flex items-start justify-between">
        {/* Go Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-90"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Live Clock */}
        <div className="flex items-center gap-2 pointer-events-none">
          <FlipBox value={hours} />
          <span className="text-white/40 font-black mb-1 animate-pulse">:</span>
          <FlipBox value={minutes} />
          <span className="text-white/40 font-black mb-1 animate-pulse">:</span>
          <FlipBox value={seconds} />
          <span className="text-white/20 font-black mb-1">.</span>
          <FlipBox value={ms} />
        </div>
      </div>

      {/* Main Content Layer (Bottom aligned) */}
      <div className="relative z-20 w-full max-w-md mx-auto px-6 pb-12 sm:pb-16 flex flex-col items-center text-center space-y-8 mt-auto">
        
        {/* Title Block */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 bg-indigo-900/40 px-4 py-1.5 rounded-full border border-indigo-500/30 backdrop-blur-md">
              Engineered With Passion
            </span>
            <Sparkles className="w-5 h-5 text-fuchsia-400" />
          </div>
          <h2 className="text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-lg">
            Aayush Sharma
          </h2>
          <p className="text-sm font-bold tracking-[0.2em] text-slate-300 uppercase pt-2">
            Full Stack Architect
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-4">
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
            <Globe className="w-5 h-5" />
            <span>Explore My Portfolio</span>
          </a>

          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 rounded-2xl bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 border border-[#0A66C2]/40 text-white font-extrabold text-sm flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 cursor-pointer backdrop-blur-xl"
          >
            <Linkedin className="w-5 h-5" />
            <span>Connect on LinkedIn</span>
          </a>
        </div>
        
      </div>
    </div>
  );
}
