import React from 'react';
import { Printer, Share2, PlusCircle, CheckCircle, Bluetooth } from 'lucide-react';
import { useBluetooth } from '../hooks/useBluetooth';

export default function ReceiptPrint({
  isOpen,
  transaction,
  customer,
  onNewTransaction
}) {
  const { printViaBluetooth, isConnecting, isBluetoothSupported } = useBluetooth();

  if (!isOpen || !transaction) return null;

  const lapakInfo = {
    name: 'CV. AZRIEL PUTRA JAMAL',
    subTitle: 'Pengepul Besi Tua, Logam & Daur Ulang',
    address: 'Pulopipisan Karangjaya Pebayuran Bekasi',
    phone: '081511055679'
  };

  // 1. Action: Print via Browser (Standard Thermal 58mm CSS)
  const handleBrowserPrint = () => {
    window.print();
  };

  // 2. Action: Print via Web Bluetooth
  const handleBluetoothPrint = async () => {
    const success = await printViaBluetooth(transaction, lapakInfo);
    if (!success) {
      window.print();
    }
  };

  // 3. Action: Kirim Struk via WhatsApp
  const handleSendWhatsApp = () => {
    let text = `*${lapakInfo.name}*\n`;
    text += `${lapakInfo.subTitle}\n`;
    text += `${lapakInfo.address}\n`;
    text += `Telp/WA: ${lapakInfo.phone}\n`;
    text += `--------------------------------\n`;
    text += `No Nota: *${transaction.invoiceNumber}*\n`;
    text += `Tanggal: ${new Date(transaction.date).toLocaleString('id-ID')}\n`;
    text += `Pengepul: *${transaction.customerName}*\n`;
    text += `--------------------------------\n`;

    if (transaction.items && transaction.items.length > 0) {
      transaction.items.forEach((item, i) => {
        text += `${i + 1}. *${item.name}*`;
        if (item.batches && item.batches.length > 1) {
          text += ` (${item.batches.length}x timbang)`;
        }
        text += `\n`;
        text += `   ${item.netWeight} kg x Rp ${item.pricePerKg.toLocaleString('id-ID')}`;
        if (item.cashDiscount > 0) {
          text += ` (pot. Rp ${item.cashDiscount.toLocaleString('id-ID')})`;
        }
        text += ` = Rp ${item.subtotal.toLocaleString('id-ID')}\n`;
      });
    }

    text += `--------------------------------\n`;
    text += `Subtotal Kotor: Rp ${transaction.grossTotal.toLocaleString('id-ID')}\n`;

    if (transaction.debtDeduction > 0) {
      text += `Potong Kas Bon: -Rp ${transaction.debtDeduction.toLocaleString('id-ID')}\n`;
      if (transaction.remainingDebt !== undefined) {
        text += `Sisa Kas Bon: Rp ${transaction.remainingDebt.toLocaleString('id-ID')}\n`;
      }
    }

    text += `================================\n`;
    text += `*TOTAL DIBAYARKAN (CASH):*\n`;
    text += `*Rp ${transaction.netPaid.toLocaleString('id-ID')}*\n`;
    text += `================================\n`;
    text += `Terima Kasih Atas Kerjasamanya! 🙏\n`;
    text += `_Aplikasi dibuat oleh K2C Komputindo_`;

    const phoneTarget = customer?.phone
      ? customer.phone.replace(/[^0-9]/g, '').replace(/^0/, '62')
      : '';

    const url = phoneTarget
      ? `https://wa.me/${phoneTarget}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col my-auto animate-in fade-in duration-150 overflow-hidden">
        {/* Top Header Status */}
        <div className="px-4 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span className="font-bold text-xs sm:text-sm">Transaksi Berhasil Disimpan</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400">
            #{transaction.invoiceNumber?.slice(-6) || 'NOTA'}
          </span>
        </div>

        {/* Paper Receipt Preview (58mm thermal monochrome look) */}
        <div className="p-3.5 bg-slate-950 overflow-y-auto max-h-[55vh]">
          <div
            id="printable-receipt"
            className="w-full bg-white text-black p-4 rounded-xl font-mono text-[11px] leading-tight shadow-md border border-slate-300"
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-gray-400">
              <div className="flex justify-center mb-1.5">
                <img
                  src="/bosjamal.jpg"
                  alt="Logo CV. AZRIEL PUTRA JAMAL"
                  className="w-14 h-14 rounded-full object-contain mx-auto border border-gray-300"
                />
              </div>
              <h2 className="font-extrabold text-xs uppercase tracking-wider">{lapakInfo.name}</h2>
              <p className="text-[10px] text-gray-700 font-sans">{lapakInfo.subTitle}</p>
              <p className="text-[9px] text-gray-600 mt-0.5 leading-snug">{lapakInfo.address}</p>
              <p className="text-[9px] text-gray-600 font-bold">Telp: {lapakInfo.phone}</p>
            </div>

            {/* Info */}
            <div className="py-2 text-[10px] border-b border-dashed border-gray-400 space-y-0.5">
              <div className="flex justify-between">
                <span>Nota:</span>
                <span className="font-bold">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>
                  {new Date(transaction.date).toLocaleDateString('id-ID')} {new Date(transaction.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pengepul:</span>
                <span className="font-bold">{transaction.customerName || 'Umum'}</span>
              </div>
            </div>

            {/* Items */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-1.5">
              {transaction.items &&
                transaction.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div className="pr-1">
                      <span className="font-bold block">
                        {it.name}
                        {it.batches && it.batches.length > 1 && (
                          <span className="text-[9px] font-normal text-gray-600 ml-1">
                            ({it.batches.length}x timbang)
                          </span>
                        )}
                      </span>
                      <span className="text-gray-600 text-[10px]">
                        {it.netWeight || it.weight} kg × Rp {(it.pricePerKg || 0).toLocaleString('id-ID')}
                        {it.cashDiscount > 0 && ` (-Rp ${it.cashDiscount.toLocaleString('id-ID')})`}
                      </span>
                    </div>
                    <span className="font-bold pt-0.5 tabular-nums flex-shrink-0">
                      Rp {(it.subtotal || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
            </div>

            {/* Totals & Potong Bon */}
            <div className="py-2 text-[10px] border-b border-dashed border-gray-400 space-y-0.5">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal Kotor:</span>
                <span>Rp {(transaction.grossTotal || 0).toLocaleString('id-ID')}</span>
              </div>

              {transaction.debtDeduction > 0 && (
                <>
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>Potong Kas Bon:</span>
                    <span>-Rp {transaction.debtDeduction.toLocaleString('id-ID')}</span>
                  </div>
                  {transaction.remainingDebt !== undefined && (
                    <div className="flex justify-between text-gray-500 text-[9px]">
                      <span>Sisa Kas Bon:</span>
                      <span>Rp {transaction.remainingDebt.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Total Paid */}
            <div className="pt-2 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-700 block">
                TOTAL DIBAYARKAN (TUNAI):
              </span>
              <span className="text-lg font-black block mt-0.5 tracking-tight">
                Rp {(transaction.netPaid || 0).toLocaleString('id-ID')}
              </span>
            </div>

            {/* Footer note */}
            <div className="text-center pt-2 text-[9px] text-gray-500 font-sans border-t border-dashed border-gray-300 mt-2">
              Barang yang sudah ditimbang & dibayar tidak dapat ditarik kembali.
              <p className="font-bold mt-0.5">TERIMA KASIH</p>
              <p className="text-[8px] text-gray-400 mt-0.5 font-mono">Dibuat oleh K2C Komputindo</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Bluetooth Print */}
            {isBluetoothSupported && (
              <button
                type="button"
                onClick={handleBluetoothPrint}
                disabled={isConnecting}
                className="py-2.5 px-2 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700/70 active:scale-95 transition"
              >
                <Bluetooth className="w-3.5 h-3.5 text-sky-400" />
                <span>{isConnecting ? 'Koneksi...' : 'Thermal BT'}</span>
              </button>
            )}

            {/* Browser Print 58mm */}
            <button
              type="button"
              onClick={handleBrowserPrint}
              className={`${
                isBluetoothSupported ? 'col-span-1' : 'col-span-2'
              } py-2.5 px-2 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700/70 active:scale-95 transition`}
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Cetak Nota</span>
            </button>
          </div>

          {/* Share WhatsApp */}
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Kirim Nota via WhatsApp</span>
          </button>

          {/* New Transaction Button */}
          <button
            type="button"
            onClick={onNewTransaction}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/15 active:scale-95 transition mt-1"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.4]" />
            <span>TRANSAKSI BARU</span>
          </button>
        </div>
      </div>
    </div>
  );
}
