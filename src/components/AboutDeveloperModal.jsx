import { useState, useEffect } from 'react';
import { X, Globe, Linkedin } from 'lucide-react';

// Custom FlipUnit component that does a 3D rotation flip on value change
function FlipUnit({ value, isMs = false }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setAnimate(true);
      // Halfway through the flip (75ms), change the displayed text
      const changeTimer = setTimeout(() => {
        setDisplayValue(value);
      }, 75);
      const endTimer = setTimeout(() => {
        setAnimate(false);
      }, 150);
      return () => {
        clearTimeout(changeTimer);
        clearTimeout(endTimer);
      };
    }
  }, [value, displayValue]);

  return (
    <div
      className={`px-2 py-1.5 rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-700/60 text-slate-200 text-xs font-black shadow-lg text-center select-none ${
        animate ? 'flip-animate' : ''
      }`}
      style={{
        width: isMs ? '3.5rem' : '2.75rem',
        backfaceVisibility: 'hidden',
        transformStyle: 'preserve-3d',
        display: 'inline-block'
      }}
    >
      {displayValue}
    </div>
  );
}

export default function AboutDeveloperModal({ isOpen, onClose }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTime(new Date());
    }, 45); // Run fast enough for smooth milliseconds update

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ms = Math.floor(time.getMilliseconds()).toString().padStart(3, '0');

  const linkedinUrl = "https://in.linkedin.com/in/aayush-sharma-2013d";
  const portfolioUrl = "https://itsaayushsharma.vercel.app";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in text-slate-900">
      {/* CSS flip card animation styles embedded directly */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flip-card-anim {
          0% { transform: rotateX(0deg); }
          50% { transform: rotateX(-90deg); }
          100% { transform: rotateX(0deg); }
        }
        .flip-animate {
          animation: flip-card-anim 0.15s ease-in-out;
        }
      ` }} />

      <div className="relative max-w-sm w-full mx-auto animate-scale-up">
        
        {/* Main Developer Card matching exact user screenshot design */}
        <div className="relative bg-slate-950 rounded-[32px] overflow-hidden shadow-2xl border border-slate-800 text-white flex flex-col items-center">
          
          {/* Top Floating Flip Clock Pills & Close Button */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            {/* Flip Clock (Hours, Minutes, Seconds, Milliseconds) */}
            <div className="flex items-center gap-1.5">
              <FlipUnit value={hours} />
              <FlipUnit value={minutes} />
              <FlipUnit value={seconds} />
              <FlipUnit value={ms} isMs={true} />
            </div>

            {/* Circular Translucent Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
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
          <div className="relative z-10 w-full px-6 pb-8 pt-2 text-center space-y-4 -mt-24">
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

          </div>
        </div>

      </div>
    </div>
  );
}
