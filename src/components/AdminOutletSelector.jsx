import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { MapPin } from 'lucide-react';

export default function AdminOutletSelector() {
  const { outlets, selectedAdminOutlet, changeAdminOutlet } = useAdmin();

  return (
    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-200 rounded-xl flex items-center justify-center text-purple-700">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-black text-purple-900 leading-tight">Global Outlet Filter</h2>
          <p className="text-xs text-purple-700 font-medium">Filtering data across all admin pages</p>
        </div>
      </div>
      
      <div className="relative shrink-0">
        <select
          value={selectedAdminOutlet}
          onChange={(e) => changeAdminOutlet(e.target.value)}
          className="appearance-none bg-white border-2 border-purple-200 text-purple-900 font-bold text-sm rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-purple-500 w-full sm:w-auto min-w-[200px] cursor-pointer shadow-xs transition-colors"
        >
          <option value="ALL">🏢 All Canteens & Outlets</option>
          {outlets.map(outlet => (
            <option key={outlet.id} value={outlet.id}>
              📍 {outlet.name} ({outlet.code})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-purple-600">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}
