create extension if not exists pgcrypto;

create type public.organization_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.processing_job_status as enum (
  'queued',
  'running',
  'retrying',
  'failed',
  'completed',
  'canceled'
);
create type public.processing_job_type as enum (
  'pdf_ingestion',
  'pdf_extraction',
  'workflow_run',
  'export_delivery'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

create table public.organization_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.service_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  token_hash text not null unique,
  scopes text[] not null default '{}',
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid references auth.users(id),
  type public.processing_job_type not null,
  status public.processing_job_status not null default 'queued',
  idempotency_key text,
  priority smallint not null default 5,
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error_message text,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint processing_jobs_idempotency unique (organization_id, idempotency_key)
);

create index processing_jobs_status_priority_idx
  on public.processing_jobs (status, priority, queued_at);
create index processing_jobs_organization_idx
  on public.processing_jobs (organization_id, created_at desc);

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  trigger_config jsonb not null default '{}'::jsonb,
  action_config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_service_account_id uuid references public.service_accounts(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  request_id text,
  ip_address inet,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_organization_idx
  on public.audit_logs (organization_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

create trigger organization_users_set_updated_at
before update on public.organization_users
for each row
execute function public.set_updated_at();

create trigger service_accounts_set_updated_at
before update on public.service_accounts
for each row
execute function public.set_updated_at();

create trigger processing_jobs_set_updated_at
before update on public.processing_jobs
for each row
execute function public.set_updated_at();

create trigger workflows_set_updated_at
before update on public.workflows
for each row
execute function public.set_updated_at();

create or replace function public.has_organization_access(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_users ou
    where ou.organization_id = target_organization_id
      and ou.user_id = auth.uid()
  );
$$;

alter table public.organizations enable row level security;
alter table public.organization_users enable row level security;
alter table public.service_accounts enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.workflows enable row level security;
alter table public.audit_logs enable row level security;

create policy "organization members can read organizations"
  on public.organizations
  for select
  using (public.has_organization_access(id));

create policy "owners and admins can update organizations"
  on public.organizations
  for update
  using (
    exists (
      select 1
      from public.organization_users ou
      where ou.organization_id = id
        and ou.user_id = auth.uid()
        and ou.role in ('owner', 'admin')
    )
  );

create policy "authenticated users can create organizations"
  on public.organizations
  for insert
  with check (auth.uid() = created_by);

create policy "organization members can read memberships"
  on public.organization_users
  for select
  using (public.has_organization_access(organization_id));

create policy "owners and admins can manage memberships"
  on public.organization_users
  for all
  using (
    exists (
      select 1
      from public.organization_users me
      where me.organization_id = organization_users.organization_id
        and me.user_id = auth.uid()
        and me.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_users me
      where me.organization_id = organization_users.organization_id
        and me.user_id = auth.uid()
        and me.role in ('owner', 'admin')
    )
  );

create policy "organization members can read service accounts"
  on public.service_accounts
  for select
  using (public.has_organization_access(organization_id));

create policy "owners and admins can manage service accounts"
  on public.service_accounts
  for all
  using (
    exists (
      select 1
      from public.organization_users ou
      where ou.organization_id = service_accounts.organization_id
        and ou.user_id = auth.uid()
        and ou.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_users ou
      where ou.organization_id = service_accounts.organization_id
        and ou.user_id = auth.uid()
        and ou.role in ('owner', 'admin')
    )
  );

create policy "organization members can read jobs"
  on public.processing_jobs
  for select
  using (public.has_organization_access(organization_id));

create policy "organization members can create jobs"
  on public.processing_jobs
  for insert
  with check (
    public.has_organization_access(organization_id)
    and auth.uid() = requested_by
  );

create policy "organization members can update jobs"
  on public.processing_jobs
  for update
  using (public.has_organization_access(organization_id));

create policy "organization members can read workflows"
  on public.workflows
  for select
  using (public.has_organization_access(organization_id));

create policy "organization members can create workflows"
  on public.workflows
  for insert
  with check (
    public.has_organization_access(organization_id)
    and auth.uid() = created_by
  );

create policy "organization members can update workflows"
  on public.workflows
  for update
  using (public.has_organization_access(organization_id));

create policy "organization members can read audit logs"
  on public.audit_logs
  for select
  using (
    organization_id is null
    or public.has_organization_access(organization_id)
  );

create policy "authenticated writes for audit logs"
  on public.audit_logs
  for insert
  with check (auth.uid() is not null);
