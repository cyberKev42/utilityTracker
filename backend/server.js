import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connect, getDb } from './db.js';
import authRoutes from './routes/auth.js';
import entriesRoutes from './routes/entries.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

await connect();

app.get('/api/health', async (req, res) => {
  const db = getDb();
  res.json({
    status: 'ok',
    database: db ? 'connected' : 'Not configured',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/entries', entriesRoutes);

app.listen(PORT, '0.0.0.0');
