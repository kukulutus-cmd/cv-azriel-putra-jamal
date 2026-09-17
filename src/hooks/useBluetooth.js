import { useState, useCallback } from 'react';

/**
 * Hook untuk mencetak struk thermal 58mm via Web Bluetooth API (ESC/POS)
 * dengan graceful fallback ke browser dialog print.
 */
export function useBluetooth() {
  const [device, setDevice] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isBluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  // Sambungkan ke printer bluetooth 58mm (dengan auto-reconnect jika pernah di-pair)
  const connect = useCallback(async (forcePrompt = false) => {
    if (!isBluetoothSupported) {
      setError('Web Bluetooth tidak didukung pada browser ini. Gunakan browser Chrome/Edge di Android/PC atau gunakan Cetak Standar.');
      return null;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // 1. Coba sambungkan otomatis ke printer yang sudah pernah di-pair sebelumnya (tanpa popup)
      if (!forcePrompt && typeof navigator.bluetooth.getDevices === 'function') {
        try {
          const knownDevices = await navigator.bluetooth.getDevices();
          if (knownDevices && knownDevices.length > 0) {
            const remembered = knownDevices[0];
            setDevice(remembered);
            setIsConnecting(false);
            return remembered;
          }
        } catch (autoErr) {
          console.log('Auto-reconnect notice:', autoErr);
        }
      }

      // 2. Jika baru pertama kali, munculkan dialog pemilih Bluetooth perangkat
      const selectedDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent
          '0000ffe0-0000-1000-8000-00805f9b34fb'  // Common HM-10 / Thermal
        ]
      });

      setDevice(selectedDevice);
      setIsConnecting(false);
      return selectedDevice;
    } catch (err) {
      setIsConnecting(false);
      if (err.name !== 'NotFoundError') {
        setError(err.message || 'Gagal menyambungkan Bluetooth printer.');
      }
      return null;
    }
  }, [isBluetoothSupported]);

  // Format struk menjadi byte array ESC/POS
  const formatReceiptBytes = (transaction, lapakInfo = { name: 'CV. AZRIEL PUTRA JAMAL', address: 'Pulopipisan Karangjaya Pebayuran Bekasi', phone: '081511055679' }) => {
    const encoder = new TextEncoder();
    const parts = [];

    // Helper push command
    const pushCmd = (bytes) => parts.push(new Uint8Array(bytes));
    const pushText = (str) => parts.push(encoder.encode(str + '\n'));

    // 1. Initialize Printer
    pushCmd([0x1B, 0x40]);

    // 2. Header Centered & Bold
    pushCmd([0x1B, 0x61, 0x01]); // Align Center
    pushCmd([0x1D, 0x21, 0x11]); // Double Height + Width
    pushText(lapakInfo.name);
    pushCmd([0x1D, 0x21, 0x00]); // Normal size
    pushText(lapakInfo.address);
    pushText('Telp: ' + lapakInfo.phone);
    pushText('================================');

    // 3. Info Transaksi (Align Left)
    pushCmd([0x1B, 0x61, 0x00]); // Align Left
    pushText(`No Nota : ${transaction.invoiceNumber || 'INV-001'}`);
    pushText(`Tanggal : ${new Date(transaction.date || Date.now()).toLocaleString('id-ID')}`);
    pushText(`Pengepul: ${transaction.customerName || 'Umum'}`);
    pushText('--------------------------------');

    // 4. Item List (58mm width ~ 32 columns)
    if (transaction.items && transaction.items.length > 0) {
      transaction.items.forEach((item, idx) => {
        pushCmd([0x1B, 0x45, 0x01]); // Bold item name
        pushText(`${idx + 1}. ${item.name}`);
        pushCmd([0x1B, 0x45, 0x00]); // Normal
        
        const weightStr = `${item.netWeight || item.weight}kg x Rp ${(item.pricePerKg || 0).toLocaleString('id-ID')}`;
        const subtotalStr = `Rp ${(item.subtotal || 0).toLocaleString('id-ID')}`;
        
        // Pad spacing to 32 characters
        const spaceCount = Math.max(1, 32 - weightStr.length - subtotalStr.length);
        pushText(weightStr + ' '.repeat(spaceCount) + subtotalStr);
      });
    }
    pushText('--------------------------------');

    // 5. Totals
    const grossStr = `Rp ${(transaction.grossTotal || 0).toLocaleString('id-ID')}`;
    const grossLabel = 'Subtotal Kotor:';
    pushText(grossLabel + ' '.repeat(Math.max(1, 32 - grossLabel.length - grossStr.length)) + grossStr);

    if (transaction.debtDeduction > 0) {
      const potongStr = `-Rp ${transaction.debtDeduction.toLocaleString('id-ID')}`;
      const potongLabel = 'Potong Kas Bon:';
      pushText(potongLabel + ' '.repeat(Math.max(1, 32 - potongLabel.length - potongStr.length)) + potongStr);

      if (transaction.remainingDebt !== undefined) {
        const sisaStr = `Rp ${transaction.remainingDebt.toLocaleString('id-ID')}`;
        const sisaLabel = 'Sisa Kas Bon:';
        pushText(sisaLabel + ' '.repeat(Math.max(1, 32 - sisaLabel.length - sisaStr.length)) + sisaStr);
      }
    }

    pushText('================================');

    // 6. TOTAL CASH PAID (Big & Bold)
    pushCmd([0x1B, 0x45, 0x01]); // Bold
    pushCmd([0x1D, 0x21, 0x01]); // Double Height
    const totalPaidStr = `Rp ${(transaction.netPaid || 0).toLocaleString('id-ID')}`;
    const totalLabel = 'DIBAYARKAN:';
    pushText(totalLabel + ' ' + totalPaidStr);
    pushCmd([0x1D, 0x21, 0x00]); // Normal
    pushCmd([0x1B, 0x45, 0x00]); // Normal

    // 7. Footer
    pushCmd([0x1B, 0x61, 0x01]); // Center
    pushText('\nBarang yang sudah ditimbang');
    pushText('& dibayar tidak dapat ditarik kembali.');
    pushText('Terima Kasih Atas Kerjasamanya!');
    pushText('Aplikasi oleh K2C Komputindo\n');

    // 8. Feed & Cut
    pushCmd([0x1B, 0x64, 0x04]); // Feed 4 lines

    // Gabungkan array buffers
    const totalLen = parts.reduce((acc, curr) => acc + curr.length, 0);
    const combined = new Uint8Array(totalLen);
    let offset = 0;
    for (const part of parts) {
      combined.set(part, offset);
      offset += part.length;
    }

    return combined;
  };

  // Kirim data ke Bluetooth Printer
  const printViaBluetooth = useCallback(async (transaction, lapakInfo) => {
    let activeDevice = device;
    if (!activeDevice || !activeDevice.gatt.connected) {
      activeDevice = await connect();
    }
    if (!activeDevice) return false;

    try {
      const server = await activeDevice.gatt.connect();
      const services = await server.getPrimaryServices();
      let writeChar = null;

      for (const s of services) {
        const chars = await s.getCharacteristics();
        for (const c of chars) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            writeChar = c;
            break;
          }
        }
        if (writeChar) break;
      }

      if (!writeChar) {
        throw new Error('Karakteristik write printer tidak ditemukan.');
      }

      const data = formatReceiptBytes(transaction, lapakInfo);
      
      // Kirim dalam potongan chunks (maks 512 byte per transmit)
      const chunkSize = 100;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await writeChar.writeValue(chunk);
      }

      return true;
    } catch (err) {
      console.warn('Bluetooth print failed, fallback:', err);
      setError(err.message || 'Gagal mengirim data ke Bluetooth printer.');
      return false;
    }
  }, [device, connect]);

  return {
    isBluetoothSupported,
    device,
    isConnecting,
    error,
    connect,
    printViaBluetooth,
    formatReceiptBytes
  };
}
