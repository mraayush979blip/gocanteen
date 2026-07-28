import { ChevronLeft, MoreHorizontal, Code2, Trophy, GraduationCap, Globe, Linkedin, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AboutDeveloper() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const linkedinUrl = "https://in.linkedin.com/in/aayush-sharma-5a2103233";
  const portfolioUrl = "https://aayush-sharma.vercel.app";

  return (
    <>
      {/* =========================================
          MOBILE VIEW (NEW REDESIGN)
          ========================================= */}
      <div className="sm:hidden fixed inset-0 z-50 bg-[#0B0F17] font-['Inter',sans-serif] text-white overflow-y-auto overflow-x-hidden">
        {/* Fixed Hero Image Background */}
        <div className="fixed top-0 inset-x-0 h-[60vh] z-0">
          <img 
            src="/photo.jpg" 
            alt="Aayush Sharma" 
            className="w-full h-full object-cover object-center" 
          />
          {/* Smooth black gradient from bottom only */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-[#0B0F17]/60 to-transparent"></div>
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Top Header */}
          <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-20">
            <button 
              onClick={handleBack}
              className="w-10 h-10 rounded-[12px] bg-[#121826]/80 flex items-center justify-center border border-[#2A2F3A] shadow-sm active:scale-95 transition-transform backdrop-blur-md"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button 
              className="w-10 h-10 flex items-center justify-center text-white active:scale-95 transition-transform bg-[#121826]/40 rounded-full backdrop-blur-md border border-[#2A2F3A]/50"
            >
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="px-6 mt-[25vh] pb-16 flex-1 flex flex-col">
            {/* Hero Text */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-[2px] bg-[#2563EB]"></div>
                <span className="text-[#2563EB] text-[10px] font-bold tracking-[0.2em] uppercase">About Developer</span>
              </div>
              <h1 className="text-[40px] leading-tight font-bold text-white tracking-tight mb-1">
                Aayush Sharma
              </h1>
              <p className="text-[18px] text-[#A1A1AA] font-medium">
                Cyber Security Student <span className="text-[#2563EB] mx-1.5">•</span> Full Stack Developer
              </p>
            </div>

            {/* Bio & Quote Section */}
            <div className="flex flex-col gap-6 mb-10">
              <div className="flex justify-between items-start gap-4 flex-col">
                <p className="text-[15px] leading-[1.6] text-[#A1A1AA] flex-1 max-w-[280px]">
                  Building secure, scalable, and user-focused applications. Passionate about Cyber Security, AI, and creating products that solve real-world problems.
                </p>
                
                {/* Quote Card */}
                <div className="bg-[#121826] border border-[#2A2F3A] rounded-[16px] p-4 w-full shadow-md shrink-0">
                  <div className="text-[#2563EB] text-2xl font-serif leading-none mb-1">"</div>
                  <p className="text-[13px] text-[#A1A1AA] font-medium leading-snug italic">
                    I believe technology should solve problems, not create them.
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics Section */}
            <div className="bg-[#121826] border border-[#2A2F3A] rounded-[20px] shadow-md flex items-stretch overflow-hidden mb-10 py-5">
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
                <Code2 className="w-5 h-5 text-[#2563EB] mb-2" />
                <div className="text-[22px] font-bold text-white mb-0.5">5+</div>
                <div className="text-[11px] text-[#A1A1AA] uppercase tracking-wider font-semibold">Projects</div>
              </div>
              <div className="w-[1px] bg-[#2A2F3A] shrink-0 my-2"></div>
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
                <Trophy className="w-5 h-5 text-[#2563EB] mb-2" />
                <div className="text-[22px] font-bold text-white mb-0.5">5+</div>
                <div className="text-[11px] text-[#A1A1AA] uppercase tracking-wider font-semibold">Hackathons</div>
              </div>
              <div className="w-[1px] bg-[#2A2F3A] shrink-0 my-2"></div>
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
                <GraduationCap className="w-5 h-5 text-[#2563EB] mb-2" />
                <div className="text-[13px] font-bold text-white mb-1 leading-tight">Founder &<br/>Lead Developer</div>
                <div className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-semibold">AcroAMS</div>
              </div>
            </div>

            {/* Action Cards */}
            <div className="flex flex-col gap-4">
              {/* Card 1 */}
              <a 
                href={portfolioUrl} 
                target="_blank" 
                rel="noreferrer"
                className="bg-[#121826] border border-[#2A2F3A] rounded-[20px] p-[20px] flex items-center justify-between shadow-md group active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-[#2563EB]" />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-semibold text-white mb-0.5">Explore Portfolio</h3>
                    <p className="text-[14px] text-[#A1A1AA]">View my projects.</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#0B0F17] border border-[#2A2F3A] flex items-center justify-center shrink-0">
                  <ArrowRight className="w-5 h-5 text-[#A1A1AA] group-hover:text-white transition-colors" />
                </div>
              </a>

              {/* Card 2 */}
              <a 
                href={linkedinUrl} 
                target="_blank" 
                rel="noreferrer"
                className="bg-[#121826] border border-[#2A2F3A] rounded-[20px] p-[20px] flex items-center justify-between shadow-md group active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                    <Linkedin className="w-6 h-6 text-[#2563EB]" />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-semibold text-white mb-0.5">Connect on LinkedIn</h3>
                    <p className="text-[14px] text-[#A1A1AA]">Let's connect.</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#0B0F17] border border-[#2A2F3A] flex items-center justify-center shrink-0">
                  <ArrowRight className="w-5 h-5 text-[#A1A1AA] group-hover:text-white transition-colors" />
                </div>
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* =========================================
          DESKTOP VIEW (OLD SIMPLE DESIGN)
          ========================================= */}
      <div className="hidden sm:flex fixed inset-0 z-50 bg-black flex-col font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden touch-none overscroll-none">

        {/* Solid Black Header with Back Button */}
        <div className="relative z-30 h-16 bg-black flex items-center px-4 sm:px-6 shadow-md border-b border-black">
          <button
            onClick={handleBack}
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
            <img
              src="/aayush-profile.jpg"
              alt="Aayush Sharma"
              className="w-full h-full object-cover object-center"
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
    </>
  );
}
