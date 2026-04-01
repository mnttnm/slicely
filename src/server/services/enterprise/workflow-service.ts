import { createClient } from "@/server/services/supabase/server";
import { PostgrestError } from "@supabase/supabase-js";

export interface WorkflowRecord {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  trigger_config: Record<string, unknown>;
  action_config: Record<string, unknown>;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowInput {
  organizationId: string;
  createdBy: string;
  name: string;
  description?: string;
  triggerConfig: Record<string, unknown>;
  actionConfig: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  triggerConfig?: Record<string, unknown>;
  actionConfig?: Record<string, unknown>;
  isActive?: boolean;
}

const WORKFLOWS_TABLE = "workflows";

const throwPostgrestError = (error: PostgrestError | null, fallback: string): never => {
  if (error) {
    throw new Error(error.message);
  }

  throw new Error(fallback);
};

export async function listWorkflows(organizationId: string): Promise<WorkflowRecord[]> {
  const supabase = createClient();
  const { data, error } = await (supabase as any)
    .from(WORKFLOWS_TABLE)
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throwPostgrestError(error, "Failed to list workflows");
  }

  return (data || []) as WorkflowRecord[];
}

export async function createWorkflow(input: CreateWorkflowInput): Promise<WorkflowRecord> {
  const supabase = createClient();
  const { data, error } = await (supabase as any)
    .from(WORKFLOWS_TABLE)
    .insert({
      organization_id: input.organizationId,
      created_by: input.createdBy,
      name: input.name,
      description: input.description || null,
      trigger_config: input.triggerConfig,
      action_config: input.actionConfig,
      is_active: input.isActive ?? true,
    })
    .select("*")
    .single();

  if (error) {
    throwPostgrestError(error, "Failed to create workflow");
  }

  return data as WorkflowRecord;
}

export async function getWorkflowById(
  organizationId: string,
  workflowId: string,
): Promise<WorkflowRecord | null> {
  const supabase = createClient();
  const { data, error } = await (supabase as any)
    .from(WORKFLOWS_TABLE)
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", workflowId)
    .maybeSingle();

  if (error) {
    throwPostgrestError(error, "Failed to fetch workflow");
  }

  return (data as WorkflowRecord | null) || null;
}

export async function updateWorkflow(
  organizationId: string,
  workflowId: string,
  input: UpdateWorkflowInput,
): Promise<WorkflowRecord | null> {
  const updatePayload: Record<string, unknown> = {};

  if (input.name !== undefined) {
    updatePayload.name = input.name;
  }

  if (input.description !== undefined) {
    updatePayload.description = input.description;
  }

  if (input.triggerConfig !== undefined) {
    updatePayload.trigger_config = input.triggerConfig;
  }

  if (input.actionConfig !== undefined) {
    updatePayload.action_config = input.actionConfig;
  }

  if (input.isActive !== undefined) {
    updatePayload.is_active = input.isActive;
  }

  const supabase = createClient();
  const { data, error } = await (supabase as any)
    .from(WORKFLOWS_TABLE)
    .update(updatePayload)
    .eq("organization_id", organizationId)
    .eq("id", workflowId)
    .select("*")
    .maybeSingle();

  if (error) {
    throwPostgrestError(error, "Failed to update workflow");
  }

  return (data as WorkflowRecord | null) || null;
}
