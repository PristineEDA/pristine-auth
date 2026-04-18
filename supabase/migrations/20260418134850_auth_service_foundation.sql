create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = timezone('utc', now());
	return new;
end;
$$;

create table if not exists public.user_profiles (
	user_id uuid primary key references auth.users(id) on delete cascade,
	email text not null,
	username text not null check (username ~ '^[A-Za-z0-9][A-Za-z0-9_-]{2,23}$'),
	username_normalized text generated always as (lower(username)) stored,
	avatar_path text,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists user_profiles_username_normalized_idx
	on public.user_profiles (username_normalized);

create table if not exists public.user_config_snapshots (
	user_id uuid primary key references auth.users(id) on delete cascade,
	settings jsonb not null default '{}'::jsonb,
	sync_version integer not null default 1,
	synced_at timestamptz not null default timezone('utc', now()),
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint user_config_snapshots_settings_is_object check (jsonb_typeof(settings) = 'object')
);

create index if not exists user_config_snapshots_synced_at_idx
	on public.user_config_snapshots (synced_at desc);

create table if not exists public.desktop_exchange_codes (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	code_hash text not null unique,
	encrypted_payload text not null,
	redirect_uri text not null,
	expires_at timestamptz not null,
	consumed_at timestamptz,
	created_at timestamptz not null default timezone('utc', now())
);

create index if not exists desktop_exchange_codes_user_id_idx
	on public.desktop_exchange_codes (user_id, created_at desc);

create index if not exists desktop_exchange_codes_expires_at_idx
	on public.desktop_exchange_codes (expires_at);

alter table public.user_profiles enable row level security;
alter table public.user_config_snapshots enable row level security;
alter table public.desktop_exchange_codes enable row level security;

drop policy if exists "users can read own profile" on public.user_profiles;
create policy "users can read own profile"
	on public.user_profiles
	for select
	to authenticated
	using (auth.uid() = user_id);

drop policy if exists "users can insert own profile" on public.user_profiles;
create policy "users can insert own profile"
	on public.user_profiles
	for insert
	to authenticated
	with check (auth.uid() = user_id);

drop policy if exists "users can update own profile" on public.user_profiles;
create policy "users can update own profile"
	on public.user_profiles
	for update
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

drop policy if exists "users can read own config snapshots" on public.user_config_snapshots;
create policy "users can read own config snapshots"
	on public.user_config_snapshots
	for select
	to authenticated
	using (auth.uid() = user_id);

drop policy if exists "users can insert own config snapshots" on public.user_config_snapshots;
create policy "users can insert own config snapshots"
	on public.user_config_snapshots
	for insert
	to authenticated
	with check (auth.uid() = user_id);

drop policy if exists "users can update own config snapshots" on public.user_config_snapshots;
create policy "users can update own config snapshots"
	on public.user_config_snapshots
	for update
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists user_config_snapshots_set_updated_at on public.user_config_snapshots;
create trigger user_config_snapshots_set_updated_at
before update on public.user_config_snapshots
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'avatars',
	'avatars',
	true,
	5242880,
	array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public can read avatars" on storage.objects;
create policy "public can read avatars"
	on storage.objects
	for select
	to anon, authenticated
	using (bucket_id = 'avatars');
