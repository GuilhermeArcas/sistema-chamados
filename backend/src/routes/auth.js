import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { nome, email, senha } = req.body ?? {};
  if (!nome || !email || !senha || senha.length < 6) {
    return res.status(400).json({ erro: 'Informe nome, e-mail e senha (mínimo de 6 caracteres).' });
  }
  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      'insert into users (nome, email, senha_hash) values ($1, $2, $3) returning id, nome, email, role',
      [nome, email.toLowerCase(), senhaHash]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    console.error(e);
    res.status(500).json({ erro: 'Erro interno.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body ?? {};
  const { rows } = await pool.query('select * from users where email = $1', [(email ?? '').toLowerCase()]);
  const usuario = rows[0];
  if (!usuario || !(await bcrypt.compare(senha ?? '', usuario.senha_hash))) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }
  const token = jwt.sign({ sub: String(usuario.id), role: usuario.role }, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });
  res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
  });
});

export default router;