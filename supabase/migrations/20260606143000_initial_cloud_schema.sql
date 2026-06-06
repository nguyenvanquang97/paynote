create extension if not exists "pgcrypto";

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at_ms bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at_ms bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bank text not null,
  amount numeric(14, 2) not null,
  balance_after numeric(14, 2),
  description text,
  category text,
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  timestamp_ms bigint not null,
  raw_text text not null,
  is_suspected_gap boolean not null default false,
  created_at_ms bigint not null,
  dedupe_key text,
  unique (user_id, dedupe_key)
);

create index if not exists idx_transactions_user_timestamp
  on transactions (user_id, timestamp_ms desc);

create index if not exists idx_transactions_user_category
  on transactions (user_id, category);

create index if not exists idx_transactions_user_type
  on transactions (user_id, transaction_type);

create table if not exists custom_categories (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at_ms bigint not null,
  updated_at_ms bigint not null,
  primary key (user_id, id)
);

create table if not exists favorite_categories (
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id text not null,
  created_at_ms bigint not null,
  primary key (user_id, category_id)
);

create table if not exists category_budgets (
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id text not null,
  month_key text not null,
  budget_limit numeric(14, 2) not null,
  spent numeric(14, 2),
  updated_at_ms bigint not null,
  primary key (user_id, category_id, month_key)
);

create index if not exists idx_category_budgets_user_month
  on category_budgets (user_id, month_key);

create table if not exists monthly_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null,
  note text not null default '',
  updated_at_ms bigint not null,
  primary key (user_id, month_key)
);

create table if not exists budget_alert_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_key text not null,
  payload jsonb not null,
  triggered_at_ms bigint not null,
  primary key (user_id, alert_key)
);

create table if not exists in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at_ms bigint not null,
  is_read boolean not null default false
);

create index if not exists idx_in_app_notifications_user_created
  on in_app_notifications (user_id, created_at_ms desc);

create table if not exists ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  created_at_ms bigint not null
);

create index if not exists idx_ai_chat_messages_user_created
  on ai_chat_messages (user_id, created_at_ms desc);
