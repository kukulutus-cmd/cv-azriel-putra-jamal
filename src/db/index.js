import Dexie from 'dexie';

export const db = new Dexie('LapakRongsokDB');

// Schema Definition
db.version(1).stores({
  items: '++id, name, category, currentPrice, colorTag',
  customers: '++id, name, phone, currentDebt, notes',
  transactions: '++id, invoiceNumber, date, customerId, customerName, grossTotal, debtDeduction, netPaid, syncStatus',
  debt_logs: '++id, customerId, type, amount, date, invoiceId, notes'
});

// Seed Data
const INITIAL_ITEMS = [
  { name: 'Tembaga Super', category: 'Tembaga', currentPrice: 115000, colorTag: '#b45309' },
  { name: 'Tembaga Biasa', category: 'Tembaga', currentPrice: 95000, colorTag: '#d97706' },
  { name: 'Kuningan', category: 'Kuningan', currentPrice: 65000, colorTag: '#eab308' },
  { name: 'Alumunium Kaleng', category: 'Alumunium', currentPrice: 18000, colorTag: '#0284c7' },
  { name: 'Alumunium Siku', category: 'Alumunium', currentPrice: 28000, colorTag: '#0ea5e9' },
  { name: 'Besi Tebal/Super', category: 'Besi', currentPrice: 5500, colorTag: '#475569' },
  { name: 'Besi Tipis/Biasa', category: 'Besi', currentPrice: 4200, colorTag: '#64748b' },
  { name: 'Kardus Bersih', category: 'Kardus', currentPrice: 1800, colorTag: '#854d0e' }
];

const INITIAL_CUSTOMERS = [
  { name: 'Umum / Non-Langganan', phone: '', currentDebt: 0, notes: 'Pelanggan lepas tanpa kas bon' },
  { name: 'Pak Kumis (Pemulung)', phone: '081234567890', currentDebt: 150000, notes: 'Langganan gerobak dorong' },
  { name: 'Cak Mat (Roda Tiga)', phone: '089876543210', currentDebt: 0, notes: 'Langganan motor roda tiga' }
];

// Inisialisasi Seed Data Otomatis saat Database Pertama Kali Digunakan
db.on('populate', async () => {
  await db.items.bulkAdd(INITIAL_ITEMS);
  await db.customers.bulkAdd(INITIAL_CUSTOMERS);
  
  // Catat log kas bon awal untuk Pak Kumis agar ada riwayat
  await db.debt_logs.add({
    customerId: 2,
    type: 'BORROW',
    amount: 150000,
    date: new Date(Date.now() - 86400000).toISOString(),
    invoiceId: null,
    notes: 'Pinjaman kas bon awal'
  });
});

// Helper untuk memastikan data terisi jika populate lewat
export async function ensureDatabaseSeeded() {
  const itemCount = await db.items.count();
  if (itemCount === 0) {
    await db.items.bulkAdd(INITIAL_ITEMS);
  }
  const customerCount = await db.customers.count();
  if (customerCount === 0) {
    await db.customers.bulkAdd(INITIAL_CUSTOMERS);
  }
}
