grant select, update, delete on public.event_bookings to authenticated;

drop policy if exists "Admins can view all event bookings" on public.event_bookings;
create policy "Admins can view all event bookings"
  on public.event_bookings for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update all event bookings" on public.event_bookings;
create policy "Admins can update all event bookings"
  on public.event_bookings for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete all event bookings" on public.event_bookings;
create policy "Admins can delete all event bookings"
  on public.event_bookings for delete to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete motorcycle photos" on storage.objects;
create policy "Admins can delete motorcycle photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'motorcycle-photos'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
