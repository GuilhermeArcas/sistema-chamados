insert into categories (nome) values
  ('Hardware'),
  ('Software'),
  ('Rede'),
  ('Acesso e senha'),
  ('Outros')
on conflict (nome) do nothing;