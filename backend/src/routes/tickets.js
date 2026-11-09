import { Router } from 'express';
import pool from '../db/pool.js';
import { autenticar, exigirRole } from '../middlewares/auth.js';

const router = Router();
router.use(autenticar);

const STATUS = ['aberto', 'em_andamento', 'resolvido'];
const PRIORIDADES = ['baixa', 'media', 'alta'];
const ehTecnico = (u) => u.role === 'tecnico' || u.role === 'admin';

// Carrega o chamado e garante que o usuário pode vê-lo (senão responde 404).
async function carregarChamado(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ erro: 'ID inválido.' });
    return null;
  }
  const { rows } = await pool.query('select * from tickets where id = $1', [id]);
  const chamado = rows[0];
  if (!chamado || (!ehTecnico(req.usuario) && chamado.author_id !== req.usuario.id)) {
    res.status(404).json({ erro: 'Chamado não encontrado.' });
    return null;
  }
  return chamado;
}

// Criar chamado
router.post('/', async (req, res) => {
  const { titulo, descricao, prioridade = 'media', category_id = null } = req.body ?? {};
  if (!titulo?.trim() || !descricao?.trim() || !PRIORIDADES.includes(prioridade)) {
    return res.status(400).json({
      erro: 'Informe título, descrição e uma prioridade válida (baixa, media ou alta).',
    });
  }
  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query(
      `insert into tickets (titulo, descricao, prioridade, category_id, author_id)
       values ($1, $2, $3, $4, $5) returning *`,
      [titulo.trim(), descricao.trim(), prioridade, category_id, req.usuario.id]
    );
    await client.query(
      'insert into status_history (ticket_id, de, para, alterado_por) values ($1, null, $2, $3)',
      [rows[0].id, 'aberto', req.usuario.id]
    );
    await client.query('commit');
    res.status(201).json(rows[0]);
  } catch (e) {
    await client.query('rollback');
    if (e.code === '23503') return res.status(400).json({ erro: 'Categoria inválida.' });
    throw e;
  } finally {
    client.release();
  }
});

// Listar chamados (filtro opcional: ?status=aberto)
router.get('/', async (req, res) => {
  const { status } = req.query;
  if (status && !STATUS.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }
  const filtros = [];
  const valores = [];
  if (!ehTecnico(req.usuario)) {
    valores.push(req.usuario.id);
    filtros.push(`t.author_id = $${valores.length}`);
  }
  if (status) {
    valores.push(status);
    filtros.push(`t.status = $${valores.length}`);
  }
  const where = filtros.length ? `where ${filtros.join(' and ')}` : '';
  const { rows } = await pool.query(
    `select t.id, t.titulo, t.status, t.prioridade, t.criado_em, t.atualizado_em,
            u.nome as autor, c.nome as categoria, a.nome as responsavel
       from tickets t
       join users u on u.id = t.author_id
       left join categories c on c.id = t.category_id
       left join users a on a.id = t.assignee_id
       ${where}
      order by t.criado_em desc`,
    valores
  );
  res.json(rows);
});

// Detalhe do chamado, com comentários e histórico
router.get('/:id', async (req, res) => {
  const chamado = await carregarChamado(req, res);
  if (!chamado) return;
  const comentarios = await pool.query(
    `select c.id, c.texto, c.criado_em, u.nome as autor
       from comments c join users u on u.id = c.author_id
      where c.ticket_id = $1 order by c.criado_em`,
    [chamado.id]
  );
  const historico = await pool.query(
    `select h.de, h.para, h.alterado_em, u.nome as alterado_por
       from status_history h join users u on u.id = h.alterado_por
      where h.ticket_id = $1 order by h.alterado_em`,
    [chamado.id]
  );
  res.json({ ...chamado, comentarios: comentarios.rows, historico: historico.rows });
});

// Mudar status (só técnico e admin)
router.patch('/:id/status', exigirRole('tecnico', 'admin'), async (req, res) => {
  const { status } = req.body ?? {};
  if (!STATUS.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido. Use: aberto, em_andamento ou resolvido.' });
  }
  const chamado = await carregarChamado(req, res);
  if (!chamado) return;
  if (chamado.status === status) return res.json(chamado);

  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query(
      `update tickets
          set status = $1, assignee_id = coalesce(assignee_id, $2), atualizado_em = now()
        where id = $3 returning *`,
      [status, req.usuario.id, chamado.id]
    );
    await client.query(
      'insert into status_history (ticket_id, de, para, alterado_por) values ($1, $2, $3, $4)',
      [chamado.id, chamado.status, status, req.usuario.id]
    );
    await client.query('commit');
    res.json(rows[0]);
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
});

// Comentar
router.post('/:id/comentarios', async (req, res) => {
  const chamado = await carregarChamado(req, res);
  if (!chamado) return;
  const texto = req.body?.texto?.trim();
  if (!texto) return res.status(400).json({ erro: 'Informe o texto do comentário.' });
  const { rows } = await pool.query(
    'insert into comments (ticket_id, author_id, texto) values ($1, $2, $3) returning id, texto, criado_em',
    [chamado.id, req.usuario.id, texto]
  );
  await pool.query('update tickets set atualizado_em = now() where id = $1', [chamado.id]);
  res.status(201).json(rows[0]);
});

export default router;