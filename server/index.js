require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const routes = require('./routes');
const setupSocket = require('./socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// General rate limiter for all API routes
const generalLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 120, // 120 requests per window per IP
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', generalLimiter, routes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/history', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM scan_history ORDER BY created_at DESC LIMIT 100').all();
    res.json(rows.map(r => ({ ...r, params: JSON.parse(r.params || '{}'), results: JSON.parse(r.results || '[]') })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/alerts', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 100').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alerts/:id/acknowledge', (req, res) => {
  try {
    db.prepare('UPDATE alerts SET acknowledged = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

setupSocket(io);

const PORT = process.env.PORT || 3001;

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

async function start() {
  await db.getDb();
  console.log('Database initialized');
  server.listen(PORT, () => {
    console.log(`Hop! server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
