import { appendAuditLog, userHasOrganizationAccess } from "@/server/services/enterprise/job-service";
import {
  createWorkflow,
  listWorkflows,
} from "@/server/services/enterprise/workflow-service";
import { createClient } from "@/server/services/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const listQuerySchema = z.object({
  organizationId: z.string().uuid(),
});

const createBodySchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2).max(150),
  description: z.string().max(2000).optional(),
  triggerConfig: z.record(z.unknown()).default({}),
  actionConfig: z.record(z.unknown()).default({}),
  isActive: z.boolean().optional(),
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

  const queryParseResult = listQuerySchema.safeParse({
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

  const workflows = await listWorkflows(organizationId);

  await appendAuditLog({
    organizationId,
    actorUserId: user.id,
    action: "workflows.list",
    entityType: "workflow",
    metadata: { returnedCount: workflows.length },
  });

  return NextResponse.json({ workflows });
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
  const bodyParseResult = createBodySchema.safeParse(body);

  if (!bodyParseResult.success) {
    return NextResponse.json({ error: "Invalid body", details: bodyParseResult.error.flatten() }, { status: 400 });
  }

  const { organizationId, name, description, triggerConfig, actionConfig, isActive } = bodyParseResult.data;

  const hasAccess = await userHasOrganizationAccess(organizationId, user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workflow = await createWorkflow({
    organizationId,
    createdBy: user.id,
    name,
    description,
    triggerConfig,
    actionConfig,
    isActive,
  });

  await appendAuditLog({
    organizationId,
    actorUserId: user.id,
    action: "workflows.create",
    entityType: "workflow",
    entityId: workflow.id,
    metadata: { name: workflow.name, isActive: workflow.is_active },
  });

  return NextResponse.json({ workflow }, { status: 201 });
}
