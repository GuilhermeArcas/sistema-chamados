import express from 'express';
import pool from './db/pool.js';
import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import { autenticar, exigirRole } from './middlewares/auth.js';

const app = express();
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(500).json({ status: 'erro no banco' });
  }
});

app.use('/api/auth', authRoutes);
app.get('/api/me', autenticar, (req, res) => res.json(req.usuario));
app.get('/api/tecnico/teste', autenticar, exigirRole('tecnico', 'admin'), (_req, res) =>
  res.json({ ok: 'área do técnico' })
);

app.get('/api/categorias', autenticar, async (_req, res) => {
  const { rows } = await pool.query('select id, nome from categories order by nome');
  res.json(rows);
});
app.use('/api/tickets', ticketRoutes);

app.listen(3000, () => console.log('API na porta 3000'));