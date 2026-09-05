-- Per-user cooking history (what was cooked, and when)

create table if not exists public.cook_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  recipe_id text not null,
  recipe_title text not null,
  recipe_image_url text,
  household_code text not null default '',
  cooked_at timestamptz not null default now()
);

create index if not exists cook_logs_user_cooked_at_idx
  on public.cook_logs (user_id, cooked_at desc);

alter table public.cook_logs enable row level security;

create policy "Users read own cook logs"
  on public.cook_logs for select to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own cook logs"
  on public.cook_logs for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users delete own cook logs"
  on public.cook_logs for delete to authenticated
  using (auth.uid() = user_id);
