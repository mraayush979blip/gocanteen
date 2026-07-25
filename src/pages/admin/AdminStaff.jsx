import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, Shield, ChefHat, User, Loader2, Plus, X, Calendar, Clock, Save, Lock, Mail, Edit3, Trash2, Eye, EyeOff, Key } from 'lucide-react';

export default function AdminStaff() {
  const { showToast } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Staff Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [staffRole, setStaffRole] = useState('staff');
  const [isTemporary, setIsTemporary] = useState(false);
  const [validFrom, setValidFrom] = useState('');
  const [validTill, setValidTill] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Staff fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setEmail('');
    setPassword('');
    setFullName('');
    setStaffRole('staff');
    setIsTemporary(false);
    setValidFrom('');
    setValidTill('');
    setShowPass(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (staffUser) => {
    setEditingStaff(staffUser);
    setEmail(staffUser.email || '');
    // Pre-fill password if stored in assigned_password or raw_password
    setPassword(staffUser.assigned_password || staffUser.raw_password || '');
    setFullName(staffUser.full_name || '');
    setStaffRole(staffUser.role || 'staff');
    setIsTemporary(Boolean(staffUser.is_temporary));
    setValidFrom(staffUser.valid_from ? staffUser.valid_from.split('T')[0] : '');
    setValidTill(staffUser.valid_till ? staffUser.valid_till.split('T')[0] : '');
    setShowPass(false);
    setModalOpen(true);
  };

  const updateUserRole = async (id, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id);

      if (error) throw error;
      showToast(`✓ User role updated to ${newRole.toUpperCase()}`);
      fetchUsers();
    } catch (err) {
      showToast('Failed to update role: ' + err.message, true);
    }
  };

  const handleDeleteStaff = async (staffUser) => {
    if (!window.confirm(`Are you sure you want to delete staff account "${staffUser.full_name || staffUser.email}"?`)) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', staffUser.id);
      if (error) throw error;
      showToast(`✓ Staff member ${staffUser.full_name || staffUser.email} removed.`);
      fetchUsers();
    } catch (err) {
      showToast('Failed to delete staff: ' + err.message, true);
    }
  };

  const handleAddOrUpdateStaff = async (e) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) {
      showToast('Please fill in name and email address', true);
      return;
    }

    if (isTemporary && (!validFrom || !validTill)) {
      showToast('Please select From Date and Till Date for temporary staff', true);
      return;
    }

    setSaving(true);
    try {
      if (editingStaff) {
        // UPDATE Existing Staff Profile
        const updatePayload = {
          email: email.trim(),
          full_name: fullName.trim(),
          role: staffRole,
          is_temporary: isTemporary,
          valid_from: isTemporary && validFrom ? new Date(validFrom).toISOString() : null,
          valid_till: isTemporary && validTill ? new Date(validTill).toISOString() : null
        };

        if (password) {
          updatePayload.assigned_password = password;
        }

        const { error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', editingStaff.id);

        if (error) throw error;
        showToast(`✓ Staff member "${fullName}" updated successfully!`);
      } else {
        // CREATE New Staff Profile
        if (!password) {
          showToast('Please set a password for the new staff account', true);
          setSaving(false);
          return;
        }

        const { data: authData } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              role: staffRole,
              full_name: fullName.trim()
            }
          }
        });

        const staffUserId = authData?.user?.id || crypto.randomUUID();

        const profilePayload = {
          id: staffUserId,
          email: email.trim(),
          full_name: fullName.trim(),
          role: staffRole,
          is_temporary: isTemporary,
          valid_from: isTemporary && validFrom ? new Date(validFrom).toISOString() : null,
          valid_till: isTemporary && validTill ? new Date(validTill).toISOString() : null,
          assigned_password: password
        };

        const { error: profErr } = await supabase
          .from('profiles')
          .upsert([profilePayload]);

        if (profErr) throw profErr;
        showToast(`✓ Staff member "${fullName}" created successfully!`);
      }

      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast('Failed to save staff details: ' + err.message, true);
    } finally {
      setSaving(false);
    }
  };

  // Filter ONLY staff and admin accounts (excluding normal customers)
  const staffOnlyUsers = users.filter(u => u.role === 'staff' || u.role === 'admin');

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading staff list...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-16 text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900">Official Staff & Admin Members</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage kitchen staff accounts, assigned passwords, and temporary time-bound access
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Staff Member
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Staff Name</th>
                <th className="p-4">Official Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Access Validity</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffOnlyUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                    No staff members created yet. Click "+ Add New Staff Member" above to create one.
                  </td>
                </tr>
              ) : (
                staffOnlyUsers.map(user => {
                  const isTempExpired = user.is_temporary && user.valid_till && new Date(user.valid_till) < new Date();

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-extrabold text-slate-900 flex items-center gap-2">
                        {user.role === 'admin' ? (
                          <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                        ) : (
                          <ChefHat className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        {user.full_name || 'Staff Member'}
                      </td>
                      <td className="p-4 text-slate-600 font-semibold">{user.email}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            user.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {user.is_temporary ? (
                          isTempExpired ? (
                            <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-red-300">
                              ⌛ Temp Expired
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-amber-200 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Valid: {user.valid_from ? new Date(user.valid_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Now'} - {new Date(user.valid_till).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 font-semibold text-[11px]">♾️ Permanent Access</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors flex items-center gap-1"
                            title="Edit Staff & View/Change Password"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span className="text-[11px] font-bold">Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteStaff(user)}
                            className="p-2 rounded-xl bg-slate-100 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Delete Staff Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs text-slate-900">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-extrabold text-slate-900">
                  {editingStaff ? 'Edit Staff Member Details' : 'Add New Staff Member'}
                </h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddOrUpdateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@gocanteen.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-600 font-medium"
                  />
                </div>
              </div>

              {/* Password field with view/hide toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {editingStaff ? 'Assigned Password' : 'Set Account Password'}
                  </label>
                  {editingStaff && password && (
                    <span className="text-[10px] text-purple-700 font-extrabold flex items-center gap-1">
                      <Key className="w-3 h-3" /> Password Saved
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required={!editingStaff}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingStaff ? 'Type new password to update...' : 'Set account password'}
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-600 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-purple-600 hover:text-purple-800 p-0.5 rounded-md hover:bg-purple-50 transition-colors"
                    title={showPass ? 'Hide Password' : 'Reveal Password'}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {editingStaff ? (
                  <p className="text-[10px] text-slate-500 font-medium mt-1">
                    {password ? (
                      '💡 Click the eye icon to view the assigned password, or type a new one to change it.'
                    ) : (
                      '⚠️ Password was set prior to column creation. Type a new password above and click Save to store it!'
                    )}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Assignment</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-600 font-bold"
                >
                  <option value="staff">👨‍🍳 Kitchen Staff</option>
                  <option value="admin">🛡️ Admin Manager</option>
                </select>
              </div>

              {/* Temporary Access Toggle */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">Temporary Access Staff</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Limit staff login to specific date range</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isTemporary}
                    onChange={(e) => setIsTemporary(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </div>

                {isTemporary && (
                  <div className="grid grid-cols-2 gap-2 bg-amber-50/50 border border-amber-200 rounded-2xl p-3 animate-fade-in">
                    <div>
                      <label className="block text-[11px] font-extrabold text-amber-900 mb-1">Valid From Date</label>
                      <input
                        type="date"
                        required={isTemporary}
                        value={validFrom}
                        onChange={(e) => setValidFrom(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-amber-900 mb-1">Valid Till Date</label>
                      <input
                        type="date"
                        required={isTemporary}
                        value={validTill}
                        onChange={(e) => setValidTill(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingStaff ? 'Save Staff Changes' : 'Create Staff Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
