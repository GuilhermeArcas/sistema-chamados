import express from 'express';
import pg from 'pg';

const app = express();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

app.get('/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(500).json({ status: 'erro no banco' });
  }
});

app.listen(3000, () => console.log('API na porta 3000'));