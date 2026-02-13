import { createClient } from "@/server/services/supabase/server";
import { PostgrestError } from "@supabase/supabase-js";

export type JobStatus =
  | "queued"
  | "running"
  | "retrying"
  | "failed"
  | "completed"
  | "canceled";

export type JobType = "pdf_ingestion" | "pdf_extraction" | "workflow_run" | "export_delivery";

export interface ProcessingJobRecord {
  id: string;
  organization_id: string;
  requested_by: string | null;
  type: JobType;
  status: JobStatus;
  idempotency_key: string | null;
  priority: number;
  attempt_count: number;
  max_attempts: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error_message: string | null;
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateJobInput {
  organizationId: string;
  requestedBy: string;
  type: JobType;
  payload: Record<string, unknown>;
  priority?: number;
  idempotencyKey?: string;
}

export interface ListJobsInput {
  organizationId: string;
  limit: number;
  status?: JobStatus;
}

const PROCESSING_JOBS_TABLE = "processing_jobs";
const ORGANIZATION_USERS_TABLE = "organization_users";
const AUDIT_LOGS_TABLE = "audit_logs";

const mapPostgrestError = (error: PostgrestError | null, fallback: string): never => {
  if (error) {
    throw new Error(error.message);
  }

  throw new Error(fallback);
};

export async function userHasOrganizationAccess(
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await (supabase as any)
    .from(ORGANIZATION_USERS_TABLE)
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    mapPostgrestError(error, "Failed to validate organization access");
  }

  return Boolean(data);
}

export async function listProcessingJobs(input: ListJobsInput): Promise<ProcessingJobRecord[]> {
  const supabase = createClient();

  let query = (supabase as any)
    .from(PROCESSING_JOBS_TABLE)
    .select("*")
    .eq("organization_id", input.organizationId)
    .order("created_at", { ascending: false })
    .limit(input.limit);

  if (input.status) {
    query = query.eq("status", input.status);
  }

  const { data, error } = await query;

  if (error) {
    mapPostgrestError(error, "Failed to list processing jobs");
  }

  return (data || []) as ProcessingJobRecord[];
}

export async function createProcessingJob(input: CreateJobInput): Promise<ProcessingJobRecord> {
  const supabase = createClient();

  const insertPayload = {
    organization_id: input.organizationId,
    requested_by: input.requestedBy,
    type: input.type,
    payload: input.payload,
    priority: input.priority ?? 5,
    idempotency_key: input.idempotencyKey || null,
  };

  const { data, error } = await (supabase as any)
    .from(PROCESSING_JOBS_TABLE)
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    if (input.idempotencyKey && error.code === "23505") {
      const { data: existingJob, error: existingJobError } = await (supabase as any)
        .from(PROCESSING_JOBS_TABLE)
        .select("*")
        .eq("organization_id", input.organizationId)
        .eq("idempotency_key", input.idempotencyKey)
        .single();

      if (existingJobError) {
        mapPostgrestError(existingJobError, "Failed to fetch idempotent processing job");
      }

      return existingJob as ProcessingJobRecord;
    }

    mapPostgrestError(error, "Failed to create processing job");
  }

  return data as ProcessingJobRecord;
}

export async function getProcessingJobById(
  organizationId: string,
  jobId: string,
): Promise<ProcessingJobRecord | null> {
  const supabase = createClient();
  const { data, error } = await (supabase as any)
    .from(PROCESSING_JOBS_TABLE)
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    mapPostgrestError(error, "Failed to fetch processing job");
  }

  if (!data) {
    return null;
  }

  return data as ProcessingJobRecord;
}

export async function updateProcessingJobStatus(
  organizationId: string,
  jobId: string,
  status: JobStatus,
  fields: { result?: Record<string, unknown>; errorMessage?: string },
): Promise<ProcessingJobRecord | null> {
  const supabase = createClient();

  const nowIso = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    status,
  };

  if (status === "running") {
    updatePayload.started_at = nowIso;
  }

  if (status === "completed" || status === "failed" || status === "canceled") {
    updatePayload.completed_at = nowIso;
  }

  if (fields.result) {
    updatePayload.result = fields.result;
  }

  if (fields.errorMessage) {
    updatePayload.error_message = fields.errorMessage;
  }

  const { data, error } = await (supabase as any)
    .from(PROCESSING_JOBS_TABLE)
    .update(updatePayload)
    .eq("organization_id", organizationId)
    .eq("id", jobId)
    .select("*")
    .maybeSingle();

  if (error) {
    mapPostgrestError(error, "Failed to update processing job");
  }

  if (!data) {
    return null;
  }

  return data as ProcessingJobRecord;
}

export async function appendAuditLog(input: {
  organizationId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createClient();

  const { error } = await (supabase as any).from(AUDIT_LOGS_TABLE).insert({
    organization_id: input.organizationId,
    actor_user_id: input.actorUserId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId || null,
    metadata: input.metadata || {},
  });

  if (error) {
    mapPostgrestError(error, "Failed to append audit log");
  }
}
