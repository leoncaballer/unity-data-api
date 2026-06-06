import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.API_KEY || '';
const DATA_DIR = process.env.DATA_DIR || '/var/data';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const dataDir = path.resolve(DATA_DIR);
const dataFile = path.join(dataDir, 'sessions.jsonl');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '', 'utf8');

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key']
}));

app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/upload-session', (req, res) => {
  const sentKey = req.get('X-API-Key');
  if (sentKey !== API_KEY) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const body = req.body || {};
  if (!body.participantId || !body.sessionId || !body.condition) {
    return res.status(400).json({ ok: false, error: 'missing required fields' });
  }

  const record = {
    receivedAtUtc: new Date().toISOString(),
    ...body
  };

  fs.appendFileSync(dataFile, JSON.stringify(record) + '\n', 'utf8');
  res.status(201).json({ ok: true, message: 'session saved' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Saving data to ${dataFile}`);
});