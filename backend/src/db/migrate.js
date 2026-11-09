import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './pool.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

await pool.query(
  'create table if not exists schema_migrations (nome text primary key, aplicada_em timestamptz not null default now())'
);
const aplicadas = new Set((await pool.query('select nome from schema_migrations')).rows.map((r) => r.nome));

for (const arquivo of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  if (aplicadas.has(arquivo)) continue;
  await pool.query(fs.readFileSync(path.join(dir, arquivo), 'utf8'));
  await pool.query('insert into schema_migrations (nome) values ($1)', [arquivo]);
  console.log('Migration aplicada:', arquivo);
}

console.log('Banco atualizado.');
await pool.end();