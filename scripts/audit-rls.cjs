#!/usr/bin/env node

/**
 * RLS Audit Script - Simple Version
 * 
 * This script queries the Supabase database to audit RLS configuration.
 * It uses simple fetch calls to query system tables through the REST API.
 * 
 * Usage: node audit-rls.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env file');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔍 RLS Audit Tool - Tauze ERP v5.0\n');
console.log('=' . repeat(60));
console.log(`Database: ${SUPABASE_URL}`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log('=' . repeat(60));
console.log('');

/**
 * Query Supabase using REST API
 */
async function querySupabase(table, select = '*', filters = {}) {
  const params = new URLSearchParams({
    select,
    ...filters
  });

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'count=exact'
    }
  });

  if (!response.ok) {
    throw new Error(`Query failed: ${response.statusText}`);
  }

  const data = await response.json();
  const count = response.headers.get('content-range')?.split('/')[1];
  
  return { data, count: count ? parseInt(count) : data.length };
}

/**
 * Get list of all tables in public schema
 */
async function getAllTables() {
  console.log('📊 Fetching list of all tables...');
  
  try {
    // We'll use information_schema if accessible, otherwise fall back to querying known tables
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'sql_%'
      ORDER BY table_name
    `;
    
    // Since we can't execute raw SQL directly, we'll document the known tables
    const knownTables = [
      'animais', 'abastecimentos', 'contas_pagar', 'contas_receber',
      'parceiros', 'fazendas', 'lotes', 'insumos', 'estoque',
      'pedidos_compra', 'pedidos_venda', 'veiculos', 'manutencoes',
      'audit_logs', 'market_quotes', 'approval_queue', 'approval_rules',
      'user_drafts', 'certificados_digitais', 'market_import_logs'
    ];
    
    console.log(`   Found ${knownTables.length} known tables\n`);
    return knownTables;
  } catch (error) {
    console.error('   ⚠️  Could not fetch table list automatically');
    console.error(`   Error: ${error.message}\n`);
    return [];
  }
}

/**
 * Check if a table has tenant_id column
 */
async function checkTableStructure(tableName) {
  try {
    // Try to query the table with tenant_id - if it fails, column doesn't exist
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${tableName}?select=tenant_id&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    );
    
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate audit report
 */
async function runAudit() {
  const tables = await getAllTables();
  
  if (tables.length === 0) {
    console.log('⚠️  No tables found or unable to query database.');
    console.log('💡 Please run the manual audit steps instead:');
    console.log('   See: src/database/audit-manual-steps.md\n');
    return;
  }

  console.log('🔍 Checking table configurations...\n');
  
  const results = {
    tablesChecked: [],
    tablesWithoutTenantId: [],
    tablesAccessible: [],
    tablesRestricted: [],
    timestamp: new Date().toISOString()
  };

  for (const table of tables) {
    process.stdout.write(`   Checking ${table}... `);
    
    try {
      // Test if we can access the table
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          }
        }
      );

      if (response.ok) {
        console.log('✅ accessible');
        results.tablesAccessible.push(table);
        
        // Check for tenant_id
        const hasTenantId = await checkTableStructure(table);
        if (!hasTenantId) {
          results.tablesWithoutTenantId.push(table);
        }
      } else if (response.status === 401 || response.status === 403) {
        console.log('🔒 restricted (RLS may be enabled)');
        results.tablesRestricted.push(table);
      } else {
        console.log(`⚠️  error (${response.status})`);
      }
      
      results.tablesChecked.push(table);
      
    } catch (error) {
      console.log(`❌ failed: ${error.message}`);
    }
  }

  console.log('');
  console.log('=' . repeat(60));
  console.log('AUDIT RESULTS');
  console.log('=' . repeat(60));
  console.log('');
  console.log(`Total tables checked:           ${results.tablesChecked.length}`);
  console.log(`Tables accessible:              ${results.tablesAccessible.length}`);
  console.log(`Tables restricted:              ${results.tablesRestricted.length}`);
  console.log(`Tables without tenant_id:       ${results.tablesWithoutTenantId.length}`);
  console.log('');

  if (results.tablesWithoutTenantId.length > 0) {
    console.log('⚠️  Tables WITHOUT tenant_id column:');
    results.tablesWithoutTenantId.forEach(table => {
      console.log(`   - ${table}`);
    });
    console.log('');
  }

  if (results.tablesRestricted.length > 0) {
    console.log('🔒 Restricted tables (likely have RLS):');
    results.tablesRestricted.forEach(table => {
      console.log(`   - ${table}`);
    });
    console.log('');
  }

  // Generate report
  const reportDir = path.join(__dirname, 'src', 'database', 'audit-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportPath = path.join(reportDir, `rls-audit-${timestamp}.md`);

  const report = generateMarkdownReport(results);
  fs.writeFileSync(reportPath, report);

  console.log('=' . repeat(60));
  console.log(`✅ Audit complete!`);
  console.log(`📄 Report saved to: ${reportPath}`);
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('   1. Review the report in src/database/audit-reports/');
  console.log('   2. Run manual SQL queries for detailed analysis:');
  console.log('      See: src/database/audit-manual-steps.md');
  console.log('   3. Compare with audit-rls.sql for comprehensive checks');
  console.log('=' . repeat(60));
  console.log('');
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(results) {
  let report = `# RLS Audit Report - Tauze ERP v5.0\n\n`;
  report += `**Generated:** ${results.timestamp}\n`;
  report += `**Database:** ${SUPABASE_URL}\n`;
  report += `**Audit Type:** Automated API-based Audit\n\n`;
  report += `---\n\n`;

  report += `## Summary\n\n`;
  report += `| Metric | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Tables Checked | ${results.tablesChecked.length} |\n`;
  report += `| Tables Accessible (anon key) | ${results.tablesAccessible.length} |\n`;
  report += `| Tables Restricted | ${results.tablesRestricted.length} |\n`;
  report += `| Tables Without tenant_id | ${results.tablesWithoutTenantId.length} |\n\n`;

  report += `## Interpretation\n\n`;
  report += `- **Accessible Tables:** Can be queried with anonymous key (may indicate missing RLS)\n`;
  report += `- **Restricted Tables:** Return 401/403 errors (likely have RLS enabled)\n`;
  report += `- **Without tenant_id:** Missing multi-tenant isolation column\n\n`;

  report += `---\n\n`;

  if (results.tablesAccessible.length > 0) {
    report += `## ✅ Accessible Tables\n\n`;
    report += `These tables can be accessed with the anonymous key:\n\n`;
    results.tablesAccessible.forEach(table => {
      report += `- \`${table}\`\n`;
    });
    report += `\n⚠️  **Warning:** If these are tenant-specific tables, they should have RLS policies.\n\n`;
  }

  if (results.tablesRestricted.length > 0) {
    report += `## 🔒 Restricted Tables\n\n`;
    report += `These tables are restricted (likely have RLS enabled):\n\n`;
    results.tablesRestricted.forEach(table => {
      report += `- \`${table}\`\n`;
    });
    report += `\n✅ Good! These tables appear to have access controls in place.\n\n`;
  }

  if (results.tablesWithoutTenantId.length > 0) {
    report += `## ⚠️  Tables Without tenant_id Column\n\n`;
    results.tablesWithoutTenantId.forEach(table => {
      report += `- \`${table}\`\n`;
    });
    report += `\n**Note:** Some tables (like audit_logs, market_quotes) may intentionally not have tenant_id if they're shared/reference tables.\n\n`;
  }

  report += `---\n\n`;
  report += `## Limitations\n\n`;
  report += `This automated audit has limitations:\n\n`;
  report += `1. ❌ Cannot check if RLS is actually enabled (requires pg_tables access)\n`;
  report += `2. ❌ Cannot list policies (requires pg_policies access)\n`;
  report += `3. ❌ Cannot verify tenant isolation logic\n`;
  report += `4. ✅ Can detect accessibility and basic structure\n\n`;

  report += `## Recommendations\n\n`;
  report += `1. 🔍 Run the manual SQL audit for comprehensive analysis:\n`;
  report += `   - Open Supabase Dashboard > SQL Editor\n`;
  report += `   - Follow steps in \`src/database/audit-manual-steps.md\`\n`;
  report += `   - Execute queries from \`src/database/audit-rls.sql\`\n\n`;
  report += `2. 📋 Review accessible tables and add RLS if needed\n\n`;
  report += `3. 🧪 Test tenant isolation using the test script\n\n`;
  report += `4. 📝 Document findings and create action items\n\n`;

  report += `---\n\n`;
  report += `## Next Steps\n\n`;
  report += `- [ ] Complete manual SQL audit (required for full analysis)\n`;
  report += `- [ ] Enable RLS on accessible tables that need it\n`;
  report += `- [ ] Create tenant isolation policies\n`;
  report += `- [ ] Add tenant_id to tables missing it\n`;
  report += `- [ ] Test tenant isolation\n`;
  report += `- [ ] Schedule next audit (1 month)\n\n`;

  return report;
}

// Run the audit
runAudit().catch(error => {
  console.error('\n❌ Audit failed:', error.message);
  console.error('\n💡 Try the manual audit instead:');
  console.error('   See: src/database/audit-manual-steps.md\n');
  process.exit(1);
});
