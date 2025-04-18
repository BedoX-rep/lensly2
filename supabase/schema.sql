-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create subscription type enum
create type subscription_type as enum ('Trial', 'Monthly', 'Quarterly', 'Lifetime');
create type subscription_status as enum ('Active', 'Suspended', 'Cancelled');

-- Create base tables if they don't exist
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric not null,
  position integer default 0,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  start_date timestamp with time zone default now(),
  end_date timestamp with time zone not null,
  subscription_type subscription_type default 'Trial',
  status subscription_status default 'Active',
  trial_used boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists public.subscription_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  subscription_id uuid references public.subscriptions(id) not null,
  modified_by uuid references auth.users(id) not null,
  previous_status subscription_status,
  new_status subscription_status,
  previous_end_date timestamp with time zone,
  new_end_date timestamp with time zone,
  previous_type subscription_type,
  new_type subscription_type,
  action_timestamp timestamp with time zone default now(),
  notes text
);

-- Add admin flag to auth.users if it doesn't exist
alter table auth.users add column if not exists is_admin boolean default false;

-- Enable RLS
alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_audit_logs enable row level security;

-- Create RLS policies
create policy "Users can view their own data"
on public.products for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own data"
on public.products for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own data"
on public.products for update
to authenticated
using (auth.uid() = user_id);

-- Admin policies
create policy "Admins can view all subscriptions"
on public.subscriptions for select
to authenticated
using (
  (auth.uid() = user_id) or 
  (select is_admin from auth.users where id = auth.uid())
);

create policy "Admins can modify all subscriptions"
on public.subscriptions for update
to authenticated
using ((select is_admin from auth.users where id = auth.uid()));

create policy "Admins can view audit logs"
on public.subscription_audit_logs for select
to authenticated
using ((select is_admin from auth.users where id = auth.uid()));