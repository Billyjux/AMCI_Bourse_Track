const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'bourse.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/public')));

let db;

async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS bank_status (
    bank_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS period (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL
  )`);

  saveDB();
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function cleanExpired() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  db.run('DELETE FROM bank_status WHERE updated_at < ?', [cutoff]);
  saveDB();
}

// GET all statuses
app.get('/api/statuses', (req, res) => {
  cleanExpired();
  const rows = db.exec('SELECT bank_id, status, updated_at FROM bank_status');
  const result = {};
  if (rows.length > 0) {
    rows[0].values.forEach(([bank_id, status, updated_at]) => {
      result[bank_id] = { status, updatedAt: updated_at };
    });
  }
  res.json(result);
});

// POST update a bank status
app.post('/api/status', (req, res) => {
  const { bankId, status } = req.body;
  if (!bankId || !['green', 'red'].includes(status)) {
    return res.status(400).json({ error: 'Invalid bankId or status' });
  }

  const period = getPeriod();
  if (period) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const start = new Date(period.start_date);
    const end = new Date(period.end_date);
    if (now < start || now > end) {
      return res.status(403).json({ error: 'Outside bourse period' });
    }
  }

  db.run(
    'INSERT OR REPLACE INTO bank_status (bank_id, status, updated_at) VALUES (?, ?, ?)',
    [bankId, status, Date.now()]
  );
  saveDB();
  res.json({ success: true });
});

// GET period
app.get('/api/period', (req, res) => {
  const p = getPeriod();
  res.json(p || {});
});

// POST set period
app.post('/api/period', (req, res) => {
  const { startDate, endDate } = req.body;
  if (!startDate || !endDate) return res.status(400).json({ error: 'Missing dates' });
  db.run(
    'INSERT OR REPLACE INTO period (id, start_date, end_date) VALUES (1, ?, ?)',
    [startDate, endDate]
  );
  saveDB();
  res.json({ success: true });
});

// DELETE reset all statuses
app.delete('/api/statuses', (req, res) => {
  db.run('DELETE FROM bank_status');
  saveDB();
  res.json({ success: true });
});

function getPeriod() {
  const rows = db.exec('SELECT start_date, end_date FROM period WHERE id = 1');
  if (rows.length > 0 && rows[0].values.length > 0) {
    const [start_date, end_date] = rows[0].values[0];
    return { start_date, end_date };
  }
  return null;
}

// Admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public/admin.html'));
});

// Serve frontend for all other routes
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public/index.html'));
});

// Reset all statuses at midnight every day
function scheduleMidnightReset() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0); // next midnight
  const msUntilMidnight = midnight - now;
  setTimeout(() => {
    db.run('DELETE FROM bank_status');
    saveDB();
    console.log('✅ Midnight reset — all bank statuses cleared');
    scheduleMidnightReset(); // schedule next day
  }, msUntilMidnight);
  console.log('⏰ Next reset in ' + Math.round(msUntilMidnight/1000/60) + ' minutes');
}

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Bourse Tracker running on http://localhost:${PORT}`);
  });
});
