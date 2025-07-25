import fetch from 'node-fetch';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { serial } = req.query;
  if (!serial) {
    res.status(400).json({ ok: false, message: "No serial provided" });
    return;
  }

  // ✅ رابط Google Sheets CSV
  const csvUrl = 'https://docs.google.com/spreadsheets/d/1vIn-P2rD5IVNZ6HXjXHmJPBlRWxqktso9ucxdjMRyxM/export?format=csv';

  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      res.status(500).json({ ok: false, message: "Error fetching CSV" });
      return;
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    let found = false;
    let expired = false;

    for (const line of lines) {
      const [sheetSerial, expiryDate] = line.split(',');
      if (sheetSerial.trim() === serial.trim()) {
        found = true;

        const [day, month, year] = expiryDate.trim().split(/[-\/]/).map(Number);
        const expiry = new Date(year, month - 1, day);
        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (todayOnly > expiry) expired = true;
        break;
      }
    }

    if (!found) {
      res.status(200).json({ ok: false, message: "Serial Not Found" });
    } else if (expired) {
      res.status(200).json({ ok: false, message: "Serial Expired" });
    } else {
      res.status(200).json({ ok: true, message: "Serial OK" });
    }

  } catch (error) {
    res.status(500).json({ ok: false, message: "Server Error", error: error.message });
  }
}