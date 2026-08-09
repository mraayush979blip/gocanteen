import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { MapPin, AlertTriangle, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';

export default function OutletSelectionModal({ isOpen, onClose }) {
  const { outlets, selectedOutlet, setSelectedOutlet, clearCart, cart } = useAuth();
  const [pendingSelection, setPendingSelection] = useState(null);

  const handleInitialSelect = (outletId) => {
    setPendingSelection(outletId);
  };

  const handleConfirm = () => {
    if (!pendingSelection) return;
    
    if (selectedOutlet && selectedOutlet !== pendingSelection && cart.length > 0) {
      const confirmClear = window.confirm("Changing canteens will clear your current cart. Proceed?");
      if (!confirmClear) {
        setPendingSelection(null);
        return;
      }
      clearCart();
    }
    
    setSelectedOutlet(pendingSelection);
    setPendingSelection(null);
    if (onClose) onClose();
  };

  const pendingOutletData = pendingSelection ? outlets.find(o => o.id === pendingSelection) : null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={() => {
               // only allow close if an outlet is already selected
               if (selectedOutlet && onClose && !pendingSelection) onClose();
            }}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white rounded-[32px] w-full max-w-sm p-6 shadow-2xl overflow-hidden border border-white/20"
          >
            {/* Top decorative gradient */}
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 opacity-10 rounded-b-[40px] pointer-events-none" />

            <AnimatePresence mode="wait">
              {!pendingSelection ? (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mt-2 mb-8 relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full shadow-[0_8px_16px_-6px_rgba(16,185,129,0.3)] mx-auto flex items-center justify-center mb-4 border border-emerald-100">
                      <MapPin className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Select Campus</h2>
                    <p className="text-sm text-slate-500 mt-2 font-medium px-4">Choose your location to see the correct menu and stock.</p>
                  </div>

                  <div className="space-y-4">
                    {outlets.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-sm font-medium animate-pulse">Loading campuses...</div>
                    ) : (
                      outlets.map((outlet) => (
                        <button
                          key={outlet.id}
                          onClick={() => handleInitialSelect(outlet.id)}
                          className={`w-full p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden group flex items-center justify-between
                            ${selectedOutlet === outlet.id 
                              ? 'border-emerald-500 bg-emerald-50 shadow-[0_8px_16px_-6px_rgba(16,185,129,0.2)]' 
                              : 'border-slate-100 bg-white hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5'
                            }
                          `}
                        >
                          <div>
                            <div className={`font-black text-lg tracking-tight ${selectedOutlet === outlet.id ? 'text-emerald-900' : 'text-slate-800 group-hover:text-emerald-700 transition-colors'}`}>
                              {outlet.name}
                            </div>
                            <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Campus Code: {outlet.code}</div>
                          </div>
                          
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${selectedOutlet === outlet.id ? 'bg-emerald-500 shadow-md scale-100' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 scale-95 group-hover:scale-100'}`}>
                            {selectedOutlet === outlet.id ? (
                              <CheckCircle2 className="w-6 h-6 text-white" />
                            ) : (
                              <ArrowRight className="w-5 h-5" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  
                  {selectedOutlet && onClose && (
                    <button
                      onClick={onClose}
                      className="w-full mt-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="pt-2"
                >
                  <button 
                    onClick={() => setPendingSelection(null)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors mb-4"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-amber-100 rounded-full mx-auto flex items-center justify-center mb-4">
                      <AlertTriangle className="w-10 h-10 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Confirm Campus</h2>
                    <p className="text-slate-600 mt-2 font-medium">
                      You selected <span className="text-emerald-600 font-bold">{pendingOutletData?.name}</span>
                    </p>
                  </div>

                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-8">
                    <p className="text-sm font-bold text-red-800 text-center leading-relaxed">
                      Please double-check your campus! Orders placed at the wrong campus are <span className="underline">NOT REFUNDABLE</span>.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleConfirm}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-white font-black text-lg rounded-2xl shadow-[0_8px_16px_-6px_rgba(16,185,129,0.4)]"
                    >
                      Yes, I am here
                    </button>
                    <button
                      onClick={() => setPendingSelection(null)}
                      className="w-full py-4 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all text-slate-700 font-bold text-base rounded-2xl"
                    >
                      No, Change Campus
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
