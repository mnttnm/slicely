# Enterprise Implementation Log

## What I implemented in this pass

This pass focuses on creating the **data + API foundation** for enterprise readiness without breaking existing user flows.

### 1) Organization and RBAC foundation
- Added organization primitives:
  - `organizations`
  - `organization_users`
  - `service_accounts`
- Added scoped roles via `organization_role` enum (`owner`, `admin`, `member`, `viewer`).
- Added `has_organization_access(...)` helper used by RLS policies.

### 2) Durable job-processing foundation
- Added `processing_jobs` table with:
  - typed status (`queued`, `running`, `retrying`, `failed`, `completed`, `canceled`)
  - typed job categories (`pdf_ingestion`, `pdf_extraction`, `workflow_run`, `export_delivery`)
  - idempotency constraint `(organization_id, idempotency_key)`
  - retry fields (`attempt_count`, `max_attempts`)
  - payload/result/error tracking and lifecycle timestamps.
- Added indexes to support queue polling and org-level dashboards.

### 3) Recurring automation foundation
- Added `workflows` table for trigger/action configuration and lifecycle flags.

### 4) Auditing foundation
- Added `audit_logs` table with actor context (`user` or `service account`), action metadata, and request linkage.

### 5) API foundation for processing jobs
- Added new REST endpoints:
  - `GET /api/v1/jobs`
  - `POST /api/v1/jobs`
  - `GET /api/v1/jobs/:id`
  - `PATCH /api/v1/jobs/:id`
- Added request validation via `zod` for query/body payloads.
- Added organization membership checks before all job reads/writes.
- Added idempotent job creation support through `Idempotency-Key` header.
- Added audit log entries for list/get/create/update job API operations.

### 6) Row-level security policy baseline
- Enabled RLS on all new enterprise tables.
- Added policies for org-scoped reads/writes with stricter ownership/admin checks for membership and service-account management.

## Decisions made autonomously
- Preserve existing product behavior while introducing parallel enterprise tables and APIs.
- Make jobs and workflows org-scoped from day one.
- Enforce default-deny through RLS and explicit membership checks.
- Use idempotency in schema + API now so workers can become safely retryable later.
- Expose APIs as authenticated user endpoints first; service-account auth can layer in next.

## Inputs needed from you when back

1. **Role model details**
   - Should `viewer` be allowed to enqueue jobs/workflows, or strictly read-only?
2. **Workflow DSL shape**
   - Keep generic `jsonb` trigger/action configs, or lock to versioned schema contracts now?
3. **Service account model**
   - Rotateable opaque tokens only, or support OAuth client credentials in v1?
4. **Audit retention policy**
   - Preferred retention window and archival strategy.
5. **Queue execution target**
   - Preferred worker runtime (Supabase Edge Functions, external worker service, or managed queue).
6. **Worker authorization model**
   - Should job status transitions be user-driven only, or should worker/service-account paths bypass user session auth?

## Suggested next implementation slice
1. Build worker loop for `processing_jobs` execution and retries.
2. Connect existing PDF processing flow to enqueue jobs instead of synchronous processing.
3. Add organization selector and membership bootstrap in app onboarding.
4. Add service-account token auth for machine-to-machine API usage.
5. Add webhook delivery jobs and retry/replay endpoints.
