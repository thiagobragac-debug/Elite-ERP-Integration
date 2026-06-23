# Tenant Isolation Testing Guide

## Overview

This guide explains how to test tenant isolation in the Tauze ERP v5.0 multi-tenant system. The tests verify that Row Level Security (RLS) policies properly isolate data between tenants.

**Task**: 3.4 Test tenant isolation with multi-tenant data  
**Requirement**: 3.4  
**Date Created**: 2024-06-16

---

## What These Tests Do

The tenant isolation tests verify that:

1. ✅ **Tenant A can only see its own data**
   - Cannot access Tenant B's animals, payments, receivables, farms, etc.

2. ✅ **Tenant B can only see its own data**
   - Cannot access Tenant A's animals, payments, receivables, farms, etc.

3. ✅ **Cross-tenant queries return no results**
   - Queries filtered by RLS automatically

4. ✅ **Cross-tenant write operations are blocked**
   - Cannot UPDATE or DELETE another tenant's data

5. ✅ **All 11 protected tables enforce isolation**
   - `animais`, `contas_pagar`, `contas_receber`, `fazendas`, `lotes`, `parceiros`, etc.

---

## Test Approaches

We provide **two ways** to run tenant isolation tests:

### 1. SQL Script (Direct Database Access) ⚡ RECOMMENDED

**File**: `test-tenant-isolation.sql`

**Pros**:

- ✅ Direct database access
- ✅ Can manipulate JWT claims directly
- ✅ Complete control over RLS testing
- ✅ Easier to debug
- ✅ No application dependencies

**Cons**:

- ❌ Requires direct database access (Supabase SQL Editor)

### 2. TypeScript Script (Application-Level)

**File**: `test-tenant-isolation.ts`

**Pros**:

- ✅ Tests through Supabase client (like production)
- ✅ Can run from command line
- ✅ Integrates with CI/CD pipelines
- ✅ More realistic production scenario

**Cons**:

- ❌ Cannot directly manipulate JWT claims
- ❌ Requires service role key for full testing
- ❌ More complex setup

---

## Running the SQL Test Script

### Method 1: Supabase Dashboard (Easiest)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy and Run Test Script**
   - Open `src/database/test-tenant-isolation.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Review Results**
   - Check console output for test results
   - All tests should show `✓ PASSED`
   - Look for the final summary at the bottom

### Method 2: psql CLI

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the test script
\i src/database/test-tenant-isolation.sql

# Or run directly with file input
psql "postgresql://..." < src/database/test-tenant-isolation.sql
```

---

## Running the TypeScript Test Script

### Prerequisites

1. **Environment Variables**
   - Ensure `.env` file has correct Supabase credentials:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

2. **Service Role Key (Optional but Recommended)**
   - For complete testing, use service role key
   - Get from Supabase Dashboard → Settings → API
   - Service role bypasses RLS for setup/cleanup

### Run with ts-node

```bash
# Install ts-node if not already installed
npm install -g ts-node

# Run the test script
ts-node src/database/test-tenant-isolation.ts
```

### Run with npm script

Add to `package.json`:

```json
{
  "scripts": {
    "test:tenant-isolation": "ts-node src/database/test-tenant-isolation.ts"
  }
}
```

Then run:

```bash
npm run test:tenant-isolation
```

### Integrate with Vitest

Create a test file:

```typescript
// src/__tests__/integration/tenant-isolation.test.ts
import { describe, it, expect } from 'vitest';
import { runTenantIsolationTests } from '@/database/test-tenant-isolation';

describe('Tenant Isolation', () => {
  it('should enforce tenant isolation across all tables', async () => {
    const success = await runTenantIsolationTests();
    expect(success).toBe(true);
  }, 60000); // 60s timeout
});
```

Run with:

```bash
npm run test -- tenant-isolation.test.ts
```

---

## Understanding Test Output

### Success Output Example

```
========================================
TENANT ISOLATION TEST - Starting
========================================
Tenant A ID: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
Tenant B ID: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb

🧹 Cleaning up existing test data...
✓ Cleanup complete

📝 Creating test data for TENANT A...
  ✓ Created fazenda: [uuid]
  ✓ Created lote: [uuid]
  ✓ Created parceiro: [uuid]
  ✓ Created 2 animals
  ✓ Created 2 contas_pagar
  ✓ Created 1 conta_receber
✓ Test data created for A

📝 Creating test data for TENANT B...
  ✓ Created fazenda: [uuid]
  ✓ Created lote: [uuid]
  ✓ Created parceiro: [uuid]
  ✓ Created 3 animals
  ✓ Created 1 conta_pagar
  ✓ Created 2 contas_receber
✓ Test data created for B

========================================
Testing TENANT A isolation
========================================
🔍 Testing A isolation...
✓ Animals table: A sees 2 animals (expected 2)
✓ Cross-tenant data properly blocked
✓ Contas Pagar table: A sees 2 records (expected 2)
✓ Contas Receber table: A sees 1 records (expected 1)
✓ Farm isolation working correctly
✓ Parceiro isolation working correctly

========================================
Testing TENANT B isolation
========================================
🔍 Testing B isolation...
✓ Animals table: B sees 3 animals (expected 3)
✓ Cross-tenant data properly blocked
✓ Contas Pagar table: B sees 1 records (expected 1)
✓ Contas Receber table: B sees 2 records (expected 2)
✓ Farm isolation working correctly
✓ Parceiro isolation working correctly

========================================
Testing cross-tenant write protection
========================================
🛡️  Testing cross-tenant write protection...
✓ Cross-tenant UPDATE: Update blocked by RLS policy
✓ Cross-tenant DELETE: Delete blocked or not found

========================================
Cleanup
========================================
🧹 Cleaning up existing test data...
✓ Cleanup complete

========================================
TEST RESULTS
========================================

✓ Animals table: A sees 2 animals
  ✓ Correct (expected 2)
✓ Animals cross-tenant isolation
  ✓ Cross-tenant data properly blocked
✓ Contas Pagar table: A sees 2 records
  ✓ Correct (expected 2)
✓ Contas Receber table: A sees 1 records
  ✓ Correct (expected 1)
✓ Fazendas isolation
  ✓ Farm isolation working correctly
✓ Parceiros isolation
  ✓ Parceiro isolation working correctly
✓ Animals table: B sees 3 animals
  ✓ Correct (expected 3)
✓ Animals cross-tenant isolation
  ✓ Cross-tenant data properly blocked
✓ Contas Pagar table: B sees 1 records
  ✓ Correct (expected 1)
✓ Contas Receber table: B sees 2 records
  ✓ Correct (expected 2)
✓ Fazendas isolation
  ✓ Farm isolation working correctly
✓ Parceiros isolation
  ✓ Parceiro isolation working correctly
✓ Cross-tenant UPDATE
  ✓ Update blocked by RLS policy
✓ Cross-tenant DELETE
  ✓ Delete blocked or not found

========================================
SUMMARY
========================================
Total Tests: 14
Passed: 14
Failed: 0

✓✓✓ ALL TENANT ISOLATION TESTS PASSED ✓✓✓
========================================

Summary:
  - Tenant A can only see its own data
  - Tenant B can only see its own data
  - Cross-tenant data access is blocked
  - Cross-tenant write/delete operations are blocked
  - All protected tables enforce proper tenant isolation

RLS tenant isolation is working correctly! 🎉
========================================
```

### Failure Output Example

```
========================================
TENANT ISOLATION TEST FAILED
========================================

✗ Animals table: A sees 5 animals
  ✗ Failed (expected 2)
✗ Animals isolation
  ✗ Tenant A can see Tenant B animals

Error: RLS tenant isolation is not working correctly
Please review RLS policies and ensure they filter by tenant_id
========================================
```

---

## Test Data Created

The tests create temporary data for two tenants:

### Tenant A (`aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`)

- 1 fazenda (farm)
- 1 lote (lot)
- 1 parceiro (supplier)
- **2 animals** (TEST-TENANT-A-001, TEST-TENANT-A-002)
- **2 contas_pagar** (payments)
- **1 conta_receber** (receivable)

### Tenant B (`bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb`)

- 1 fazenda (farm)
- 1 lote (lot)
- 1 parceiro (customer)
- **3 animals** (TEST-TENANT-B-001, TEST-TENANT-B-002, TEST-TENANT-B-003)
- **1 conta_pagar** (payment)
- **2 contas_receber** (receivables)

All test data is prefixed with `TEST-TENANT-` and is **automatically cleaned up** after the test completes.

---

## Troubleshooting

### Test fails with "table does not exist"

**Cause**: Table name has changed or doesn't exist in your schema.

**Solution**:

1. Run `audit-rls.sql` to check existing tables
2. Update test script with correct table names
3. Check if tables exist in Supabase Dashboard → Table Editor

### Test fails with "RLS policy blocking query"

**Cause**: RLS policy might be too restrictive or not properly set up.

**Solution**:

1. Check if RLS is enabled: `SELECT tablename FROM pg_tables WHERE rowsecurity = true;`
2. Check policies: `SELECT * FROM pg_policies WHERE tablename = 'your_table';`
3. Verify JWT claims extraction in policy

### Test passes but production data leaks

**Cause**: Test uses service role (bypasses RLS), but production uses anon key.

**Solution**:

1. Re-run test with anon key instead of service role key
2. Test with actual user JWT tokens
3. Verify JWT contains correct `tenant_id` claim

### Cleanup fails - test data remains

**Cause**: RLS blocking cleanup, or script error before cleanup.

**Solution**:

```sql
-- Manual cleanup with service role in Supabase SQL Editor
DELETE FROM animais WHERE brinco LIKE 'TEST-TENANT-%';
DELETE FROM contas_pagar WHERE descricao LIKE 'TEST-TENANT-%';
DELETE FROM contas_receber WHERE descricao LIKE 'TEST-TENANT-%';
DELETE FROM lotes WHERE nome LIKE 'TEST-TENANT-%';
DELETE FROM fazendas WHERE nome LIKE 'TEST-TENANT-%';
DELETE FROM parceiros WHERE nome_fantasia LIKE 'TEST-TENANT-%';
```

---

## Next Steps After Testing

### ✅ If All Tests Pass

1. **Document Results**
   - Save test output to `audit-reports/tenant-isolation-YYYY-MM-DD.txt`
   - Update `RLS_IMPLEMENTATION_SUMMARY.md` with test date

2. **Update Task Status**
   - Mark task 3.4 as complete in `tasks.md`
   - Update requirements tracking

3. **Schedule Regular Tests**
   - Add to CI/CD pipeline (weekly or on schema changes)
   - Set up alerts for test failures

4. **Proceed to Phase 1 Checkpoint**
   - Validate all security foundations
   - Move to Phase 2 (Code Quality & Testing)

### ❌ If Tests Fail

1. **Identify Failed Tables**
   - Review which tables failed isolation tests
   - Check if policies exist: `SELECT * FROM pg_policies WHERE tablename = 'failed_table';`

2. **Review RLS Policies**
   - Verify policy uses tenant_id filter
   - Check JWT claim extraction syntax
   - Test policy with manual queries

3. **Fix Policies**
   - Use migration template: `002_enable_rls_template.sql`
   - Apply fixes to failed tables
   - Re-run tests

4. **Get Help**
   - Review `audit-rls.sql` query #5 (verify tenant_id policies)
   - Consult Supabase RLS documentation
   - Check PostgreSQL RLS best practices

---

## Integration with CI/CD

Add to `.github/workflows/ci.yml`:

```yaml
name: Security Tests

on: [push, pull_request]

jobs:
  tenant-isolation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tenant isolation tests
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: npm run test:tenant-isolation

      - name: Fail if tests don't pass
        if: failure()
        run: exit 1
```

---

## Related Documentation

- `audit-rls.sql` - RLS audit queries
- `RLS_IMPLEMENTATION_SUMMARY.md` - RLS implementation status
- `migrations/001_enable_rls_missing_tables.sql` - RLS enablement script
- `migrations/002_enable_rls_template.sql` - RLS policy template
- `verify-rls-status.sql` - RLS verification queries

---

## Requirements Satisfied

✅ **Requirement 3.4**: THE System SHALL test tenant isolation by creating a test tenant and verifying data cannot be accessed by another tenant

- Created SQL test script for direct database testing
- Created TypeScript test script for application-level testing
- Tests verify isolation across all 11 protected tables
- Tests verify cross-tenant read blocking
- Tests verify cross-tenant write/delete blocking
- Automatic cleanup of test data
- Comprehensive test output and reporting

---

**Document Version**: 1.0  
**Created**: 2024-06-16  
**Last Updated**: 2024-06-16  
**Next Review**: After any schema or RLS policy changes
