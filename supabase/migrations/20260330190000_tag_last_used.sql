-- Track when a tag was last assigned to a recipe (for suggestion ranking)

alter table public.tags
  add column if not exists last_used timestamptz;

create index if not exists tags_personal_last_used_idx
  on public.tags (owner_user_id, last_used desc nulls last)
  where owner_user_id is not null;

create index if not exists tags_household_last_used_idx
  on public.tags (household_code, last_used desc nulls last)
  where household_code is not null;

-- Backfill from linked recipes' updated_at
update public.tags t
set last_used = src.latest
from (
  select
    rt.tag_row_id,
    max(coalesce(r.updated_at, r.created_at)) as latest
  from public.recipe_tags rt
  join public.recipes r on r.row_id = rt.recipe_row_id
  group by rt.tag_row_id
) src
where t.row_id = src.tag_row_id
  and t.last_used is null;
