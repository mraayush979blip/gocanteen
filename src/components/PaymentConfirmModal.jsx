import { useState, useEffect } from 'react';
import { DollarSign, Smartphone, X, AlertTriangle, KeyRound, CheckCircle2, ArrowLeft, AlertCircle, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PaymentConfirmModal({ isOpen, order, targetStatus, onConfirm, onClose }) {
  const { staffT } = useAuth();

  // Step 1: 'select_method' | Step 2: 'double_confirm'
  const [step, setStep] = useState('select_method');
  const [selectedMethod, setSelectedMethod] = useState('cash');

  useEffect(() => {
    if (isOpen) {
      setStep('select_method');
      setSelectedMethod('cash');
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  // Parse coupon discount from special_instructions if present
  let displayFinalAmount = Number(order.total_amount || 0);
  let savedDiscount = 0;
  let subtotalAmount = displayFinalAmount;
  let couponCodeName = '';

  if (order.special_instructions) {
    const savedMatch = order.special_instructions.match(/Saved:\s*₹?(\d+)/i);
    const subtotalMatch = order.special_instructions.match(/Subtotal:\s*₹?(\d+)/i);
    const couponMatch = order.special_instructions.match(/Coupon:\s*([A-Z0-9_-]+)/i);

    if (savedMatch && savedMatch[1]) {
      savedDiscount = Number(savedMatch[1]);
    }
    if (subtotalMatch && subtotalMatch[1]) {
      subtotalAmount = Number(subtotalMatch[1]);
    }
    if (couponMatch && couponMatch[1]) {
      couponCodeName = couponMatch[1];
    }

    if (savedDiscount > 0) {
      if (displayFinalAmount === subtotalAmount || displayFinalAmount > (subtotalAmount - savedDiscount)) {
        displayFinalAmount = Math.max(0, subtotalAmount - savedDiscount);
      }
    }
  }

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    setStep('double_confirm');
  };

  const handleFinalConfirm = () => {
    onConfirm(selectedMethod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in text-slate-900">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'select_method' ? (
          <>
            {/* Step 1: Select Method Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  {staffT.paymentRequired}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Order #{order.token_number || order.id.slice(0, 4)} • Status: {targetStatus.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Prominent Red Unpaid Warning Callout */}
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-3.5 flex items-start gap-2.5 text-red-900 shadow-2xs">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs font-black uppercase tracking-wider block text-red-700">
                  {staffT.unpaidWarningHeader}
                </span>
                <p className="text-[11px] font-bold text-red-900 leading-snug">
                  {staffT.unpaidWarningBody}
                </p>
              </div>
            </div>

            {/* Order Info Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{staffT.token}:</span>
                <span className="text-base font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                  #{order.token_number || order.id.slice(0, 4)}
                </span>
              </div>

              {order.pickup_code && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-purple-600" /> {staffT.pin}:
                  </span>
                  <span className="text-sm font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 font-mono">
                    {order.pickup_code}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-500">Customer:</span>
                <span className="text-xs font-bold text-slate-900">{order.customer_name || 'Walk-in'}</span>
              </div>

              {/* Explicit Subtotal & Coupon Discount Breakdown */}
              {savedDiscount > 0 ? (
                <div className="bg-white rounded-xl p-3 border border-emerald-200 text-xs space-y-1.5 my-1">
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>Cart Subtotal:</span>
                    <span>₹{subtotalAmount}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Coupon Discount ({couponCodeName || 'APPLIED'}):</span>
                    <span>-₹{savedDiscount}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-1.5 text-sm">
                    <span>Final Amount Payable:</span>
                    <span className="text-emerald-700 font-black">₹{displayFinalAmount}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Final Amount Payable:</span>
                  <span className="text-base font-black text-emerald-700">₹{displayFinalAmount}</span>
                </div>
              )}
            </div>

            {/* Instructions */}
            <p className="text-xs text-slate-600 font-medium text-center leading-relaxed">
              {staffT.selectPaymentMode}
            </p>

            {/* Payment Options Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={() => handleSelectMethod('cash')}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <DollarSign className="w-5 h-5" /> 💵 Paid Cash at Counter (₹{displayFinalAmount})
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 text-center"
              >
                {staffT.cancelKeepUnpaid}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Double Confirmation Screen */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  {staffT.confirmTitle}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Final Payment Check
                </p>
              </div>
            </div>

            {/* Confirmation Box */}
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 text-center space-y-3">
              <span className="text-3xl">💰</span>
              <p className="text-xs text-slate-800 font-bold leading-relaxed">
                {staffT.confirmPrompt} <span className="text-base font-black text-emerald-800">₹{displayFinalAmount}</span> ({selectedMethod.toUpperCase()}) {staffT.confirmPromptSuffix}
              </p>

              <div className="bg-white rounded-xl p-2.5 border border-emerald-200 text-xs font-extrabold text-slate-900">
                Token #{order.token_number || order.id.slice(0, 4)} • {order.customer_name || 'Walk-in'}
              </div>
            </div>

            {/* Confirm Actions */}
            <div className="space-y-2.5">
              <button
                onClick={handleFinalConfirm}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                {staffT.yesConfirmPaid} (₹{displayFinalAmount})
              </button>

              <button
                onClick={() => setStep('select_method')}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> {staffT.goBack}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
