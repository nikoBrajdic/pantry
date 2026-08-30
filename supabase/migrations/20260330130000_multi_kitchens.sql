-- Multi-kitchen membership (many people per kitchen, many kitchens per user)

create table if not exists public.household_members (
  household_code text not null references public.households (code) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (household_code, user_id)
);

create index if not exists household_members_user_idx
  on public.household_members (user_id);

alter table public.household_members enable row level security;

create policy "Users read own memberships"
  on public.household_members for select to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own memberships"
  on public.household_members for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users delete own memberships"
  on public.household_members for delete to authenticated
  using (auth.uid() = user_id);

-- Members of a kitchen can see who else is in it
create policy "Members read kitchen roster"
  on public.household_members for select to authenticated
  using (
    exists (
      select 1
      from public.household_members mine
      where mine.user_id = auth.uid()
        and mine.household_code = household_members.household_code
    )
  );

-- Prefer membership table for kitchen writes
drop policy if exists "Members can update household" on public.households;

create policy "Members can update household"
  on public.households for update to authenticated
  using (
    exists (
      select 1
      from public.household_members
      where household_members.user_id = auth.uid()
        and household_members.household_code = households.code
    )
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.household_code = households.code
    )
  )
  with check (
    exists (
      select 1
      from public.household_members
      where household_members.user_id = auth.uid()
        and household_members.household_code = households.code
    )
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.household_code = households.code
    )
  );

-- Backfill memberships from existing active kitchen codes
insert into public.household_members (household_code, user_id)
select profiles.household_code, profiles.id
from public.profiles
where profiles.household_code <> ''
  and exists (
    select 1 from public.households where households.code = profiles.household_code
  )
on conflict do nothing;
