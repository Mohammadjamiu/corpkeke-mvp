-- Create rides table
create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid not null references public.users(id) on delete cascade,
  driver_id uuid references public.users(id) on delete set null,
  pickup_location jsonb not null,
  dropoff_location jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'completed', 'cancelled')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.rides enable row level security;

-- Passengers can view their own rides
create policy "passengers_view_own_rides"
  on public.rides for select
  using (auth.uid() = passenger_id);

-- Passengers can create rides
create policy "passengers_create_rides"
  on public.rides for insert
  with check (auth.uid() = passenger_id);

-- Passengers can update their own pending rides (cancel)
create policy "passengers_update_own_rides"
  on public.rides for update
  using (auth.uid() = passenger_id and status = 'pending');

-- Drivers can view all pending rides
create policy "drivers_view_pending_rides"
  on public.rides for select
  using (
    status = 'pending' and exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'driver'
    )
  );

-- Drivers can view rides they've accepted
create policy "drivers_view_accepted_rides"
  on public.rides for select
  using (auth.uid() = driver_id);

-- Drivers can accept pending rides
create policy "drivers_accept_rides"
  on public.rides for update
  using (
    status = 'pending' and exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'driver'
    )
  )
  with check (
    status = 'accepted' and driver_id = auth.uid()
  );

-- Create index for faster queries
create index if not exists rides_status_idx on public.rides(status);
create index if not exists rides_passenger_id_idx on public.rides(passenger_id);
create index if not exists rides_driver_id_idx on public.rides(driver_id);
