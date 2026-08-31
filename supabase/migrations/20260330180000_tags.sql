-- Scoped tag catalog + recipe links (tags also remain on recipe.data for app payloads)

create table if not exists public.tags (
  row_id uuid primary key default gen_random_uuid(),
  id text not null,
  label text not null,
  owner_user_id uuid references public.profiles (id) on delete cascade,
  household_code text references public.households (code) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_scope_chk check (
    (owner_user_id is not null and household_code is null)
    or (owner_user_id is null and household_code is not null)
  )
);

create unique index if not exists tags_personal_id_uniq
  on public.tags (owner_user_id, id)
  where owner_user_id is not null;

create unique index if not exists tags_household_id_uniq
  on public.tags (household_code, id)
  where household_code is not null;

create index if not exists tags_owner_idx on public.tags (owner_user_id);
create index if not exists tags_household_idx on public.tags (household_code);

create table if not exists public.recipe_tags (
  recipe_row_id uuid not null references public.recipes (row_id) on delete cascade,
  tag_row_id uuid not null references public.tags (row_id) on delete cascade,
  primary key (recipe_row_id, tag_row_id)
);

create index if not exists recipe_tags_tag_idx on public.recipe_tags (tag_row_id);

alter table public.tags enable row level security;
alter table public.recipe_tags enable row level security;

create policy "Users read own personal tags"
  on public.tags for select to authenticated
  using (owner_user_id = auth.uid());

create policy "Users insert own personal tags"
  on public.tags for insert to authenticated
  with check (owner_user_id = auth.uid());

create policy "Users update own personal tags"
  on public.tags for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "Users delete own personal tags"
  on public.tags for delete to authenticated
  using (owner_user_id = auth.uid());

create policy "Members read kitchen tags"
  on public.tags for select to authenticated
  using (
    household_code is not null
    and public.is_household_member(household_code)
  );

create policy "Members insert kitchen tags"
  on public.tags for insert to authenticated
  with check (
    household_code is not null
    and public.is_household_member(household_code)
  );

create policy "Members update kitchen tags"
  on public.tags for update to authenticated
  using (
    household_code is not null
    and public.is_household_member(household_code)
  )
  with check (
    household_code is not null
    and public.is_household_member(household_code)
  );

create policy "Members delete kitchen tags"
  on public.tags for delete to authenticated
  using (
    household_code is not null
    and public.is_household_member(household_code)
  );

-- recipe_tags: allow if user can see both sides (via recipe ownership / membership)
create policy "Users manage recipe_tags for accessible recipes"
  on public.recipe_tags for all to authenticated
  using (
    exists (
      select 1
      from public.recipes r
      where r.row_id = recipe_tags.recipe_row_id
        and (
          r.owner_user_id = auth.uid()
          or (
            r.household_code is not null
            and public.is_household_member(r.household_code)
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.recipes r
      where r.row_id = recipe_tags.recipe_row_id
        and (
          r.owner_user_id = auth.uid()
          or (
            r.household_code is not null
            and public.is_household_member(r.household_code)
          )
        )
    )
  );

-- Backfill tag catalog from recipe payloads
insert into public.tags (id, label, owner_user_id, household_code)
select distinct on (r.owner_user_id, r.household_code, slug)
  slug,
  label,
  r.owner_user_id,
  r.household_code
from public.recipes r
cross join lateral (
  select
    lower(trim(both '-' from regexp_replace(lower(trim(tag_text)), '[^a-z0-9]+', '-', 'g'))) as slug,
    trim(regexp_replace(trim(tag_text), '\s+', ' ', 'g')) as label
  from jsonb_array_elements_text(
    case
      when jsonb_typeof(r.data -> 'tags') = 'array' then r.data -> 'tags'
      else '[]'::jsonb
    end
  ) as tag_text
) parsed
where parsed.slug <> ''
order by r.owner_user_id, r.household_code, slug, r.updated_at desc
on conflict do nothing;

-- Backfill recipe_tags links
insert into public.recipe_tags (recipe_row_id, tag_row_id)
select r.row_id, t.row_id
from public.recipes r
cross join lateral jsonb_array_elements_text(
  case
    when jsonb_typeof(r.data -> 'tags') = 'array' then r.data -> 'tags'
    else '[]'::jsonb
  end
) as tag_text
join public.tags t
  on t.id = lower(trim(both '-' from regexp_replace(lower(trim(tag_text)), '[^a-z0-9]+', '-', 'g')))
 and (
   (r.owner_user_id is not null and t.owner_user_id = r.owner_user_id)
   or (r.household_code is not null and t.household_code = r.household_code)
 )
on conflict do nothing;
