import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Database } from 'lucide-react';
import { useSync } from '../hooks/useSync';
import SyncModal from './SyncModal';

export default function SyncStatus() {
  const { isOnline, unsyncedCount, isSyncing, triggerSync } = useSync();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5 text-xs font-sans">
        {/* Connection Indicator - Clickable */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all active:scale-95 ${
            isOnline
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}
          title="Klik untuk detail koneksi & database lokal"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="font-bold">{isOnline ? 'Online' : 'Offline'}</span>
        </button>

        {/* Pending Sync Queue Badge - Clickable */}
        {unsyncedCount > 0 && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700/80 transition-all active:scale-95 text-xs font-bold shadow-sm"
            title="Klik untuk melihat transaksi offline & sinkronisasi"
          >
            <span>{unsyncedCount} draft</span>
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-300' : 'text-slate-400'}`} />
          </button>
        )}
      </div>

      {/* Detail Modal */}
      <SyncModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
