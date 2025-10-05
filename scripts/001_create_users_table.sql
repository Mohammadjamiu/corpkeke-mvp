-- Create users table with role-based access
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  role text not null check (role in ('passenger', 'driver')),
  vehicle_info text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Users can view their own profile
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "users_insert_own"
  on public.users for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id);

-- Drivers can view passenger profiles when they have an accepted ride
create policy "drivers_view_passengers"
  on public.users for select
  using (
    role = 'passenger' and exists (
      select 1 from public.rides
      where rides.passenger_id = users.id
      and rides.driver_id = auth.uid()
      and rides.status = 'accepted'
    )
  );

-- Passengers can view driver profiles when driver accepted their ride
create policy "passengers_view_drivers"
  on public.users for select
  using (
    role = 'driver' and exists (
      select 1 from public.rides
      where rides.driver_id = users.id
      and rides.passenger_id = auth.uid()
      and rides.status = 'accepted'
    )
  );
