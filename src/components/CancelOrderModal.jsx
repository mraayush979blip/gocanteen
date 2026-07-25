import { useState } from 'react';
import { X, AlertTriangle, XCircle, Send } from 'lucide-react';

export default function CancelOrderModal({ isOpen, order, onConfirm, onClose, isCustomer = false }) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const staffPresets = [
    'Item Out of Stock 🍲',
    'Kitchen Closed / High Rush ⏰',
    'Customer Requested Cancellation 👤',
    'Payment / Duplicate Order Issue ⚠️',
    'Other / Custom Reason 📝'
  ];

  const customerPresets = [
    'Changed My Mind 🧠',
    'Ordered Wrong Item 🍕',
    'Taking Too Long / Change of Plans ⏳',
    'Placing a New Order 🔄',
    'Other / Custom Reason 📝'
  ];

  const presets = isCustomer ? customerPresets : staffPresets;

  const handleConfirm = (e) => {
    e.preventDefault();
    setError('');

    const finalReason = reason === 'Other / Custom Reason 📝' 
      ? customReason.trim() 
      : reason.trim();

    if (!finalReason) {
      setError('Please select or enter a cancellation reason');
      return;
    }

    onConfirm(finalReason);
    setReason('');
    setCustomReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in text-slate-900">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Cancel Order #{order.token_number || order.id.slice(0, 4)}</h3>
              <p className="text-[11px] text-slate-500 font-medium">Customer: {order.customer_name || 'Guest'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-red-900 font-medium">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>
            <b>Cancellation Notice:</b> {isCustomer ? 'This will cancel your unpaid order and remove it from the kitchen queue.' : 'The reason you select will be displayed directly to the student/customer and recorded in audit logs.'}
          </span>
        </div>

        {/* Preset Reason Selector */}
        <form onSubmit={handleConfirm} className="space-y-3">
          <label className="block text-xs font-extrabold text-slate-800">Select Cancellation Reason *</label>
          
          <div className="space-y-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setReason(p);
                  setError('');
                }}
                className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                  reason === p
                    ? 'bg-red-50/80 border-red-500 text-red-950 shadow-2xs ring-1 ring-red-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{p}</span>
                {reason === p && <span className="text-red-600 font-black">✓</span>}
              </button>
            ))}
          </div>

          {/* Custom Reason Text Area if selected */}
          {reason === 'Other / Custom Reason 📝' && (
            <div className="pt-1">
              <textarea
                rows={2}
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific reason for cancelling..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>
          )}

          {error && <p className="text-[11px] font-extrabold text-red-600">{error}</p>}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Confirm Cancel
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
