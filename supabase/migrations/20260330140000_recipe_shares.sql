-- Short recipe share links (payload stored server-side)

create table if not exists public.recipe_shares (
  id text primary key,
  recipe jsonb not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists recipe_shares_created_at_idx
  on public.recipe_shares (created_at desc);

alter table public.recipe_shares enable row level security;

create policy "Authenticated can read recipe shares"
  on public.recipe_shares for select to authenticated
  using (true);

create policy "Authenticated can create recipe shares"
  on public.recipe_shares for insert to authenticated
  with check (true);
