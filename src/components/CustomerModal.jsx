import React, { useState } from 'react';
import { X, UserPlus, Search, Check, User, Phone, CheckCircle2 } from 'lucide-react';
import { db } from '../db';

export default function CustomerModal({
  isOpen,
  onClose,
  customers,
  selectedCustomer,
  onSelectCustomer
}) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  const handleAddNewCustomer = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const id = await db.customers.add({
        name: newName.trim(),
        phone: newPhone.trim(),
        currentDebt: 0,
        notes: newNotes.trim()
      });

      const added = await db.customers.get(id);
      onSelectCustomer(added);
      setShowAddForm(false);
      setNewName('');
      setNewPhone('');
      setNewNotes('');
      onClose();
    } catch (err) {
      console.error('Error adding customer:', err);
      alert('Gagal menambah pengepul.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              Pilih Pengepul / Mitra
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 font-sans">
          {!showAddForm ? (
            <>
              {/* Search & Add Button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama atau telepon..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-850 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>BARU</span>
                </button>
              </div>

              {/* Customer List */}
              <div className="space-y-1.5 mt-2">
                {filteredCustomers.map((customer) => {
                  const isSelected = selectedCustomer?.id === customer.id;
                  const hasDebt = (customer.currentDebt || 0) > 0;

                  return (
                    <button
                      key={customer.id}
                      onClick={() => {
                        onSelectCustomer(customer);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-sm ring-1 ring-amber-500/30'
                          : 'bg-slate-800/80 border-slate-700/60 hover:bg-slate-750 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex-1 pr-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm truncate">
                            {customer.name}
                          </h4>
                          {isSelected && (
                            <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          )}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-xs font-mono text-slate-400 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.notes && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {customer.notes}
                          </p>
                        )}
                      </div>

                      {/* Debt Status Badge */}
                      <div className="flex-shrink-0">
                        {hasDebt ? (
                          <div className="px-2.5 py-1 bg-rose-500/15 border border-rose-500/40 rounded-xl text-right">
                            <span className="text-[9px] text-rose-300 uppercase block font-bold leading-none">
                              Kas Bon
                            </span>
                            <span className="text-xs font-bold font-mono text-rose-300 tabular-nums">
                              Rp {Number(customer.currentDebt).toLocaleString('id-ID')}
                            </span>
                          </div>
                        ) : (
                          <div className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center flex items-center gap-1 text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs font-bold font-mono">
                              LUNAS
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}

                {filteredCustomers.length === 0 && (
                  <div className="py-10 text-center text-slate-400 bg-slate-850/80 rounded-xl border border-slate-700/60">
                    <p className="text-xs font-medium">Pengepul tidak ditemukan</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Form Tambah Pengepul Baru */
            <form onSubmit={handleAddNewCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nama Pengepul *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak Kumis, Mas Joko"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-medium"
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
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Catatan Armada / Lapak (opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Roda tiga Tossa, gerobak"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/10 active:scale-95 transition"
                >
                  Simpan & Pilih
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
