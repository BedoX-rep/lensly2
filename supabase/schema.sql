
-- Create subscriptions table
create table public.subscriptions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    start_date timestamp with time zone default now(),
    end_date timestamp with time zone default (now() + interval '7 days'),
    is_active boolean default true,
    payment_status text default 'trial',
    created_at timestamp with time zone default now()
);

-- Add index for faster subscription lookups
create index idx_subscriptions_user_active on public.subscriptions(user_id, is_active);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Create policies
create policy "Users can view their own subscription"
on public.subscriptions for select
to authenticated
using (auth.uid() = user_id);

-- Function to automatically deactivate expired subscriptions
create or replace function check_subscription_expiry()
returns trigger as $$
begin
  if new.end_date < now() then
    new.is_active := false;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to check expiration on insert/update
create trigger check_subscription_expiry_trigger
before insert or update on public.subscriptions
for each row execute function check_subscription_expiry();


-- Enable RLS
alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.receipts enable row level security;
alter table public.receipt_items enable row level security;

-- Add user_id column to tables
alter table public.products add column user_id uuid references auth.users(id) default auth.uid();
alter table public.clients add column user_id uuid references auth.users(id) default auth.uid();
alter table public.receipts add column user_id uuid references auth.users(id) default auth.uid();
alter table public.receipt_items add column user_id uuid references auth.users(id) default auth.uid();

-- Create RLS policies
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

-- Client policies
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

-- Receipt policies
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

-- Receipt items policies
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
