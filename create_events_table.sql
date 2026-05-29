-- ── Table events — SpotTLS ────────────────────────────────────────────
create table if not exists events (
  id           text primary key,
  spot_id      text,
  spot_name    text not null,
  quartier     text,
  title        text not null,
  description  text,
  category     text,
  date         date not null,
  time_start   text,
  time_end     text,
  price        text,
  price_detail text,
  tags         text[],
  link         text,
  photo_url    text,
  featured     boolean default false,
  created_at   timestamptz default now()
);

-- Lecture publique (anon key)
alter table events enable row level security;
create policy "Public read events" on events for select using (true);

-- ── Données initiales (events.json) ──────────────────────────────────
insert into events (id, spot_name, quartier, title, description, category, date, time_start, time_end, price, price_detail, tags, link, photo_url, featured) values
('evt_001','Le Rex','Capitole','Soirée Techno — Circuit Breaker','Quatre heures de sets techno brutaux avec les meilleurs DJs de la scène locale. Soundsystem d''enfer, light show immersif.','DJ Set','2026-06-06','23:00','06:00','€€','12€ / gratuit avant 23h30',array['techno','underground','dansant'],'https://ra.co',null,true),
('evt_002','Le Bikini','Saint-Cyprien','Concert — Jungle','Le duo britannique de funk et soul électronique s''arrête à Toulouse pour une soirée mémorable.','Concert','2026-06-07','20:00','23:00','€€€','28€ prévente',array['live','funk','soul'],'https://le-bikini.com',null,false),
('evt_003','Père Peinard','Wilson','Happy Hour du Vendredi','Cocktails à moitié prix de 18h à 21h. DJ en fond sonore, terrasse ouverte.','Happy Hour','2026-06-06','18:00','21:00','€','Cocktails 6€',array['terrasse','chill','afterwork'],null,null,false),
('evt_004','La Dynamo','Compans','Soirée Garage Rock','Three local bands bring the heat. Doors open at 8pm, show starts at 9pm.','Concert','2026-06-07','20:00','02:00','€','6€ sur place',array['rock','live','alternatif'],'https://ladynamo.fr',null,false),
('evt_005','Le Purple','Capitole','Purple Saturday Night','La nuit électro du Purple revient avec un lineup 100% femmes aux platines.','DJ Set','2026-06-07','23:30','06:00','€€','15€',array['electro','dansant','lgbtq'],'https://shotgun.live',null,true),
('evt_006','Café des Artistes','Carmes','Brunch Jazz du Dimanche','Jazz live en trio, brunch gourmand de 11h à 15h. Réservation conseillée.','Brunch','2026-06-08','11:00','15:00','€€','29€ brunch inclus',array['jazz','brunch','cosy'],null,null,false)
on conflict (id) do nothing;
