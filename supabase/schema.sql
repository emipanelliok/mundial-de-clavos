-- Mundial de Clavos 2025 — Schema

-- Tournament configuration (singleton)
create table if not exists tournament_config (
  id int primary key default 1,
  phase text not null default 'eliminatorias',
  max_qualifiers int not null default 32,
  nominations_open boolean not null default true,
  constraint singleton check (id = 1)
);

insert into tournament_config (id, phase, max_qualifiers, nominations_open)
values (1, 'eliminatorias', 32, true)
on conflict (id) do nothing;

-- Reference/seed cars from the tweet
create table if not exists reference_cars (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- User nominations (one per twitter handle)
create table if not exists nominations (
  id uuid primary key default gen_random_uuid(),
  twitter_handle text not null,
  ip_address text,
  created_at timestamptz default now(),
  constraint unique_twitter unique(twitter_handle)
);

-- Individual car nominations (up to 5 per nomination)
create table if not exists nomination_cars (
  id uuid primary key default gen_random_uuid(),
  nomination_id uuid not null references nominations(id) on delete cascade,
  car_name text not null,
  reference_car_id uuid references reference_cars(id),
  created_at timestamptz default now()
);

-- Live ranking view
create or replace view car_nomination_counts as
select
  car_name,
  reference_car_id,
  count(*)::int as total_nominations
from nomination_cars
group by car_name, reference_car_id
order by total_nominations desc;

-- Tournament cars (qualifiers)
create table if not exists tournament_cars (
  id uuid primary key default gen_random_uuid(),
  car_name text not null,
  image_url text,
  total_nominations int default 0,
  seed int,
  group_letter text,
  group_position int,
  created_at timestamptz default now()
);

-- Matches
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  phase text not null,
  group_letter text,
  match_number int,
  car1_id uuid references tournament_cars(id),
  car2_id uuid references tournament_cars(id),
  car1_votes int default 0,
  car2_votes int default 0,
  winner_id uuid references tournament_cars(id),
  is_active boolean default false,
  closed_at timestamptz,
  created_at timestamptz default now()
);

-- Match votes
create table if not exists match_votes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id),
  voter_identifier text not null,
  voted_car_id uuid not null references tournament_cars(id),
  created_at timestamptz default now(),
  constraint unique_vote unique(match_id, voter_identifier)
);

-- RLS Policies
alter table tournament_config enable row level security;
alter table nominations enable row level security;
alter table nomination_cars enable row level security;
alter table tournament_cars enable row level security;
alter table matches enable row level security;
alter table match_votes enable row level security;
alter table reference_cars enable row level security;

-- Public read
create policy "public read tournament_config" on tournament_config for select using (true);
create policy "public read reference_cars" on reference_cars for select using (true);
create policy "public read tournament_cars" on tournament_cars for select using (true);
create policy "public read matches" on matches for select using (true);

-- Public insert nominations (controlled by unique constraint)
create policy "public insert nominations" on nominations for insert with check (true);
create policy "public insert nomination_cars" on nomination_cars for insert with check (true);
create policy "public insert match_votes" on match_votes for insert with check (true);

-- Public read for vote counts
create policy "public read match_votes" on match_votes for select using (true);
create policy "public read nomination_cars" on nomination_cars for select using (true);
create policy "public read nominations" on nominations for select using (true);
