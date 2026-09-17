import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureDatabaseSeeded } from '../db';
import { User, AlertCircle, CreditCard, ChevronRight, ShoppingCart, ChevronUp, ArrowRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';

import ItemGrid from '../components/ItemGrid';
import NumpadModal from '../components/NumpadModal';
import CartList from '../components/CartList';
import CustomerModal from '../components/CustomerModal';
import DebtModal from '../components/DebtModal';
import ReceiptPrint from '../components/ReceiptPrint';

export default function Transaction() {
  useEffect(() => {
    ensureDatabaseSeeded();
  }, []);

  const items = useLiveQuery(() => db.items.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    if (!selectedCustomer && customers.length > 0) {
      const defaultCust = customers.find((c) => c.name.includes('Umum')) || customers[0];
      setSelectedCustomer(defaultCust);
    } else if (selectedCustomer) {
      const refreshed = customers.find((c) => c.id === selectedCustomer.id);
      if (refreshed) setSelectedCustomer(refreshed);
    }
  }, [customers, selectedCustomer]);

  const [cartItems, setCartItems] = useState([]);
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [activeItemForWeighing, setActiveItemForWeighing] = useState(null);
  const [editingCartIndex, setEditingCartIndex] = useState(null);
  const [editingCartData, setEditingCartData] = useState(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isMobileCartDrawerOpen, setIsMobileCartDrawerOpen] = useState(false);
  const [lastCompletedTransaction, setLastCompletedTransaction] = useState(null);

  const grossTotal = cartItems.reduce((acc, item) => acc + (item.subtotal || 0), 0);
  const totalKg = cartItems.reduce((acc, item) => acc + (item.netWeight || 0), 0);

  const handleSelectItem = (item) => {
    setActiveItemForWeighing(item);
    setEditingCartIndex(null);
    setEditingCartData(null);
    setIsNumpadOpen(true);
  };

  const handleEditCartItem = (cartItem, index) => {
    const matchedItem = items.find((i) => i.id === cartItem.itemId) || {
      id: cartItem.itemId,
      name: cartItem.name,
      category: cartItem.category,
      currentPrice: cartItem.pricePerKg
    };
    setActiveItemForWeighing(matchedItem);
    setEditingCartIndex(index);
    setEditingCartData(cartItem);
    setIsNumpadOpen(true);
  };

  const handleAddWeighedItem = (weighedData) => {
    if (editingCartIndex !== null) {
      setCartItems((prev) => {
        const updated = [...prev];
        updated[editingCartIndex] = weighedData;
        return updated;
      });
      setEditingCartIndex(null);
      setEditingCartData(null);
    } else {
      setCartItems((prev) => [...prev, weighedData]);
    }
  };

  const handleRemoveCartItem = (index) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    if (window.confirm('Kosongkan semua daftar timbangan aktif?')) {
      setCartItems([]);
    }
  };

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) {
      alert('Pilih dan timbang material terlebih dahulu!');
      return;
    }
    setIsDebtModalOpen(true);
  };

  const handleConfirmPayment = async ({
    grossTotal,
    debtDeduction,
    netPaid,
    remainingDebt
  }) => {
    try {
      const now = new Date();
      const invoiceNumber = `TRX-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Date.now()).slice(-4)}`;

      const transactionPayload = {
        invoiceNumber,
        date: now.toISOString(),
        customerId: selectedCustomer ? selectedCustomer.id : null,
        customerName: selectedCustomer ? selectedCustomer.name : 'Umum',
        items: cartItems,
        grossTotal,
        debtDeduction,
        netPaid,
        remainingDebt,
        syncStatus: 'draft'
      };

      await db.transaction('rw', [db.transactions, db.customers, db.debt_logs], async () => {
        const txId = await db.transactions.add(transactionPayload);
        transactionPayload.id = txId;

        if (selectedCustomer && selectedCustomer.id) {
          if (debtDeduction > 0) {
            await db.customers.update(selectedCustomer.id, {
              currentDebt: remainingDebt
            });

            await db.debt_logs.add({
              customerId: selectedCustomer.id,
              type: 'DEDUCT',
              amount: debtDeduction,
              date: now.toISOString(),
              invoiceId: txId,
              notes: `Potongan pembayaran nota ${invoiceNumber}`
            });
          }
        }
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {
        // Fallback
      }

      setLastCompletedTransaction(transactionPayload);
      setIsDebtModalOpen(false);
      setIsReceiptOpen(true);
      setCartItems([]);
    } catch (err) {
      console.error('Failed to process transaction:', err);
      alert('Terjadi kesalahan saat memproses transaksi.');
    }
  };

  const handleNewTransaction = () => {
    setIsReceiptOpen(false);
    setLastCompletedTransaction(null);
    setCartItems([]);
    const defaultCust = customers.find((c) => c.name.includes('Umum')) || customers[0];
    if (defaultCust) setSelectedCustomer(defaultCust);
  };

  const customerDebt = selectedCustomer?.currentDebt || 0;

  return (
    <div className="flex flex-col h-full space-y-3 pb-40 lg:pb-0">
      {/* Top Header: Customer Selector Bar */}
      <div className="flex items-center justify-between gap-2 p-3 bg-slate-800/90 border border-slate-700/70 rounded-xl shadow-sm">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 rounded-xl text-left transition active:scale-98 min-w-0 flex-1 sm:flex-initial"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-none">
                Pengepul:
              </span>
              <span className="text-sm font-bold text-white truncate block mt-0.5">
                {selectedCustomer?.name || 'Pilih Pengepul...'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 ml-0.5 flex-shrink-0" />
          </button>

          {/* Badge Kas Bon Kontras & Terang */}
          {customerDebt > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/15 border border-rose-500/40 rounded-xl flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <div>
                <span className="text-[9px] text-rose-300 uppercase font-bold block leading-none">
                  Kas Bon:
                </span>
                <span className="text-xs sm:text-sm font-bold font-mono text-rose-300 leading-tight block tabular-nums">
                  Rp {customerDebt.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ) : (
            <span className="hidden sm:inline-block px-3 py-1.5 bg-slate-900/60 rounded-xl text-xs font-mono text-emerald-400 font-semibold border border-slate-700/50">
              Bon: Rp 0
            </span>
          )}
        </div>

        {/* Quick Stats Pill (Desktop/Tablet) */}
        <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-300 flex-shrink-0">
          <div className="px-3 py-1.5 bg-slate-900/60 border border-slate-700/50 rounded-xl">
            <span className="text-slate-400">Item: </span>
            <span className="font-bold text-white tabular-nums">{cartItems.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-900/60 border border-slate-700/50 rounded-xl">
            <span className="text-slate-400">Tonase: </span>
            <span className="font-bold text-emerald-400 tabular-nums">{totalKg.toFixed(2)} kg</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Material Item Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 items-start">
        {/* Left Column (Material Grid) */}
        <div className="lg:col-span-7 xl:col-span-8 w-full">
          <ItemGrid items={items} transactions={transactions} onSelectItem={handleSelectItem} />
        </div>

        {/* Right Column: Permanent Cart & Pay for Tablet/Desktop */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col space-y-3">
          <CartList
            items={cartItems}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onEditItem={handleEditCartItem}
          />

          {/* Big Checkout / Pay Button (Tablet/Desktop) */}
          <button
            type="button"
            disabled={cartItems.length === 0}
            onClick={handleProceedToPayment}
            className={`w-full py-4 px-5 rounded-xl font-bold text-base sm:text-lg flex items-center justify-between border shadow-lg active:scale-[0.99] transition-all ${
              cartItems.length > 0
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-500 border-slate-700/60 cursor-not-allowed opacity-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 stroke-[2.4]" />
              <span>BAYAR SEKARANG</span>
            </div>
            <div className="text-right font-mono">
              <span className="text-xl sm:text-2xl font-black tabular-nums">
                Rp {grossTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Floating Sticky Cart & Pay Bar (Positioned cleanly above bottom nav) */}
      <div className="lg:hidden fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 bg-slate-900/98 backdrop-blur-md border-t border-slate-800 px-3 py-2 shadow-[0_-8px_20px_rgba(0,0,0,0.45)]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2.5">
          {/* Tapping left button opens Cart Drawer */}
          <button
            type="button"
            onClick={() => setIsMobileCartDrawerOpen(true)}
            className="flex items-center gap-2.5 flex-1 py-1.5 px-3 rounded-xl bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition active:scale-95 text-left min-w-0 shadow-sm"
          >
            <div className="relative w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
              <ShoppingCart className="w-4 h-4" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-slate-300 truncate">
                  {cartItems.length} Item ({totalKg.toFixed(1)} kg)
                </span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </div>
              <span className="text-sm font-bold font-mono text-amber-400 truncate block tabular-nums">
                Rp {grossTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </button>

          {/* Big Quick Pay Button on Mobile */}
          <button
            type="button"
            disabled={cartItems.length === 0}
            onClick={handleProceedToPayment}
            className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition flex-shrink-0 ${
              cartItems.length > 0
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-50 cursor-not-allowed'
            }`}
          >
            <span>BAYAR</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Mobile Cart Drawer */}
      {isMobileCartDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 p-0">
          <div className="w-full max-w-md bg-slate-900 border-t border-slate-750 rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-925 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">
                  Rincian Timbangan ({cartItems.length} Item)
                </h3>
              </div>
              <button
                onClick={() => setIsMobileCartDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-3 flex-1 overflow-y-auto">
              <CartList
                items={cartItems}
                onRemoveItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onEditItem={(item, idx) => {
                  setIsMobileCartDrawerOpen(false);
                  handleEditCartItem(item, idx);
                }}
              />
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3.5 bg-slate-925 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => setIsMobileCartDrawerOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold rounded-xl text-xs"
              >
                + Tambah Material
              </button>
              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={() => {
                  setIsMobileCartDrawerOpen(false);
                  handleProceedToPayment();
                }}
                className={`flex-1 py-3 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md ${
                  cartItems.length > 0
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                }`}
              >
                <span>BAYAR SEKARANG</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <NumpadModal
        item={activeItemForWeighing}
        isOpen={isNumpadOpen}
        initialData={editingCartData}
        onClose={() => {
          setIsNumpadOpen(false);
          setEditingCartIndex(null);
          setEditingCartData(null);
        }}
        onConfirm={handleAddWeighedItem}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={(cust) => setSelectedCustomer(cust)}
      />

      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        customer={selectedCustomer}
        grossTotal={grossTotal}
        onConfirmPayment={handleConfirmPayment}
      />

      <ReceiptPrint
        isOpen={isReceiptOpen}
        transaction={lastCompletedTransaction}
        customer={selectedCustomer}
        onNewTransaction={handleNewTransaction}
      />
    </div>
  );
}
