create table if not exists public.event_catalog (
  id text primary key check (id in ('cafe', 'concert', 'tour')),
  type text not null,
  title text not null,
  description text not null,
  image text not null,
  alt text not null
);

alter table public.event_catalog enable row level security;
grant select on public.event_catalog to anon, authenticated;

drop policy if exists "Anyone can view events" on public.event_catalog;
create policy "Anyone can view events"
  on public.event_catalog for select to anon, authenticated
  using (true);

insert into public.event_catalog (id, type, title, description, image, alt)
values
  ('cafe', 'CAFE MEETUP', 'Coffee & Chrome',
    'A relaxed meetup for good coffee and stories from the road.',
    '/images/event-cafe.jpg', 'Motorcycles inside a motorcycle cafe'),
  ('concert', 'LIVE CONCERT', 'Moto Night Live',
    'Meet up with riders for a night of live music and engines.',
    '/images/event-concert.jpg', 'A motorcycle at a live music concert'),
  ('tour', 'SCENIC TOUR', 'Open Road Escape',
    'Pack your riding gear for a scenic motorcycle tour and campout.',
    '/images/event-tour.webp',
    'A touring motorcycle parked beside a tent in the mountains')
on conflict (id) do update set
  type = excluded.type,
  title = excluded.title,
  description = excluded.description,
  image = excluded.image,
  alt = excluded.alt;
