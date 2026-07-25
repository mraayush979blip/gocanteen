import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Smile, X } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    name: 'Food',
    icon: '🍔',
    emojis: ['🍔', '🍕', '🌯', '🥪', '🌭', '🍿', '🌮', '🍟', '🍗', '🍝', '🍛', '🫓', '🥗', '🍱', '🥟', '🍚', '🍲', '🍳', '🥩', '🍣', '🥞', '🧇']
  },
  {
    name: 'Drinks',
    icon: '🥤',
    emojis: ['🥤', '☕', '🧋', '🍵', '🍋', '🍓', '🥭', '🍊', '🍉', '🍺', '🧃', '🍷', '🍹', '🥛', '🧊', '🧋']
  },
  {
    name: 'Desserts',
    icon: '🍰',
    emojis: ['🍰', '🍫', '🍨', '🍩', '🍦', '🧁', '🍮', '🍪', '🍬', '🍭', '🎂', '🥧']
  },
  {
    name: 'Deals & Icons',
    icon: '🔥',
    emojis: ['🔥', '⭐', '🎉', '🏷️', '🎟️', '⚡', '👑', '🍽️', '🛎️', '🛒', '📦', '✨', '🎁', '❤️', '👌']
  }
];

export default function EmojiPickerMenu({ value = '🍽️', onChange, label = 'Emoji' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Food');
  const [customInput, setCustomInput] = useState(value);
  const pickerRef = useRef(null);

  useEffect(() => {
    setCustomInput(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (emoji) => {
    onChange(emoji);
    setCustomInput(emoji);
    setIsOpen(false);
  };

  const currentCategory = EMOJI_CATEGORIES.find(c => c.name === activeTab) || EMOJI_CATEGORIES[0];

  return (
    <div className="relative" ref={pickerRef}>
      {label && <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{value || '🍽️'}</span>
          <span className="text-xs font-bold text-slate-700">Choose Emoji</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu Grid */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header & Custom Input */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-purple-600" /> Pick Food Emoji
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {EMOJI_CATEGORIES.map(cat => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveTab(cat.name)}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                  activeTab === cat.name
                    ? 'bg-white text-purple-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="hidden sm:inline">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="grid grid-cols-6 gap-1 max-h-44 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50 scrollbar-thin">
            {currentCategory.emojis.map((e, idx) => (
              <button
                key={`${e}-${idx}`}
                type="button"
                onClick={() => handleSelect(e)}
                className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center hover:bg-purple-100 hover:scale-115 transition-all ${
                  value === e ? 'bg-purple-200 border border-purple-400 shadow-2xs' : ''
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Custom Typing Fallback */}
          <div className="pt-1.5 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 shrink-0">Or type custom:</span>
            <input
              type="text"
              value={customInput}
              onChange={(e) => {
                const val = e.target.value;
                setCustomInput(val);
                if (val) onChange(val);
              }}
              placeholder="e.g. 🥐"
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center focus:outline-none focus:border-purple-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}
