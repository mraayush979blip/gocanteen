import { Monitor, Trophy, Rocket, Globe, Linkedin, Send, Quote } from 'lucide-react';

export default function AboutDeveloper() {
  const linkedinUrl = "https://www.linkedin.com/in/aayush-sharma-2013d";
  const portfolioUrl = "https://itsaayushsharma.vercel.app";

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6 pt-2">

        {/* 1. HERO COVER CARD */}
        <div className="relative rounded-[32px] overflow-hidden shadow-xl bg-slate-950 text-white min-h-[440px] sm:min-h-[480px] flex flex-col justify-end">
          {/* Background Image */}
          <img
            src="/photo.jpg"
            alt="Aayush Sharma - Developer"
            className="absolute inset-0 w-full h-full object-cover object-center"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/aayush-profile.jpg';
            }}
          />

          {/* Gradient Overlay to make text crisp and readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />

          {/* Foreground Hero Content */}
          <div className="relative z-10 p-6 sm:p-10 space-y-4">
            {/* Header Tag */}
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 block">
                ABOUT DEVELOPER
              </span>
              <div className="w-10 h-0.5 bg-emerald-500 rounded-full" />
            </div>

            {/* Developer Name & Title */}
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-white">
                Aayush <span className="text-emerald-400">Sharma</span>
              </h1>
              <p className="text-sm sm:text-base font-semibold text-slate-300 mt-2 flex items-center gap-2 flex-wrap">
                <span>Cyber Security Student</span>
                <span className="text-emerald-400 font-bold">•</span>
                <span>Full Stack Developer</span>
              </p>
            </div>

            {/* Bio Paragraph */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-xl">
              Building secure, scalable, and user-focused applications. Passionate about Cyber Security, AI, and creating products that solve real-world problems.
            </p>
          </div>
        </div>


        {/* 2. THREE STATS / METRICS CARD */}
        <div className="bg-white rounded-[28px] p-5 shadow-xs border border-slate-200/80 grid grid-cols-3 gap-2 divide-x divide-slate-100 text-center">
          {/* Metric 1 */}
          <div className="flex flex-col items-center justify-center p-2 space-y-1">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-1 shadow-2xs">
              <Monitor className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 leading-none">6+</span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">PROJECTS</span>
            <span className="text-[11px] text-slate-400 font-semibold block">Completed</span>
          </div>

          {/* Metric 2 */}
          <div className="flex flex-col items-center justify-center p-2 space-y-1">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-1 shadow-2xs">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 leading-none">5+</span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">HACKATHONS</span>
            <span className="text-[11px] text-slate-400 font-semibold block">Participated</span>
          </div>

          {/* Metric 3 */}
          <div className="flex flex-col items-center justify-center p-2 space-y-1">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-1 shadow-2xs">
              <Rocket className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-black text-slate-900 leading-tight">Founder & Lead Developer</span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">ACROAMS & LevelOne</span>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:block">Founder & Lead Developer</span>
          </div>
        </div>


        {/* 3. QUOTE BOX */}
        <div className="bg-white rounded-[28px] p-6 shadow-xs border border-slate-200/80 relative overflow-hidden space-y-3">
          <Quote className="w-8 h-8 text-emerald-500/30 rotate-180" />
          <p className="text-sm sm:text-base font-bold text-slate-800 italic leading-relaxed pl-2">
            "I believe technology should solve problems, not create them."
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <div className="w-6 h-0.5 bg-emerald-500 rounded-full" />
            <span className="text-xs font-black text-emerald-600">Aayush Sharma</span>
          </div>
        </div>


        {/* 4. LET'S CONNECT SECTION */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 px-1">
            <Send className="w-4 h-4 text-emerald-600 transform -rotate-45" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">LET'S CONNECT</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* LinkedIn Card */}
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-[24px] p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex items-center gap-4 cursor-pointer group active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Linkedin className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">LinkedIn</h4>
                <p className="text-xs text-emerald-600 font-bold mt-0.5">Connect with me</p>
              </div>
            </a>

            {/* Portfolio Card */}
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-[24px] p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex items-center gap-4 cursor-pointer group active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform border border-emerald-200">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">Portfolio</h4>
                <p className="text-xs text-emerald-600 font-bold mt-0.5">View my work</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
