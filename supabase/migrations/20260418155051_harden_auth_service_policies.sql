create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	new.updated_at = timezone('utc', now());
	return new;
end;
$$;

drop policy if exists "users can read own profile" on public.user_profiles;
create policy "users can read own profile"
	on public.user_profiles
	for select
	to authenticated
	using ((select auth.uid()) = user_id);

drop policy if exists "users can insert own profile" on public.user_profiles;
create policy "users can insert own profile"
	on public.user_profiles
	for insert
	to authenticated
	with check ((select auth.uid()) = user_id);

drop policy if exists "users can update own profile" on public.user_profiles;
create policy "users can update own profile"
	on public.user_profiles
	for update
	to authenticated
	using ((select auth.uid()) = user_id)
	with check ((select auth.uid()) = user_id);

drop policy if exists "users can read own config snapshots" on public.user_config_snapshots;
create policy "users can read own config snapshots"
	on public.user_config_snapshots
	for select
	to authenticated
	using ((select auth.uid()) = user_id);

drop policy if exists "users can insert own config snapshots" on public.user_config_snapshots;
create policy "users can insert own config snapshots"
	on public.user_config_snapshots
	for insert
	to authenticated
	with check ((select auth.uid()) = user_id);

drop policy if exists "users can update own config snapshots" on public.user_config_snapshots;
create policy "users can update own config snapshots"
	on public.user_config_snapshots
	for update
	to authenticated
	using ((select auth.uid()) = user_id)
	with check ((select auth.uid()) = user_id);

drop policy if exists "public can read avatars" on storage.objects;
