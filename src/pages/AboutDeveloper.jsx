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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Immersive Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>

      <div className="relative max-w-[380px] w-full mx-auto">
        
        {/* Main Developer Glass Card */}
        <div className="relative bg-slate-900/60 backdrop-blur-2xl rounded-[36px] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/10 text-white flex flex-col items-center group">
          
          {/* Subtle animated border gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-fuchsia-500/20 opacity-50 pointer-events-none"></div>

          {/* Top Center Floating Live Clock */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-2 pointer-events-none">
            <FlipBox value={hours} />
            <span className="text-white/40 font-black mb-1 animate-pulse">:</span>
            <FlipBox value={minutes} />
            <span className="text-white/40 font-black mb-1 animate-pulse">:</span>
            <FlipBox value={seconds} />
            <span className="text-white/20 font-black mb-1">.</span>
            <FlipBox value={ms} />
          </div>

          {/* Top Right Circular Go Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-90"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Full-bleed Portrait Image */}
          <div className="relative w-full h-[460px] bg-slate-950 overflow-hidden">
            <img
              src="/aayush-profile.jpg"
              alt="Aayush Sharma"
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 filter contrast-125 brightness-90 saturate-50 mix-blend-luminosity"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop';
              }}
            />
            {/* Elegant Image Overlays */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/60 to-purple-900/20 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-72 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent pointer-events-none" />
          </div>

          {/* Developer Details & Actions */}
          <div className="relative z-10 w-full px-8 pb-10 pt-2 text-center -mt-36">
            
            {/* Title Block */}
            <div className="space-y-1 mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 backdrop-blur-sm">
                  Engineered With Passion
                </span>
                <Sparkles className="w-4 h-4 text-fuchsia-400" />
              </div>
              <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 drop-shadow-sm">
                Aayush Sharma
              </h2>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase pt-2">
                Full Stack Architect
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-[18px] bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-[13px] flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] hover:animate-[shimmer_1.5s_infinite]"></div>
                <Globe className="w-4 h-4" />
                <span>Explore My Portfolio</span>
              </a>

              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-[18px] bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border border-[#0A66C2]/30 text-[#0A66C2] hover:text-[#2d81d2] font-extrabold text-[13px] flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 cursor-pointer backdrop-blur-md"
              >
                <Linkedin className="w-4 h-4" />
                <span>Connect on LinkedIn</span>
              </a>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
