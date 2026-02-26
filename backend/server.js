import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connect, getDb, getDatabaseEnvKey } from './db.js';
import authRoutes from './routes/auth.js';
import entriesRoutes from './routes/entries.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'https://utility-tracker-gamma.vercel.app',
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

await connect();

app.get('/api/health', async (req, res) => {
  const db = getDb();
  res.json({
    status: 'ok',
    database: db ? 'connected' : 'Not configured',
    databaseEnv: getDatabaseEnvKey() || 'none',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/entries', entriesRoutes);

app.listen(PORT, '0.0.0.0');
