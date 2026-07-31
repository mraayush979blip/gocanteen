import { Monitor, Trophy, Rocket, Globe, Linkedin, Send, Quote, Shield, Code, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AboutDeveloper() {
  const navigate = useNavigate();
  const linkedinUrl = "https://www.linkedin.com/in/aayush-sharma-2013d";
  const portfolioUrl = "https://itsaayushsharma.vercel.app";

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6 pt-6">

        {/* 1. HERO COVER CARD */}
        <div className="relative rounded-[24px] overflow-hidden shadow-sm bg-white aspect-[4/5] sm:aspect-[4/3] md:aspect-[3/2]">
          {/* Background Image */}
          <img
            src="/photo.jpg"
            alt="Aayush Sharma - Developer"
            className="absolute inset-0 w-full h-full object-cover object-top"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/aayush-profile.jpg';
            }}
          />

          {/* No full gradient overlay anymore - photo is 100% clear */}

          {/* Foreground Hero Content */}
          <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end sm:justify-end md:justify-center items-start">

            <div className="mb-2">
              <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-emerald-600 font-bold text-[12px] tracking-wide inline-block shadow-sm">
                Hello, I'm
              </span>
            </div>

            {/* Developer Name */}
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-slate-900 mb-4 flex flex-col items-start gap-1">
              <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-2xl shadow-sm inline-block">Aayush</span>
              <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-2xl shadow-sm inline-block text-emerald-600">Sharma</span>
            </h1>

            {/* Attributes */}
            <div className="space-y-2 flex flex-col items-start">
              <div className="inline-flex items-center gap-2.5 text-slate-800 text-[12px] sm:text-[13px] font-bold bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full shadow-sm">
                <Code className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
                Full Stack Developer
              </div>
              <div className="inline-flex items-center gap-2.5 text-slate-800 text-[12px] sm:text-[13px] font-bold bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full shadow-sm">
                <MapPin className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
                Indore, India
              </div>
            </div>
          </div>
        </div>


        {/* 2. THREE STATS / METRICS CARD */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex items-stretch divide-x divide-slate-200/60 text-center">
          {/* Metric 1 */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 space-y-1.5">
            <Monitor className="w-6 h-6 text-emerald-500 mb-1" strokeWidth={1.5} />
            <span className="text-[22px] sm:text-2xl font-black text-slate-900 leading-none tracking-tight">6+</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block pt-1">PROJECTS</span>
            <span className="text-[10px] text-slate-400 font-medium block">Completed</span>
          </div>

          {/* Metric 2 */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 space-y-1.5">
            <Trophy className="w-6 h-6 text-emerald-500 mb-1" strokeWidth={1.5} />
            <span className="text-[22px] sm:text-2xl font-black text-slate-900 leading-none tracking-tight">5+</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block pt-1">HACKATHONS</span>
            <span className="text-[10px] text-slate-400 font-medium block">Participated</span>
          </div>

          {/* Metric 3 */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 space-y-1.5">
            <Rocket className="w-6 h-6 text-emerald-500 mb-1" strokeWidth={1.5} />
            <span className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight px-1">Founder & Lead Developer</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block pt-1">ACROAMS &<br />LEVELONE</span>
          </div>
        </div>


        {/* 3. QUOTE BOX */}
        <div className="bg-white rounded-[24px] p-7 shadow-sm border border-slate-100 relative space-y-4">
          <Quote className="w-8 h-8 text-emerald-500 fill-emerald-500" />
          <p className="text-[15px] sm:text-base font-semibold text-slate-800 italic leading-relaxed">
            "I believe technology should solve problems, not create them."
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <div className="w-8 h-[2px] bg-emerald-500 rounded-full" />
            <span className="text-[13px] font-bold text-emerald-600">Aayush Sharma</span>
          </div>
        </div>


        {/* 4. LET'S CONNECT SECTION */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 px-2 mb-3">
            <Send className="w-4 h-4 text-emerald-500 transform -rotate-45" strokeWidth={2.5} />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">LET'S CONNECT</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* LinkedIn Card */}
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex items-center justify-between group active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-[18px] bg-[#0A66C2] text-white flex items-center justify-center shrink-0">
                  <Linkedin className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-900">LinkedIn</h4>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Connect with me</p>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#FAFAFA] text-emerald-500 flex items-center justify-center group-hover:bg-emerald-50 transition-colors border border-slate-100">
                <ArrowRight className="w-4 h-4" />
              </div>
            </a>

            {/* Portfolio Card */}
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex items-center justify-between group active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-[18px] bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-900">Portfolio</h4>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">View my work</p>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#FAFAFA] text-emerald-500 flex items-center justify-center group-hover:bg-emerald-50 transition-colors border border-slate-100">
                <ArrowRight className="w-4 h-4" />
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
