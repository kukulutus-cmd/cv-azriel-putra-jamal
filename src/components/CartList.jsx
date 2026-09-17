import React from 'react';
import { Trash2, ShoppingCart, Scale, Pencil, Layers, DollarSign } from 'lucide-react';

export default function CartList({ items, onRemoveItem, onClearCart, onEditItem }) {
  const totalWeight = items.reduce((sum, item) => sum + (item.netWeight || 0), 0);
  const totalGross = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  return (
    <div className="flex flex-col h-full bg-slate-800/90 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
      {/* Header Cart */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-white text-xs sm:text-sm tracking-tight uppercase">
            Nota Timbangan ({items.length} Item)
          </h3>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-lg hover:bg-rose-950/30 transition"
          >
            Kosongkan
          </button>
        )}
      </div>

      {/* Items Scrollable List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 max-h-[380px] lg:max-h-[calc(100vh-340px)]">
        {items.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-center p-4">
            <Scale className="w-9 h-9 mb-2 opacity-30 text-slate-500" />
            <p className="font-bold text-xs text-slate-300">Keranjang timbangan masih kosong</p>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-[220px]">
              Pilih material di atas untuk mulai menimbang muatan
            </p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.itemId}-${index}`}
              className="flex items-center justify-between p-2.5 bg-slate-850/80 border border-slate-700/60 hover:border-slate-600 rounded-xl transition-all shadow-sm"
            >
              {/* Item Info - Click to Edit */}
              <div
                onClick={() => onEditItem && onEditItem(item, index)}
                className="flex-1 pr-2 cursor-pointer"
                title="Klik untuk ubah berat"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    #{index + 1}
                  </span>
                  <h5 className="font-bold text-white text-xs sm:text-sm leading-snug hover:text-amber-300 transition-colors">
                    {item.name}
                  </h5>
                  {item.batches && item.batches.length > 1 && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold inline-flex items-center gap-0.5">
                      <Layers className="w-2.5 h-2.5" />
                      <span>{item.batches.length}x timbang</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center flex-wrap gap-1.5 mt-0.5 text-[11px] font-mono text-slate-300">
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {item.netWeight} kg
                  </span>
                  <span className="text-slate-500">×</span>
                  <span className="tabular-nums">
                    Rp {Number(item.pricePerKg).toLocaleString('id-ID')}
                  </span>

                  {item.tareWeight > 0 && (
                    <span className="text-rose-400 text-[10px] tabular-nums">
                      (tara -{Number(item.tareWeight).toFixed(2)}kg)
                    </span>
                  )}

                  {item.cashDiscount > 0 && (
                    <span className="text-amber-400 text-[10px] tabular-nums bg-amber-500/10 px-1 rounded border border-amber-500/20">
                      pot. Rp {Number(item.cashDiscount).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </div>

              {/* Subtotal & Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <div className="text-right font-mono">
                  <span className="text-xs sm:text-sm font-bold text-white block tabular-nums">
                    Rp {Number(item.subtotal).toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Edit Button */}
                {onEditItem && (
                  <button
                    onClick={() => onEditItem(item, index)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-amber-400 rounded-lg border border-slate-700/60 transition active:scale-95"
                    title="Ubah berat timbangan"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Delete Button */}
                <button
                  onClick={() => onRemoveItem(index)}
                  className="p-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700/60 transition active:scale-95"
                  title="Hapus baris"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary Footer */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-700/60 space-y-1.5 font-sans">
        <div className="flex items-center justify-between font-mono text-xs text-slate-300">
          <span>Total Berat Netto:</span>
          <span className="font-bold text-white tabular-nums">
            {totalWeight.toFixed(2)} kg
          </span>
        </div>
        <div className="flex items-center justify-between font-mono border-t border-slate-800 pt-1.5">
          <span className="text-xs font-bold text-slate-300 uppercase">Subtotal Kotor:</span>
          <span className="text-base sm:text-lg font-black text-amber-400 tabular-nums">
            Rp {totalGross.toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  );
}
