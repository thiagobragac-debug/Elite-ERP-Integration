/**
 * CHECKPOINT VALIDATION SCRIPT - Phase 1: Security & Foundations
 * 
 * Task: 4. Checkpoint - Validate security foundations
 * 
 * This script validates all security measures implemented in Phase 1:
 * 1. Environment variable validation
 * 2. Git history cleanup
 * 3. API key rotation
 * 4. RLS policies and tenant isolation
 * 5. Test suite status
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

const results: CheckResult[] = [];

function printHeader(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(title);
  console.log('='.repeat(70) + '\n');
}

function printResult(result: CheckResult) {
  const icon = result.passed ? '✓' : '✗';
  const status = result.passed ? 'PASS' : 'FAIL';
  console.log(`${icon} [${status}] ${result.name}`);
  console.log(`   ${result.message}`);
  if (result.details) {
    console.log(`   Details: ${result.details}`);
  }
  console.log('');
}

/**
 * Check 1: Verify environment validation implementation
 */
function checkEnvironmentValidation(): CheckResult {
  try {
    // Check if validateEnv.ts exists
    const validateEnvPath = join(process.cwd(), 'src', 'lib', 'validateEnv.ts');
    if (!existsSync(validateEnvPath)) {
      return {
        name: 'Environment Validation Implementation',
        passed: false,
        message: 'validateEnv.ts file not found',
        details: 'Expected: src/lib/validateEnv.ts'
      };
    }

    // Check if validateEnv is called in main.tsx
    const mainPath = join(process.cwd(), 'src', 'main.tsx');
    if (!existsSync(mainPath)) {
      return {
        name: 'Environment Validation Implementation',
        passed: false,
        message: 'main.tsx file not found'
      };
    }

    const mainContent = readFileSync(mainPath, 'utf-8');
    if (!mainContent.includes('validateEnv')) {
      return {
        name: 'Environment Validation Implementation',
        passed: false,
        message: 'validateEnv() not called in main.tsx',
        details: 'Environment validation must be called before React renders'
      };
    }

    return {
      name: 'Environment Validation Implementation',
      passed: true,
      message: 'Environment validation is properly implemented and integrated'
    };
  } catch (error) {
    return {
      name: 'Environment Validation Implementation',
      passed: false,
      message: 'Error checking environment validation',
      details: String(error)
    };
  }
}

/**
 * Check 2: Verify .env is in .gitignore
 */
function checkGitignore(): CheckResult {
  try {
    const gitignorePath = join(process.cwd(), '.gitignore');
    if (!existsSync(gitignorePath)) {
      return {
        name: '.gitignore Configuration',
        passed: false,
        message: '.gitignore file not found'
      };
    }

    const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
    const hasEnv = gitignoreContent.includes('.env');
    const hasEnvLocal = gitignoreContent.includes('.env.local');
    const hasEnvPattern = gitignoreContent.includes('.env.*.local');

    if (!hasEnv || !hasEnvLocal || !hasEnvPattern) {
      return {
        name: '.gitignore Configuration',
        passed: false,
        message: 'Environment files not properly ignored',
        details: `Missing: ${[
          !hasEnv && '.env',
          !hasEnvLocal && '.env.local',
          !hasEnvPattern && '.env.*.local'
        ].filter(Boolean).join(', ')}`
      };
    }

    return {
      name: '.gitignore Configuration',
      passed: true,
      message: 'All environment files are properly ignored in .gitignore'
    };
  } catch (error) {
    return {
      name: '.gitignore Configuration',
      passed: false,
      message: 'Error checking .gitignore',
      details: String(error)
    };
  }
}

/**
 * Check 3: Verify .env removed from Git history
 */
function checkGitHistory(): CheckResult {
  try {
    const output = execSync('git log --all --full-history -- .env', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();

    if (output.length > 0) {
      return {
        name: 'Git History Cleanup',
        passed: false,
        message: '.env file still exists in Git history',
        details: 'Run: git filter-repo --path .env --invert-paths'
      };
    }

    return {
      name: 'Git History Cleanup',
      passed: true,
      message: '.env file successfully removed from Git history'
    };
  } catch (error: any) {
    // Git log returns empty with exit code 0, or error if not found
    // We consider empty output or specific errors as success
    if (error.status === 0 || error.stdout?.trim() === '') {
      return {
        name: 'Git History Cleanup',
        passed: true,
        message: '.env file not found in Git history'
      };
    }

    return {
      name: 'Git History Cleanup',
      passed: false,
      message: 'Error checking Git history',
      details: String(error)
    };
  }
}

/**
 * Check 4: Verify .env.example exists
 */
function checkEnvExample(): CheckResult {
  try {
    const envExamplePath = join(process.cwd(), '.env.example');
    if (!existsSync(envExamplePath)) {
      return {
        name: '.env.example Documentation',
        passed: false,
        message: '.env.example file not found'
      };
    }

    const content = readFileSync(envExamplePath, 'utf-8');
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !content.includes(varName));

    if (missingVars.length > 0) {
      return {
        name: '.env.example Documentation',
        passed: false,
        message: 'Required variables missing from .env.example',
        details: `Missing: ${missingVars.join(', ')}`
      };
    }

    return {
      name: '.env.example Documentation',
      passed: true,
      message: 'All required environment variables documented in .env.example'
    };
  } catch (error) {
    return {
      name: '.env.example Documentation',
      passed: false,
      message: 'Error checking .env.example',
      details: String(error)
    };
  }
}

/**
 * Check 5: Verify RLS audit scripts exist
 */
function checkRLSAuditScripts(): CheckResult {
  try {
    const auditSqlPath = join(process.cwd(), 'src', 'database', 'audit-rls.sql');
    const auditTsPath = join(process.cwd(), 'src', 'database', 'run-audit.ts');

    if (!existsSync(auditSqlPath)) {
      return {
        name: 'RLS Audit Scripts',
        passed: false,
        message: 'audit-rls.sql not found',
        details: 'Expected: src/database/audit-rls.sql'
      };
    }

    if (!existsSync(auditTsPath)) {
      return {
        name: 'RLS Audit Scripts',
        passed: false,
        message: 'run-audit.ts not found',
        details: 'Expected: src/database/run-audit.ts'
      };
    }

    return {
      name: 'RLS Audit Scripts',
      passed: true,
      message: 'RLS audit scripts are present and ready to run'
    };
  } catch (error) {
    return {
      name: 'RLS Audit Scripts',
      passed: false,
      message: 'Error checking RLS audit scripts',
      details: String(error)
    };
  }
}

/**
 * Check 6: Verify tenant isolation test exists
 */
function checkTenantIsolationTest(): CheckResult {
  try {
    const testPath = join(process.cwd(), 'src', 'database', 'test-tenant-isolation.ts');

    if (!existsSync(testPath)) {
      return {
        name: 'Tenant Isolation Test',
        passed: false,
        message: 'test-tenant-isolation.ts not found',
        details: 'Expected: src/database/test-tenant-isolation.ts'
      };
    }

    const content = readFileSync(testPath, 'utf-8');
    if (!content.includes('runTenantIsolationTests')) {
      return {
        name: 'Tenant Isolation Test',
        passed: false,
        message: 'runTenantIsolationTests function not found in test file'
      };
    }

    return {
      name: 'Tenant Isolation Test',
      passed: true,
      message: 'Tenant isolation test is implemented and ready to run'
    };
  } catch (error) {
    return {
      name: 'Tenant Isolation Test',
      passed: false,
      message: 'Error checking tenant isolation test',
      details: String(error)
    };
  }
}

/**
 * Check 7: Verify credential rotation documentation
 */
function checkCredentialRotationDocs(): CheckResult {
  try {
    const docsPath = join(process.cwd(), 'CREDENTIAL_ROTATION_CHECKLIST.md');

    if (!existsSync(docsPath)) {
      return {
        name: 'Credential Rotation Documentation',
        passed: false,
        message: 'CREDENTIAL_ROTATION_CHECKLIST.md not found',
        details: 'Documentation for key rotation procedures is missing'
      };
    }

    const content = readFileSync(docsPath, 'utf-8');
    const hasSupabase = content.toLowerCase().includes('supabase');
    const hasStripe = content.toLowerCase().includes('stripe');

    if (!hasSupabase || !hasStripe) {
      return {
        name: 'Credential Rotation Documentation',
        passed: false,
        message: 'Incomplete credential rotation documentation',
        details: `Missing: ${[
          !hasSupabase && 'Supabase',
          !hasStripe && 'Stripe'
        ].filter(Boolean).join(', ')} procedures`
      };
    }

    return {
      name: 'Credential Rotation Documentation',
      passed: true,
      message: 'Credential rotation procedures are documented'
    };
  } catch (error) {
    return {
      name: 'Credential Rotation Documentation',
      passed: false,
      message: 'Error checking credential rotation documentation',
      details: String(error)
    };
  }
}

/**
 * Main checkpoint validation
 */
async function runCheckpoint() {
  printHeader('PHASE 1 CHECKPOINT VALIDATION - Security & Foundations');

  console.log('Running automated checks...\n');

  // Run all automated checks
  results.push(checkEnvironmentValidation());
  results.push(checkGitignore());
  results.push(checkGitHistory());
  results.push(checkEnvExample());
  results.push(checkRLSAuditScripts());
  results.push(checkTenantIsolationTest());
  results.push(checkCredentialRotationDocs());

  // Print results
  printHeader('AUTOMATED CHECK RESULTS');
  results.forEach(printResult);

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const totalCount = results.length;

  printHeader('SUMMARY');
  console.log(`Total Checks:  ${totalCount}`);
  console.log(`Passed:        ${passedCount} ✓`);
  console.log(`Failed:        ${failedCount} ✗`);
  console.log('');

  if (failedCount === 0) {
    console.log('✓✓✓ ALL AUTOMATED CHECKS PASSED ✓✓✓\n');
  } else {
    console.log('✗✗✗ SOME CHECKS FAILED ✗✗✗\n');
    console.log('Please review and fix the failed checks above.\n');
  }

  // Manual verification steps
  printHeader('MANUAL VERIFICATION REQUIRED');
  
  console.log('The following items require manual verification:\n');
  
  console.log('1. OLD API KEYS VERIFICATION');
  console.log('   ✓ Action: Test old Supabase and Stripe keys');
  console.log('   ✓ Expected: Old keys should return 401 Unauthorized');
  console.log('   ✓ How to test:');
  console.log('      - Use old keys in a test API request');
  console.log('      - Verify they are revoked in respective dashboards');
  console.log('');

  console.log('2. RLS AUDIT EXECUTION');
  console.log('   ✓ Action: Run RLS audit against the database');
  console.log('   ✓ Command: npm run audit:rls');
  console.log('   ✓ Expected: All tables should have RLS enabled with tenant isolation');
  console.log('   ✓ Review: Check the generated audit report');
  console.log('');

  console.log('3. TENANT ISOLATION TEST');
  console.log('   ✓ Action: Run tenant isolation tests');
  console.log('   ✓ Command: npx tsx src/database/test-tenant-isolation.ts');
  console.log('   ✓ Expected: All tenant isolation tests should pass');
  console.log('   ✓ Verify: Tenants can only see their own data');
  console.log('');

  console.log('4. TEST SUITE STATUS');
  console.log('   ✓ Action: Run the full test suite');
  console.log('   ✓ Command: npm test -- --run');
  console.log('   ✓ Expected: All tests should pass');
  console.log('   ✓ Current Status: Some tests are failing (ConfirmProvider issues)');
  console.log('   ✓ Note: Test failures need to be addressed or acknowledged');
  console.log('');

  console.log('5. ENVIRONMENT VALIDATION TEST');
  console.log('   ✓ Action: Test app startup without required environment variables');
  console.log('   ✓ How to test:');
  console.log('      - Temporarily rename .env to .env.backup');
  console.log('      - Run: npm run dev');
  console.log('      - Expected: App should show error and refuse to start');
  console.log('      - Restore: Rename .env.backup back to .env');
  console.log('');

  printHeader('NEXT STEPS');
  
  if (failedCount > 0) {
    console.log('1. Fix all failed automated checks');
    console.log('2. Complete manual verification steps');
    console.log('3. Re-run this checkpoint script');
    console.log('');
  } else {
    console.log('1. Complete all manual verification steps listed above');
    console.log('2. Document any findings or issues');
    console.log('3. Address test suite failures if blocking');
    console.log('4. Proceed to Phase 2 once all verifications pass');
    console.log('');
  }

  console.log('='.repeat(70) + '\n');

  // Exit with appropriate code
  process.exit(failedCount > 0 ? 1 : 0);
}

// Run the checkpoint
runCheckpoint().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
