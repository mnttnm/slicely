/* eslint-disable n/no-process-env */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type JobStatus = "queued" | "running" | "retrying" | "failed" | "completed" | "canceled";

interface ProcessingJob {
  id: string;
  organization_id: string;
  type: string;
  status: JobStatus;
  payload: Record<string, unknown>;
  attempt_count: number;
  max_attempts: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

const parseBatchSize = (): number => {
  const raw = process.env.JOB_WORKER_BATCH_SIZE;
  const parsed = Number(raw || "10");

  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) {
    return 10;
  }

  return parsed;
};

const withDelay = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const mockJobExecution = async (job: ProcessingJob): Promise<Record<string, unknown>> => {
  await withDelay(200);

  return {
    summary: "Job executed by worker stub",
    processedAt: new Date().toISOString(),
    type: job.type,
    payloadKeys: Object.keys(job.payload || {}),
  };
};

const markJobAsRunning = async (jobId: string): Promise<void> => {
  const { error } = await supabase
    .from("processing_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    throw new Error(`Failed to mark job ${jobId} as running: ${error.message}`);
  }
};

const incrementAttemptCount = async (job: ProcessingJob): Promise<void> => {
  const { error } = await supabase
    .from("processing_jobs")
    .update({
      attempt_count: job.attempt_count + 1,
    })
    .eq("id", job.id);

  if (error) {
    throw new Error(`Failed to increment attempt_count for ${job.id}: ${error.message}`);
  }
};

const completeJob = async (jobId: string, result: Record<string, unknown>): Promise<void> => {
  const { error } = await supabase
    .from("processing_jobs")
    .update({
      status: "completed",
      result,
      completed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", jobId);

  if (error) {
    throw new Error(`Failed to complete job ${jobId}: ${error.message}`);
  }
};

const failOrRetryJob = async (job: ProcessingJob, errorMessage: string): Promise<void> => {
  const canRetry = job.attempt_count < job.max_attempts;
  const status: JobStatus = canRetry ? "retrying" : "failed";

  const { error } = await supabase
    .from("processing_jobs")
    .update({
      status,
      error_message: errorMessage,
      completed_at: canRetry ? null : new Date().toISOString(),
    })
    .eq("id", job.id);

  if (error) {
    throw new Error(`Failed to set retry/failed status for ${job.id}: ${error.message}`);
  }
};

const fetchQueuedJobs = async (batchSize: number): Promise<ProcessingJob[]> => {
  const { data, error } = await supabase
    .from("processing_jobs")
    .select("id, organization_id, type, status, payload, attempt_count, max_attempts")
    .in("status", ["queued", "retrying"])
    .order("priority", { ascending: true })
    .order("queued_at", { ascending: true })
    .limit(batchSize);

  if (error) {
    throw new Error(`Failed to fetch queued jobs: ${error.message}`);
  }

  return (data || []) as ProcessingJob[];
};

const processBatch = async (): Promise<number> => {
  const jobs = await fetchQueuedJobs(parseBatchSize());

  for (const job of jobs) {
    try {
      await incrementAttemptCount(job);
      await markJobAsRunning(job.id);
      const result = await mockJobExecution(job);
      await completeJob(job.id, result);
      console.log(`[worker] completed job ${job.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown worker error";
      await failOrRetryJob(job, message);
      console.error(`[worker] failed job ${job.id}: ${message}`);
    }
  }

  return jobs.length;
};

async function main() {
  const processed = await processBatch();
  console.log(`[worker] processed batch size: ${processed}`);
}

main().catch((error) => {
  console.error("[worker] fatal error", error);
  process.exit(1);
});
