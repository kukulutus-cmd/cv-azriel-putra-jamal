import React, { useState, useMemo } from 'react';
import { Package, Search, X, Flame, Sparkles } from 'lucide-react';

export default function ItemGrid({ items = [], transactions = [], onSelectItem }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Hitung frekuensi transaksi setiap jenis barang dari riwayat database
  const itemFrequency = useMemo(() => {
    const counts = {};
    (transactions || []).forEach((tx) => {
      (tx.items || []).forEach((it) => {
        if (it.itemId) counts[it.itemId] = (counts[it.itemId] || 0) + 1;
        if (it.name) counts[it.name] = (counts[it.name] || 0) + 1;
      });
    });
    return counts;
  }, [transactions]);

  // Prioritas default rongsok umum jika transaksi masih sedikit
  const DEFAULT_POPULAR = [
    'Besi Tipis/Biasa',
    'Besi Tebal/Super',
    'Kardus Bersih',
    'Alumunium Kaleng',
    'Tembaga Biasa'
  ];

  // 2. Dapatkan 5 barang paling sering ditimbang
  const topFrequentItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    const sorted = [...items].sort((a, b) => {
      const freqA = (a.id ? itemFrequency[a.id] : 0) || itemFrequency[a.name] || 0;
      const freqB = (b.id ? itemFrequency[b.id] : 0) || itemFrequency[b.name] || 0;
      if (freqB !== freqA) return freqB - freqA;

      const idxA = DEFAULT_POPULAR.indexOf(a.name);
      const idxB = DEFAULT_POPULAR.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    return sorted.slice(0, 5);
  }, [items, itemFrequency]);

  // Kategori unik
  const categories = [
    'ALL',
    'TOP5',
    ...new Set(items.map((i) => i.category || 'Lainnya'))
  ];

  // Filter & sortir items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      if (selectedCategory === 'TOP5') {
        return topFrequentItems.some((t) => t.id === item.id);
      }
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });

    // Urutkan item pada kategori ALL agar 5 barang terlaris selalu muncul paling atas
    if (selectedCategory === 'ALL' && !searchQuery) {
      result.sort((a, b) => {
        const freqA = (a.id ? itemFrequency[a.id] : 0) || itemFrequency[a.name] || 0;
        const freqB = (b.id ? itemFrequency[b.id] : 0) || itemFrequency[b.name] || 0;
        if (freqB !== freqA) return freqB - freqA;

        const idxA = DEFAULT_POPULAR.indexOf(a.name);
        const idxB = DEFAULT_POPULAR.indexOf(b.name);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }

    return result;
  }, [items, selectedCategory, searchQuery, topFrequentItems, itemFrequency]);

  return (
    <div className="flex flex-col h-full space-y-3 font-sans">
      {/* Search Bar & Category Pills */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari jenis barang rongsok..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {categories.map((cat) => {
            const isTop5Tab = cat === 'TOP5';
            const isActive = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white font-medium border border-slate-700/60'
                }`}
              >
                {isTop5Tab && <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                <span>
                  {cat === 'ALL'
                    ? 'Semua Material'
                    : cat === 'TOP5'
                    ? 'Paling Sering (Top 5)'
                    : cat}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5 BARANG PALING SERING DITIMBANG (TOP 5 QUICK-ACCESS ROW) */}
      {!searchQuery && selectedCategory === 'ALL' && topFrequentItems.length > 0 && (
        <div className="bg-slate-800/90 border border-slate-700/70 rounded-xl p-2.5 sm:p-3 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span>5 Paling Sering Ditimbang (Akses Cepat)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Ketuk untuk timbang</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {topFrequentItems.map((item, idx) => {
              const accentColor = item.colorTag || '#f59e0b';
              const freq = (item.id ? itemFrequency[item.id] : 0) || itemFrequency[item.name] || 0;

              return (
                <button
                  key={`top-${item.id}`}
                  type="button"
                  onClick={() => onSelectItem(item)}
                  style={{ borderLeftColor: accentColor }}
                  className="group relative flex flex-col justify-between p-2.5 bg-slate-900/90 hover:bg-slate-750 active:scale-[0.97] border border-slate-700/70 border-l-[3px] rounded-xl text-left transition-all duration-150 shadow-sm touch-manipulation cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      TOP #{idx + 1}
                    </span>
                    {freq > 0 ? (
                      <span className="text-[9px] text-emerald-400 font-mono font-bold">
                        {freq}x nota
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-sans">
                        Favorit
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors mt-1.5 line-clamp-1 leading-snug">
                    {item.name}
                  </h4>

                  <div className="mt-1.5 pt-1.5 border-t border-slate-800/90 flex items-baseline justify-between font-mono text-xs">
                    <span className="text-[10px] text-slate-400 font-sans">Beli:</span>
                    <div>
                      <span className="font-bold text-emerald-400 tabular-nums">
                        Rp {Number(item.currentPrice).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans ml-0.5">/kg</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Material Cards Grid: Solid, Elevated & High-Contrast */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 overflow-y-auto max-h-[calc(100vh-220px)] lg:max-h-[calc(100vh-250px)] pr-0.5">
        {filteredItems.map((item, idx) => {
          const accentColor = item.colorTag || '#f59e0b';
          const freq = (item.id ? itemFrequency[item.id] : 0) || itemFrequency[item.name] || 0;
          const isTop5 = topFrequentItems.some((t) => t.id === item.id);

          return (
            <button
              key={item.id}
              onClick={() => onSelectItem(item)}
              style={{ borderLeftColor: accentColor }}
              className="group relative flex flex-col justify-between p-3 sm:p-3.5 min-h-[82px] sm:min-h-[92px] bg-slate-800/90 hover:bg-slate-750 active:scale-[0.98] border border-slate-700/60 border-l-[4px] rounded-xl text-left transition-all duration-150 shadow-sm hover:shadow-md touch-manipulation cursor-pointer"
            >
              {/* Category Badge & Title */}
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded-md inline-block leading-none">
                    {item.category}
                  </span>
                  {isTop5 && selectedCategory === 'ALL' && (
                    <span className="text-[9px] text-amber-400 font-bold flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      <Flame className="w-2.5 h-2.5 fill-amber-400" />
                      <span>Sering</span>
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors mt-1.5 leading-snug line-clamp-1">
                  {item.name}
                </h3>
              </div>

              {/* Price Row: High-Contrast & Clear Readability */}
              <div className="mt-2.5 flex items-baseline justify-between border-t border-slate-700/50 pt-2 w-full font-mono">
                <span className="text-xs text-slate-300 font-sans font-medium">Beli:</span>
                <div className="text-right">
                  <span className="text-sm sm:text-base font-bold text-emerald-400 tabular-nums">
                    Rp {Number(item.currentPrice).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-sans ml-1">/kg</span>
                </div>
              </div>
            </button>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center justify-center bg-slate-800/40 rounded-xl border border-slate-700/50">
            <Package className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
            <p className="font-semibold text-sm text-slate-300">Material tidak ditemukan</p>
            <p className="text-xs text-slate-500 mt-0.5">Coba kata kunci pencarian yang lain</p>
          </div>
        )}
      </div>
    </div>
  );
}
