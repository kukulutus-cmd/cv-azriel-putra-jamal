import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Delete,
  ArrowRight,
  Scale,
  Plus,
  Trash2,
  Percent,
  DollarSign,
  Edit3
} from 'lucide-react';

export default function NumpadModal({
  item,
  isOpen,
  onClose,
  onConfirm,
  initialData = null
}) {
  // Input angka saat ini di numpad
  const [activeInput, setActiveInput] = useState('');
  
  // Mode input numpad: 'GROSS' (berat kotor) | 'MANUAL_TARE_KG' | 'MANUAL_TARE_PCT' | 'CASH_DISCOUNT'
  const [inputTarget, setInputTarget] = useState('GROSS');

  // Akumulasi banyak timbangan (misal timbang berkali-kali per karung)
  const [batches, setBatches] = useState([]);

  // Pengaturan Tara
  const [tare, setTare] = useState({ type: 'fixed', value: 0 }); // { type: 'fixed' | 'percent', value: number }

  // Potongan Langsung Rupiah (Uang Kotoran)
  const [cashDiscount, setCashDiscount] = useState(0);

  // Inisialisasi data jika mengedit dari keranjang
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        if (initialData.batches && initialData.batches.length > 0) {
          setBatches(initialData.batches);
          setActiveInput('');
        } else {
          setBatches([]);
          setActiveInput(initialData.grossWeight ? initialData.grossWeight.toString() : '');
        }
        setTare({
          type: initialData.tareDescription?.includes('%') ? 'percent' : 'fixed',
          value: initialData.tareValueRaw || initialData.tareWeight || 0
        });
        setCashDiscount(initialData.cashDiscount || 0);
      } else {
        setActiveInput('');
        setBatches([]);
        setTare({ type: 'fixed', value: 0 });
        setCashDiscount(0);
      }
      setInputTarget('GROSS');
    }
  }, [isOpen, initialData]);

// AudioContext singleton untuk menghindari freeze/lag audio di Android & iOS
let sharedAudioCtx = null;

const playClickSound = (freq = 400) => {
  try {
    // Haptic vibration instan di HP Android (<1ms)
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }

    if (typeof window === 'undefined') return;
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) return;

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtxClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }

    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.02;
    osc.connect(gain);
    gain.connect(sharedAudioCtx.destination);
    osc.start();
    osc.stop(sharedAudioCtx.currentTime + 0.025);
  } catch {
    // Silent fallback
  }
};

  // Numpad Key Press Handler
  const handleKeyClick = (key) => {
    playClickSound(520);

    if (key === 'C') {
      if (inputTarget === 'GROSS') {
        setActiveInput('');
      } else if (inputTarget === 'MANUAL_TARE_KG' || inputTarget === 'MANUAL_TARE_PCT') {
        setTare({ type: 'fixed', value: 0 });
        setActiveInput('');
        setInputTarget('GROSS');
      } else if (inputTarget === 'CASH_DISCOUNT') {
        setCashDiscount(0);
        setActiveInput('');
        setInputTarget('GROSS');
      }
      return;
    }

    if (key === 'BACKSPACE') {
      if (inputTarget === 'GROSS') {
        setActiveInput((prev) => prev.slice(0, -1));
      } else if (inputTarget === 'MANUAL_TARE_KG') {
        const next = tare.value.toString().slice(0, -1);
        setTare({ type: 'fixed', value: parseFloat(next) || 0 });
      } else if (inputTarget === 'MANUAL_TARE_PCT') {
        const next = tare.value.toString().slice(0, -1);
        setTare({ type: 'percent', value: parseFloat(next) || 0 });
      } else if (inputTarget === 'CASH_DISCOUNT') {
        const next = cashDiscount.toString().slice(0, -1);
        setCashDiscount(parseFloat(next) || 0);
      }
      return;
    }

    if (key === '.') {
      if (inputTarget === 'CASH_DISCOUNT') return; // Rupiah tidak pakai desimal
      if (inputTarget === 'GROSS') {
        if (!activeInput.includes('.')) {
          setActiveInput((prev) => (prev === '' ? '0.' : prev + '.'));
        }
      } else {
        const currStr = tare.value.toString();
        if (!currStr.includes('.')) {
          const next = currStr === '0' ? '0.' : currStr + '.';
          setTare((prev) => ({ ...prev, value: next }));
        }
      }
      return;
    }

    // Input Angka Digit
    if (inputTarget === 'GROSS') {
      if (activeInput === '0' && key === '0') return;
      if (activeInput === '0' && key !== '.') {
        setActiveInput(key);
        return;
      }
      setActiveInput((prev) => prev + key);
    } else if (inputTarget === 'MANUAL_TARE_KG') {
      const currStr = tare.value === 0 ? '' : tare.value.toString();
      const nextVal = parseFloat(currStr + key) || 0;
      setTare({ type: 'fixed', value: nextVal });
    } else if (inputTarget === 'MANUAL_TARE_PCT') {
      const currStr = tare.value === 0 ? '' : tare.value.toString();
      const nextVal = Math.min(100, parseFloat(currStr + key) || 0);
      setTare({ type: 'percent', value: nextVal });
    } else if (inputTarget === 'CASH_DISCOUNT') {
      const currStr = cashDiscount === 0 ? '' : cashDiscount.toString();
      const nextVal = parseFloat(currStr + key) || 0;
      setCashDiscount(nextVal);
    }
  };

  // Tambah timbangan ke daftar akumulasi (Multi-Timbang / Multi-Batch)
  const handleAddBatch = () => {
    const currentVal = parseFloat(activeInput);
    if (!currentVal || currentVal <= 0) {
      alert('Ketik angka timbangan terlebih dahulu sebelum menambah karung/batch!');
      return;
    }
    playClickSound(650);
    setBatches((prev) => [...prev, currentVal]);
    setActiveInput('');
    setInputTarget('GROSS');
  };

  // Hapus satu batch timbangan
  const handleRemoveBatch = (index) => {
    setBatches((prev) => prev.filter((_, i) => i !== index));
  };

  // Hitung Total Berat Kotor (Akumulasi batch + input yang sedang diketik)
  const batchesSum = batches.reduce((sum, b) => sum + b, 0);
  const currentGross = parseFloat(activeInput) || 0;
  const totalGrossWeight = parseFloat((batchesSum + currentGross).toFixed(2));

  // Hitung Nilai Tara dalam KG
  const tareAmountKg = useMemo(() => {
    if (tare.type === 'fixed') {
      return parseFloat(tare.value) || 0;
    } else if (tare.type === 'percent') {
      return parseFloat(((totalGrossWeight * (parseFloat(tare.value) || 0)) / 100).toFixed(2));
    }
    return 0;
  }, [totalGrossWeight, tare]);

  // Berat Netto Bersih
  const netWeight = Math.max(0, parseFloat((totalGrossWeight - tareAmountKg).toFixed(2)));

  // Subtotal Rupiah sebelum dan sesudah potongan uang
  const rawSubtotal = Math.round(netWeight * (item?.currentPrice || 0));
  const finalSubtotal = Math.max(0, rawSubtotal - cashDiscount);

  // Konfirmasi & Masukkan ke Keranjang
  const handleConfirm = () => {
    // Jika masih ada input aktif di layar, otomatis masukkan
    let finalBatches = [...batches];
    if (currentGross > 0) {
      finalBatches.push(currentGross);
    }

    if (netWeight <= 0) {
      alert('Masukkan berat timbangan yang valid!');
      return;
    }

    playClickSound(750);
    onConfirm({
      itemId: item.id,
      name: item.name,
      category: item.category,
      pricePerKg: item.currentPrice,
      grossWeight: totalGrossWeight,
      tareWeight: tareAmountKg,
      tareValueRaw: tare.value,
      tareDescription:
        tare.type === 'percent'
          ? `${tare.value}% (-${tareAmountKg.toFixed(2)}kg)`
          : tare.value > 0
          ? `${tare.value} kg`
          : 'Bersih',
      cashDiscount: cashDiscount,
      batches: finalBatches.length > 1 ? finalBatches : null,
      netWeight: netWeight,
      subtotal: finalSubtotal
    });

    setActiveInput('');
    setBatches([]);
    setTare({ type: 'fixed', value: 0 });
    setCashDiscount(0);
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-slate-700/80 sm:rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
        {/* 1. Header Dialog */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.colorTag || '#f59e0b' }}
            />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block leading-tight">
                {item.category}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight truncate">
                {item.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-400 uppercase block leading-none">
                Tarif Beli
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 tabular-nums">
                Rp {Number(item.currentPrice).toLocaleString('id-ID')} / kg
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="overflow-y-auto flex-1 p-3.5 space-y-2.5">
          {/* Main Digital Scale Display Box */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {batches.length > 0
                    ? `TOTAL KOTOR (${batches.length + (currentGross > 0 ? 1 : 0)}X TIMBANG)`
                    : 'BERAT KOTOR TIMBANGAN'}
                </span>
              </span>

              {/* Tombol Akumulasi Karung / Batch (+) */}
              <button
                type="button"
                onClick={handleAddBatch}
                className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold font-sans flex items-center gap-1 active:scale-95 transition"
                title="Tekan ini jika menimbang banyak karung/tumpukan secara bertahap"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Karung / Timbang Lagi</span>
              </button>
            </div>

            {/* Display Nilai Angka */}
            <div className="flex items-baseline justify-end gap-1.5 font-mono py-1">
              <span className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight tabular-nums">
                {inputTarget === 'GROSS'
                  ? totalGrossWeight > 0
                    ? totalGrossWeight
                    : '0'
                  : inputTarget === 'MANUAL_TARE_KG'
                  ? `${tare.value} kg`
                  : inputTarget === 'MANUAL_TARE_PCT'
                  ? `${tare.value} %`
                  : `Rp ${cashDiscount.toLocaleString('id-ID')}`}
              </span>
              <span className="text-sm font-bold text-slate-400 font-sans">
                {inputTarget === 'GROSS'
                  ? 'kg'
                  : inputTarget === 'CASH_DISCOUNT'
                  ? 'pot. tunai'
                  : inputTarget === 'MANUAL_TARE_PCT'
                  ? 'tara'
                  : 'tara'}
              </span>
            </div>

            {/* Rincian Karung/Batch Jika Ada */}
            {batches.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
                  <span className="text-[10px] text-slate-400 font-sans mr-1">Rincian:</span>
                  {batches.map((b, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700/60 flex-shrink-0"
                    >
                      <span>#{idx + 1}: {b}kg</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBatch(idx)}
                        className="text-slate-400 hover:text-rose-400"
                        title="Hapus baris ini"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {currentGross > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex-shrink-0">
                      <span>Ketik: {currentGross}kg</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3 Status Metrik: Tara, Netto, Subtotal */}
          <div className="grid grid-cols-3 gap-1.5 font-mono text-center">
            {/* Box Tara */}
            <div
              onClick={() => setInputTarget('MANUAL_TARE_KG')}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                inputTarget === 'MANUAL_TARE_KG' || inputTarget === 'MANUAL_TARE_PCT'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500/40'
                  : 'bg-slate-800/90 border-slate-700/60 hover:border-slate-600 text-slate-300'
              }`}
            >
              <span className="text-[10px] text-slate-400 block font-sans font-medium flex items-center justify-center gap-1">
                <span>Tara</span>
                <Edit3 className="w-2.5 h-2.5 opacity-60" />
              </span>
              <span className="text-xs sm:text-sm font-bold text-rose-400 tabular-nums">
                -{tareAmountKg.toFixed(2)} kg
              </span>
            </div>

            {/* Box Netto Bersih */}
            <div
              onClick={() => setInputTarget('GROSS')}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                inputTarget === 'GROSS'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800/90 border-slate-700/60'
              }`}
            >
              <span className="text-[10px] text-emerald-300 block font-sans font-medium">
                Netto Bersih
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 tabular-nums">
                {netWeight.toFixed(2)} kg
              </span>
            </div>

            {/* Box Subtotal Rupiah */}
            <div
              onClick={() => setInputTarget('CASH_DISCOUNT')}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                inputTarget === 'CASH_DISCOUNT'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                  : 'bg-slate-800/90 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <span className="text-[10px] text-slate-400 block font-sans font-medium flex items-center justify-center gap-1">
                <span>Subtotal</span>
                {cashDiscount > 0 && <span className="text-amber-400 text-[9px]">(Disc)</span>}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white tabular-nums">
                Rp {finalSubtotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* 3. Panel Opsi Potongan Tara & Potongan Uang */}
          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-2">
            {/* Quick Tara Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[11px] font-sans">
                <span className="font-bold text-slate-300">Potongan Tara (Wadah / Kotoran):</span>
                <span className="text-slate-400 font-mono text-[10px]">
                  {tare.type === 'percent' ? `${tare.value}%` : `${tare.value}kg`}
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1 font-mono text-xs">
                {[
                  { label: 'Bersih', type: 'fixed', val: 0 },
                  { label: '-0.5kg', type: 'fixed', val: 0.5 },
                  { label: '-1.0kg', type: 'fixed', val: 1.0 },
                  { label: '-2.0kg', type: 'fixed', val: 2.0 },
                  { label: '-1%', type: 'percent', val: 1 },
                  { label: '-2%', type: 'percent', val: 2 }
                ].map((btn) => {
                  const isSelected =
                    tare.type === btn.type && parseFloat(tare.value) === btn.val;
                  return (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => {
                        playClickSound(380);
                        setTare({ type: btn.type, value: btn.val });
                        setInputTarget('GROSS');
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                        isSelected
                          ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-700/60 hover:bg-slate-750 hover:text-white'
                      }`}
                    >
                      {btn.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tombol Input Manual: Tara Bebas (kg / %) & Potongan Uang (Rp) */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-700/50 font-sans text-xs">
              <button
                type="button"
                onClick={() => {
                  playClickSound(400);
                  setInputTarget('MANUAL_TARE_KG');
                  setTare((prev) => ({ type: 'fixed', value: prev.value || 0 }));
                }}
                className={`py-1.5 px-2 rounded-lg font-bold border transition flex items-center justify-center gap-1 ${
                  inputTarget === 'MANUAL_TARE_KG'
                    ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700/60'
                }`}
              >
                <span>Tara (kg) Manual</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound(400);
                  setInputTarget('MANUAL_TARE_PCT');
                  setTare((prev) => ({ type: 'percent', value: prev.value || 0 }));
                }}
                className={`py-1.5 px-2 rounded-lg font-bold border transition flex items-center justify-center gap-1 ${
                  inputTarget === 'MANUAL_TARE_PCT'
                    ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700/60'
                }`}
              >
                <Percent className="w-3 h-3" />
                <span>Tara (%) Manual</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound(400);
                  setInputTarget('CASH_DISCOUNT');
                }}
                className={`py-1.5 px-2 rounded-lg font-bold border transition flex items-center justify-center gap-1 ${
                  inputTarget === 'CASH_DISCOUNT'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700/60'
                }`}
              >
                <DollarSign className="w-3 h-3" />
                <span>Potong Rp</span>
              </button>
            </div>

            {/* Indikator Mode Aktif */}
            {inputTarget !== 'GROSS' && (
              <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
                <span>
                  Mengubah: <strong>
                    {inputTarget === 'MANUAL_TARE_KG'
                      ? 'Tara Manual (kg)'
                      : inputTarget === 'MANUAL_TARE_PCT'
                      ? 'Tara Manual (%)'
                      : 'Potongan Uang (Rp)'}
                  </strong> (Ketik di tombol angka bawah)
                </span>
                <button
                  type="button"
                  onClick={() => setInputTarget('GROSS')}
                  className="text-amber-400 hover:underline font-bold"
                >
                  Selesai
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4. Tactile Numpad Grid (Fast Response & Zero Touch Delay) */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 touch-manipulation select-none">
          <div className="grid grid-cols-3 gap-1.5 max-w-sm mx-auto touch-manipulation">
            {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'C'].map((k) => {
              const isClear = k === 'C';
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeyClick(k)}
                  className={`h-12 sm:h-13 rounded-xl text-xl sm:text-2xl font-mono font-bold transition-transform duration-75 active:scale-95 flex items-center justify-center touch-manipulation select-none cursor-pointer ${
                    isClear
                      ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60 active:bg-rose-900/70'
                      : 'bg-slate-800 active:bg-slate-700 text-white border border-slate-700/70 shadow-sm'
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>

          {/* Backspace & Confirm Row */}
          <div className="flex gap-2 mt-2 max-w-sm mx-auto touch-manipulation">
            <button
              type="button"
              onClick={() => handleKeyClick('BACKSPACE')}
              className="w-1/4 h-12 sm:h-13 rounded-xl bg-slate-800 active:bg-slate-700 text-slate-200 border border-slate-700/70 flex items-center justify-center active:scale-95 transition-transform duration-75 touch-manipulation select-none cursor-pointer"
              title="Hapus Digit Terakhir"
            >
              <Delete className="w-5 h-5 text-amber-400" />
            </button>

            <button
              type="button"
              disabled={netWeight <= 0}
              onClick={handleConfirm}
              className={`flex-1 h-12 sm:h-13 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 border transition-transform duration-75 active:scale-[0.98] touch-manipulation select-none ${
                netWeight > 0
                  ? 'bg-emerald-500 active:bg-emerald-600 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/15'
                  : 'bg-slate-800 text-slate-500 border-slate-700/60 cursor-not-allowed opacity-50'
              }`}
            >
              <span>{initialData ? 'SIMPAN TIMBANGAN' : 'MASUKKAN KERANJANG'}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
