
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
