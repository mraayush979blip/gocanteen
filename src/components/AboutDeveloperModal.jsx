import { useState, useEffect } from 'react';
import { X, Globe, Linkedin } from 'lucide-react';

function FlipBox({ value }) {
  return (
    <div className="w-9 h-9 rounded-xl bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 text-white font-mono font-black text-xs sm:text-sm flex items-center justify-center shadow-xl select-none">
      {value}
    </div>
  );
}

export default function AboutDeveloperModal({ isOpen, onClose }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTime(new Date());
    }, 30);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ms = Math.floor((time.getMilliseconds() % 1000) / 10).toString().padStart(2, '0');

  const linkedinUrl = "https://in.linkedin.com/in/aayush-sharma-2013d";
  const portfolioUrl = "https://itsaayushsharma.vercel.app";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in text-slate-900">
      <div className="relative max-w-sm w-full mx-auto animate-scale-up">
        
        {/* Main Developer Card matching user reference image */}
        <div className="relative bg-slate-950 rounded-[32px] overflow-hidden shadow-2xl border border-slate-800 text-white flex flex-col items-center">
          
          {/* Top Center Floating Live Clock */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
            <FlipBox value={hours} />
            <FlipBox value={minutes} />
            <FlipBox value={seconds} />
            <FlipBox value={ms} />
          </div>

          {/* Top Right Circular Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Full-bleed Portrait Developer Image */}
          <div className="relative w-full h-[430px] bg-slate-900 overflow-hidden">
            <img
              src="/aayush-profile.jpg"
              alt="Aayush Sharma"
              className="w-full h-full object-cover object-top filter grayscale contrast-125 brightness-95"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop';
              }}
            />
            {/* Top Light Gray Fade */}
            <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-slate-200/60 via-slate-300/20 to-transparent pointer-events-none" />
            {/* Bottom Dark Gradient Fade Overlay */}
            <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent pointer-events-none" />
          </div>

          {/* Developer Title & Action Buttons Overlay */}
          <div className="relative z-10 w-full px-6 pb-8 pt-2 text-center space-y-4 -mt-24">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                Aayush Sharma
              </h2>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-400 mt-1">
                FULL STACK DEVELOPER
              </p>
            </div>

            {/* Action Buttons: LinkedIn & Portfolio */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-2 rounded-2xl bg-sky-950/80 hover:bg-sky-900/90 border border-sky-800/60 text-slate-100 font-extrabold text-[10px] sm:text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer backdrop-blur-md"
              >
                <Linkedin className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Let's Connect on LinkedIn</span>
              </a>

              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/70 text-slate-100 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer backdrop-blur-md"
              >
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Portfolio</span>
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
