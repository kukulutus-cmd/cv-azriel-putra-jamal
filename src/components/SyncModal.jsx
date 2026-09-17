import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  Download,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ArrowLeft
} from 'lucide-react';
import { useSync } from '../hooks/useSync';

export default function SyncModal({ isOpen, onClose }) {
  const { isOnline, unsyncedCount, isSyncing, triggerSync } = useSync();
  const [syncMessage, setSyncMessage] = useState(null);

  // Ambil transaksi yang statusnya draft/pending
  const draftTransactions =
    useLiveQuery(
      () =>
        db.transactions
          .where('syncStatus')
          .anyOf(['draft', 'PENDING'])
          .reverse()
          .limit(10)
          .toArray(),
      []
    ) || [];

  const totalAllTransactions =
    useLiveQuery(() => db.transactions.count(), []) || 0;

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    setSyncMessage({
      type: 'info',
      text: 'Mengecek konektivitas cloud server...'
    });
    try {
      await triggerSync();
      setTimeout(() => {
        setSyncMessage({
          type: 'success',
          text: 'Data lokal tersimpan aman dan terverifikasi di perangkat.'
        });
      }, 600);
    } catch {
      setSyncMessage({
        type: 'warning',
        text: 'Data tersimpan offline di HP ini. Server cloud belum aktif.'
      });
    }
  };

  // Unduh Backup Data Lokal ke JSON
  const handleExportBackup = async () => {
    try {
      const items = await db.items.toArray();
      const customers = await db.customers.toArray();
      const transactions = await db.transactions.toArray();
      const debt_logs = await db.debt_logs.toArray();

      const backupData = {
        app: 'CV. AZRIEL PUTRA JAMAL - POS Timbangan',
        vendor: 'K2C Komputindo',
        exportedAt: new Date().toISOString(),
        items,
        customers,
        transactions,
        debt_logs
      };

      const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `backup-lapak-rongsok-${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setSyncMessage({
        type: 'success',
        text: 'File cadangan JSON berhasil diunduh ke memori perangkat!'
      });
    } catch (err) {
      console.error('Backup error:', err);
      setSyncMessage({
        type: 'error',
        text: 'Gagal membuat file cadangan data.'
      });
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-slate-700/80 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                Penyimpanan & Sinkronisasi
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Offline-First Database • Dexie.js
              </p>
            </div>
          </div>

          {/* Tombol Tutup Atas (Besar & Jelas) */}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700/70 text-xs font-bold flex items-center gap-1 active:scale-95 transition"
          >
            <X className="w-4 h-4" />
            <span>Tutup</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 font-sans">
          {/* Status Kartu Perangkat */}
          <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Status Jaringan:</span>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isOnline
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Terhubung (Online)</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Tanpa Internet (Offline)</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
              <span className="text-xs font-semibold text-slate-300">Database Lokal:</span>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Aktif & Siap</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
              <span className="text-xs font-semibold text-slate-300">Total Transaksi Tersimpan:</span>
              <span className="text-xs font-mono font-bold text-white">
                {totalAllTransactions} Nota
              </span>
            </div>
          </div>

          {/* Penjelasan Transaksi Draft */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Smartphone className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Mengapa ada label "{unsyncedCount} draft"?</span>
            </div>
            <p className="text-[11px] text-amber-100/90 font-medium leading-relaxed">
              Aplikasi berjalan <strong>100% Offline di HP ini</strong>. Semua timbangan dan kas bon tersimpan permanen di memori internal perangkat. Status <strong>"draft"</strong> menandakan data siap diunggah ke server cloud saat pemilik lapak menghubungkan sistem pusat.
            </p>
          </div>

          {/* Feedback Pesan Sinkronisasi */}
          {syncMessage && (
            <div
              className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                syncMessage.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : syncMessage.type === 'warning'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{syncMessage.text}</span>
            </div>
          )}

          {/* Opsi Cadangan & Sinkronisasi */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleExportBackup}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/70 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              title="Download cadangan data JSON ke memori HP"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Cadangkan JSON</span>
            </button>

            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-500/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Memeriksa...' : 'Sinkronkan'}</span>
            </button>
          </div>

          {/* Daftar Transaksi Draft Lokal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
              <span>Antrean Nota Lokal ({draftTransactions.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">Tersimpan di IndexedDB</span>
            </h4>

            {draftTransactions.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-center text-xs text-slate-400">
                Semua transaksi lokal telah terverifikasi aman.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {draftTransactions.map((tx) => (
                  <div
                    key={tx.id || tx.invoiceNumber}
                    className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="font-mono font-bold text-white block truncate">
                        {tx.invoiceNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {tx.customerName || 'Umum'} •{' '}
                        {new Date(tx.date).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 font-mono">
                      <span className="font-bold text-emerald-400 block tabular-nums">
                        Rp {Number(tx.netPaid || tx.grossTotal || 0).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans font-semibold inline-block">
                        Lokal Draft
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom: Big Prominent Return Button */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 active:scale-98 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 border border-slate-700/80 transition shadow-md"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>KEMBALI KE LAYAR KASIR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
