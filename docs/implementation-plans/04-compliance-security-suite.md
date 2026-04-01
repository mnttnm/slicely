# Implementation Plan: Compliance & Security Suite

**Priority:** 🔴 CRITICAL
**Impact:** 90/100
**Effort:** Medium (4-5 weeks)
**Owner:** Backend Engineering + Security
**Dependencies:** API Layer (for audit logging of API calls)

---

## 1. Overview

### Objective
Implement comprehensive compliance and security features to meet SOC2, GDPR, HIPAA, and ISO 27001 requirements, enabling Slicely to serve regulated industries (healthcare, finance, legal).

### Current Gaps
- ❌ No audit logs (who did what, when)
- ❌ No data retention policies
- ❌ No PII detection/redaction
- ❌ No customer-managed encryption keys
- ❌ No role-based access control (RBAC)
- ❌ No GDPR tools (data export, deletion)

### Success Criteria
- ✅ Complete audit trail for all user actions
- ✅ RBAC with granular permissions
- ✅ PII detection and redaction
- ✅ GDPR compliance (data export, deletion, consent)
- ✅ Data retention policies with auto-deletion
- ✅ SOC2 Type II audit readiness

---

## 2. Feature Breakdown

### 2.1 Audit Logging

**Purpose:** Track all user actions for compliance and security monitoring

**Database Schema:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),

  -- Event details
  event_type VARCHAR(100) NOT NULL,    -- 'pdf.upload', 'slicer.create', 'api.call'
  event_category VARCHAR(50) NOT NULL, -- 'auth', 'data', 'system', 'security'
  action VARCHAR(50) NOT NULL,         -- 'create', 'read', 'update', 'delete'
  resource_type VARCHAR(50) NOT NULL,  -- 'pdf', 'slicer', 'api_key'
  resource_id UUID,

  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  request_method VARCHAR(10),          -- 'GET', 'POST', etc.
  request_path TEXT,

  -- Payload tracking (for compliance)
  request_payload JSONB,               -- Sanitized request data
  response_status INTEGER,
  response_payload JSONB,              -- Sanitized response data

  -- Result
  status VARCHAR(20) NOT NULL,         -- 'success', 'failure', 'error'
  error_message TEXT,

  -- Metadata
  severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity) WHERE severity IN ('warning', 'critical');

-- Partition by month for performance (100M+ rows)
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- etc...
```

**Audit Events to Track:**

```typescript
// Authentication events
'auth.login.success'
'auth.login.failed'
'auth.logout'
'auth.password.reset'
'auth.mfa.enabled'
'auth.mfa.disabled'

// Data access events
'pdf.upload'
'pdf.view'
'pdf.download'
'pdf.delete'
'slicer.create'
'slicer.update'
'slicer.delete'
'slicer.process'
'output.view'
'output.export'

// API events
'api.key.create'
'api.key.revoke'
'api.call.success'
'api.call.failed'
'api.rate_limit.exceeded'

// Security events
'security.unauthorized_access'
'security.permission_denied'
'security.suspicious_activity'
'security.data_breach_attempt'

// System events
'system.settings.update'
'system.integration.connected'
'system.integration.disconnected'
'system.backup.completed'
```

**Audit Log Service:**

```typescript
// src/lib/audit/audit-logger.ts

export interface AuditLogEntry {
  userId?: string;
  organizationId?: string;
  eventType: string;
  eventCategory: 'auth' | 'data' | 'system' | 'security';
  action: 'create' | 'read' | 'update' | 'delete';
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  requestMethod?: string;
  requestPath?: string;
  requestPayload?: any;
  responseStatus?: number;
  responsePayload?: any;
  status: 'success' | 'failure' | 'error';
  errorMessage?: string;
  severity?: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

export class AuditLogger {
  async log(entry: AuditLogEntry): Promise<void> {
    // Sanitize payloads (remove sensitive data)
    const sanitizedRequestPayload = this.sanitizePayload(entry.requestPayload);
    const sanitizedResponsePayload = this.sanitizePayload(entry.responsePayload);

    // Insert into audit_logs table
    await supabase.from('audit_logs').insert({
      user_id: entry.userId,
      organization_id: entry.organizationId,
      event_type: entry.eventType,
      event_category: entry.eventCategory,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      request_id: entry.requestId,
      request_method: entry.requestMethod,
      request_path: entry.requestPath,
      request_payload: sanitizedRequestPayload,
      response_status: entry.responseStatus,
      response_payload: sanitizedResponsePayload,
      status: entry.status,
      error_message: entry.errorMessage,
      severity: entry.severity || 'info',
      metadata: entry.metadata,
    });

    // If critical severity, send alert
    if (entry.severity === 'critical') {
      await this.sendSecurityAlert(entry);
    }
  }

  private sanitizePayload(payload: any): any {
    if (!payload) return null;

    // Remove sensitive fields
    const sensitiveFields = ['password', 'apiKey', 'token', 'secret', 'creditCard'];
    const sanitized = { ...payload };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  async sendSecurityAlert(entry: AuditLogEntry): Promise<void> {
    // Send to PagerDuty, Slack, email, etc.
    console.error('SECURITY ALERT:', entry);
  }
}

// Global instance
export const auditLogger = new AuditLogger();

// Middleware for Next.js API routes
export function auditMiddleware(handler: any) {
  return async (req: NextRequest, res: NextResponse) => {
    const startTime = Date.now();
    const requestId = req.headers.get('X-Request-ID') || crypto.randomUUID();

    try {
      const response = await handler(req, res);

      // Log successful request
      await auditLogger.log({
        userId: req.user?.id,
        eventType: `api.${req.method.toLowerCase()}`,
        eventCategory: 'data',
        action: this.mapMethodToAction(req.method),
        resourceType: this.extractResourceType(req.url),
        ipAddress: req.ip,
        userAgent: req.headers.get('User-Agent'),
        requestId,
        requestMethod: req.method,
        requestPath: req.url,
        responseStatus: response.status,
        status: 'success',
        metadata: {
          responseTime: Date.now() - startTime,
        },
      });

      return response;
    } catch (error: any) {
      // Log failed request
      await auditLogger.log({
        userId: req.user?.id,
        eventType: `api.${req.method.toLowerCase()}.failed`,
        eventCategory: 'data',
        action: this.mapMethodToAction(req.method),
        resourceType: this.extractResourceType(req.url),
        ipAddress: req.ip,
        userAgent: req.headers.get('User-Agent'),
        requestId,
        requestMethod: req.method,
        requestPath: req.url,
        status: 'error',
        errorMessage: error.message,
        severity: error.statusCode === 403 ? 'warning' : 'info',
      });

      throw error;
    }
  };
}
```

---

### 2.2 Role-Based Access Control (RBAC)

**Purpose:** Granular permissions for team collaboration

**Database Schema:**

```sql
-- Organizations (multi-tenancy)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,

  owner_id UUID REFERENCES auth.users(id),

  plan VARCHAR(50) DEFAULT 'free',        -- 'free', 'pro', 'enterprise'
  billing_email VARCHAR(255),

  settings JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  role_id UUID REFERENCES roles(id),

  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,

  UNIQUE(organization_id, user_id)
);

-- Roles (predefined + custom)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,

  is_system BOOLEAN DEFAULT false,        -- System roles cannot be deleted

  permissions JSONB NOT NULL,             -- Array of permission strings

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, name)
);

-- Seed system roles
INSERT INTO roles (name, description, is_system, permissions) VALUES
('owner', 'Full access to all resources', true, '["*"]'),
('admin', 'Manage users, slicers, and settings', true, '["users.*", "slicers.*", "pdfs.*", "settings.*"]'),
('editor', 'Create and edit slicers, upload PDFs', true, '["slicers.create", "slicers.read", "slicers.update", "pdfs.create", "pdfs.read", "outputs.read"]'),
('viewer', 'View-only access', true, '["slicers.read", "pdfs.read", "outputs.read"]');
```

**Permission System:**

```typescript
// Permission format: "resource.action" or "*" for wildcard

type Permission =
  | '*'                       // All permissions
  | 'users.*'                 // All user permissions
  | 'users.invite'
  | 'users.remove'
  | 'users.update_role'
  | 'slicers.*'
  | 'slicers.create'
  | 'slicers.read'
  | 'slicers.update'
  | 'slicers.delete'
  | 'slicers.process'
  | 'pdfs.*'
  | 'pdfs.upload'
  | 'pdfs.read'
  | 'pdfs.download'
  | 'pdfs.delete'
  | 'outputs.read'
  | 'outputs.export'
  | 'settings.*'
  | 'settings.billing'
  | 'settings.integrations'
  | 'api_keys.*';

// Permission checker
export class PermissionChecker {
  constructor(private userPermissions: string[]) {}

  can(requiredPermission: Permission): boolean {
    // Check for wildcard
    if (this.userPermissions.includes('*')) {
      return true;
    }

    // Check for exact match
    if (this.userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Check for resource wildcard (e.g., "slicers.*" allows "slicers.create")
    const [resource, action] = requiredPermission.split('.');
    const resourceWildcard = `${resource}.*`;

    if (this.userPermissions.includes(resourceWildcard)) {
      return true;
    }

    return false;
  }

  canAny(permissions: Permission[]): boolean {
    return permissions.some((p) => this.can(p));
  }

  canAll(permissions: Permission[]): boolean {
    return permissions.every((p) => this.can(p));
  }
}

// Middleware for permission checking
export function requirePermission(permission: Permission) {
  return async (req: NextRequest) => {
    const user = req.user;

    if (!user) {
      throw new APIError('Unauthorized', 401);
    }

    // Get user's role and permissions
    const member = await supabase
      .from('organization_members')
      .select('*, role:roles(*)')
      .eq('user_id', user.id)
      .single();

    const permissions = member.role.permissions as string[];
    const checker = new PermissionChecker(permissions);

    if (!checker.can(permission)) {
      // Log unauthorized access attempt
      await auditLogger.log({
        userId: user.id,
        eventType: 'security.permission_denied',
        eventCategory: 'security',
        action: 'read',
        resourceType: permission.split('.')[0],
        status: 'failure',
        severity: 'warning',
        metadata: {
          requiredPermission: permission,
          userPermissions: permissions,
        },
      });

      throw new APIError('Permission denied', 403);
    }
  };
}
```

---

### 2.3 PII Detection & Redaction

**Purpose:** Automatically detect and redact personally identifiable information (PII) for HIPAA/GDPR compliance

**Implementation:**

```typescript
// src/lib/pii/pii-detector.ts

import { ComprehendClient, DetectPiiEntitiesCommand } from '@aws-sdk/client-comprehend';

export interface PIIEntity {
  type: 'SSN' | 'EMAIL' | 'PHONE' | 'CREDIT_CARD' | 'NAME' | 'ADDRESS' | 'DATE_OF_BIRTH' | 'MEDICAL_ID';
  value: string;
  start: number;
  end: number;
  confidence: number;
}

export interface PIIDetectionResult {
  text: string;
  piiDetected: boolean;
  entities: PIIEntity[];
  redactedText: string;
  riskScore: number;  // 0-100
}

export class PIIDetector {
  private comprehendClient: ComprehendClient;

  constructor() {
    this.comprehendClient = new ComprehendClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async detectPII(text: string): Promise<PIIDetectionResult> {
    // Use AWS Comprehend for PII detection
    const response = await this.comprehendClient.send(
      new DetectPiiEntitiesCommand({
        Text: text,
        LanguageCode: 'en',
      })
    );

    const entities: PIIEntity[] = (response.Entities || []).map((entity) => ({
      type: entity.Type as any,
      value: text.substring(entity.BeginOffset!, entity.EndOffset!),
      start: entity.BeginOffset!,
      end: entity.EndOffset!,
      confidence: entity.Score!,
    }));

    // Calculate risk score
    const riskScore = this.calculateRiskScore(entities);

    // Redact PII
    const redactedText = this.redactText(text, entities);

    return {
      text,
      piiDetected: entities.length > 0,
      entities,
      redactedText,
      riskScore,
    };
  }

  private calculateRiskScore(entities: PIIEntity[]): number {
    const weights = {
      SSN: 30,
      CREDIT_CARD: 25,
      MEDICAL_ID: 20,
      DATE_OF_BIRTH: 15,
      ADDRESS: 10,
      PHONE: 10,
      EMAIL: 5,
      NAME: 5,
    };

    let score = 0;

    for (const entity of entities) {
      score += weights[entity.type] || 0;
    }

    return Math.min(100, score);
  }

  private redactText(text: string, entities: PIIEntity[]): string {
    // Sort entities by start position (reverse order for proper replacement)
    const sortedEntities = [...entities].sort((a, b) => b.start - a.start);

    let redacted = text;

    for (const entity of sortedEntities) {
      redacted =
        redacted.substring(0, entity.start) +
        `[${entity.type}]` +
        redacted.substring(entity.end);
    }

    return redacted;
  }

  // Alternative: Use regex for basic PII detection (free, less accurate)
  async detectPIIBasic(text: string): Promise<PIIDetectionResult> {
    const entities: PIIEntity[] = [];

    // SSN (XXX-XX-XXXX)
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    let match;
    while ((match = ssnRegex.exec(text)) !== null) {
      entities.push({
        type: 'SSN',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.9,
      });
    }

    // Email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    while ((match = emailRegex.exec(text)) !== null) {
      entities.push({
        type: 'EMAIL',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.95,
      });
    }

    // Phone (various formats)
    const phoneRegex = /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    while ((match = phoneRegex.exec(text)) !== null) {
      entities.push({
        type: 'PHONE',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.85,
      });
    }

    // Credit Card (16 digits)
    const ccRegex = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
    while ((match = ccRegex.exec(text)) !== null) {
      entities.push({
        type: 'CREDIT_CARD',
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.8,
      });
    }

    const riskScore = this.calculateRiskScore(entities);
    const redactedText = this.redactText(text, entities);

    return {
      text,
      piiDetected: entities.length > 0,
      entities,
      redactedText,
      riskScore,
    };
  }
}

// Usage in PDF processing
export async function processPDFWithPIIDetection(pdfId: string): Promise<void> {
  const piiDetector = new PIIDetector();

  // Extract text from PDF
  const text = await extractTextFromPDF(pdfId);

  // Detect PII
  const piiResult = await piiDetector.detectPII(text);

  // Store PII detection results
  await supabase.from('outputs').update({
    pii_detected: piiResult.piiDetected,
    pii_entities: piiResult.entities,
    pii_risk_score: piiResult.riskScore,
    text_content: piiResult.redactedText,  // Store redacted version
  }).eq('pdf_id', pdfId);

  // Alert if high-risk PII detected
  if (piiResult.riskScore > 50) {
    await auditLogger.log({
      eventType: 'security.pii_detected',
      eventCategory: 'security',
      action: 'read',
      resourceType: 'pdf',
      resourceId: pdfId,
      status: 'warning',
      severity: 'warning',
      metadata: {
        piiTypes: [...new Set(piiResult.entities.map((e) => e.type))],
        riskScore: piiResult.riskScore,
      },
    });
  }
}
```

---

### 2.4 Data Retention Policies

**Purpose:** Automatically delete or archive data after a specified period (GDPR compliance)

**Database Schema:**

```sql
CREATE TABLE retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  resource_type VARCHAR(50) NOT NULL,   -- 'pdf', 'output', 'audit_log'
  retention_days INTEGER NOT NULL,      -- 30, 90, 365, etc.

  action VARCHAR(20) NOT NULL,          -- 'delete', 'archive'
  archive_destination VARCHAR(255),     -- S3 bucket URL for archival

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Execution log
CREATE TABLE retention_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES retention_policies(id),

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  records_affected INTEGER DEFAULT 0,
  records_deleted INTEGER DEFAULT 0,
  records_archived INTEGER DEFAULT 0,

  status VARCHAR(20) DEFAULT 'running',  -- 'running', 'completed', 'failed'
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation:**

```typescript
// src/lib/retention/retention-service.ts

export class RetentionService {
  async enforceRetentionPolicies(): Promise<void> {
    const policies = await supabase
      .from('retention_policies')
      .select('*')
      .eq('is_active', true);

    for (const policy of policies.data) {
      await this.enforcePolicy(policy);
    }
  }

  async enforcePolicy(policy: RetentionPolicy): Promise<void> {
    const executionId = await this.startExecution(policy.id);

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);

      // Find records older than cutoff date
      const records = await this.findExpiredRecords(policy.resource_type, cutoffDate);

      if (policy.action === 'archive') {
        await this.archiveRecords(policy, records);
      }

      // Delete records
      await this.deleteRecords(policy.resource_type, records);

      await this.completeExecution(executionId, records.length);
    } catch (error: any) {
      await this.failExecution(executionId, error.message);
      throw error;
    }
  }

  private async archiveRecords(policy: RetentionPolicy, records: any[]): Promise<void> {
    // Export to S3 before deletion
    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const archiveData = JSON.stringify(records, null, 2);
    const timestamp = new Date().toISOString().split('T')[0];
    const key = `retention-archives/${policy.resource_type}/${timestamp}.json`;

    await s3.send(
      new PutObjectCommand({
        Bucket: policy.archive_destination,
        Key: key,
        Body: archiveData,
      })
    );
  }

  private async deleteRecords(resourceType: string, records: any[]): Promise<void> {
    const ids = records.map((r) => r.id);

    const tableName = resourceType === 'pdf' ? 'pdfs' :
                      resourceType === 'output' ? 'outputs' :
                      'audit_logs';

    await supabase.from(tableName).delete().in('id', ids);
  }
}

// Cron job (runs daily at 2 AM)
// Schedule with BullMQ or cron
export async function scheduleRetentionEnforcement() {
  const queue = new Queue('retention-enforcement', {
    connection: redisConnection,
  });

  // Run daily at 2 AM
  queue.add(
    'enforce-retention',
    {},
    {
      repeat: {
        pattern: '0 2 * * *',
      },
    }
  );
}
```

---

### 2.5 GDPR Compliance Tools

**Purpose:** Right to access, right to be forgotten, consent management

**Features:**

```typescript
// Data Export (Right to Access)
export async function exportUserData(userId: string): Promise<string> {
  // Gather all user data
  const [user, pdfs, slicers, outputs, auditLogs] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('pdfs').select('*').eq('user_id', userId),
    supabase.from('slicers').select('*').eq('user_id', userId),
    supabase.from('outputs').select('*').eq('user_id', userId),
    supabase.from('audit_logs').select('*').eq('user_id', userId),
  ]);

  const userData = {
    user: user.data,
    pdfs: pdfs.data,
    slicers: slicers.data,
    outputs: outputs.data,
    auditLogs: auditLogs.data,
  };

  // Create ZIP file
  const zip = new JSZip();
  zip.file('user-data.json', JSON.stringify(userData, null, 2));

  // Add PDFs
  for (const pdf of pdfs.data) {
    const pdfFile = await downloadPDFFromStorage(pdf.file_path);
    zip.file(`pdfs/${pdf.file_name}`, pdfFile);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });

  // Upload to temporary storage
  const downloadUrl = await uploadToTemporaryStorage(zipBlob, userId);

  return downloadUrl;
}

// Data Deletion (Right to be Forgotten)
export async function deleteAllUserData(userId: string): Promise<void> {
  // Delete in order (respecting foreign keys)
  await supabase.from('outputs').delete().eq('user_id', userId);
  await supabase.from('pdf_slicers').delete().eq('user_id', userId);
  await supabase.from('slicers').delete().eq('user_id', userId);

  // Delete PDFs from storage
  const pdfs = await supabase.from('pdfs').select('file_path').eq('user_id', userId);
  for (const pdf of pdfs.data) {
    await supabase.storage.from('pdfs').remove([pdf.file_path]);
  }

  await supabase.from('pdfs').delete().eq('user_id', userId);
  await supabase.from('api_keys').delete().eq('user_id', userId);
  await supabase.from('audit_logs').delete().eq('user_id', userId);

  // Finally, delete user
  await supabase.auth.admin.deleteUser(userId);

  // Log deletion
  await auditLogger.log({
    userId,
    eventType: 'user.deleted',
    eventCategory: 'system',
    action: 'delete',
    resourceType: 'user',
    resourceId: userId,
    status: 'success',
    severity: 'info',
  });
}
```

---

## 3. Rollout Plan

### Week 1: Audit Logging
- ✅ Create database schema
- ✅ Implement AuditLogger service
- ✅ Add audit middleware to API routes
- ✅ Build admin UI for viewing audit logs

### Week 2: RBAC
- ✅ Create organizations, roles, members tables
- ✅ Implement PermissionChecker
- ✅ Add permission middleware
- ✅ Build team management UI

### Week 3: PII Detection
- ✅ Integrate AWS Comprehend
- ✅ Add PII detection to PDF processing
- ✅ Build PII report UI
- ✅ Test with sample documents

### Week 4: Data Retention & GDPR
- ✅ Implement retention policies
- ✅ Build data export/deletion tools
- ✅ Consent management UI
- ✅ Privacy policy generator

### Week 5: Testing & Documentation
- ✅ Security audit
- ✅ Penetration testing
- ✅ SOC2 compliance checklist
- ✅ Documentation

---

## 4. Success Metrics

- **Audit Log Coverage:** 100% of sensitive operations logged
- **RBAC Adoption:** 60%+ of customers create teams
- **PII Detection Accuracy:** >95%
- **GDPR Compliance:** 100% (pass audit)

---

## 5. Next Steps

1. ✅ Review and approve
2. ✅ Begin Week 1 (Audit Logging)
3. ✅ Schedule security audit

---

**Document Owner:** Security & Compliance Team
**Last Updated:** November 5, 2025
**Status:** Ready for Implementation
