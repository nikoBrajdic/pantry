  -- Add display names for shared kitchens

  alter table public.households
    add column if not exists name text not null default '';
