-- Function to auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, phone, role, vehicle_info)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', 'User'),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', null),
    coalesce(new.raw_user_meta_data ->> 'role', 'passenger'),
    coalesce(new.raw_user_meta_data ->> 'vehicle_info', null)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger to call the function on user creation
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
