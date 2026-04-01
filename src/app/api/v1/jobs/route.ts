import {
  appendAuditLog,
  createProcessingJob,
  listProcessingJobs,
  userHasOrganizationAccess,
} from "@/server/services/enterprise/job-service";
import { createClient } from "@/server/services/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const listJobsQuerySchema = z.object({
  organizationId: z.string().uuid(),
  status: z
    .enum(["queued", "running", "retrying", "failed", "completed", "canceled"])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createJobBodySchema = z.object({
  organizationId: z.string().uuid(),
  type: z.enum(["pdf_ingestion", "pdf_extraction", "workflow_run", "export_delivery"]),
  payload: z.record(z.unknown()).default({}),
  priority: z.number().int().min(1).max(10).optional(),
});

const unauthorizedResponse = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorizedResponse();
  }

  const parseResult = listJobsQuerySchema.safeParse({
    organizationId: request.nextUrl.searchParams.get("organizationId"),
    status: request.nextUrl.searchParams.get("status") || undefined,
    limit: request.nextUrl.searchParams.get("limit") || undefined,
  });

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: parseResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { organizationId, status, limit } = parseResult.data;

  const hasAccess = await userHasOrganizationAccess(organizationId, user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const jobs = await listProcessingJobs({
    organizationId,
    status,
    limit,
  });

  await appendAuditLog({
    organizationId,
    actorUserId: user.id,
    action: "jobs.list",
    entityType: "processing_job",
    metadata: {
      returnedCount: jobs.length,
      statusFilter: status || null,
    },
  });

  return NextResponse.json({ jobs });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  const parseResult = createJobBodySchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: parseResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { organizationId, type, payload, priority } = parseResult.data;

  const hasAccess = await userHasOrganizationAccess(organizationId, user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const idempotencyKey = request.headers.get("Idempotency-Key") || undefined;

  const job = await createProcessingJob({
    organizationId,
    requestedBy: user.id,
    type,
    payload,
    priority,
    idempotencyKey,
  });

  await appendAuditLog({
    organizationId,
    actorUserId: user.id,
    action: "jobs.create",
    entityType: "processing_job",
    entityId: job.id,
    metadata: {
      type: job.type,
      status: job.status,
      idempotencyKey: idempotencyKey || null,
    },
  });

  return NextResponse.json({ job }, { status: 201 });
}
