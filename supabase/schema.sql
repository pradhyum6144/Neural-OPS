
-- ── Neural OPS — Supabase Schema ──────────────────────────────────────────
-- Run this in Supabase → SQL Editor → New Query → Run

-- 1. token_usage
create table if not exists public.token_usage (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  command       text not null,
  total_tokens  integer not null default 0,
  agent_breakdown jsonb not null default '{}',
  run_id        text not null,
  created_at    timestamptz not null default now()
);

create index if not exists token_usage_user_id_idx on public.token_usage (user_id);
create index if not exists token_usage_created_at_idx on public.token_usage (created_at desc);

-- 2. alert_settings
create table if not exists public.alert_settings (
  user_id             text primary key,
  daily_limit         integer not null default 100000,
  per_run_limit       integer not null default 10000,
  spike_threshold     integer not null default 5000,
  email_enabled       boolean not null default false,
  email_address       text,
  discord_enabled     boolean not null default false,
  discord_webhook_url text,
  slack_enabled       boolean not null default false,
  slack_webhook_url   text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists alert_settings_updated_at on public.alert_settings;
create trigger alert_settings_updated_at
  before update on public.alert_settings
  for each row execute function public.set_updated_at();

-- 3. alert_logs
create table if not exists public.alert_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  alert_type  text not null check (alert_type in ('warning', 'critical', 'spike')),
  message     text not null,
  tokens_used integer not null default 0,
  limit_used  integer not null default 0,
  fired_at    timestamptz not null default now()
);

create index if not exists alert_logs_user_id_idx on public.alert_logs (user_id);
create index if not exists alert_logs_fired_at_idx on public.alert_logs (fired_at desc);

-- 4. user_connections (tool integrations)
create table if not exists public.user_connections (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  tool_name    text not null,
  tool_type    text not null,
  display_name text not null,
  access_token text,
  metadata     jsonb not null default '{}',
  connected_at timestamptz not null default now(),
  is_active    boolean not null default true,
  unique (user_id, tool_name)
);

create index if not exists user_connections_user_id_idx on public.user_connections (user_id);
alter table public.user_connections enable row level security;

-- 5. deployments
create table if not exists public.deployments (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  pipeline_config jsonb not null default '{}',
  deploy_type     text not null check (deploy_type in ('api', 'whatsapp')),
  endpoint_id     text unique,
  endpoint_url    text,
  api_key         text,
  whatsapp_number text,
  total_calls     integer not null default 0,
  created_at      timestamptz not null default now(),
  is_active       boolean not null default true
);

create index if not exists deployments_user_id_idx on public.deployments (user_id);
alter table public.deployments enable row level security;

-- Helper to atomically increment call count
create or replace function public.increment_deployment_calls(p_endpoint_id text)
returns void language plpgsql as $$
begin
  update public.deployments
  set total_calls = total_calls + 1
  where endpoint_id = p_endpoint_id;
end;
$$;

-- ── Smart Router cost columns (migration) ─────────────────────────────────
alter table public.token_usage
  add column if not exists cost_inr  numeric not null default 0,
  add column if not exists model_used text;

-- ── Row Level Security (optional but recommended) ─────────────────────────
alter table public.token_usage    enable row level security;
alter table public.alert_settings enable row level security;
alter table public.alert_logs     enable row level security;

-- Service role bypasses RLS automatically — no policies needed for server-side access.
-- Add user-level policies here if you add Supabase Auth later.
