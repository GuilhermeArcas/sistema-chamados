import jwt from 'jsonwebtoken';

export function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization ?? '').split(' ');
  if (tipo !== 'Bearer' || !token) return res.status(401).json({ erro: 'Token ausente.' });
  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: Number(dados.sub), role: dados.role };
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

export const exigirRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.usuario.role) ? next() : res.status(403).json({ erro: 'Sem permissão.' });