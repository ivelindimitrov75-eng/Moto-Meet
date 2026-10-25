create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

alter table public.todos enable row level security;
grant select on public.todos to anon, authenticated;

drop policy if exists "Anyone can view community updates" on public.todos;
create policy "Anyone can view community updates"
  on public.todos for select to anon, authenticated
  using (true);
