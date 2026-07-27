import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, ShoppingBag, IndianRupee, Save, ShieldCheck, Loader2 } from 'lucide-react';

export default function CustomerProfile({ onOpenAuth }) {
  const { session, profile, fetchProfile, showToast } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0 });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
    if (session?.user) {
      fetchUserStats();
    }
  }, [profile, session]);

  const fetchUserStats = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, payment_status, status')
        .eq('customer_id', session.user.id);

      if (orders) {
        const paidOrders = orders.filter(o => o.payment_status === 'paid' && o.status !== 'cancelled');
        const count = paidOrders.length;
        const spent = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        setStats({ totalOrders: count, totalSpent: spent });
      }
    } catch (err) {
      console.error('Profile stats error:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Please enter your full name', true);
      return;
    }
    if (!phone.trim()) {
      showToast('Please enter your mobile phone number', true);
      return;
    }
    if (phone.trim().length !== 10) {
      showToast('Mobile number must be exactly 10 digits', true);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone: phone })
        .eq('id', session.user.id);

      if (error) throw error;
      await fetchProfile();
      showToast('✓ Profile updated!');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 space-y-3 max-w-md mx-auto my-10 shadow-xs">
        <span className="text-4xl">👤</span>
        <h3 className="text-lg font-extrabold text-slate-900">Sign In to View Profile</h3>
        <p className="text-xs text-slate-500 font-medium">
          Manage your account profile and details.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-16 text-slate-900">
      
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-yellow-300 text-lg font-black flex items-center justify-center shadow-xs shrink-0">
          {(fullName || session.user.email)[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900">{fullName || 'Valued Customer'}</h1>
          <p className="text-xs text-slate-500">{session.user.email}</p>
          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
            <ShieldCheck className="w-3 h-3" /> {profile?.role || 'customer'} account
          </span>
        </div>
      </div>

      {/* Stats Cards (Total Orders & Total Spent) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-slate-900">{stats.totalOrders}</span>
              <span className="text-xs text-slate-500 block font-semibold">Total Orders</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-slate-900">₹{stats.totalSpent}</span>
              <span className="text-xs text-slate-500 block font-semibold">Total Spent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">Personal Details</h2>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length > 10 && val.startsWith('91')) {
                    val = val.slice(2);
                  } else if (val.length === 11 && val.startsWith('0')) {
                    val = val.slice(1);
                  }
                  setPhone(val.slice(0, 10));
                }}
                placeholder="Enter 10-digit mobile number"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                disabled
                value={session.user.email}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 text-xs cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile Details
          </button>
        </form>
      </div>
    </div>
  );
}
