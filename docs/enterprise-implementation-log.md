# Enterprise Implementation Log

## What I implemented so far

This work now covers **data + API + worker foundation** for enterprise readiness, while preserving existing user flows.

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
- Added workflow APIs:
  - `GET /api/v1/workflows`
  - `POST /api/v1/workflows`
  - `GET /api/v1/workflows/:id`
  - `PATCH /api/v1/workflows/:id`
- Added validation, org access checks, and audit logging for workflow operations.

### 4) Auditing foundation
- Added `audit_logs` table with actor context (`user` or `service account`), action metadata, and request linkage.
- Added API-side audit events for both job and workflow read/write operations.

### 5) API foundation for processing jobs
- Added new REST endpoints:
  - `GET /api/v1/jobs`
  - `POST /api/v1/jobs`
  - `GET /api/v1/jobs/:id`
  - `PATCH /api/v1/jobs/:id`
- Added request validation via `zod` for query/body payloads.
- Added organization membership checks before all job reads/writes.
- Added idempotent job creation support through `Idempotency-Key` header.

### 6) Worker execution foundation
- Added `scripts/process-jobs.ts` worker script that:
  - polls queued/retrying jobs in priority order
  - increments attempt counts
  - transitions jobs to `running`
  - executes a pluggable job runner (stub implementation)
  - marks jobs `completed` or `retrying`/`failed` based on retry budget.
- Added `npm run process-jobs` script for local/CI worker execution.

### 7) Repo quality unblockers
- Renamed legacy PascalCase component files to kebab-case to align with lint/type conventions and unblock module resolution issues.

## Decisions made autonomously
- Preserve existing behavior while introducing additive enterprise tables, APIs, and worker scaffolding.
- Keep APIs user-session authenticated first; layer service-account auth in next phase.
- Enforce org checks at API boundary even with RLS in place.
- Introduce job idempotency + retries now so ingestion/extraction flows can migrate safely.
- Ship workflow config as flexible `jsonb` first, then version contracts later.

## Inputs needed from you when back

1. **Role model details**
   - Should `viewer` be allowed to enqueue jobs/workflows, or strictly read-only?
2. **Workflow DSL shape**
   - Keep flexible `jsonb` configs, or enforce versioned schema contracts immediately?
3. **Service account model**
   - Opaque token auth only, or OAuth client credentials in v1?
4. **Audit retention policy**
   - Retention window + archival strategy.
5. **Queue runtime decision**
   - Supabase Edge Functions vs dedicated worker service vs managed queue.
6. **Worker authorization model**
   - Should worker status transitions use service-role execution only?
7. **Priority integrations**
   - First connectors to build (S3, SharePoint, Google Drive, Box, SFTP, webhooks).

## Next implementation slice (already queued mentally)
1. Replace worker stub with actual `pdf_ingestion` and `pdf_extraction` handlers.
2. Enqueue jobs from existing synchronous PDF flows.
3. Add service-account token authentication path for machine-to-machine APIs.
4. Add webhook delivery jobs + signature, retry, and replay support.
5. Add workflow scheduler trigger execution.
