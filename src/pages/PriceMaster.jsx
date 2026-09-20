import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncStandardItems } from '../db';
import { Tag, Plus, Edit2, Check, X, Search, Trash2, RotateCcw, Sliders } from 'lucide-react';

export default function PriceMaster() {
  const items = useLiveQuery(() => db.items.toArray(), []) || [];

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editPriceInput, setEditPriceInput] = useState('');

  // State Modal Tambah Material Baru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Besi');
  const [newPrice, setNewPrice] = useState('');
  const [newColorTag, setNewColorTag] = useState('#f59e0b');

  // State Modal Edit Material Lengkap
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemBeingEdited, setItemBeingEdited] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editColorTag, setEditColorTag] = useState('#f59e0b');

  // Extract unique categories
  const categories = ['ALL', ...Array.from(new Set(items.map((i) => i.category || 'Lainnya')))];

  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(search.toLowerCase()));
    const matchCategory =
      selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const startEditPrice = (item) => {
    setEditingItemId(item.id);
    setEditPriceInput(item.currentPrice.toString());
  };

  const adjustEditPrice = (delta) => {
    const curr = parseFloat(editPriceInput) || 0;
    const next = Math.max(0, curr + delta);
    setEditPriceInput(next.toString());
  };

  const saveEditPrice = async (itemId) => {
    const parsed = parseFloat(editPriceInput);
    if (!parsed || parsed < 0) {
      alert('Masukkan harga yang valid!');
      return;
    }

    try {
      await db.items.update(itemId, { currentPrice: parsed });
      setEditingItemId(null);
    } catch (err) {
      console.error('Error updating price:', err);
      alert('Gagal memperbarui harga.');
    }
  };

  const openEditModal = (item) => {
    setItemBeingEdited(item);
    setEditName(item.name);
    setEditCategory(item.category || '');
    setEditPrice(item.currentPrice.toString());
    setEditColorTag(item.colorTag || '#f59e0b');
    setIsEditModalOpen(true);
  };

  const handleSaveFullEdit = async (e) => {
    e.preventDefault();
    if (!itemBeingEdited || !editName.trim() || !editPrice) return;

    try {
      await db.items.update(itemBeingEdited.id, {
        name: editName.trim(),
        category: editCategory.trim(),
        currentPrice: parseFloat(editPrice),
        colorTag: editColorTag
      });
      setIsEditModalOpen(false);
      setItemBeingEdited(null);
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Gagal mengubah data material.');
    }
  };

  const handleDeleteItem = async (item) => {
    if (confirm(`Hapus material "${item.name}" dari daftar harga?`)) {
      try {
        await db.items.delete(item.id);
        if (isEditModalOpen && itemBeingEdited?.id === item.id) {
          setIsEditModalOpen(false);
          setItemBeingEdited(null);
        }
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Gagal menghapus material.');
      }
    }
  };

  const handleAddNewItem = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;

    try {
      await db.items.add({
        name: newName.trim(),
        category: newCategory.trim(),
        currentPrice: parseFloat(newPrice),
        colorTag: newColorTag
      });

      setIsAddModalOpen(false);
      setNewName('');
      setNewPrice('');
    } catch (err) {
      console.error('Error adding item:', err);
      alert('Gagal menambah jenis material baru.');
    }
  };

  const handleSyncStandard = async () => {
    if (
      confirm(
        'Sinkronkan daftar harga dengan 19 material standar (Besi 5500, Kr 3800, KL 3000, TB 210000, Bc 225000, Kn 145000, Dang" 185000, Siku A/B, dll)?'
      )
    ) {
      try {
        await syncStandardItems(true);
        alert('Daftar 19 material standar berhasil diperbarui!');
      } catch (err) {
        console.error('Error syncing:', err);
        alert('Gagal sinkronisasi data.');
      }
    }
  };

  const COLOR_PRESETS = [
    { label: 'Tembaga', color: '#b45309' },
    { label: 'Kuningan', color: '#eab308' },
    { label: 'Alumunium', color: '#0284c7' },
    { label: 'Besi', color: '#64748b' },
    { label: 'Kardus', color: '#854d0e' },
    { label: 'Aki/Plastik', color: '#10b981' },
    { label: 'Babet/Lainnya', color: '#475569' },
    { label: 'Elemen/Spesial', color: '#8b5cf6' }
  ];

  return (
    <div className="flex flex-col space-y-3 max-w-5xl mx-auto pb-24 md:pb-6 font-sans">
      {/* 1. Header Bar */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-xl p-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Tag className="w-4 h-4 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Papan Harga Beli Harian</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 border border-slate-700/60 font-mono font-bold">
                  {items.length} Material
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Pembaruan tarif timbangan per kilogram secara instan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncStandard}
              className="px-3 py-2 bg-slate-750 hover:bg-slate-700 text-slate-200 hover:text-amber-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700/70 active:scale-95 transition"
              title="Terapkan / Sinkronkan 19 Data Standar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>SINKRON STANDAR</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/15 active:scale-95 transition"
            >
              <Plus className="w-4 h-4 stroke-[2.6]" />
              <span>+ MATERIAL</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter Kategori & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 bg-slate-800/90 p-2.5 border border-slate-700/60 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari jenis barang atau material rongsok..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-850 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 font-medium focus:outline-none focus:border-amber-500 transition"
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

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none font-sans">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-850 text-slate-300 border-slate-700/60 hover:bg-slate-750 hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'SEMUA MATERIAL' : cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Papan Harga: High-Contrast Commodity Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredItems.map((item) => {
          const isEditing = editingItemId === item.id;
          const accentColor = item.colorTag || '#f59e0b';

          return (
            <div
              key={item.id}
              style={{ borderLeftColor: accentColor }}
              className={`p-3.5 bg-slate-800/90 border border-slate-700/60 border-l-[4px] rounded-xl flex flex-col justify-between gap-2.5 transition shadow-sm ${
                isEditing ? 'ring-1 ring-amber-500/50 bg-slate-800' : 'hover:border-slate-600'
              }`}
            >
              {/* Baris Atas: Info Material & Harga */}
              <div className="flex items-center justify-between gap-2.5">
                {/* Nama Material & Kategori */}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-md inline-block">
                    {item.category}
                  </span>
                  <h4 className="font-bold text-white text-sm sm:text-base leading-snug mt-1 truncate">
                    {item.name}
                  </h4>
                </div>

                {/* Harga Beli Display (Jika tidak sedang edit) */}
                {!isEditing && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="text-right font-mono mr-1">
                      <div className="text-base sm:text-lg font-black text-emerald-400 leading-none tabular-nums">
                        Rp {Number(item.currentPrice).toLocaleString('id-ID')}
                      </div>
                      <span className="text-[11px] text-slate-400 font-sans block mt-0.5">
                        per kg
                      </span>
                    </div>

                    {/* Quick Stepper Toggle */}
                    <button
                      onClick={() => startEditPrice(item)}
                      className="px-2 py-1.5 bg-slate-750 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-xl border border-slate-700/70 active:scale-95 transition text-xs font-mono font-bold"
                      title="Ubah Cepat Tarif (Stepper)"
                    >
                      Rp±
                    </button>

                    {/* Full Edit Modal */}
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 bg-slate-750 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-xl border border-slate-700/70 active:scale-95 transition"
                      title="Edit Detail Material (Nama, Kategori, Harga, Warna)"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tampilan Inline Editor Cepat */}
              {isEditing && (
                <div className="pt-2.5 border-t border-slate-700/60 flex flex-col gap-2 animate-in fade-in duration-100">
                  <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                    <div className="relative flex-1 min-w-[120px] font-mono">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        value={editPriceInput}
                        onChange={(e) => setEditPriceInput(e.target.value)}
                        autoFocus
                        step="100"
                        className="w-full pl-9 pr-2 py-2 bg-slate-950 border border-amber-500/80 rounded-xl text-white text-sm font-bold focus:outline-none tabular-nums"
                      />
                    </div>

                    {/* Quick Stepper */}
                    <div className="flex items-center gap-1 font-mono">
                      <button
                        type="button"
                        onClick={() => adjustEditPrice(-500)}
                        className="px-2.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/40"
                        title="-Rp 500"
                      >
                        -500
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustEditPrice(500)}
                        className="px-2.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/40"
                        title="+Rp 500"
                      >
                        +500
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustEditPrice(1000)}
                        className="px-2.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/40"
                        title="+Rp 1.000"
                      >
                        +1rb
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => saveEditPrice(item.id)}
                        className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl active:scale-95 shadow-sm"
                        title="Simpan Tarif"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                      <button
                        onClick={() => setEditingItemId(null)}
                        className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl"
                        title="Batal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                    <span>Gunakan tombol stepper atau ketik langsung tarif baru</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus Material</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-850/80 rounded-xl border border-slate-700/50">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="font-bold text-sm text-slate-300">Material tidak ditemukan</p>
            <p className="text-xs text-slate-500 mt-0.5">Coba gunakan kata kunci pencarian yang lain</p>
          </div>
        )}
      </div>

      {/* Modal: Tambah Material Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Tambah Material Rongsok Baru
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nama Material / Barang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tembaga Bakar, Aki Kering"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Kategori *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Besi / Logam / Kardus"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Harga Beli/kg (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="100"
                    placeholder="Contoh: 15000"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-amber-500 tabular-nums transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Warna Indikator Kartu
                </label>
                <div className="flex gap-2.5 items-center flex-wrap">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setNewColorTag(preset.color)}
                      style={{ backgroundColor: preset.color }}
                      className={`w-7 h-7 rounded-xl border-2 transition ${
                        newColorTag === preset.color
                          ? 'border-white scale-110 shadow-md ring-2 ring-amber-400/40'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      title={preset.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/10 active:scale-95 transition"
                >
                  Simpan Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Material Lengkap */}
      {isEditModalOpen && itemBeingEdited && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Edit Material: {itemBeingEdited.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setItemBeingEdited(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFullEdit} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nama Material / Barang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Besi, Kr, TB, Siku A"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Kategori *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Besi / Tembaga / Alumunium"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Harga Beli/kg (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="100"
                    placeholder="Contoh: 15000"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm font-mono font-bold focus:outline-none focus:border-amber-500 tabular-nums transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Warna Indikator Kartu
                </label>
                <div className="flex gap-2.5 items-center flex-wrap">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setEditColorTag(preset.color)}
                      style={{ backgroundColor: preset.color }}
                      className={`w-7 h-7 rounded-xl border-2 transition ${
                        editColorTag === preset.color
                          ? 'border-white scale-110 shadow-md ring-2 ring-amber-400/40'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      title={preset.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteItem(itemBeingEdited)}
                  className="py-2.5 px-3 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-rose-500/40 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setItemBeingEdited(null);
                    }}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/10 active:scale-95 transition"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
