import { appendAuditLog, userHasOrganizationAccess } from "@/server/services/enterprise/job-service";
import {
  getWorkflowById,
  updateWorkflow,
} from "@/server/services/enterprise/workflow-service";
import { createClient } from "@/server/services/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  organizationId: z.string().uuid(),
});

const patchBodySchema = z
  .object({
    name: z.string().min(2).max(150).optional(),
    description: z.string().max(2000).optional(),
    triggerConfig: z.record(z.unknown()).optional(),
    actionConfig: z.record(z.unknown()).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
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

  const queryParseResult = querySchema.safeParse({
    organizationId: request.nextUrl.searchParams.get("organizationId"),
  });

  if (!queryParseResult.success) {
    return NextResponse.json({ error: "Invalid query", details: queryParseResult.error.flatten() }, { status: 400 });
  }

  const { organizationId } = queryParseResult.data;
  const hasAccess = await userHasOrganizationAccess(organizationId, user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workflow = await getWorkflowById(organizationId, params.id);
  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  await appendAuditLog({
    organizationId,
    actorUserId: user.id,
    action: "workflows.get",
    entityType: "workflow",
    entityId: params.id,
  });

  return NextResponse.json({ workflow });
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

  const queryParseResult = querySchema.safeParse({
    organizationId: request.nextUrl.searchParams.get("organizationId"),
  });

  if (!queryParseResult.success) {
    return NextResponse.json({ error: "Invalid query", details: queryParseResult.error.flatten() }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const bodyParseResult = patchBodySchema.safeParse(body);

  if (!bodyParseResult.success) {
    return NextResponse.json({ error: "Invalid body", details: bodyParseResult.error.flatten() }, { status: 400 });
  }

  const { organizationId } = queryParseResult.data;
  const hasAccess = await userHasOrganizationAccess(organizationId, user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workflow = await updateWorkflow(organizationId, params.id, bodyParseResult.data);
  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  await appendAuditLog({
    organizationId,
    actorUserId: user.id,
    action: "workflows.update",
    entityType: "workflow",
    entityId: params.id,
    metadata: bodyParseResult.data,
  });

  return NextResponse.json({ workflow });
}
