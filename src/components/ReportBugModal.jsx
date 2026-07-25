import { useState } from 'react';
import { X, Bug, Lightbulb, MessageSquare, Send, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ReportBugModal({ isOpen, onClose }) {
  const { session, profile, showToast } = useAuth();
  const [feedbackType, setFeedbackType] = useState('bug'); // 'bug' | 'suggestion' | 'feedback'
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState(session?.user?.email || profile?.email || '');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const developerEmails = ['gocanteen8@gmail.com', 'mraayush979@gmail.com'];

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

    // Trigger native mailto link targeting BOTH developer emails
    const mailtoUrl = `mailto:${developerEmails.join(',')}?subject=${emailSubject}&body=${emailBody}`;
    window.location.href = mailtoUrl;

    setSubmitted(true);
    showToast('📧 Email client opened for gocanteen8@gmail.com & mraayush979@gmail.com!');
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubject('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in text-slate-900">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              {feedbackType === 'bug' ? <Bug className="w-5 h-5" /> : feedbackType === 'suggestion' ? <Lightbulb className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Report Bug or Suggestion</h3>
              <p className="text-[11px] text-slate-500 font-medium">Direct email to developer team</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-slate-900">Thank You for Your Feedback!</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
                Your report has been prepared for <b>gocanteen8@gmail.com</b> and <b>mraayush979@gmail.com</b>.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendEmail} className="space-y-4">
            
            {/* Category Selector Tabs */}
            <div className="space-y-1">
              <label className="block text-xs font-extrabold text-slate-700">Feedback Type *</label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setFeedbackType('bug')}
                  className={`py-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                    feedbackType === 'bug'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>Report Bug</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('suggestion')}
                  className={`py-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                    feedbackType === 'suggestion'
                      ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Suggestion</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('feedback')}
                  className={`py-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                    feedbackType === 'feedback'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
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
              <div className="flex flex-wrap gap-1.5 pt-0.5 font-mono text-[11px] font-extrabold">
                <span className="bg-white px-2.5 py-0.5 rounded-lg border border-amber-300">gocanteen8@gmail.com</span>
                <span className="bg-white px-2.5 py-0.5 rounded-lg border border-amber-300">mraayush979@gmail.com</span>
              </div>
            </div>

            {/* Your Email */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Your Contact Email</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Title / Brief Summary</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={feedbackType === 'bug' ? 'e.g. Menu loading issue on mobile' : 'e.g. Add favorite item feature'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Detailed Message *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what happened or what improvement you would like to see..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Developers ✉️</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
