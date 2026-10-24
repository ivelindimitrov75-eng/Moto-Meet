create table if not exists public.event_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null check (event_id in ('cafe', 'concert', 'tour')),
  rider_name text not null,
  email text not null,
  motorcycle_make text not null,
  motorcycle_model text not null,
  motorcycle_year integer,
  photo_path text,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

alter table public.event_bookings enable row level security;
grant select, insert, update, delete on public.event_bookings to authenticated;

drop policy if exists "Users can view their own event bookings" on public.event_bookings;
create policy "Users can view their own event bookings"
  on public.event_bookings for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own event bookings" on public.event_bookings;
create policy "Users can create their own event bookings"
  on public.event_bookings for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own event bookings" on public.event_bookings;
create policy "Users can update their own event bookings"
  on public.event_bookings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own event bookings" on public.event_bookings;
create policy "Users can delete their own event bookings"
  on public.event_bookings for delete to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('motorcycle-photos', 'motorcycle-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view their own motorcycle photos" on storage.objects;
create policy "Users can view their own motorcycle photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'motorcycle-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can upload their own motorcycle photos" on storage.objects;
create policy "Users can upload their own motorcycle photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'motorcycle-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can update their own motorcycle photos" on storage.objects;
create policy "Users can update their own motorcycle photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'motorcycle-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'motorcycle-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can delete their own motorcycle photos" on storage.objects;
create policy "Users can delete their own motorcycle photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'motorcycle-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
