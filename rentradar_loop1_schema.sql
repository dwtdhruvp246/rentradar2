create extension if not exists pgcrypto;

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  currency text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  phone text,
  role text not null check (role in ('super_admin','admin_staff','landlord','staff','tenant','management_leader','management_staff')),
  staff_type text check (staff_type in ('landlord','freelancer','pmc_staff')),
  landlord_id uuid references public.profiles(id) on delete set null,
  country_id uuid references public.countries(id) on delete set null,
  management_company_id uuid,
  invite_id uuid,
  permissions jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','suspended','archived')),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.landlord_subscriptions (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  subscription_plan text not null default 'free',
  status text not null default 'active' check (status in ('active','trial','suspended')),
  expires_at timestamptz not null default '2099-12-31T23:59:59.000Z',
  property_limit integer not null default 1 check (property_limit >= 0),
  unit_limit integer not null default 1 check (unit_limit >= 0),
  personal_staff_limit integer not null default 0 check (personal_staff_limit >= 0),
  partner_connection_limit integer not null default 1 check (partner_connection_limit >= 0),
  notes text,
  country_id uuid references public.countries(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists landlord_subscriptions_one_current
on public.landlord_subscriptions(landlord_id);

create or replace function public.generate_invite_token(p_bytes integer default 32)
returns text
language sql
stable
as $$
  select encode(digest(clock_timestamp()::text || random()::text || gen_random_uuid()::text, 'sha256'), 'hex');
$$;

create table if not exists public.invite_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default public.generate_invite_token(),
  role text not null check (role in ('admin_staff','landlord','staff','tenant','management_leader','management_staff')),
  email text not null,
  full_name text,
  landlord_id uuid references public.profiles(id) on delete cascade,
  country_id uuid references public.countries(id) on delete set null,
  management_company_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '6 hours'),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  address text not null,
  city text not null,
  country_id uuid references public.countries(id) on delete set null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_number text not null,
  rent_amount numeric(12,2) not null default 0,
  status text not null default 'vacant' check (status in ('vacant','occupied','maintenance')),
  assigned_contact text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, unit_number)
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  email text not null,
  full_name text not null,
  phone text,
  property_id uuid references public.properties(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  status text not null default 'active' check (status in ('active','archived')),
  invite_accepted boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tenants_one_active_relationship
on public.tenants(landlord_id, lower(email))
where archived = false and status = 'active';

create table if not exists public.leases (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  unit_id uuid not null references public.units(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  tenant_name text,
  start_date date not null,
  end_date date not null,
  rent_amount numeric(12,2) not null,
  deposit_amount numeric(12,2) not null default 0,
  status text not null default 'active' check (status in ('active','terminated','expired')),
  agreement_path text,
  agreement_file_name text,
  notes text,
  archived boolean not null default false,
  terminated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  lease_id uuid references public.leases(id) on delete set null,
  purpose text not null default 'Rent' check (purpose in ('Rent','Advance Rent','Deposit','Other')),
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  paid_at date not null default current_date,
  status text not null default 'verified' check (status in ('submitted','verified','rejected')),
  notes text,
  proof_path text,
  proof_file_name text,
  receipt_number text unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  title text not null,
  description text not null,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  resolution_notes text,
  photo_path text,
  photo_file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_permissions (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  staff_profile_id uuid references public.profiles(id) on delete cascade,
  email text not null,
  staff_type text not null default 'landlord' check (staff_type in ('landlord','freelancer')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','archived')),
  permissions jsonb not null default '{}'::jsonb,
  property_ids uuid[] not null default '{}',
  unit_ids uuid[] not null default '{}',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique(landlord_id, email)
);

create table if not exists public.management_companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  leader_profile_id uuid references public.profiles(id) on delete set null,
  country_id uuid references public.countries(id) on delete set null,
  subscription_plan text not null default 'starter',
  status text not null default 'trial' check (status in ('active','trial','suspended')),
  expires_at timestamptz,
  landlord_limit integer not null default 1,
  staff_limit integer not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_management_company_fk'
  ) then
    alter table public.profiles
      add constraint profiles_management_company_fk
      foreign key (management_company_id) references public.management_companies(id) on delete set null
      not valid;
  end if;
end $$;

create table if not exists public.management_landlord_permissions (
  id uuid primary key default gen_random_uuid(),
  management_company_id uuid not null references public.management_companies(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected','archived')),
  permissions jsonb not null default '{}'::jsonb,
  property_ids uuid[] not null default '{}',
  unit_ids uuid[] not null default '{}',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique(management_company_id, landlord_id)
);

create table if not exists public.management_staff_permissions (
  id uuid primary key default gen_random_uuid(),
  management_company_id uuid not null references public.management_companies(id) on delete cascade,
  staff_profile_id uuid references public.profiles(id) on delete cascade,
  landlord_id uuid references public.profiles(id) on delete cascade,
  email text not null,
  status text not null default 'approved' check (status in ('pending','approved','archived')),
  permissions jsonb not null default '{}'::jsonb,
  property_ids uuid[] not null default '{}',
  unit_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  kind text,
  target_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  country text not null,
  country_id uuid references public.countries(id) on delete set null,
  account_type text not null,
  message text not null,
  source text not null default 'public_contact',
  status text not null default 'new' check (status in ('new','reviewed','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.platform_payments (
  id uuid primary key default gen_random_uuid(),
  payer_type text not null check (payer_type in ('landlord','staff','management')),
  landlord_id uuid references public.profiles(id) on delete set null,
  staff_profile_id uuid references public.profiles(id) on delete set null,
  management_company_id uuid references public.management_companies(id) on delete set null,
  country_id uuid references public.countries(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  paid_at date not null default current_date,
  period_start date,
  period_end date,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.current_profile()
returns public.profiles
language sql
security definer
set search_path = public
stable
as $$
  select p from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'super_admin' and status = 'active' and archived = false);
$$;

create or replace function public.is_admin_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin_staff' and status = 'active' and archived = false);
$$;

create or replace function public.current_landlord_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select case
    when p.role = 'landlord' then p.id
    when p.role = 'staff' then p.landlord_id
    else null
  end
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.check_public_signup_duplicate(p_email text, p_phone text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1
    from public.profiles
    where lower(email) = lower(p_email)
       or (p_phone is not null and phone = p_phone)
  );
$$;

create or replace function public.validate_invite_token(p_token text)
returns table (
  id uuid,
  role text,
  email text,
  full_name text,
  landlord_id uuid,
  country_id uuid,
  management_company_id uuid,
  metadata jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select i.id, i.role, i.email, i.full_name, i.landlord_id, i.country_id, i.management_company_id, i.metadata
  from public.invite_tokens i
  where i.token = p_token
    and i.used_at is null
    and i.expires_at > now()
  limit 1;
$$;

create or replace function public.search_tenant_by_email(p_email text)
returns public.profiles
language sql
security definer
set search_path = public
stable
as $$
  select p
  from public.profiles p
  where p.role = 'tenant'
    and lower(p.email) = lower(p_email)
    and p.archived = false
  limit 1;
$$;

create or replace function public.create_tenant_invite(p_landlord_id uuid, p_email text, p_full_name text, p_phone text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_invite_id uuid;
begin
  if auth.uid() is null then
    raise exception 'permission denied';
  end if;

  insert into public.tenants(landlord_id, email, full_name, phone)
  values (p_landlord_id, lower(p_email), p_full_name, p_phone)
  returning id into v_tenant_id;

  insert into public.invite_tokens(role, email, full_name, landlord_id, metadata, created_by)
  values ('tenant', lower(p_email), p_full_name, p_landlord_id, jsonb_build_object('tenant_id', v_tenant_id), auth.uid())
  returning id into v_invite_id;

  return v_invite_id;
end;
$$;

create or replace function public.accept_tenant_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  select (metadata ->> 'tenant_id')::uuid into v_tenant_id
  from public.invite_tokens
  where id = p_invite_id
    and role = 'tenant'
    and used_at is null
    and expires_at > now();

  if v_tenant_id is null then
    raise exception 'invite expired or used';
  end if;

  update public.tenants
  set profile_id = auth.uid(), invite_accepted = true, updated_at = now()
  where id = v_tenant_id;

  update public.invite_tokens
  set used_at = now()
  where id = p_invite_id;
end;
$$;

create or replace function public.search_landlord_by_email(p_email text)
returns table(id uuid, full_name text, email text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.full_name, p.email
  from public.profiles p
  where p.role = 'landlord'
    and lower(p.email) = lower(p_email)
    and p.archived = false
  limit 1;
$$;

create or replace function public.request_staff_landlord_access_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landlord_id uuid;
  v_request_id uuid;
begin
  select id into v_landlord_id from public.profiles where role = 'landlord' and lower(email) = lower(p_email) and archived = false limit 1;
  if v_landlord_id is null then
    raise exception 'landlord not found';
  end if;

  insert into public.staff_permissions(landlord_id, staff_profile_id, email, staff_type, status)
  values (v_landlord_id, auth.uid(), (select email from public.profiles where id = auth.uid()), 'freelancer', 'pending')
  on conflict (landlord_id, email) do update set status = 'pending'
  returning id into v_request_id;

  return v_request_id;
end;
$$;

create or replace function public.request_management_landlord_access_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landlord_id uuid;
  v_company_id uuid;
  v_request_id uuid;
begin
  select id into v_landlord_id from public.profiles where role = 'landlord' and lower(email) = lower(p_email) and archived = false limit 1;
  select id into v_company_id from public.management_companies where leader_profile_id = auth.uid() limit 1;
  if v_landlord_id is null or v_company_id is null then
    raise exception 'permission denied';
  end if;

  insert into public.management_landlord_permissions(management_company_id, landlord_id, status)
  values (v_company_id, v_landlord_id, 'pending')
  on conflict (management_company_id, landlord_id) do update set status = 'pending'
  returning id into v_request_id;

  return v_request_id;
end;
$$;

create or replace function public.landlord_can_add_property(p_landlord_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select count(pr.id) < coalesce(max(ls.property_limit), 0)
    from public.landlord_subscriptions ls
    left join public.properties pr on pr.landlord_id = ls.landlord_id and pr.archived = false
    where ls.landlord_id = p_landlord_id
    group by ls.landlord_id
  ), false);
$$;

create or replace function public.landlord_can_add_unit(p_landlord_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select count(u.id) < coalesce(max(ls.unit_limit), 0)
    from public.landlord_subscriptions ls
    left join public.units u on u.landlord_id = ls.landlord_id and u.archived = false
    where ls.landlord_id = p_landlord_id
    group by ls.landlord_id
  ), false);
$$;

create or replace function public.set_receipt_number()
returns trigger
language plpgsql
as $$
begin
  if new.receipt_number is null then
    new.receipt_number := 'MSH-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(new.id::text, '-', ''), 1, 8));
  end if;
  return new;
end;
$$;

drop trigger if exists payments_set_receipt_number on public.payments;
create trigger payments_set_receipt_number
before insert on public.payments
for each row execute function public.set_receipt_number();

create or replace function public.enforce_property_limit()
returns trigger
language plpgsql
as $$
begin
  if not public.landlord_can_add_property(new.landlord_id) then
    raise exception 'property limit reached';
  end if;
  return new;
end;
$$;

drop trigger if exists properties_enforce_subscription_limit on public.properties;
create trigger properties_enforce_subscription_limit
before insert on public.properties
for each row execute function public.enforce_property_limit();

create or replace function public.enforce_unit_limit()
returns trigger
language plpgsql
as $$
begin
  if not public.landlord_can_add_unit(new.landlord_id) then
    raise exception 'unit limit reached';
  end if;
  return new;
end;
$$;

drop trigger if exists units_enforce_subscription_limit on public.units;
create trigger units_enforce_subscription_limit
before insert on public.units
for each row execute function public.enforce_unit_limit();

alter table public.countries enable row level security;
alter table public.profiles enable row level security;
alter table public.landlord_subscriptions enable row level security;
alter table public.invite_tokens enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.tenants enable row level security;
alter table public.leases enable row level security;
alter table public.payments enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.staff_permissions enable row level security;
alter table public.management_companies enable row level security;
alter table public.management_landlord_permissions enable row level security;
alter table public.management_staff_permissions enable row level security;
alter table public.notifications enable row level security;
alter table public.enquiries enable row level security;
alter table public.platform_payments enable row level security;

create policy "countries read authenticated" on public.countries for select to authenticated using (true);
create policy "profiles read self admin scoped" on public.profiles for select to authenticated using (id = auth.uid() or public.is_super_admin() or public.is_admin_staff());
create policy "profiles insert self" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update self" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "landlord subscriptions owner staff admin read" on public.landlord_subscriptions for select to authenticated using (
  landlord_id = auth.uid()
  or landlord_id = public.current_landlord_id()
  or public.is_super_admin()
  or public.is_admin_staff()
);
create policy "landlord subscriptions landlord insert own" on public.landlord_subscriptions for insert to authenticated with check (landlord_id = auth.uid());
create policy "landlord subscriptions admin update" on public.landlord_subscriptions for update to authenticated using (public.is_super_admin() or public.is_admin_staff());

create policy "invite validate via rpc only" on public.invite_tokens for select to authenticated using (public.is_super_admin() or public.is_admin_staff() or created_by = auth.uid() or landlord_id = public.current_landlord_id());
create policy "invite create scoped" on public.invite_tokens for insert to authenticated with check (public.is_super_admin() or public.is_admin_staff() or landlord_id = public.current_landlord_id() or created_by = auth.uid());
create policy "invite update creator scoped" on public.invite_tokens for update to authenticated using (public.is_super_admin() or public.is_admin_staff() or created_by = auth.uid() or landlord_id = public.current_landlord_id());

create policy "properties scoped read" on public.properties for select to authenticated using (landlord_id = public.current_landlord_id() or public.is_super_admin() or public.is_admin_staff());
create policy "properties landlord insert" on public.properties for insert to authenticated with check (landlord_id = auth.uid() and public.landlord_can_add_property(landlord_id));
create policy "properties scoped update" on public.properties for update to authenticated using (landlord_id = public.current_landlord_id() or public.is_super_admin()) with check (landlord_id = public.current_landlord_id() or public.is_super_admin());

create policy "units scoped read" on public.units for select to authenticated using (landlord_id = public.current_landlord_id() or public.is_super_admin() or public.is_admin_staff());
create policy "units landlord insert" on public.units for insert to authenticated with check (landlord_id = auth.uid() and public.landlord_can_add_unit(landlord_id));
create policy "units scoped update" on public.units for update to authenticated using (landlord_id = public.current_landlord_id() or public.is_super_admin()) with check (landlord_id = public.current_landlord_id() or public.is_super_admin());

create policy "tenants scoped read" on public.tenants for select to authenticated using (profile_id = auth.uid() or landlord_id = public.current_landlord_id() or public.is_super_admin() or public.is_admin_staff());
create policy "tenants landlord insert" on public.tenants for insert to authenticated with check (landlord_id = public.current_landlord_id() or public.is_super_admin());
create policy "tenants scoped update" on public.tenants for update to authenticated using (profile_id = auth.uid() or landlord_id = public.current_landlord_id() or public.is_super_admin());

create policy "leases scoped read" on public.leases for select to authenticated using (landlord_id = public.current_landlord_id() or exists(select 1 from public.tenants t where t.id = tenant_id and t.profile_id = auth.uid()) or public.is_super_admin());
create policy "leases scoped write" on public.leases for all to authenticated using (landlord_id = public.current_landlord_id() or public.is_super_admin()) with check (landlord_id = public.current_landlord_id() or public.is_super_admin());

create policy "payments scoped read" on public.payments for select to authenticated using (landlord_id = public.current_landlord_id() or exists(select 1 from public.tenants t where t.id = tenant_id and t.profile_id = auth.uid()) or public.is_super_admin());
create policy "payments scoped write" on public.payments for all to authenticated using (landlord_id = public.current_landlord_id() or public.is_super_admin()) with check (landlord_id = public.current_landlord_id() or public.is_super_admin());

create policy "maintenance scoped read" on public.maintenance_requests for select to authenticated using (landlord_id = public.current_landlord_id() or exists(select 1 from public.tenants t where t.id = tenant_id and t.profile_id = auth.uid()) or public.is_super_admin());
create policy "maintenance scoped write" on public.maintenance_requests for all to authenticated using (landlord_id = public.current_landlord_id() or public.is_super_admin()) with check (landlord_id = public.current_landlord_id() or public.is_super_admin());

create policy "staff permissions scoped read" on public.staff_permissions for select to authenticated using (landlord_id = public.current_landlord_id() or staff_profile_id = auth.uid() or public.is_super_admin());
create policy "staff permissions scoped write" on public.staff_permissions for all to authenticated using (landlord_id = public.current_landlord_id() or public.is_super_admin()) with check (landlord_id = public.current_landlord_id() or public.is_super_admin());

create policy "pmc company scoped read" on public.management_companies for select to authenticated using (leader_profile_id = auth.uid() or id = (select management_company_id from public.profiles where id = auth.uid()) or public.is_super_admin() or public.is_admin_staff());
create policy "pmc company admin write" on public.management_companies for all to authenticated using (public.is_super_admin() or public.is_admin_staff() or leader_profile_id = auth.uid()) with check (public.is_super_admin() or public.is_admin_staff() or leader_profile_id = auth.uid());

create policy "pmc landlord permissions scoped read" on public.management_landlord_permissions for select to authenticated using (landlord_id = public.current_landlord_id() or management_company_id = (select management_company_id from public.profiles where id = auth.uid()) or public.is_super_admin());
create policy "pmc landlord permissions scoped write" on public.management_landlord_permissions for all to authenticated using (landlord_id = public.current_landlord_id() or management_company_id = (select management_company_id from public.profiles where id = auth.uid()) or public.is_super_admin()) with check (landlord_id = public.current_landlord_id() or management_company_id = (select management_company_id from public.profiles where id = auth.uid()) or public.is_super_admin());

create policy "pmc staff permissions scoped read" on public.management_staff_permissions for select to authenticated using (staff_profile_id = auth.uid() or management_company_id = (select management_company_id from public.profiles where id = auth.uid()) or public.is_super_admin());
create policy "pmc staff permissions scoped write" on public.management_staff_permissions for all to authenticated using (management_company_id = (select management_company_id from public.profiles where id = auth.uid()) or public.is_super_admin()) with check (management_company_id = (select management_company_id from public.profiles where id = auth.uid()) or public.is_super_admin());

create policy "notifications owner read" on public.notifications for select to authenticated using (profile_id = auth.uid());
create policy "notifications owner update" on public.notifications for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "enquiries public insert" on public.enquiries for insert to anon, authenticated with check (true);
create policy "enquiries admin read" on public.enquiries for select to authenticated using (public.is_super_admin() or public.is_admin_staff());
create policy "enquiries admin update" on public.enquiries for update to authenticated using (public.is_super_admin() or public.is_admin_staff());

create policy "platform payments admin read" on public.platform_payments for select to authenticated using (public.is_super_admin() or public.is_admin_staff());
create policy "platform payments admin write" on public.platform_payments for all to authenticated using (public.is_super_admin() or public.is_admin_staff()) with check (public.is_super_admin() or public.is_admin_staff());

insert into public.countries(name, code, currency)
values ('Zimbabwe', 'ZW', 'USD'), ('Malaysia', 'MY', 'MYR')
on conflict (code) do nothing;

insert into storage.buckets(id, name, public)
values ('lease-documents', 'lease-documents', false),
       ('payment-proofs', 'payment-proofs', false),
       ('maintenance-photos', 'maintenance-photos', false)
on conflict (id) do nothing;
