const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'database', 'products.db');

// Create and seed the database automatically on the first run.
if (!fs.existsSync(dbPath)) require('./database/setup');
const db = new Database(dbPath, { fileMustExist: true });

app.use(express.json());

// Demo IPs are documentation-only TEST-NET addresses. They are simulated, not spoofed traffic.
const demoVisitors = {
  '203.0.113.10': 'India',
  '198.51.100.20': 'United States',
  '192.0.2.30': 'United Kingdom',
  '203.0.113.40': 'Germany',
  '198.51.100.50': 'Japan'
};

// Record incoming requests. Country is only known for the explicitly simulated demo IPs.
const geoCache = new Map();
function isPublicIp(ip) {
  if (!ip || ip === 'unknown' || ip === '::1' || ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) return false;
  // Documentation/test ranges are handled by the local demo map, not sent to a geo provider.
  if (/^(203\.0\.113\.|198\.51\.100\.|192\.0\.2\.)/.test(ip)) return false;
  return true;
}
async function lookupCountry(ip) {
  if (geoCache.has(ip)) return geoCache.get(ip);
  if (!isPublicIp(ip)) return 'Unknown';
  try {
    // Optional public IP geolocation lookup. The visitor IP is sent to ipapi.co.
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/country_name/`, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) return 'Unknown';
    const country = (await response.text()).trim();
    if (!country || country.toLowerCase().includes('error') || country.length > 80) return 'Unknown';
    geoCache.set(ip, country);
    return country;
  } catch (_error) {
    return 'Unknown';
  }
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api/admin')) return next();
  res.on('finish', () => {
    // Use the socket-derived address by default; only configure Express trust proxy behind a trusted proxy.
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const country = demoVisitors[ip] || 'Unknown';
    const result = db.prepare(`INSERT INTO request_logs (ip_address, country, method, path, status_code, source)
      VALUES (?, ?, ?, ?, ?, 'live')`).run(ip, country, req.method, req.path, res.statusCode);
    if (country === 'Unknown') {
      lookupCountry(ip).then(foundCountry => {
        if (foundCountry !== 'Unknown') db.prepare('UPDATE request_logs SET country = ? WHERE id = ?').run(foundCountry, result.lastInsertRowid);
      });
    }
  });
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// GET /api/products?q=watch&category=Accessories&minPrice=100&maxPrice=3000
app.get('/api/products', (req, res) => {
  const { q = '', category = '', minPrice, maxPrice } = req.query;
  const conditions = [];
  const params = {};

  if (typeof q !== 'string' || typeof category !== 'string') {
    return res.status(400).json({ error: 'Search and category must be text values.' });
  }
  if (q.trim()) {
    conditions.push('(name LIKE @search OR description LIKE @search)');
    params.search = `%${q.trim()}%`;
  }
  if (category.trim()) {
    conditions.push('category = @category');
    params.category = category.trim();
  }
  if (minPrice !== undefined && minPrice !== '') {
    const value = Number(minPrice);
    if (!Number.isFinite(value) || value < 0) return res.status(400).json({ error: 'minPrice must be a non-negative number.' });
    conditions.push('price >= @minPrice'); params.minPrice = value;
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    const value = Number(maxPrice);
    if (!Number.isFinite(value) || value < 0) return res.status(400).json({ error: 'maxPrice must be a non-negative number.' });
    conditions.push('price <= @maxPrice'); params.maxPrice = value;
  }
  if (params.minPrice !== undefined && params.maxPrice !== undefined && params.minPrice > params.maxPrice) {
    return res.status(400).json({ error: 'minPrice cannot be greater than maxPrice.' });
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const products = db.prepare(`SELECT * FROM products ${where} ORDER BY id DESC`).all(params);
  res.json({ count: products.length, products });
});

// GET /api/products/:id
app.get('/api/products/:id', (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Product ID must be a positive integer.' });
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
});

// GET /api/categories
app.get('/api/categories', (_req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all().map(row => row.category);
  res.json({ categories });
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Admin dashboard: recent request logs and summary statistics.
app.get('/api/admin/logs', (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  const logs = db.prepare('SELECT * FROM request_logs ORDER BY id DESC LIMIT ?').all(limit);
  const summary = db.prepare(`SELECT COUNT(*) AS total,
    COUNT(DISTINCT ip_address) AS unique_ips,
    COUNT(DISTINCT country) AS countries
    FROM request_logs`).get();
  const countries = db.prepare(`SELECT country, COUNT(*) AS requests FROM request_logs
    GROUP BY country ORDER BY requests DESC, country ASC`).all();
  res.json({ summary, countries, logs });
});

// Simulate a visit from one of the predefined documentation IPs.
app.post('/api/admin/simulate', (req, res) => {
  const { ip } = req.body || {};
  if (typeof ip !== 'string' || !Object.prototype.hasOwnProperty.call(demoVisitors, ip)) {
    return res.status(400).json({ error: 'Choose one of the available demo IP addresses.' });
  }
  const country = demoVisitors[ip];
  const result = db.prepare(`INSERT INTO request_logs
    (ip_address, country, method, path, status_code, source)
    VALUES (?, ?, 'GET', '/simulated-visit', 200, 'simulated')`).run(ip, country);
  res.status(201).json({ message: 'Simulated visit recorded.', log: db.prepare('SELECT * FROM request_logs WHERE id = ?').get(result.lastInsertRowid) });
});

app.delete('/api/admin/logs', (_req, res) => {
  db.prepare('DELETE FROM request_logs').run();
  res.json({ message: 'Request logs cleared.' });
});

app.listen(PORT, () => console.log(`ShopStack is running at http://localhost:${PORT}`));
