# Implementation Plan: Enterprise Data Platform Integrations

**Priority:** 🔴 CRITICAL
**Impact:** 90/100
**Effort:** Medium-High (3-4 weeks)
**Owner:** Backend Engineering
**Dependencies:** API Layer (01-api-layer.md)

---

## 1. Overview

### Objective
Enable Slicely to integrate with enterprise data platforms (Snowflake, Databricks, AWS S3, etc.) to export processed PDF data and LLM outputs, unlocking enterprise data workflows and analytics pipelines.

### Success Criteria
- ✅ Export outputs to Snowflake, Databricks, S3, GCS, Azure Blob
- ✅ Scheduled exports (cron-based)
- ✅ OAuth 2.0 authentication for platforms
- ✅ Encrypted credential storage
- ✅ Connection testing before save
- ✅ Export history and retry mechanism
- ✅ Support for multiple formats (JSON, Parquet, CSV, JSONL)

### Business Impact
- **Enables:** Enterprise data workflows, BI/analytics pipelines
- **Required by:** 70%+ of enterprise customers
- **Unlocks:** $50K+ ACV deals

---

## 2. Integration Priority

### Tier 1: Cloud Storage (Quick Wins - Week 1)
**Why First:** Simple to implement, high value, foundation for other integrations

1. **AWS S3**
   - Most popular (32% cloud market share)
   - Simple API (AWS SDK)
   - Use case: Bulk PDF input, export outputs

2. **Azure Blob Storage**
   - Microsoft ecosystem customers
   - Similar to S3

3. **Google Cloud Storage**
   - Google Cloud customers
   - Similar to S3

### Tier 2: Data Warehouses (High Value - Week 2-3)
**Why:** Core requirement for enterprise data analytics

4. **Snowflake**
   - Leading cloud data warehouse
   - Use case: Export LLM outputs for analytics

5. **Databricks**
   - Leading data lakehouse platform
   - Use case: ML workflows, data science

6. **AWS Athena**
   - Serverless SQL on S3
   - Use case: Query outputs directly

7. **BigQuery**
   - Google's data warehouse
   - Use case: GCP customers

### Tier 3: No-Code Automation (Medium Priority - Week 4)
**Why:** Enables non-technical users, rapid adoption

8. **Zapier**
   - Largest no-code platform (6M+ users)
   - Use case: Connect to 5000+ apps

9. **Make (Integromat)**
   - Visual workflow builder
   - Use case: Complex multi-step workflows

10. **n8n**
    - Open-source alternative
    - Use case: Self-hosted customers

### Tier 4: Databases (Future)
11. PostgreSQL, MySQL, MongoDB
    - Direct database writes
    - Use case: Custom app integrations

---

## 3. Technical Architecture

### 3.1 Plugin Architecture

```typescript
// Abstract base class for all integrations
interface DataDestinationPlugin {
  id: string;
  name: string;
  type: DestinationType;
  icon: string;

  // Configuration schema (for UI)
  configSchema: ZodSchema;
  credentialsSchema: ZodSchema;

  // Connection testing
  testConnection(config: any, credentials: any): Promise<boolean>;

  // Export operations
  export(data: ExportData, config: any, credentials: any): Promise<ExportResult>;

  // Supports batch export?
  supportsBatch: boolean;

  // Supported formats
  supportedFormats: ExportFormat[];
}

enum DestinationType {
  CLOUD_STORAGE = 'cloud_storage',
  DATA_WAREHOUSE = 'data_warehouse',
  DATABASE = 'database',
  WEBHOOK = 'webhook',
  NO_CODE = 'no_code',
}

enum ExportFormat {
  JSON = 'json',
  JSONL = 'jsonl',
  CSV = 'csv',
  PARQUET = 'parquet',
  AVRO = 'avro',
}

// Example: S3 Plugin Implementation
class S3Plugin implements DataDestinationPlugin {
  id = 's3';
  name = 'Amazon S3';
  type = DestinationType.CLOUD_STORAGE;
  icon = 'aws-s3.svg';
  supportsBatch = true;
  supportedFormats = [ExportFormat.JSON, ExportFormat.JSONL, ExportFormat.CSV, ExportFormat.PARQUET];

  configSchema = z.object({
    bucket: z.string().min(1),
    region: z.string().default('us-east-1'),
    prefix: z.string().default('slicely/'),
  });

  credentialsSchema = z.object({
    accessKeyId: z.string().min(1),
    secretAccessKey: z.string().min(1),
  });

  async testConnection(config: any, credentials: any): Promise<boolean> {
    const s3 = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });

    try {
      // Try to list bucket
      await s3.send(new HeadBucketCommand({ Bucket: config.bucket }));
      return true;
    } catch (error) {
      throw new Error(`Failed to connect to S3: ${error.message}`);
    }
  }

  async export(data: ExportData, config: any, credentials: any): Promise<ExportResult> {
    const s3 = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });

    // Format data based on requested format
    const formattedData = this.formatData(data, data.format);

    // Generate S3 key
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `${config.prefix}${data.slicerId}/${timestamp}.${data.format}`;

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: formattedData,
        ContentType: this.getContentType(data.format),
      })
    );

    return {
      success: true,
      destination: `s3://${config.bucket}/${key}`,
      recordsExported: data.records.length,
    };
  }

  private formatData(data: ExportData, format: ExportFormat): string | Buffer {
    switch (format) {
      case ExportFormat.JSON:
        return JSON.stringify(data.records, null, 2);

      case ExportFormat.JSONL:
        return data.records.map((r) => JSON.stringify(r)).join('\n');

      case ExportFormat.CSV:
        return this.convertToCSV(data.records);

      case ExportFormat.PARQUET:
        return this.convertToParquet(data.records);
    }
  }
}
```

### 3.2 Database Schema

```sql
-- Data Destinations Table
CREATE TABLE data_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,           -- "Production Snowflake"
  description TEXT,

  plugin_type VARCHAR(50) NOT NULL,     -- 's3', 'snowflake', 'databricks'
  config JSONB NOT NULL,                -- Plugin-specific config (bucket, table, etc.)
  credentials_id UUID REFERENCES encrypted_credentials(id), -- Encrypted credentials

  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMPTZ,
  test_status VARCHAR(50),              -- 'success', 'failed'
  test_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_destinations_user_id ON data_destinations(user_id);
CREATE INDEX idx_data_destinations_plugin_type ON data_destinations(plugin_type);

-- Encrypted Credentials (using Supabase Vault)
CREATE TABLE encrypted_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  plugin_type VARCHAR(50) NOT NULL,

  -- Store encrypted credentials in Supabase Vault
  vault_secret_id UUID NOT NULL,        -- Reference to vault.secrets

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export Jobs Table
CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  slicer_id UUID REFERENCES slicers(id) ON DELETE CASCADE,
  destination_id UUID REFERENCES data_destinations(id) ON DELETE CASCADE,

  export_type VARCHAR(50) NOT NULL,     -- 'manual', 'scheduled', 'webhook_triggered'
  export_format VARCHAR(20) NOT NULL,   -- 'json', 'csv', 'parquet'

  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'exporting', 'completed', 'failed'
  progress NUMERIC(5,2) DEFAULT 0,      -- 0-100%

  records_total INTEGER DEFAULT 0,
  records_exported INTEGER DEFAULT 0,
  bytes_exported BIGINT DEFAULT 0,

  export_destination TEXT,              -- S3 URL, Snowflake table, etc.

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_export_jobs_slicer_id ON export_jobs(slicer_id);
CREATE INDEX idx_export_jobs_destination_id ON export_jobs(destination_id);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_export_jobs_created_at ON export_jobs(created_at);

-- Export Schedules Table (cron-based)
CREATE TABLE export_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,           -- "Daily Snowflake Export"
  description TEXT,

  slicer_id UUID REFERENCES slicers(id) ON DELETE CASCADE,
  destination_id UUID REFERENCES data_destinations(id) ON DELETE CASCADE,

  cron_expression VARCHAR(100) NOT NULL, -- "0 0 * * *" (every day at midnight)
  timezone VARCHAR(50) DEFAULT 'UTC',

  export_format VARCHAR(20) NOT NULL,
  filters JSONB,                        -- Optional filters (date range, etc.)

  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_export_schedules_next_run ON export_schedules(next_run_at) WHERE is_active = true;
CREATE INDEX idx_export_schedules_slicer_id ON export_schedules(slicer_id);
```

### 3.3 Credential Encryption (Supabase Vault)

```typescript
// Store credentials securely using Supabase Vault
import { createClient } from '@supabase/supabase-js';

// Supabase Vault API
async function storeCredentials(
  userId: string,
  pluginType: string,
  credentials: Record<string, any>
): Promise<string> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key required
  );

  // Insert into Vault (encrypted at rest)
  const { data: vaultSecret, error } = await supabase
    .from('vault.secrets')
    .insert({
      name: `${pluginType}_${userId}_${Date.now()}`,
      secret: JSON.stringify(credentials), // Automatically encrypted
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store credentials: ${error.message}`);
  }

  // Store reference in encrypted_credentials table
  const { data: credRecord, error: credError } = await supabase
    .from('encrypted_credentials')
    .insert({
      user_id: userId,
      name: `${pluginType} Credentials`,
      plugin_type: pluginType,
      vault_secret_id: vaultSecret.id,
    })
    .select()
    .single();

  if (credError) {
    throw new Error(`Failed to create credential record: ${credError.message}`);
  }

  return credRecord.id;
}

// Retrieve credentials
async function retrieveCredentials(credentialId: string): Promise<Record<string, any>> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get credential record
  const { data: credRecord, error } = await supabase
    .from('encrypted_credentials')
    .select('vault_secret_id')
    .eq('id', credentialId)
    .single();

  if (error) {
    throw new Error(`Credential not found: ${error.message}`);
  }

  // Retrieve from Vault
  const { data: vaultSecret, error: vaultError } = await supabase
    .from('vault.secrets')
    .select('secret')
    .eq('id', credRecord.vault_secret_id)
    .single();

  if (vaultError) {
    throw new Error(`Failed to retrieve credentials: ${vaultError.message}`);
  }

  return JSON.parse(vaultSecret.decrypted_secret); // Automatically decrypted
}
```

---

## 4. Integration Implementations

### 4.1 AWS S3 Integration

```typescript
// src/lib/integrations/s3.ts

import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';

export const S3ConfigSchema = z.object({
  bucket: z.string().min(1, 'Bucket name is required'),
  region: z.string().default('us-east-1'),
  prefix: z.string().default('slicely/'),
  acl: z.enum(['private', 'public-read', 'public-read-write']).default('private'),
});

export const S3CredentialsSchema = z.object({
  accessKeyId: z.string().min(1, 'Access Key ID is required'),
  secretAccessKey: z.string().min(1, 'Secret Access Key is required'),
});

export class S3Integration implements DataDestinationPlugin {
  id = 's3';
  name = 'Amazon S3';
  type = DestinationType.CLOUD_STORAGE;
  icon = '/integrations/aws-s3.svg';
  supportsBatch = true;
  supportedFormats = [ExportFormat.JSON, ExportFormat.JSONL, ExportFormat.CSV, ExportFormat.PARQUET];

  configSchema = S3ConfigSchema;
  credentialsSchema = S3CredentialsSchema;

  async testConnection(config: z.infer<typeof S3ConfigSchema>, credentials: z.infer<typeof S3CredentialsSchema>): Promise<boolean> {
    const s3 = this.createClient(config, credentials);

    try {
      await s3.send(new HeadBucketCommand({ Bucket: config.bucket }));
      return true;
    } catch (error: any) {
      throw new Error(`S3 connection failed: ${error.message}`);
    }
  }

  async export(data: ExportData, config: any, credentials: any): Promise<ExportResult> {
    const s3 = this.createClient(config, credentials);

    // Generate S3 key with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `${data.slicerName.replace(/\s+/g, '_')}_${timestamp}.${data.format}`;
    const key = `${config.prefix}${filename}`;

    // Format data
    const formattedData = await this.formatData(data.records, data.format);

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: formattedData,
        ContentType: this.getContentType(data.format),
        ACL: config.acl,
        Metadata: {
          slicerId: data.slicerId,
          exportedAt: new Date().toISOString(),
          recordCount: data.records.length.toString(),
        },
      })
    );

    return {
      success: true,
      destination: `s3://${config.bucket}/${key}`,
      recordsExported: data.records.length,
      bytesExported: Buffer.byteLength(formattedData),
    };
  }

  private createClient(config: any, credentials: any): S3Client {
    return new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });
  }

  private async formatData(records: any[], format: ExportFormat): Promise<Buffer | string> {
    switch (format) {
      case ExportFormat.JSON:
        return JSON.stringify(records, null, 2);

      case ExportFormat.JSONL:
        return records.map((r) => JSON.stringify(r)).join('\n');

      case ExportFormat.CSV:
        return this.toCSV(records);

      case ExportFormat.PARQUET:
        return this.toParquet(records);

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private toCSV(records: any[]): string {
    if (records.length === 0) return '';

    // Get all unique keys from all records
    const keys = Array.from(new Set(records.flatMap(Object.keys)));

    // CSV header
    const header = keys.join(',');

    // CSV rows
    const rows = records.map((record) =>
      keys.map((key) => {
        const value = record[key];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    );

    return [header, ...rows].join('\n');
  }

  private async toParquet(records: any[]): Promise<Buffer> {
    // Use parquetjs library
    const { ParquetWriter } = await import('parquetjs');

    // Infer schema from first record
    const schema = this.inferParquetSchema(records[0]);

    // Write to buffer
    const writer = await ParquetWriter.openStream(schema);

    for (const record of records) {
      await writer.appendRow(record);
    }

    await writer.close();

    return writer.outputStream.getContents();
  }

  private getContentType(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.JSON:
        return 'application/json';
      case ExportFormat.JSONL:
        return 'application/x-ndjson';
      case ExportFormat.CSV:
        return 'text/csv';
      case ExportFormat.PARQUET:
        return 'application/octet-stream';
      default:
        return 'application/octet-stream';
    }
  }
}
```

### 4.2 Snowflake Integration

```typescript
// src/lib/integrations/snowflake.ts

import snowflake from 'snowflake-sdk';
import { z } from 'zod';

export const SnowflakeConfigSchema = z.object({
  account: z.string().min(1, 'Account identifier is required'),
  warehouse: z.string().min(1, 'Warehouse is required'),
  database: z.string().min(1, 'Database is required'),
  schema: z.string().default('PUBLIC'),
  table: z.string().min(1, 'Table name is required'),
  createTableIfNotExists: z.boolean().default(true),
});

export const SnowflakeCredentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  // OR use key-pair authentication
  privateKey: z.string().optional(),
  privateKeyPass: z.string().optional(),
});

export class SnowflakeIntegration implements DataDestinationPlugin {
  id = 'snowflake';
  name = 'Snowflake';
  type = DestinationType.DATA_WAREHOUSE;
  icon = '/integrations/snowflake.svg';
  supportsBatch = true;
  supportedFormats = [ExportFormat.JSON]; // Snowflake accepts JSON

  configSchema = SnowflakeConfigSchema;
  credentialsSchema = SnowflakeCredentialsSchema;

  async testConnection(config: any, credentials: any): Promise<boolean> {
    const connection = await this.createConnection(config, credentials);

    try {
      // Test query
      await this.executeQuery(connection, 'SELECT CURRENT_VERSION()');
      await connection.destroy();
      return true;
    } catch (error: any) {
      await connection.destroy();
      throw new Error(`Snowflake connection failed: ${error.message}`);
    }
  }

  async export(data: ExportData, config: any, credentials: any): Promise<ExportResult> {
    const connection = await this.createConnection(config, credentials);

    try {
      // Create table if it doesn't exist
      if (config.createTableIfNotExists) {
        await this.createTable(connection, config, data.records[0]);
      }

      // Insert data
      const inserted = await this.insertRecords(connection, config, data.records);

      await connection.destroy();

      return {
        success: true,
        destination: `${config.database}.${config.schema}.${config.table}`,
        recordsExported: inserted,
      };
    } catch (error: any) {
      await connection.destroy();
      throw new Error(`Snowflake export failed: ${error.message}`);
    }
  }

  private async createConnection(config: any, credentials: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const connection = snowflake.createConnection({
        account: config.account,
        username: credentials.username,
        password: credentials.password,
        warehouse: config.warehouse,
        database: config.database,
        schema: config.schema,
      });

      connection.connect((err, conn) => {
        if (err) {
          reject(new Error(`Failed to connect: ${err.message}`));
        } else {
          resolve(conn);
        }
      });
    });
  }

  private async createTable(connection: any, config: any, sampleRecord: any): Promise<void> {
    // Infer schema from sample record
    const columns = Object.entries(sampleRecord).map(([key, value]) => {
      const type = this.inferSnowflakeType(value);
      return `${key} ${type}`;
    });

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${config.table} (
        id VARCHAR(36) PRIMARY KEY,
        ${columns.join(',\n        ')},
        exported_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `;

    await this.executeQuery(connection, createTableSQL);
  }

  private async insertRecords(connection: any, config: any, records: any[]): Promise<number> {
    // Use Snowflake COPY INTO for bulk insert
    // First, stage data in internal stage

    // For simplicity, use INSERT statements (for small batches)
    // For large batches, use Snowflake's PUT/COPY commands

    const tableName = config.table;

    // Batch insert (1000 records at a time)
    const batchSize = 1000;
    let totalInserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      // Build multi-row INSERT
      const keys = Object.keys(batch[0]);
      const values = batch.map((record) =>
        keys.map((key) => {
          const value = record[key];
          if (value === null || value === undefined) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
          return value;
        }).join(', ')
      );

      const insertSQL = `
        INSERT INTO ${tableName} (${keys.join(', ')})
        VALUES ${values.map((v) => `(${v})`).join(', ')}
      `;

      await this.executeQuery(connection, insertSQL);
      totalInserted += batch.length;
    }

    return totalInserted;
  }

  private inferSnowflakeType(value: any): string {
    if (typeof value === 'string') return 'VARCHAR(16777216)';
    if (typeof value === 'number') return Number.isInteger(value) ? 'INTEGER' : 'FLOAT';
    if (typeof value === 'boolean') return 'BOOLEAN';
    if (value instanceof Date) return 'TIMESTAMP_NTZ';
    if (typeof value === 'object') return 'VARIANT'; // JSON type
    return 'VARCHAR(16777216)';
  }

  private executeQuery(connection: any, sql: string): Promise<any> {
    return new Promise((resolve, reject) => {
      connection.execute({
        sqlText: sql,
        complete: (err: any, stmt: any, rows: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        },
      });
    });
  }
}
```

### 4.3 Databricks Integration

```typescript
// src/lib/integrations/databricks.ts

import { z } from 'zod';
import axios from 'axios';

export const DatabricksConfigSchema = z.object({
  workspace_url: z.string().url('Invalid workspace URL'),
  catalog: z.string().min(1, 'Catalog is required'),
  schema: z.string().min(1, 'Schema is required'),
  table: z.string().min(1, 'Table name is required'),
  cluster_id: z.string().optional(), // Optional: use serverless SQL warehouse instead
  sql_warehouse_id: z.string().optional(),
});

export const DatabricksCredentialsSchema = z.object({
  access_token: z.string().min(1, 'Access token is required'),
});

export class DatabricksIntegration implements DataDestinationPlugin {
  id = 'databricks';
  name = 'Databricks';
  type = DestinationType.DATA_WAREHOUSE;
  icon = '/integrations/databricks.svg';
  supportsBatch = true;
  supportedFormats = [ExportFormat.JSON, ExportFormat.PARQUET];

  configSchema = DatabricksConfigSchema;
  credentialsSchema = DatabricksCredentialsSchema;

  async testConnection(config: any, credentials: any): Promise<boolean> {
    try {
      // Test by listing catalogs
      const response = await axios.get(
        `${config.workspace_url}/api/2.1/unity-catalog/catalogs`,
        {
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
          },
        }
      );

      return response.status === 200;
    } catch (error: any) {
      throw new Error(`Databricks connection failed: ${error.message}`);
    }
  }

  async export(data: ExportData, config: any, credentials: any): Promise<ExportResult> {
    // Upload data to DBFS (Databricks File System)
    const dbfsPath = await this.uploadToDBFS(data, config, credentials);

    // Create table if not exists
    await this.createTable(config, credentials, data.records[0]);

    // Use COPY INTO to load data from DBFS into Delta table
    await this.copyIntoTable(config, credentials, dbfsPath, data.format);

    return {
      success: true,
      destination: `${config.catalog}.${config.schema}.${config.table}`,
      recordsExported: data.records.length,
    };
  }

  private async uploadToDBFS(data: ExportData, config: any, credentials: any): Promise<string> {
    // Format data
    const content = data.format === ExportFormat.JSON
      ? JSON.stringify(data.records)
      : await this.toParquet(data.records);

    const dbfsPath = `/tmp/slicely/${data.slicerId}/${Date.now()}.${data.format}`;

    // Upload to DBFS using REST API
    await axios.post(
      `${config.workspace_url}/api/2.0/dbfs/put`,
      {
        path: dbfsPath,
        contents: Buffer.from(content).toString('base64'),
        overwrite: true,
      },
      {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
      }
    );

    return dbfsPath;
  }

  private async createTable(config: any, credentials: any, sampleRecord: any): Promise<void> {
    // Infer schema
    const columns = Object.entries(sampleRecord).map(([key, value]) => {
      const type = this.inferSparkType(value);
      return `${key} ${type}`;
    });

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${config.catalog}.${config.schema}.${config.table} (
        ${columns.join(',\n        ')}
      )
      USING DELTA
    `;

    await this.executeSQL(config, credentials, createTableSQL);
  }

  private async copyIntoTable(config: any, credentials: any, dbfsPath: string, format: ExportFormat): Promise<void> {
    const fileFormat = format === ExportFormat.JSON ? 'JSON' : 'PARQUET';

    const copySQL = `
      COPY INTO ${config.catalog}.${config.schema}.${config.table}
      FROM 'dbfs:${dbfsPath}'
      FILEFORMAT = ${fileFormat}
    `;

    await this.executeSQL(config, credentials, copySQL);
  }

  private async executeSQL(config: any, credentials: any, sql: string): Promise<any> {
    const warehouseId = config.sql_warehouse_id;

    if (!warehouseId) {
      throw new Error('SQL Warehouse ID is required');
    }

    // Execute SQL using Databricks SQL Statement API
    const response = await axios.post(
      `${config.workspace_url}/api/2.0/sql/statements`,
      {
        warehouse_id: warehouseId,
        statement: sql,
        wait_timeout: '30s',
      },
      {
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
        },
      }
    );

    return response.data;
  }

  private inferSparkType(value: any): string {
    if (typeof value === 'string') return 'STRING';
    if (typeof value === 'number') return Number.isInteger(value) ? 'BIGINT' : 'DOUBLE';
    if (typeof value === 'boolean') return 'BOOLEAN';
    if (value instanceof Date) return 'TIMESTAMP';
    if (typeof value === 'object') return 'STRING'; // Store as JSON string
    return 'STRING';
  }

  private async toParquet(records: any[]): Promise<Buffer> {
    // Reuse S3Integration's toParquet method
    const s3Integration = new S3Integration();
    return await s3Integration['toParquet'](records);
  }
}
```

### 4.4 Zapier Integration

```typescript
// Zapier integration uses Zapier Platform CLI
// Create a Zapier app at https://zapier.com/app/developer

// zapier-app/index.js

const authentication = {
  type: 'custom',
  fields: [
    {
      key: 'apiKey',
      label: 'API Key',
      required: true,
      type: 'string',
      helpText: 'Get your API key from Slicely Settings > API Keys',
    },
  ],
  test: async (z, bundle) => {
    // Test API key by calling /api/v1/me
    const response = await z.request({
      url: 'https://api.slicely.com/v1/me',
      headers: {
        Authorization: `Bearer ${bundle.authData.apiKey}`,
      },
    });

    return response.json;
  },
};

// Triggers
const newOutputTrigger = {
  key: 'new_output',
  noun: 'Output',
  display: {
    label: 'New Output',
    description: 'Triggers when a new output is created from processing a PDF.',
  },

  operation: {
    perform: async (z, bundle) => {
      const response = await z.request({
        url: 'https://api.slicely.com/v1/outputs',
        headers: {
          Authorization: `Bearer ${bundle.authData.apiKey}`,
        },
        params: {
          limit: 100,
          sort: '-created_at',
        },
      });

      return response.json.outputs;
    },

    sample: {
      id: '123',
      slicer_id: '456',
      slicer_name: 'Invoice Processor',
      pdf_id: '789',
      pdf_name: 'invoice.pdf',
      text_content: 'Extracted text...',
      created_at: '2025-11-05T10:00:00Z',
    },
  },
};

const processingCompletedTrigger = {
  key: 'processing_completed',
  noun: 'Processing',
  display: {
    label: 'Processing Completed',
    description: 'Triggers when PDF processing is completed.',
  },

  operation: {
    type: 'hook',
    performSubscribe: async (z, bundle) => {
      // Subscribe to webhook
      const response = await z.request({
        url: 'https://api.slicely.com/v1/webhooks',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bundle.authData.apiKey}`,
        },
        body: {
          url: bundle.targetUrl,
          events: ['processing.completed'],
        },
      });

      return response.json;
    },

    performUnsubscribe: async (z, bundle) => {
      // Unsubscribe from webhook
      await z.request({
        url: `https://api.slicely.com/v1/webhooks/${bundle.subscribeData.id}`,
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${bundle.authData.apiKey}`,
        },
      });
    },

    perform: async (z, bundle) => {
      // Zapier will automatically parse the webhook payload
      return [bundle.cleanedRequest];
    },

    sample: {
      event: 'processing.completed',
      slicer_id: '456',
      slicer_name: 'Invoice Processor',
      pdf_id: '789',
      pdf_name: 'invoice.pdf',
      status: 'completed',
      outputs_count: 5,
    },
  },
};

// Actions
const uploadPDFAction = {
  key: 'upload_pdf',
  noun: 'PDF',
  display: {
    label: 'Upload PDF',
    description: 'Upload a PDF document to Slicely.',
  },

  operation: {
    inputFields: [
      {
        key: 'file',
        label: 'PDF File',
        type: 'file',
        required: true,
      },
      {
        key: 'is_template',
        label: 'Is Template',
        type: 'boolean',
        default: 'false',
      },
    ],

    perform: async (z, bundle) => {
      const formData = new FormData();
      formData.append('file', bundle.inputData.file);
      formData.append('is_template', bundle.inputData.is_template);

      const response = await z.request({
        url: 'https://api.slicely.com/v1/pdfs',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bundle.authData.apiKey}`,
        },
        body: formData,
      });

      return response.json;
    },

    sample: {
      id: '789',
      file_name: 'invoice.pdf',
      file_processing_status: 'pending',
      created_at: '2025-11-05T10:00:00Z',
    },
  },
};

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication,

  triggers: {
    [newOutputTrigger.key]: newOutputTrigger,
    [processingCompletedTrigger.key]: processingCompletedTrigger,
  },

  actions: {
    [uploadPDFAction.key]: uploadPDFAction,
  },
};
```

---

## 5. UI/UX Design

### 5.1 Data Destinations Page

```typescript
// src/app/(pages)/settings/data-destinations/page.tsx

export default function DataDestinationsPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Data Destinations</h1>
          <p className="text-muted-foreground mt-2">
            Connect Slicely to your data warehouse, cloud storage, or other platforms
          </p>
        </div>

        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Destination
        </Button>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {AVAILABLE_INTEGRATIONS.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <img src={integration.icon} alt={integration.name} className="h-10 w-10" />
                <div>
                  <CardTitle>{integration.name}</CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{integration.useCase}</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleAddIntegration(integration)}
              >
                Connect
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connected Destinations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Connected Destinations</h2>

        {destinations.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No destinations connected yet</p>
              <Button variant="link" onClick={() => setShowAddDialog(true)}>
                Connect your first destination
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {destinations.map((destination) => (
              <Card key={destination.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={getIntegrationIcon(destination.plugin_type)}
                        alt={destination.name}
                        className="h-8 w-8"
                      />
                      <div>
                        <CardTitle className="text-lg">{destination.name}</CardTitle>
                        <CardDescription>{destination.description}</CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {destination.test_status === 'success' && (
                        <Badge variant="success">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Connected
                        </Badge>
                      )}

                      {destination.test_status === 'failed' && (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Connection Failed
                        </Badge>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTestConnection(destination)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Test Connection
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditDestination(destination)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteDestination(destination)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">{formatPluginType(destination.plugin_type)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Tested</p>
                      <p className="font-medium">
                        {destination.last_tested_at
                          ? formatDistanceToNow(new Date(destination.last_tested_at), { addSuffix: true })
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  {destination.test_status === 'failed' && destination.test_error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Connection Error</AlertTitle>
                      <AlertDescription>{destination.test_error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5.2 Export Configuration Dialog

```typescript
// Export configuration in Slicer Settings

<Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Configure Export</DialogTitle>
      <DialogDescription>
        Set up automatic export of outputs to your data destination
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      {/* Destination Selection */}
      <div>
        <Label>Destination</Label>
        <Select value={exportConfig.destinationId} onValueChange={(v) => setExportConfig({ ...exportConfig, destinationId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select destination" />
          </SelectTrigger>
          <SelectContent>
            {destinations.map((dest) => (
              <SelectItem key={dest.id} value={dest.id}>
                <div className="flex items-center gap-2">
                  <img src={getIntegrationIcon(dest.plugin_type)} className="h-4 w-4" />
                  {dest.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Export Format */}
      <div>
        <Label>Export Format</Label>
        <Select value={exportConfig.format} onValueChange={(v) => setExportConfig({ ...exportConfig, format: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="jsonl">JSON Lines</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="parquet">Parquet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Schedule */}
      <div>
        <Label>Schedule</Label>
        <div className="flex items-center gap-2">
          <Select value={exportConfig.scheduleType} onValueChange={(v) => setExportConfig({ ...exportConfig, scheduleType: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual Only</SelectItem>
              <SelectItem value="after_processing">After Processing</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>

          {exportConfig.scheduleType === 'scheduled' && (
            <Input
              placeholder="Cron expression (e.g., 0 0 * * *)"
              value={exportConfig.cronExpression}
              onChange={(e) => setExportConfig({ ...exportConfig, cronExpression: e.target.value })}
            />
          )}
        </div>

        {exportConfig.scheduleType === 'scheduled' && (
          <p className="text-sm text-muted-foreground mt-1">
            Next run: {cronToHumanReadable(exportConfig.cronExpression)}
          </p>
        )}
      </div>

      {/* Export Preview */}
      <div>
        <Label>What will be exported?</Label>
        <Card className="mt-2">
          <CardContent className="pt-4">
            <ul className="space-y-1 text-sm">
              <li>✅ All outputs for this slicer</li>
              <li>✅ LLM outputs (structured data)</li>
              <li>✅ Metadata (PDF name, page number, timestamps)</li>
              <li>❌ Original PDF files (use separate S3 sync)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setShowExportDialog(false)}>
        Cancel
      </Button>
      <Button onClick={handleSaveExportConfig}>
        Save Configuration
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

```typescript
describe('S3Integration', () => {
  let integration: S3Integration;

  beforeEach(() => {
    integration = new S3Integration();
  });

  test('should validate config schema', () => {
    const validConfig = {
      bucket: 'my-bucket',
      region: 'us-east-1',
      prefix: 'slicely/',
    };

    expect(() => integration.configSchema.parse(validConfig)).not.toThrow();

    const invalidConfig = {
      bucket: '', // empty
    };

    expect(() => integration.configSchema.parse(invalidConfig)).toThrow();
  });

  test('should format data as JSON', async () => {
    const records = [
      { id: '1', name: 'Test' },
      { id: '2', name: 'Test 2' },
    ];

    const formatted = await integration['formatData'](records, ExportFormat.JSON);
    expect(formatted).toContain('"id": "1"');
    expect(formatted).toContain('"name": "Test"');
  });

  test('should format data as CSV', async () => {
    const records = [
      { id: '1', name: 'Test' },
      { id: '2', name: 'Test 2' },
    ];

    const formatted = await integration['formatData'](records, ExportFormat.CSV);
    expect(formatted).toContain('id,name');
    expect(formatted).toContain('1,Test');
    expect(formatted).toContain('2,Test 2');
  });
});
```

### 6.2 Integration Tests

```typescript
describe('S3Integration - End-to-End', () => {
  let integration: S3Integration;
  let testConfig: any;
  let testCredentials: any;

  beforeAll(() => {
    integration = new S3Integration();

    testConfig = {
      bucket: process.env.TEST_S3_BUCKET!,
      region: 'us-east-1',
      prefix: 'test/',
    };

    testCredentials = {
      accessKeyId: process.env.TEST_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.TEST_AWS_SECRET_ACCESS_KEY!,
    };
  });

  test('should connect to S3', async () => {
    const result = await integration.testConnection(testConfig, testCredentials);
    expect(result).toBe(true);
  });

  test('should export data to S3', async () => {
    const testData: ExportData = {
      slicerId: 'test-slicer',
      slicerName: 'Test Slicer',
      format: ExportFormat.JSON,
      records: [
        { id: '1', text: 'Test output' },
        { id: '2', text: 'Test output 2' },
      ],
    };

    const result = await integration.export(testData, testConfig, testCredentials);

    expect(result.success).toBe(true);
    expect(result.recordsExported).toBe(2);
    expect(result.destination).toContain('s3://');
  });
});
```

---

## 7. Rollout Plan

### Week 1: Cloud Storage (S3, Azure Blob, GCS)
- ✅ Implement S3 plugin
- ✅ Implement Azure Blob plugin
- ✅ Implement GCS plugin
- ✅ UI for adding destinations
- ✅ Test connections
- ✅ Manual exports

### Week 2: Snowflake
- ✅ Implement Snowflake plugin
- ✅ OAuth authentication
- ✅ Table creation
- ✅ Bulk insert
- ✅ Testing

### Week 3: Databricks + Scheduled Exports
- ✅ Implement Databricks plugin
- ✅ Delta table integration
- ✅ Implement cron-based scheduler
- ✅ Export job queue (BullMQ)
- ✅ Export history UI

### Week 4: Zapier + Polish
- ✅ Build Zapier app
- ✅ Submit for review
- ✅ Documentation
- ✅ Bug fixes
- ✅ Performance optimization

---

## 8. Success Metrics

### Technical Metrics
- **Export Success Rate:** > 99%
- **Export Speed:** < 5 seconds for 1000 records
- **Connection Test Time:** < 3 seconds
- **Job Retry Success Rate:** > 95%

### Business Metrics
- **Adoption:** 40%+ of enterprise customers use integrations
- **Most Popular:** S3 (60%), Snowflake (30%), Databricks (20%)
- **Export Volume:** 1M+ records exported per month
- **Feature NPS:** 70+ (strong satisfaction)

---

## 9. Risk Mitigation

### Risk 1: Credential Security
**Mitigation:** Use Supabase Vault, encrypt at rest, audit log access

### Risk 2: Export Failures
**Mitigation:** Retry logic (3 attempts), dead letter queue, alerts

### Risk 3: Performance Degradation
**Mitigation:** Async exports, job queue, batch processing

### Risk 4: Cost Overruns (data transfer)
**Mitigation:** Compression, batch exports, cost alerts

---

## 10. Next Steps

1. ✅ Review and approve this plan
2. ✅ Set up AWS/Snowflake/Databricks test accounts
3. ✅ Provision Supabase Vault
4. ✅ Begin Week 1 (Cloud Storage integrations)
5. ✅ Schedule weekly demos

---

**Document Owner:** Backend Engineering Team
**Last Updated:** November 5, 2025
**Status:** Ready for Implementation
**Approvers:** Product, Engineering Lead, CTO
