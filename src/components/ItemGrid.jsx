import React, { useState } from 'react';
import { Package, Search, X } from 'lucide-react';

export default function ItemGrid({ items, onSelectItem }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Kategori unik
  const categories = ['ALL', ...new Set(items.map((i) => i.category || 'Lainnya'))];

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Category Pills & Quick Search */}
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
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white font-medium border border-slate-700/60'
              }`}
            >
              {cat === 'ALL' ? 'Semua Material' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Material Cards Grid: Solid, Elevated & High-Contrast */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 overflow-y-auto max-h-[calc(100vh-220px)] lg:max-h-[calc(100vh-250px)] pr-0.5">
        {filteredItems.map((item) => {
          const accentColor = item.colorTag || '#f59e0b';

          return (
            <button
              key={item.id}
              onClick={() => onSelectItem(item)}
              style={{ borderLeftColor: accentColor }}
              className="group relative flex flex-col justify-between p-3 sm:p-3.5 min-h-[82px] sm:min-h-[92px] bg-slate-800/90 hover:bg-slate-750 active:scale-[0.98] border border-slate-700/60 border-l-[4px] rounded-xl text-left transition-all duration-150 shadow-sm hover:shadow-md"
            >
              {/* Category Badge & Title */}
              <div className="w-full">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded-md inline-block leading-none">
                  {item.category}
                </span>
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
