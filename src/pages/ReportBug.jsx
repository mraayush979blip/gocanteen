import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bug, Lightbulb, MessageSquare, Send, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ReportBug() {
  const navigate = useNavigate();
  const { session, profile, showToast } = useAuth();
  const [feedbackType, setFeedbackType] = useState('bug'); // 'bug' | 'suggestion' | 'feedback'
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState(session?.user?.email || profile?.email || '');
  const [submitted, setSubmitted] = useState(false);

  const developerEmails = ['mail@gocanteen.in', 'developer@gocanteen.in'];

  const handleSendEmail = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please enter a description of your bug or suggestion', true);
      return;
    }

    const categoryTitle = feedbackType === 'bug' ? '🐞 BUG REPORT' : feedbackType === 'suggestion' ? '💡 FEATURE SUGGESTION' : '💬 GENERAL FEEDBACK';
    const emailSubject = encodeURIComponent(`[Go Canteen ${categoryTitle}] ${subject.trim() || 'User Feedback'}`);
    const emailBody = encodeURIComponent(
      `Category: ${categoryTitle}\n` +
      `User Email: ${userEmail || 'Guest User'}\n` +
      `Date & Time: ${new Date().toLocaleString('en-IN')}\n\n` +
      `Details / Description:\n${description.trim()}\n\n` +
      `----------------------------------------\n` +
      `Sent via Go Canteen In-App Feedback System`
    );

    const mailtoUrl = `mailto:${developerEmails.join(',')}?subject=${emailSubject}&body=${emailBody}`;
    window.location.href = mailtoUrl;

    setSubmitted(true);
    showToast('📧 Email client opened for mail@gocanteen.in & developer@gocanteen.in!');
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubject('');
    setDescription('');
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative pb-8">
      {/* Dark Green Header matching the new aesthetic */}
      <div className="bg-[#0f4d43] text-white pt-16 pb-20 px-6 relative overflow-hidden shrink-0">
        <div className="max-w-md mx-auto relative z-10 flex flex-col justify-center h-full">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-tight">Report Bug / Suggestions</h1>
              <p className="text-emerald-100/80 text-xs font-semibold">Help us improve Go Canteen</p>
            </div>
          </div>
        </div>
      </div>

      {/* White Overlapping Card */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl w-full p-6 shadow-2xl space-y-5 border border-slate-100 relative">
          
          {submitted ? (
            <div className="py-8 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">Thank You for Your Feedback!</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
                  Your report has been prepared for <b>mail@gocanteen.in</b> and <b>developer@gocanteen.in</b>.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs mt-4 w-full"
              >
                Go Back
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendEmail} className="space-y-5">
              
              {/* Category Selector Tabs */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">Feedback Type *</label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFeedbackType('bug')}
                    className={`py-2.5 rounded-xl text-[11px] font-extrabold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      feedbackType === 'bug'
                        ? 'bg-white text-red-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Bug className="w-4 h-4" />
                    <span>Bug</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackType('suggestion')}
                    className={`py-2.5 rounded-xl text-[11px] font-extrabold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      feedbackType === 'suggestion'
                        ? 'bg-white text-amber-500 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>Suggestion</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackType('feedback')}
                    className={`py-2.5 rounded-xl text-[11px] font-extrabold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      feedbackType === 'feedback'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Feedback</span>
                  </button>
                </div>
              </div>

              {/* Target Emails Banner */}
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 space-y-1 text-xs text-amber-900 font-medium">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Sends directly to Developer Inboxes:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-[11px] font-extrabold">
                  <span className="bg-white px-2.5 py-0.5 rounded-lg border border-amber-300">mail@gocanteen.in</span>
                  <span className="bg-white px-2.5 py-0.5 rounded-lg border border-amber-300">developer@gocanteen.in</span>
                </div>
              </div>

              {/* Your Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">Your Contact Email</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0f4d43] focus:ring-1 focus:ring-[#0f4d43]"
                />
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">Title / Brief Summary</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={feedbackType === 'bug' ? 'e.g. Menu loading issue on mobile' : 'e.g. Add favorite item feature'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0f4d43] focus:ring-1 focus:ring-[#0f4d43]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">Detailed Message *</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what happened or what improvement you would like to see..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0f4d43] focus:ring-1 focus:ring-[#0f4d43]"
                />
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#0f4d43] hover:bg-[#0c4038] text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send to Developers ✉️</span>
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
