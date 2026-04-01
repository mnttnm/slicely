import {
  appendAuditLog,
  getProcessingJobById,
  updateProcessingJobStatus,
  userHasOrganizationAccess,
} from "@/server/services/enterprise/job-service";
import { createClient } from "@/server/services/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const organizationQuerySchema = z.object({
  organizationId: z.string().uuid(),
});

const updateJobSchema = z.object({
  status: z.enum(["queued", "running", "retrying", "failed", "completed", "canceled"]),
  result: z.record(z.unknown()).optional(),
  errorMessage: z.string().min(1).max(3000).optional(),
});

const unauthorizedResponse = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorizedResponse();
  }

  const queryParseResult = organizationQuerySchema.safeParse({
    organizationId: request.nextUrl.searchParams.get("organizationId"),
  });

  if (!queryParseResult.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: queryParseResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { organizationId } = queryParseResult.data;

  const hasAccess = await userHasOrganizationAccess(organizationId, user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const job = await getProcessingJobById(organizationId, params.id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  await appendAuditLog({
    organizationId,
    actorUserId: user.id,
    action: "jobs.get",
    entityType: "processing_job",
    entityId: params.id,
  });

  return NextResponse.json({ job });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorizedResponse();
  }

  const queryParseResult = organizationQuerySchema.safeParse({
    organizationId: request.nextUrl.searchParams.get("organizationId"),
  });

  if (!queryParseResult.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: queryParseResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const bodyParseResult = updateJobSchema.safeParse(body);

  if (!bodyParseResult.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: bodyParseResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { organizationId } = queryParseResult.data;
  const hasAccess = await userHasOrganizationAccess(organizationId, user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const job = await updateProcessingJobStatus(organizationId, params.id, bodyParseResult.data.status, {
    result: bodyParseResult.data.result,
    errorMessage: bodyParseResult.data.errorMessage,
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  await appendAuditLog({
    organizationId,
    actorUserId: user.id,
    action: "jobs.update",
    entityType: "processing_job",
    entityId: params.id,
    metadata: {
      status: bodyParseResult.data.status,
    },
  });

  return NextResponse.json({ job });
}
