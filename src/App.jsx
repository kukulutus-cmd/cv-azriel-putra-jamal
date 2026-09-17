import React, { useState } from 'react';
import { ShoppingCart, Users, Tag, BarChart3, Scale } from 'lucide-react';
import Transaction from './pages/Transaction';
import Customers from './pages/Customers';
import PriceMaster from './pages/PriceMaster';
import Dashboard from './pages/Dashboard';
import SyncStatus from './components/SyncStatus';

export default function App() {
  const [activeTab, setActiveTab] = useState('POS'); // 'POS' | 'CUSTOMERS' | 'PRICES' | 'DASHBOARD'

  const navItems = [
    { id: 'POS', label: 'Kasir POS', icon: ShoppingCart },
    { id: 'CUSTOMERS', label: 'Buku Kas Bon', icon: Users },
    { id: 'PRICES', label: 'Harga Beli', icon: Tag },
    { id: 'DASHBOARD', label: 'Rekap & Laporan', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header Bar: Clean, Modern, Elevated */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-3.5 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/15 flex-shrink-0">
              <Scale className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white leading-tight tracking-tight truncate">
                  CV. AZRIEL PUTRA JAMAL
                </h1>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 font-medium">
                <span className="truncate">Timbangan & Kasir</span>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700/60 flex-shrink-0">
                  by K2C Komputindo
                </span>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <SyncStatus />
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 pb-28 md:pb-8 overflow-x-hidden">
        {activeTab === 'POS' && <Transaction />}
        {activeTab === 'CUSTOMERS' && <Customers />}
        {activeTab === 'PRICES' && <PriceMaster />}
        {activeTab === 'DASHBOARD' && <Dashboard />}

        {/* Clean Footer Attribution */}
        <footer className="mt-8 mb-2 text-center font-sans">
          <p className="text-xs text-slate-400 font-medium">
            <strong className="text-slate-200 font-bold">CV. AZRIEL PUTRA JAMAL</strong> • Dibuat oleh <span className="text-amber-400 font-semibold">K2C Komputindo</span>
          </p>
        </footer>
      </main>

      {/* Bottom Navigation: Clean & Comfortable */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 shadow-xl">
        <div className="max-w-md md:max-w-2xl mx-auto grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'text-amber-400 bg-amber-500/10 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                <span className="text-[11px] mt-1 tracking-tight text-center leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
