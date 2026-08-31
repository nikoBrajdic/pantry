-- Recipes as rows (personal or kitchen-scoped), migrated out of jsonb blobs.

create table if not exists public.recipes (
  row_id uuid primary key default gen_random_uuid(),
  id text not null,
  owner_user_id uuid references public.profiles (id) on delete cascade,
  household_code text references public.households (code) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipes_scope_chk check (
    (owner_user_id is not null and household_code is null)
    or (owner_user_id is null and household_code is not null)
  )
);

create unique index if not exists recipes_personal_id_uniq
  on public.recipes (owner_user_id, id)
  where owner_user_id is not null;

create unique index if not exists recipes_household_id_uniq
  on public.recipes (household_code, id)
  where household_code is not null;

create index if not exists recipes_owner_idx on public.recipes (owner_user_id);
create index if not exists recipes_household_idx on public.recipes (household_code);

alter table public.recipes enable row level security;

create policy "Users read own personal recipes"
  on public.recipes for select to authenticated
  using (owner_user_id = auth.uid());

create policy "Users insert own personal recipes"
  on public.recipes for insert to authenticated
  with check (owner_user_id = auth.uid());

create policy "Users update own personal recipes"
  on public.recipes for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "Users delete own personal recipes"
  on public.recipes for delete to authenticated
  using (owner_user_id = auth.uid());

create policy "Members read kitchen recipes"
  on public.recipes for select to authenticated
  using (
    household_code is not null
    and public.is_household_member(household_code)
  );

create policy "Members insert kitchen recipes"
  on public.recipes for insert to authenticated
  with check (
    household_code is not null
    and public.is_household_member(household_code)
  );

create policy "Members update kitchen recipes"
  on public.recipes for update to authenticated
  using (
    household_code is not null
    and public.is_household_member(household_code)
  )
  with check (
    household_code is not null
    and public.is_household_member(household_code)
  );

create policy "Members delete kitchen recipes"
  on public.recipes for delete to authenticated
  using (
    household_code is not null
    and public.is_household_member(household_code)
  );

-- Backfill personal shelves
insert into public.recipes (id, owner_user_id, household_code, data, created_at, updated_at)
select
  coalesce(nullif(elem->>'id', ''), gen_random_uuid()::text),
  p.id,
  null,
  elem,
  coalesce((elem->>'createdAt')::timestamptz, p.updated_at, now()),
  coalesce((elem->>'updatedAt')::timestamptz, p.updated_at, now())
from public.profiles p
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(p.recipes) = 'array' then p.recipes
    else '[]'::jsonb
  end
) as elem
on conflict do nothing;

-- Backfill kitchen shelves (skip ids already taken only within same kitchen via unique index)
insert into public.recipes (id, owner_user_id, household_code, data, created_at, updated_at)
select
  coalesce(nullif(elem->>'id', ''), gen_random_uuid()::text),
  null,
  h.code,
  elem,
  coalesce((elem->>'createdAt')::timestamptz, h.updated_at, now()),
  coalesce((elem->>'updatedAt')::timestamptz, h.updated_at, now())
from public.households h
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(h.recipes) = 'array' then h.recipes
    else '[]'::jsonb
  end
) as elem
on conflict do nothing;

-- Stop writing recipe blobs on profiles / households
alter table public.profiles drop column if exists recipes;
alter table public.households drop column if exists recipes;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
