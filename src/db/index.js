import Dexie from 'dexie';

export const db = new Dexie('LapakRongsokDB');

// Schema Definition
db.version(1).stores({
  items: '++id, name, category, currentPrice, colorTag',
  customers: '++id, name, phone, currentDebt, notes',
  transactions: '++id, invoiceNumber, date, customerId, customerName, grossTotal, debtDeduction, netPaid, syncStatus',
  debt_logs: '++id, customerId, type, amount, date, invoiceId, notes'
});

// Seed Data - 19 Material Standar Lapak
export const INITIAL_ITEMS = [
  { name: 'Besi', category: 'Besi', currentPrice: 5500, colorTag: '#64748b' },
  { name: 'Kr', category: 'Kardus/Kertas', currentPrice: 3800, colorTag: '#854d0e' },
  { name: 'KL', category: 'Kardus/Kertas', currentPrice: 3000, colorTag: '#a16207' },
  { name: 'TB', category: 'Tembaga', currentPrice: 210000, colorTag: '#b45309' },
  { name: 'Bc', category: 'Tembaga', currentPrice: 225000, colorTag: '#ea580c' },
  { name: 'Kn', category: 'Kuningan', currentPrice: 145000, colorTag: '#eab308' },
  { name: 'Dang"', category: 'Tembaga', currentPrice: 185000, colorTag: '#c2410c' },
  { name: 'Kng', category: 'Kuningan', currentPrice: 145000, colorTag: '#ca8a04' },
  { name: 'Rd kn', category: 'Kuningan', currentPrice: 120000, colorTag: '#d97706' },
  { name: 'Siku A', category: 'Alumunium', currentPrice: 50000, colorTag: '#0284c7' },
  { name: 'Siku B', category: 'Alumunium', currentPrice: 47000, colorTag: '#0369a1' },
  { name: 'Al tebel', category: 'Alumunium', currentPrice: 40000, colorTag: '#0ea5e9' },
  { name: 'Pc/plat', category: 'Alumunium', currentPrice: 40000, colorTag: '#38bdf8' },
  { name: 'RSK', category: 'Alumunium', currentPrice: 32000, colorTag: '#0284c7' },
  { name: 'Koali', category: 'Alumunium', currentPrice: 32000, colorTag: '#0ea5e9' },
  { name: 'Ac', category: 'Alumunium', currentPrice: 32000, colorTag: '#0284c7' },
  { name: 'Bbt', category: 'Babet', currentPrice: 30000, colorTag: '#475569' },
  { name: 'Aki', category: 'Aki', currentPrice: 17000, colorTag: '#10b981' },
  { name: 'Element', category: 'Lainnya', currentPrice: 20000, colorTag: '#8b5cf6' }
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

// Fungsi untuk sinkronisasi daftar material standar ke IndexedDB
export async function syncStandardItems(replaceOldSample = true) {
  const existingItems = await db.items.toArray();
  const oldSampleNames = [
    'tembaga super',
    'tembaga biasa',
    'kuningan',
    'alumunium kaleng',
    'alumunium siku',
    'besi tebal/super',
    'besi tipis/biasa',
    'kardus bersih'
  ];

  // 1. Hapus sample data lama jika diminta
  if (replaceOldSample) {
    for (const item of existingItems) {
      if (oldSampleNames.includes(item.name.trim().toLowerCase())) {
        await db.items.delete(item.id);
      }
    }
  }

  // 2. Upsert data standar
  const currentItems = await db.items.toArray();
  for (const std of INITIAL_ITEMS) {
    const found = currentItems.find(
      (i) => i.name.trim().toLowerCase() === std.name.trim().toLowerCase()
    );
    if (found) {
      await db.items.update(found.id, {
        currentPrice: std.currentPrice,
        category: std.category,
        colorTag: std.colorTag
      });
    } else {
      await db.items.add(std);
    }
  }
}

// Helper untuk memastikan data terisi & ter-update otomatis
export async function ensureDatabaseSeeded() {
  const itemCount = await db.items.count();
  const VERSION_KEY = 'LAPAK_ITEMS_CATALOG_V2';

  if (itemCount === 0) {
    await db.items.bulkAdd(INITIAL_ITEMS);
    localStorage.setItem(VERSION_KEY, 'synced');
  } else if (localStorage.getItem(VERSION_KEY) !== 'synced') {
    // Sinkronisasi otomatis ke data standar 19 item baru
    await syncStandardItems(true);
    localStorage.setItem(VERSION_KEY, 'synced');
  }

  const customerCount = await db.customers.count();
  if (customerCount === 0) {
    await db.customers.bulkAdd(INITIAL_CUSTOMERS);
  }
}
