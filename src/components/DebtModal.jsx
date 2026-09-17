import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, DollarSign, AlertTriangle, ArrowRight, Wallet } from 'lucide-react';

export default function DebtModal({
  isOpen,
  onClose,
  customer,
  grossTotal,
  onConfirmPayment
}) {
  const currentDebt = customer?.currentDebt || 0;
  const maxPossibleDeduction = Math.min(grossTotal || 0, currentDebt);

  const [isDeducting, setIsDeducting] = useState(false);
  const [deductionInput, setDeductionInput] = useState('0');

  useEffect(() => {
    if (isOpen) {
      if (currentDebt > 0) {
        setIsDeducting(true);
        setDeductionInput(maxPossibleDeduction.toString());
      } else {
        setIsDeducting(false);
        setDeductionInput('0');
      }
    }
  }, [isOpen, currentDebt, grossTotal, maxPossibleDeduction]);

  if (!isOpen) return null;

  const debtDeduction = isDeducting ? parseFloat(deductionInput) || 0 : 0;
  const netPaid = Math.max(0, grossTotal - debtDeduction);
  const remainingDebt = Math.max(0, currentDebt - debtDeduction);

  const handleSetPreset = (amount) => {
    setDeductionInput(Math.min(amount, maxPossibleDeduction).toString());
  };

  const handleConfirm = () => {
    if (debtDeduction > currentDebt) {
      alert('Potongan bon tidak boleh melebihi sisa hutang kas bon!');
      return;
    }
    if (debtDeduction > grossTotal) {
      alert('Potongan bon tidak boleh melebihi total belanja timbangan!');
      return;
    }

    onConfirmPayment({
      grossTotal,
      debtDeduction,
      netPaid,
      remainingDebt
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-none">
                Penyelesaian Pembayaran
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pengepul: <span className="font-bold text-white">{customer?.name || 'Umum'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 font-mono overflow-y-auto flex-1">
          {/* Info Belanja Kotor */}
          <div className="flex items-center justify-between p-3 bg-slate-800/90 border border-slate-700/60 rounded-xl">
            <span className="text-xs font-semibold text-slate-300 font-sans">
              Total Nilai Timbangan:
            </span>
            <span className="text-base sm:text-lg font-black text-white tabular-nums">
              Rp {grossTotal.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Section Kas Bon jika customer punya hutang */}
          {currentDebt > 0 ? (
            <div className="p-3.5 bg-slate-800/90 border border-rose-500/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-sans">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="font-bold text-xs text-rose-300">
                    Kas Bon Terdaftar:
                  </span>
                </div>
                <span className="font-black text-sm sm:text-base text-rose-300 tabular-nums">
                  Rp {currentDebt.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Toggle Potong Bon */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 font-sans">
                <span className="text-xs text-slate-200 font-medium">
                  Potong Dari Nota Ini?
                </span>
                <button
                  type="button"
                  onClick={() => setIsDeducting(!isDeducting)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDeducting ? 'bg-rose-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDeducting ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Input Nominal Potongan */}
              {isDeducting && (
                <div className="space-y-2 pt-1 font-sans">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSetPreset(maxPossibleDeduction)}
                      className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold font-mono"
                    >
                      Potong Lunas (Rp {maxPossibleDeduction.toLocaleString('id-ID')})
                    </button>
                    {maxPossibleDeduction >= 50000 && (
                      <button
                        type="button"
                        onClick={() => handleSetPreset(50000)}
                        className="px-2.5 py-1 bg-slate-750 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-bold"
                      >
                        50 rb
                      </button>
                    )}
                    {maxPossibleDeduction >= 100000 && (
                      <button
                        type="button"
                        onClick={() => handleSetPreset(100000)}
                        className="px-2.5 py-1 bg-slate-750 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-bold"
                      >
                        100 rb
                      </button>
                    )}
                  </div>

                  <div className="relative font-mono">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={deductionInput}
                      onChange={(e) => setDeductionInput(e.target.value)}
                      max={maxPossibleDeduction}
                      min={0}
                      className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-rose-500/70 rounded-xl text-white font-black text-base focus:outline-none tabular-nums"
                    />
                  </div>

                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Sisa Kas Bon Nanti:</span>
                    <span className="font-mono font-bold text-rose-300 tabular-nums">
                      Rp {remainingDebt.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center flex items-center justify-center gap-1.5 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pengepul bersih dari tanggungan kas bon</span>
            </div>
          )}

          {/* Total Uang Tunai Dikeluarkan (Digital LCD Look) */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-center shadow-inner">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 font-sans block leading-none">
              Uang Tunai Bersih Dibayarkan (Cash):
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1.5 tabular-nums">
              Rp {netPaid.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-[2] py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/15 active:scale-95 transition"
          >
            <Wallet className="w-4 h-4 stroke-[2.4]" />
            <span>SIMPAN & CETAK NOTA</span>
          </button>
        </div>
      </div>
    </div>
  );
}
