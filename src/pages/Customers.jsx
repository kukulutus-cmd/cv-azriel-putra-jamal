import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  Users,
  Search,
  UserPlus,
  PlusCircle,
  History,
  Phone,
  AlertCircle,
  X,
  ArrowDownRight,
  ArrowUpRight,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';

export default function Customers() {
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const debtLogs = useLiveQuery(() => db.debt_logs.toArray(), []) || [];

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'DEBT_ONLY'

  // State Modal Tambah Bon Baru
  const [borrowModalCust, setBorrowModalCust] = useState(null);
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowNotes, setBorrowNotes] = useState('');

  // State Modal Riwayat Bon
  const [historyModalCust, setHistoryModalCust] = useState(null);

  // State Form Pengepul Baru
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search));
    const matchTab = activeTab === 'ALL' || (c.currentDebt || 0) > 0;
    return matchSearch && matchTab;
  });

  const totalOutstandingDebt = customers.reduce(
    (sum, c) => sum + (c.currentDebt || 0),
    0
  );
  const debtCount = customers.filter((c) => (c.currentDebt || 0) > 0).length;

  // Handler: Tambah Kas Bon Baru
  const handleSaveNewBorrow = async (e) => {
    e.preventDefault();
    const amount = parseFloat(borrowAmount);
    if (!amount || amount <= 0 || !borrowModalCust) {
      alert('Masukkan jumlah uang kas bon yang valid!');
      return;
    }

    try {
      const now = new Date();
      await db.transaction('rw', [db.customers, db.debt_logs], async () => {
        const updatedDebt = (borrowModalCust.currentDebt || 0) + amount;
        await db.customers.update(borrowModalCust.id, {
          currentDebt: updatedDebt
        });

        await db.debt_logs.add({
          customerId: borrowModalCust.id,
          type: 'BORROW',
          amount: amount,
          date: now.toISOString(),
          invoiceId: null,
          notes: borrowNotes.trim() || 'Pinjaman kas bon tunai'
        });
      });

      setBorrowModalCust(null);
      setBorrowAmount('');
      setBorrowNotes('');
      alert('Kas bon baru berhasil dicatat!');
    } catch (err) {
      console.error('Error adding debt:', err);
      alert('Gagal mencatat kas bon.');
    }
  };

  // Handler: Tambah Pengepul Baru
  const handleSaveNewCustomer = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await db.customers.add({
        name: newName.trim(),
        phone: newPhone.trim(),
        currentDebt: 0,
        notes: newNotes.trim()
      });

      setIsAddCustModalOpen(false);
      setNewName('');
      setNewPhone('');
      setNewNotes('');
    } catch (err) {
      console.error('Error adding customer:', err);
      alert('Gagal menambah pengepul.');
    }
  };

  // Preset button nominal kas bon
  const setPresetBorrow = (val) => {
    const current = parseFloat(borrowAmount) || 0;
    setBorrowAmount((current + val).toString());
  };

  // Logs riwayat untuk modal riwayat aktif
  const customerHistoryLogs = historyModalCust
    ? debtLogs
        .filter((log) => log.customerId === historyModalCust.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  return (
    <div className="flex flex-col space-y-3 pb-24 md:pb-6 max-w-6xl mx-auto font-sans">
      {/* 1. Control Header & Stats */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-xl p-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Stats Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 border border-slate-700/60 rounded-xl">
              <Users className="w-4 h-4 text-amber-400" />
              <div className="flex items-baseline gap-1.5 font-mono text-xs">
                <span className="text-slate-300 font-sans font-medium">Mitra:</span>
                <span className="font-bold text-white tabular-nums">{customers.length}</span>
                <span className="text-[11px] text-slate-400 font-sans">orang</span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <div className="flex items-baseline gap-1.5 font-mono text-xs">
                <span className="text-slate-300 font-sans font-medium">Total Bon Aktif:</span>
                <span className="font-extrabold text-rose-300 tabular-nums">
                  Rp {totalOutstandingDebt.toLocaleString('id-ID')}
                </span>
                <span className="text-[11px] text-rose-400/90 font-sans">({debtCount} orang)</span>
              </div>
            </div>
          </div>

          {/* Button Tambah Pengepul */}
          <button
            onClick={() => setIsAddCustModalOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/15 active:scale-95 transition"
          >
            <UserPlus className="w-4 h-4 stroke-[2.4]" />
            <span>+ MITRA BARU</span>
          </button>
        </div>
      </div>

      {/* 2. Precision Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 bg-slate-800/90 p-2.5 border border-slate-700/60 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau nomor kontak pengepul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-850 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 font-sans">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
              activeTab === 'ALL'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-850 text-slate-300 border-slate-700/60 hover:bg-slate-750 hover:text-white'
            }`}
          >
            Semua ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('DEBT_ONLY')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition border flex items-center justify-center gap-1.5 ${
              activeTab === 'DEBT_ONLY'
                ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                : 'bg-slate-850 text-rose-300 border-slate-700/60 hover:bg-slate-750'
            }`}
          >
            <span>Ada Bon</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-900 text-rose-300 font-mono font-bold">
              {debtCount}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Modern Customer Ledger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredCustomers.map((c) => {
          const hasDebt = (c.currentDebt || 0) > 0;

          return (
            <div
              key={c.id}
              className="p-3.5 bg-slate-800/90 border border-slate-700/60 rounded-xl shadow-sm hover:border-slate-600 transition flex flex-col justify-between gap-3"
            >
              {/* Info Utama & Status Bon */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-bold text-white truncate">
                      {c.name}
                    </h4>
                    {c.notes && (
                      <span className="text-[10px] px-2 py-0.5 bg-slate-900/80 text-slate-300 rounded-md border border-slate-700/60 truncate max-w-[150px]">
                        {c.notes}
                      </span>
                    )}
                  </div>

                  {c.phone ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      <a
                        href={`tel:${c.phone}`}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-mono bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/60 transition"
                        title="Telepon Pengepul"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </a>
                      <a
                        href={`https://wa.me/${c.phone.replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-lg border border-emerald-500/30 transition"
                        title="Kirim Pesan WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic block mt-1">
                      Tanpa nomor HP
                    </span>
                  )}
                </div>

                {/* Kas Bon Badge */}
                <div className="text-right flex-shrink-0">
                  {hasDebt ? (
                    <div className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/40 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-rose-300 block leading-none">
                        Kas Bon Aktif
                      </span>
                      <span className="text-sm sm:text-base font-black font-mono text-rose-300 tabular-nums block mt-0.5">
                        Rp {Number(c.currentDebt).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-bold font-mono">
                        LUNAS
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2.5 border-t border-slate-700/50 font-sans">
                <button
                  onClick={() => {
                    setBorrowModalCust(c);
                    setBorrowAmount('');
                    setBorrowNotes('');
                  }}
                  className="flex-1 py-2 px-3 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/40 flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>+ Kas Bon</span>
                </button>

                <button
                  onClick={() => setHistoryModalCust(c)}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700/60 flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>Riwayat Mutasi</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-850/80 rounded-xl border border-slate-700/50">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="font-bold text-sm text-slate-300">Pengepul tidak ditemukan</p>
            <p className="text-xs text-slate-500 mt-0.5">Coba gunakan kata kunci pencarian yang lain</p>
          </div>
        )}
      </div>

      {/* Modal: Tambah Kas Bon Baru */}
      {borrowModalCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Catat Kas Bon Baru (Pinjaman)
                </h3>
              </div>
              <button
                onClick={() => setBorrowModalCust(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewBorrow} className="p-4 space-y-3.5">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                    Mitra Pengepul
                  </span>
                  <span className="text-sm font-bold text-white">
                    {borrowModalCust.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-rose-400 block font-sans">
                    Sisa Bon Aktif
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-rose-300 tabular-nums">
                    Rp {Number(borrowModalCust.currentDebt || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Nominal Kas Bon (Rp) *
                </label>
                <div className="relative font-mono">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    placeholder="0"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    className="w-full pl-11 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 focus:border-amber-500 rounded-xl text-white text-lg font-bold focus:outline-none tabular-nums"
                    autoFocus
                  />
                </div>

                {/* Preset Tombol Cepat */}
                <div className="grid grid-cols-4 gap-1.5 mt-2 font-mono">
                  {[50000, 100000, 200000, 500000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => setPresetBorrow(nominal)}
                      className="py-1.5 bg-slate-800 hover:bg-slate-750 text-amber-400 font-bold text-xs rounded-xl border border-slate-700/60 transition active:scale-95"
                    >
                      +{nominal / 1000}rb
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Keterangan (opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bensin, solar, operasional armada"
                  value={borrowNotes}
                  onChange={(e) => setBorrowNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBorrowModalCust(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/10 active:scale-95 transition"
                >
                  Simpan Bon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Riwayat Kas Bon Pengepul */}
      {historyModalCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Buku Mutasi Kas Bon
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">{historyModalCust.name}</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalCust(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 flex-1 overflow-y-auto space-y-2 font-mono text-xs">
              {customerHistoryLogs.length === 0 ? (
                <div className="py-10 text-center text-slate-400 font-sans">
                  Belum ada catatan mutasi kas bon.
                </div>
              ) : (
                customerHistoryLogs.map((log) => {
                  const isBorrow = log.type === 'BORROW';

                  return (
                    <div
                      key={log.id}
                      className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isBorrow
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isBorrow ? (
                            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-sans font-bold text-white text-xs truncate">
                            {isBorrow ? 'Pinjaman Kas Bon' : 'Potong Nota Pembayaran'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans truncate">
                            {new Date(log.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })} • {log.notes || '-'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span
                          className={`font-bold tabular-nums text-xs sm:text-sm ${
                            isBorrow ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {isBorrow ? '+' : '-'}Rp {Number(log.amount).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-950/80 border-t border-slate-800">
              <button
                onClick={() => setHistoryModalCust(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah Pengepul Baru */}
      {isAddCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Tambah Mitra Pengepul Baru
                </h3>
              </div>
              <button
                onClick={() => setIsAddCustModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCustomer} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nama Pengepul / Mitra *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak Kumis, Mas Joko"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  No HP / WhatsApp (opsional)
                </label>
                <input
                  type="tel"
                  placeholder="081234567890"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Catatan Armada / Lapak (opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Roda tiga Tossa, gerobak dorong"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/10 active:scale-95 transition"
                >
                  Simpan Mitra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
