
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enum types
create type subscription_status as enum ('Active', 'Suspended', 'Cancelled');
create type subscription_type as enum ('Trial', 'Monthly', 'Quarterly', 'Lifetime');

-- Add admin flag to auth.users
alter table auth.users add column if not exists is_admin boolean default false;

-- Create products table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price decimal(10,2) not null,
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default now()
);

-- Create clients table
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text,
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default now()
);

-- Create receipts table
create table public.receipts (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) not null,
  total_amount decimal(10,2) not null,
  tax_amount decimal(10,2) default 0,
  discount_amount decimal(10,2) default 0,
  advance_payment decimal(10,2) default 0,
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default now()
);

-- Create receipt items table
create table public.receipt_items (
  id uuid default gen_random_uuid() primary key,
  receipt_id uuid references public.receipts(id) not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null,
  price decimal(10,2) not null,
  total decimal(10,2) not null,
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default now()
);

-- Create subscriptions table
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  start_date timestamp with time zone default now(),
  end_date timestamp with time zone not null,
  subscription_type subscription_type default 'Trial',
  status subscription_status default 'Active',
  trial_used boolean default true,
  created_at timestamp with time zone default now()
);

-- Create subscription audit logs table
create table public.subscription_audit_logs (
  id uuid default gen_random_uuid() primary key,
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

-- Enable Row Level Security
alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.receipts enable row level security;
alter table public.receipt_items enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_audit_logs enable row level security;

-- RLS Policies for products
create policy "Users can create their own products"
on public.products for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view their own products"
on public.products for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can update their own products"
on public.products for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own products"
on public.products for delete
to authenticated
using (auth.uid() = user_id);

-- RLS Policies for clients
create policy "Users can create their own clients"
on public.clients for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view their own clients"
on public.clients for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can update their own clients"
on public.clients for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own clients"
on public.clients for delete
to authenticated
using (auth.uid() = user_id);

-- RLS Policies for receipts
create policy "Users can create their own receipts"
on public.receipts for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view their own receipts"
on public.receipts for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can update their own receipts"
on public.receipts for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own receipts"
on public.receipts for delete
to authenticated
using (auth.uid() = user_id);

-- RLS Policies for receipt items
create policy "Users can create their own receipt items"
on public.receipt_items for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view their own receipt items"
on public.receipt_items for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can update their own receipt items"
on public.receipt_items for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own receipt items"
on public.receipt_items for delete
to authenticated
using (auth.uid() = user_id);

-- Admin RLS policies for subscriptions
create policy "Admins can view all subscriptions"
on public.subscriptions for select
to authenticated
using (
  (select is_admin from auth.users where id = auth.uid())
  or auth.uid() = user_id
);

create policy "Admins can update all subscriptions"
on public.subscriptions for update
to authenticated
using (
  (select is_admin from auth.users where id = auth.uid())
);

-- Audit log policies
create policy "Admins can view audit logs"
on public.subscription_audit_logs for select
to authenticated
using (
  (select is_admin from auth.users where id = auth.uid())
);

create policy "System can create audit logs"
on public.subscription_audit_logs for insert
to authenticated
with check (
  (select is_admin from auth.users where id = auth.uid())
);
