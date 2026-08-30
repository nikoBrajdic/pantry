-- Fix infinite recursion in household_members RLS.
-- The "Members read kitchen roster" policy queried household_members from
-- within a policy on the same table, which Postgres rejects as recursive.

drop policy if exists "Members read kitchen roster" on public.household_members;

create or replace function public.is_household_member(code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members
    where user_id = auth.uid()
      and household_code = code
  );
$$;

revoke all on function public.is_household_member(text) from public;
grant execute on function public.is_household_member(text) to authenticated;

-- Safe roster read: helper bypasses RLS, so no recursion
create policy "Members read kitchen roster"
  on public.household_members for select to authenticated
  using (public.is_household_member(household_code));

-- Keep household update checks non-recursive too
drop policy if exists "Members can update household" on public.households;

create policy "Members can update household"
  on public.households for update to authenticated
  using (
    public.is_household_member(households.code)
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.household_code = households.code
    )
  )
  with check (
    public.is_household_member(households.code)
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.household_code = households.code
    )
  );
