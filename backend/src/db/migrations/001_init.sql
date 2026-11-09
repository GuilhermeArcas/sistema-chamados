create table if not exists users (
  id serial primary key,
  nome text not null,
  email text not null unique,
  senha_hash text not null,
  role text not null default 'usuario' check (role in ('usuario', 'tecnico', 'admin')),
  criado_em timestamptz not null default now()
);

create table if not exists categories (
  id serial primary key,
  nome text not null unique
);

create table if not exists tickets (
  id serial primary key,
  titulo text not null,
  descricao text not null,
  status text not null default 'aberto' check (status in ('aberto', 'em_andamento', 'resolvido')),
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  category_id int references categories(id),
  author_id int not null references users(id),
  assignee_id int references users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_tickets_status on tickets(status);
create index if not exists idx_tickets_assignee on tickets(assignee_id);

create table if not exists comments (
  id serial primary key,
  ticket_id int not null references tickets(id) on delete cascade,
  author_id int not null references users(id),
  texto text not null,
  criado_em timestamptz not null default now()
);

create table if not exists status_history (
  id serial primary key,
  ticket_id int not null references tickets(id) on delete cascade,
  de text,
  para text not null,
  alterado_por int not null references users(id),
  alterado_em timestamptz not null default now()
);