import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connect, getDb, getDatabaseEnvKey, getDiagnostics } from './db.js';
import authRoutes from './routes/auth.js';
import entriesRoutes from './routes/entries.js';
import settingsRoutes from './routes/settings.js';
import breakdownRoutes from './routes/breakdownRoutes.js';
import userPreferencesRoutes from './routes/userPreferences.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  'http://localhost:5173',
  'http://localhost:5300',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server or Postman requests
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn('Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

await connect();

app.get('/api/health', async (req, res) => {
  const db = getDb();
  const { dbStatus, dbErrorCode, dbErrorHint } = getDiagnostics();
  res.json({
    status: 'ok',
    databaseStatus: db ? 'connected' : dbStatus,
    databaseEnv: getDatabaseEnvKey() || 'none',
    databaseErrorCode: dbErrorCode || undefined,
    databaseErrorHint: dbErrorHint || undefined,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/entries', breakdownRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/preferences', userPreferencesRoutes);

app.listen(PORT, '0.0.0.0');
