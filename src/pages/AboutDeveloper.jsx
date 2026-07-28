import { ArrowLeft, Globe, Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AboutDeveloper() {
  const navigate = useNavigate();

  const linkedinUrl = "https://in.linkedin.com/in/aayush-sharma-2013d";
  const portfolioUrl = "https://itsaayushsharma.vercel.app";

  return (
    <div className="fixed inset-0 bg-black flex flex-col font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden touch-none overscroll-none">
      
      {/* Solid Black Header with Back Button */}
      <div className="relative z-30 h-16 bg-black flex items-center px-4 sm:px-6 shadow-md border-b border-black">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-between">
        
        {/* Immersive Background Glows & Image */}
        <div className="absolute inset-0 z-0 bg-black">
          {/* Mobile Image (hidden on sm and up) */}
          <img
            src="/photo.jpg"
            alt="Aayush Sharma"
            className="w-full h-full object-cover object-center block sm:hidden"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop';
            }}
          />
          {/* Desktop/Laptop Image (hidden on mobile, visible on sm and up) */}
          <img
            src="/aayush-profile.jpg"
            alt="Aayush Sharma"
            className="w-full h-full object-cover object-center hidden sm:block"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop';
            }}
          />
          {/* Neutral Gradients to blend and make text readable (Pure black, absolutely no blue tint) */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black via-black/60 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 inset-x-0 h-[32rem] bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none"></div>
        </div>

        {/* Spacer for top */}
        <div className="relative z-20 w-full p-6"></div>

        {/* Developer Details & Actions (Bottom aligned) */}
        <div className="relative z-20 w-full max-w-md mx-auto px-6 pb-12 sm:pb-16 flex flex-col items-center text-center space-y-8 mt-auto">
          
          {/* Title Block */}
          <div className="space-y-2">
            <h2 className="text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-lg">
              Aayush Sharma
            </h2>
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
    </div>
  );
}
