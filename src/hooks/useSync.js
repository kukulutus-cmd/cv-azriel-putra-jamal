import { useState, useEffect, useCallback } from 'react';
import { db } from '../db';
import { supabase, isSupabaseConfigured } from '../db/supabaseClient';

export function useSync() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Monitor status koneksi online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Hitung jumlah data yang belum tersinkron
  const checkUnsyncedData = useCallback(async () => {
    try {
      const pendingTx = await db.transactions
        .where('syncStatus')
        .anyOf(['draft', 'PENDING'])
        .count();
      setUnsyncedCount(pendingTx);
    } catch (err) {
      console.error('Error counting pending sync:', err);
    }
  }, []);

  useEffect(() => {
    checkUnsyncedData();
    const interval = setInterval(checkUnsyncedData, 10000);
    return () => clearInterval(interval);
  }, [checkUnsyncedData]);

  // Eksekusi Sinkronisasi Latar Belakang ke Supabase
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    if (!isSupabaseConfigured()) {
      // Jika Supabase belum dikonfigurasi, tandai lokal tetap aman
      checkUnsyncedData();
      return;
    }

    try {
      setIsSyncing(true);
      const pendingTxs = await db.transactions
        .where('syncStatus')
        .equals('PENDING')
        .limit(50)
        .toArray();

      if (pendingTxs.length > 0) {
        // Kirim transaksi ke Supabase
        const { error } = await supabase.from('pos_transactions').upsert(
          pendingTxs.map((tx) => ({
            id: tx.id,
            invoice_number: tx.invoiceNumber,
            date: tx.date,
            customer_id: tx.customerId,
            customer_name: tx.customerName,
            items: tx.items,
            gross_total: tx.grossTotal,
            debt_deduction: tx.debtDeduction,
            net_paid: tx.netPaid,
            synced_at: new Date().toISOString()
          }))
        );

        if (!error) {
          // Update status lokal di Dexie
          await db.transaction('rw', db.transactions, async () => {
            for (const tx of pendingTxs) {
              await db.transactions.update(tx.id, { syncStatus: 'SYNCED' });
            }
          });
        }
      }

      setLastSyncTime(new Date());
      await checkUnsyncedData();
    } catch (err) {
      console.warn('Background sync deferred (offline/error):', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, checkUnsyncedData]);

  return {
    isOnline,
    unsyncedCount,
    isSyncing,
    lastSyncTime,
    triggerSync,
    checkUnsyncedData
  };
}
