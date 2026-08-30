-- Pantry: profiles + shared households (recipes stored as jsonb)

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  household_code text not null default '',
  recipes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.households (
  code text primary key,
  recipes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index profiles_household_code_idx on public.profiles (household_code);

alter table public.profiles enable row level security;
alter table public.households enable row level security;

create policy "Users read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Authenticated can read households"
  on public.households for select to authenticated
  using (true);

create policy "Authenticated can create households"
  on public.households for insert to authenticated
  with check (true);

create policy "Members can update household"
  on public.households for update to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.household_code = households.code
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.household_code = households.code
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, recipes)
  values (new.id, coalesce(new.email, ''), '[]'::jsonb)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
