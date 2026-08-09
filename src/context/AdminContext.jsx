import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const { user, profile } = useAuth();
  
  // 'ALL' represents all outlets. Otherwise it's a specific outlet UUID.
  const [selectedAdminOutlet, setSelectedAdminOutlet] = useState(() => {
    return localStorage.getItem('cg_admin_outlet') || 'ALL';
  });
  
  const [outlets, setOutlets] = useState([]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchOutlets();
    }
  }, [profile]);

  const fetchOutlets = async () => {
    try {
      const { data, error } = await supabase
        .from('outlets')
        .select('*')
        .order('name');
      if (error) throw error;
      setOutlets(data || []);
    } catch (err) {
      console.error('Error fetching outlets for admin:', err);
    }
  };

  const changeAdminOutlet = (outletId) => {
    setSelectedAdminOutlet(outletId);
    localStorage.setItem('cg_admin_outlet', outletId);
  };

  return (
    <AdminContext.Provider value={{
      selectedAdminOutlet,
      changeAdminOutlet,
      outlets,
      refreshOutlets: fetchOutlets
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
