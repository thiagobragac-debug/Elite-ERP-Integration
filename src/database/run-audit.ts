/**
 * RLS Audit Runner - Tauze ERP v5.0
 *
 * This script runs Row Level Security (RLS) audit queries against the Supabase database
 * and generates a comprehensive report of findings.
 *
 * Requirements: 3.1, 3.5
 *
 * Usage:
 *   npm run audit:rls
 *   or
 *   npx tsx src/database/run-audit.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

interface AuditResult {
  query: string;
  description: string;
  data: any[];
  error?: string;
}

interface SummaryResult {
  total_tables: number;
  tables_without_rls: number;
  tables_without_policies: number;
  tables_without_tenant_id: number;
  total_policies: number;
  security_status: 'SECURE' | 'CRITICAL' | 'WARNING' | 'UNKNOWN';
}

/**
 * Execute a SQL query and return results
 */
async function executeQuery(sql: string): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    // If rpc is not available, try direct query
    if (error && error.code === '42883') {
      // Fall back to using the REST API
      const { data: directData, error: directError } = await supabase
        .from('_audit_query')
        .select('*');
      return { data: directData, error: directError };
    }

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Query 1: Find tables without RLS enabled
 */
async function findTablesWithoutRLS(): Promise<AuditResult> {
  const sql = `
    SELECT 
      schemaname AS schema_name,
      tablename AS table_name,
      'RLS NOT ENABLED' AS status,
      'CRITICAL' AS severity
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
      AND NOT EXISTS (
        SELECT 1 
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = pg_tables.tablename
          AND c.relrowsecurity = true
      )
    ORDER BY tablename;
  `;

  const { data, error } = await executeQuery(sql);

  return {
    query: 'Tables Without RLS',
    description: 'Tables in the public schema that do NOT have RLS enabled',
    data: data || [],
    error: error?.message,
  };
}

/**
 * Query 2: Find tables with RLS but no policies
 */
async function findTablesWithoutPolicies(): Promise<AuditResult> {
  const sql = `
    SELECT 
      schemaname AS schema_name,
      tablename AS table_name,
      'RLS ENABLED BUT NO POLICIES' AS status,
      'HIGH' AS severity
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
      AND EXISTS (
        SELECT 1 
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = pg_tables.tablename
          AND c.relrowsecurity = true
      )
      AND NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE schemaname = 'public'
          AND tablename = pg_tables.tablename
      )
    ORDER BY tablename;
  `;

  const { data, error } = await executeQuery(sql);

  return {
    query: 'Tables Without Policies',
    description: 'Tables with RLS enabled but no policies defined (will block all access)',
    data: data || [],
    error: error?.message,
  };
}

/**
 * Query 3: Find tables without tenant_id column
 */
async function findTablesWithoutTenantId(): Promise<AuditResult> {
  const sql = `
    SELECT 
      t.table_name,
      'NO TENANT_ID COLUMN' AS status,
      'CRITICAL' AS severity
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name NOT LIKE 'pg_%'
      AND t.table_name NOT LIKE 'sql_%'
      AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = t.table_name
          AND c.column_name = 'tenant_id'
      )
    ORDER BY t.table_name;
  `;

  const { data, error } = await executeQuery(sql);

  return {
    query: 'Tables Without tenant_id',
    description: 'Tables lacking the tenant_id column required for multi-tenant isolation',
    data: data || [],
    error: error?.message,
  };
}

/**
 * Query 4: List all existing RLS policies
 */
async function listAllPolicies(): Promise<AuditResult> {
  const sql = `
    SELECT 
      schemaname AS schema_name,
      tablename AS table_name,
      policyname AS policy_name,
      CASE 
        WHEN cmd = '*' THEN 'ALL'
        WHEN cmd = 'r' THEN 'SELECT'
        WHEN cmd = 'a' THEN 'INSERT'
        WHEN cmd = 'w' THEN 'UPDATE'
        WHEN cmd = 'd' THEN 'DELETE'
        ELSE cmd
      END AS command,
      CASE 
        WHEN permissive THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
      END AS policy_type,
      roles
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;

  const { data, error } = await executeQuery(sql);

  return {
    query: 'Existing RLS Policies',
    description: 'All RLS policies currently configured in the database',
    data: data || [],
    error: error?.message,
  };
}

/**
 * Query 5: Get audit summary
 */
async function getAuditSummary(): Promise<SummaryResult | null> {
  const sql = `
    WITH 
    tables_without_rls AS (
      SELECT COUNT(*) as count
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
        AND NOT EXISTS (
          SELECT 1 
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'
            AND c.relname = pg_tables.tablename
            AND c.relrowsecurity = true
        )
    ),
    tables_without_policies AS (
      SELECT COUNT(*) as count
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
        AND EXISTS (
          SELECT 1 
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'
            AND c.relname = pg_tables.tablename
            AND c.relrowsecurity = true
        )
        AND NOT EXISTS (
          SELECT 1 
          FROM pg_policies 
          WHERE schemaname = 'public'
            AND tablename = pg_tables.tablename
        )
    ),
    tables_without_tenant_id AS (
      SELECT COUNT(*) as count
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT LIKE 'pg_%'
        AND t.table_name NOT LIKE 'sql_%'
        AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns c
          WHERE c.table_schema = 'public'
            AND c.table_name = t.table_name
            AND c.column_name = 'tenant_id'
        )
    ),
    total_tables AS (
      SELECT COUNT(*) as count
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    ),
    total_policies AS (
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE schemaname = 'public'
    )
    SELECT 
      tt.count AS total_tables,
      twor.count AS tables_without_rls,
      twop.count AS tables_without_policies,
      twtid.count AS tables_without_tenant_id,
      tp.count AS total_policies,
      CASE 
        WHEN twor.count = 0 AND twop.count = 0 AND twtid.count = 0 THEN 'SECURE'
        WHEN twor.count > 0 OR twtid.count > 0 THEN 'CRITICAL'
        WHEN twop.count > 0 THEN 'WARNING'
        ELSE 'UNKNOWN'
      END AS security_status
    FROM total_tables tt, tables_without_rls twor, tables_without_policies twop, 
         tables_without_tenant_id twtid, total_policies tp;
  `;

  const { data, error } = await executeQuery(sql);

  if (error || !data || data.length === 0) {
    console.error('Failed to get audit summary:', error);
    return null;
  }

  return data[0] as SummaryResult;
}

/**
 * Format audit results as markdown
 */
function formatMarkdownReport(results: {
  summary: SummaryResult | null;
  tablesWithoutRLS: AuditResult;
  tablesWithoutPolicies: AuditResult;
  tablesWithoutTenantId: AuditResult;
  allPolicies: AuditResult;
}): string {
  const timestamp = new Date().toISOString();

  let report = `# RLS Audit Report - Tauze ERP v5.0\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;
  report += `**Database:** ${supabaseUrl}\n\n`;
  report += `---\n\n`;

  // Executive Summary
  report += `## Executive Summary\n\n`;
  if (results.summary) {
    const s = results.summary;
    report += `| Metric | Count |\n`;
    report += `|--------|-------|\n`;
    report += `| **Total Tables** | ${s.total_tables} |\n`;
    report += `| **Tables Without RLS** | ${s.tables_without_rls} |\n`;
    report += `| **Tables Without Policies** | ${s.tables_without_policies} |\n`;
    report += `| **Tables Without tenant_id** | ${s.tables_without_tenant_id} |\n`;
    report += `| **Total Policies** | ${s.total_policies} |\n`;
    report += `| **Security Status** | **${s.security_status}** |\n\n`;

    // Status interpretation
    if (s.security_status === 'SECURE') {
      report += `✅ **Status:** All tables have RLS enabled with proper tenant isolation.\n\n`;
    } else if (s.security_status === 'CRITICAL') {
      report += `🚨 **Status:** CRITICAL security issues found. Immediate action required.\n\n`;
    } else if (s.security_status === 'WARNING') {
      report += `⚠️ **Status:** Security issues detected. Review and remediate.\n\n`;
    }
  } else {
    report += `⚠️ Unable to generate summary. Check database permissions.\n\n`;
  }

  // Detailed Findings
  report += `---\n\n`;
  report += `## Detailed Findings\n\n`;

  // Tables without RLS
  report += `### 1. Tables Without RLS Enabled\n\n`;
  report += `${results.tablesWithoutRLS.description}\n\n`;
  if (results.tablesWithoutRLS.data.length > 0) {
    report += `**Found ${results.tablesWithoutRLS.data.length} tables:**\n\n`;
    report += `| Table Name | Severity |\n`;
    report += `|------------|----------|\n`;
    results.tablesWithoutRLS.data.forEach((row: any) => {
      report += `| ${row.table_name} | ${row.severity} |\n`;
    });
    report += `\n`;
  } else {
    report += `✅ No tables found without RLS enabled.\n\n`;
  }

  // Tables without policies
  report += `### 2. Tables Without Policies\n\n`;
  report += `${results.tablesWithoutPolicies.description}\n\n`;
  if (results.tablesWithoutPolicies.data.length > 0) {
    report += `**Found ${results.tablesWithoutPolicies.data.length} tables:**\n\n`;
    report += `| Table Name | Severity |\n`;
    report += `|------------|----------|\n`;
    results.tablesWithoutPolicies.data.forEach((row: any) => {
      report += `| ${row.table_name} | ${row.severity} |\n`;
    });
    report += `\n`;
  } else {
    report += `✅ No tables found with RLS but without policies.\n\n`;
  }

  // Tables without tenant_id
  report += `### 3. Tables Without tenant_id Column\n\n`;
  report += `${results.tablesWithoutTenantId.description}\n\n`;
  if (results.tablesWithoutTenantId.data.length > 0) {
    report += `**Found ${results.tablesWithoutTenantId.data.length} tables:**\n\n`;
    report += `| Table Name | Severity |\n`;
    report += `|------------|----------|\n`;
    results.tablesWithoutTenantId.data.forEach((row: any) => {
      report += `| ${row.table_name} | ${row.severity} |\n`;
    });
    report += `\n`;
  } else {
    report += `✅ All tables have tenant_id column.\n\n`;
  }

  // All policies
  report += `### 4. Existing RLS Policies\n\n`;
  report += `${results.allPolicies.description}\n\n`;
  if (results.allPolicies.data.length > 0) {
    report += `**Found ${results.allPolicies.data.length} policies:**\n\n`;
    report += `| Table | Policy Name | Command | Type |\n`;
    report += `|-------|-------------|---------|------|\n`;
    results.allPolicies.data.forEach((row: any) => {
      report += `| ${row.table_name} | ${row.policy_name} | ${row.command} | ${row.policy_type} |\n`;
    });
    report += `\n`;
  } else {
    report += `⚠️ No policies found.\n\n`;
  }

  // Recommendations
  report += `---\n\n`;
  report += `## Recommendations\n\n`;

  if (results.summary?.security_status === 'SECURE') {
    report += `1. ✅ Continue monitoring RLS policies regularly\n`;
    report += `2. ✅ Test tenant isolation after any schema changes\n`;
    report += `3. ✅ Document any exceptions to RLS (shared/reference tables)\n\n`;
  } else {
    report += `1. 🔧 Enable RLS on all tables without it\n`;
    report += `2. 🔧 Create tenant isolation policies for tables lacking them\n`;
    report += `3. 🔧 Add tenant_id column to tables that need multi-tenant isolation\n`;
    report += `4. 🧪 Test tenant isolation using the test script in audit-rls.sql\n`;
    report += `5. 📝 Document all policy changes in the audit log\n\n`;
  }

  report += `---\n\n`;
  report += `## Next Steps\n\n`;
  report += `- Review the SQL templates in \`src/database/audit-rls.sql\`\n`;
  report += `- Apply necessary fixes to tables identified above\n`;
  report += `- Run the audit again to verify fixes\n`;
  report += `- Schedule regular audits (weekly/monthly)\n\n`;

  return report;
}

/**
 * Main audit runner
 */
async function runAudit() {
  console.log('🔍 Starting RLS Audit...\n');

  // Since we can't directly execute SQL via Supabase client without proper RPC,
  // we'll use a workaround by querying the information_schema and pg_* tables
  // through the Supabase REST API

  console.log('⚠️  Note: Direct SQL execution requires database admin access.');
  console.log('This script will attempt to query system tables through Supabase API.\n');

  try {
    // Get summary
    console.log('📊 Fetching audit summary...');
    const summary = await getAuditSummary();

    // Run all queries
    console.log('🔍 Finding tables without RLS...');
    const tablesWithoutRLS = await findTablesWithoutRLS();

    console.log('🔍 Finding tables without policies...');
    const tablesWithoutPolicies = await findTablesWithoutPolicies();

    console.log('🔍 Finding tables without tenant_id...');
    const tablesWithoutTenantId = await findTablesWithoutTenantId();

    console.log('📋 Listing all policies...');
    const allPolicies = await listAllPolicies();

    // Generate report
    console.log('\n📝 Generating report...\n');
    const report = formatMarkdownReport({
      summary,
      tablesWithoutRLS,
      tablesWithoutPolicies,
      tablesWithoutTenantId,
      allPolicies,
    });

    // Save report
    const outputDir = path.join(process.cwd(), 'src', 'database', 'audit-reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `rls-audit-${timestamp}.md`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, report);

    console.log('✅ Audit complete!\n');
    console.log(`📄 Report saved to: ${filepath}\n`);

    // Print summary to console
    if (summary) {
      console.log('='.repeat(60));
      console.log('AUDIT SUMMARY');
      console.log('='.repeat(60));
      console.log(`Total Tables:              ${summary.total_tables}`);
      console.log(`Tables Without RLS:        ${summary.tables_without_rls}`);
      console.log(`Tables Without Policies:   ${summary.tables_without_policies}`);
      console.log(`Tables Without tenant_id:  ${summary.tables_without_tenant_id}`);
      console.log(`Total Policies:            ${summary.total_policies}`);
      console.log(`Security Status:           ${summary.security_status}`);
      console.log('='.repeat(60));
    }
  } catch (error) {
    console.error('\n❌ Audit failed:', error);

    console.log('\n💡 Alternative: Run SQL queries manually');
    console.log('   1. Open Supabase Dashboard > SQL Editor');
    console.log('   2. Copy queries from src/database/audit-rls.sql');
    console.log('   3. Execute each query and document the results\n');

    process.exit(1);
  }
}

// Run the audit
runAudit();
