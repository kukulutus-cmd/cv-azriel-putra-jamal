import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  TrendingUp,
  Scale,
  Wallet,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Calendar,
  ChevronRight,
  Filter
} from 'lucide-react';
import ReceiptPrint from '../components/ReceiptPrint';

export default function Dashboard() {
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const debtLogs = useLiveQuery(() => db.debt_logs.toArray(), []) || [];

  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('TODAY'); // 'TODAY' | 'MONTH' | 'ALL'

  // Helper pembanding tanggal lokal (menghindari offset UTC pada zona waktu Indonesia WIB)
  const isSameLocalDate = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isSameLocalMonth = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth()
    );
  };

  const now = new Date();

  // Hitung jumlah transaksi per periode untuk label tab
  const todayCount = transactions.filter((tx) => tx.date && isSameLocalDate(tx.date, now)).length;
  const monthCount = transactions.filter((tx) => tx.date && isSameLocalMonth(tx.date, now)).length;
  const allCount = transactions.length;

  // Filter transaksi aktif berdasarkan periode
  const filteredTransactions = transactions.filter((tx) => {
    if (!tx.date) return false;
    if (periodFilter === 'ALL') return true;
    if (periodFilter === 'MONTH') return isSameLocalMonth(tx.date, now);
    return isSameLocalDate(tx.date, now);
  });

  // Filter log kas bon aktif berdasarkan periode
  const filteredDebtLogs = debtLogs.filter((log) => {
    if (!log.date) return false;
    if (periodFilter === 'ALL') return true;
    if (periodFilter === 'MONTH') return isSameLocalMonth(log.date, now);
    return isSameLocalDate(log.date, now);
  });

  // 1. Total Uang Tunai Pembelian
  const totalNetPaid = filteredTransactions.reduce(
    (sum, tx) => sum + (Number(tx.netPaid) || Number(tx.grossTotal) || 0),
    0
  );

  // 2. Total Kas Bon Baru Keluar
  const totalNewBorrow = filteredDebtLogs
    .filter((log) => log.type === 'BORROW')
    .reduce((sum, log) => sum + (Number(log.amount) || 0), 0);

  // Total Pengeluaran Kas Lapak (Beli Barang + Kas Bon Keluar)
  const totalCashOut = totalNetPaid + totalNewBorrow;

  // 3. Total Tonase Masuk (kg)
  const totalTonnageKg = filteredTransactions.reduce((total, tx) => {
    const txKg = (tx.items || []).reduce(
      (sub, item) => sub + (Number(item.netWeight) || Number(item.weight) || Number(item.grossWeight) || 0),
      0
    );
    return total + txKg;
  }, 0);

  // 4. Total Kas Bon Terpotong
  const totalDebtDeducted = filteredTransactions.reduce(
    (sum, tx) => sum + (Number(tx.debtDeduction) || 0),
    0
  );

  // Helper format waktu nota agar jelas jika dari tanggal berbeda
  const formatTxDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (isSameLocalDate(d, now)) {
      return timeStr;
    }
    return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ${timeStr}`;
  };

  // 15 Transaksi Terakhir
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 15);

  return (
    <div className="flex flex-col space-y-3 max-w-6xl mx-auto pb-24 md:pb-6 font-sans">
      {/* 1. Header Bar with Period Filters */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-xl p-3 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <TrendingUp className="w-4 h-4 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                Rekapitulasi Operasional Gudang
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-sans">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 bg-slate-900/80 border border-slate-700/60 rounded-xl font-mono text-xs text-emerald-400 font-bold flex-shrink-0 self-start sm:self-auto tabular-nums">
            {filteredTransactions.length} Nota Selesai
          </div>
        </div>

        {/* Period Filter Pills */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-700/50 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            <span>Periode:</span>
          </span>
          <button
            type="button"
            onClick={() => setPeriodFilter('TODAY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              periodFilter === 'TODAY'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-700/60 hover:bg-slate-750 hover:text-white'
            }`}
          >
            Hari Ini ({todayCount})
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('MONTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              periodFilter === 'MONTH'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-700/60 hover:bg-slate-750 hover:text-white'
            }`}
          >
            Bulan Ini ({monthCount})
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              periodFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-700/60 hover:bg-slate-750 hover:text-white'
            }`}
          >
            Semua Waktu ({allCount})
          </button>
        </div>

        {/* Helpful Info Notice if Today has 0 but older transactions exist */}
        {periodFilter === 'TODAY' && todayCount === 0 && allCount > 0 && (
          <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center justify-between gap-2">
            <span>
              ℹ️ Belum ada transaksi tercatat pada hari ini. Ketuk <strong>Semua Waktu ({allCount})</strong> untuk melihat total keseluruhan nota terdahulu.
            </span>
            <button
              type="button"
              onClick={() => setPeriodFilter('ALL')}
              className="text-amber-400 underline font-bold hover:text-amber-300 flex-shrink-0"
            >
              Lihat Semua
            </button>
          </div>
        )}
      </div>

      {/* 2. Grid 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Metric 1: Total Uang Keluar */}
        <div className="p-3.5 bg-slate-800/90 border border-slate-700/60 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-sans">
              Total Kas Keluar
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 font-mono">
            <div className="text-base sm:text-xl font-black text-emerald-400 tabular-nums leading-tight">
              Rp {totalCashOut.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-slate-400 block truncate mt-1">
              Beli: Rp {totalNetPaid.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Metric 2: Tonase Masuk */}
        <div className="p-3.5 bg-slate-800/90 border border-slate-700/60 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-sans">
              Tonase Masuk
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 font-mono">
            <div className="text-base sm:text-xl font-black text-amber-400 tabular-nums leading-tight">
              {totalTonnageKg.toFixed(1)} <span className="text-xs font-sans text-slate-400 font-bold">kg</span>
            </div>
            <span className="text-[11px] text-slate-400 block truncate mt-1">
              ~ {(totalTonnageKg / 1000).toFixed(2)} Ton muatan
            </span>
          </div>
        </div>

        {/* Metric 3: Bon Terpotong */}
        <div className="p-3.5 bg-slate-800/90 border border-slate-700/60 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-sans">
              Bon Terpotong
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 font-mono">
            <div className="text-base sm:text-xl font-black text-sky-300 tabular-nums leading-tight">
              Rp {totalDebtDeducted.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-slate-400 block truncate mt-1">
              Pelunasan nota ({periodFilter === 'TODAY' ? 'hari ini' : periodFilter === 'MONTH' ? 'bulan ini' : 'semua'})
            </span>
          </div>
        </div>

        {/* Metric 4: Bon Baru Keluar */}
        <div className="p-3.5 bg-slate-800/90 border border-slate-700/60 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-sans">
              Kas Bon Baru
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 font-mono">
            <div className="text-base sm:text-xl font-black text-rose-300 tabular-nums leading-tight">
              Rp {totalNewBorrow.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-slate-400 block truncate mt-1">
              Pinjaman tunai keluar
            </span>
          </div>
        </div>
      </div>

      {/* 3. Riwayat Transaksi */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-tight">
              Riwayat Transaksi Terakhir
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Ketuk nota untuk pratinjau struk
          </span>
        </div>

        {/* List Transaksi di Layar Ponsel */}
        <div className="md:hidden divide-y divide-slate-700/50">
          {recentTransactions.map((tx) => {
            const itemCount = (tx.items || []).length;
            const txTonnage = (tx.items || []).reduce(
              (sum, it) => sum + (it.netWeight || it.weight || it.grossWeight || 0),
              0
            );

            return (
              <div
                key={tx.id || tx.invoiceNumber}
                onClick={() => setSelectedTxForReceipt(tx)}
                className="p-3.5 flex items-center justify-between hover:bg-slate-750/70 cursor-pointer active:bg-slate-750 transition"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white truncate">
                      {tx.customerName || 'Pelanggan Umum'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      • #{tx.invoiceNumber?.slice(-6) || 'NOTA'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono mt-1 flex items-center flex-wrap gap-2">
                    <span className="text-emerald-400 font-bold tabular-nums">
                      {txTonnage.toFixed(1)} kg
                    </span>
                    <span className="text-slate-600">|</span>
                    <span>{itemCount} item</span>
                    {tx.debtDeduction > 0 && (
                      <>
                        <span className="text-slate-600">|</span>
                        <span className="text-rose-400 text-xs">
                          -Rp {tx.debtDeduction.toLocaleString('id-ID')}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 text-right font-mono">
                  <div>
                    <span className="text-sm sm:text-base font-black text-emerald-400 block tabular-nums">
                      Rp {Number(tx.netPaid || tx.grossTotal || 0).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {formatTxDateTime(tx.date)}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}

          {recentTransactions.length === 0 && (
            <div className="p-10 text-center text-slate-400 font-medium text-xs">
              Belum ada riwayat transaksi tercatat.
            </div>
          )}
        </div>

        {/* Tabel Transaksi di Layar Tablet & Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-700/60 text-slate-300 font-sans text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-3.5">No. Nota</th>
                <th className="py-3 px-3.5">Waktu</th>
                <th className="py-3 px-3.5">Pengepul</th>
                <th className="py-3 px-3.5 text-right">Muatan (kg)</th>
                <th className="py-3 px-3.5 text-right">Potong Bon</th>
                <th className="py-3 px-3.5 text-right">Total Dibayar</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recentTransactions.map((tx) => {
                const txTonnage = (tx.items || []).reduce(
                  (sum, it) => sum + (it.netWeight || it.weight || it.grossWeight || 0),
                  0
                );

                return (
                  <tr
                    key={tx.id || tx.invoiceNumber}
                    onClick={() => setSelectedTxForReceipt(tx)}
                    className="hover:bg-slate-750/70 cursor-pointer transition"
                  >
                    <td className="py-3 px-3.5 font-bold text-white">
                      {tx.invoiceNumber}
                    </td>
                    <td className="py-3 px-3.5 text-slate-300">
                      {formatTxDateTime(tx.date)}
                    </td>
                    <td className="py-3 px-3.5 font-sans font-bold text-white">
                      {tx.customerName || 'Umum'}
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-amber-400 tabular-nums">
                      {txTonnage.toFixed(2)} kg
                    </td>
                    <td className="py-3 px-3.5 text-right tabular-nums">
                      {tx.debtDeduction > 0 ? (
                        <span className="text-rose-400 font-bold">
                          -Rp {tx.debtDeduction.toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right font-black text-emerald-400 text-sm tabular-nums">
                      Rp {Number(tx.netPaid || tx.grossTotal || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTxForReceipt(tx);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-700 transition"
                        title="Lihat Struk Nota"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans text-xs">
                    Belum ada transaksi operasional tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pratinjau Struk Nota Ketika Baris Transaksi Diklik */}
      {selectedTxForReceipt && (
        <ReceiptPrint
          isOpen={!!selectedTxForReceipt}
          transaction={selectedTxForReceipt}
          customer={{ name: selectedTxForReceipt.customerName }}
          onNewTransaction={() => setSelectedTxForReceipt(null)}
        />
      )}
    </div>
  );
}
