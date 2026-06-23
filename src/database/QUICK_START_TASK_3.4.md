# Quick Start Guide - Task 3.4: Test Tenant Isolation

## ⚡ 30-Second Quick Start

Want to verify tenant isolation is working? Follow these steps:

### Option 1: SQL Script (RECOMMENDED) ⭐

1. Open https://supabase.com/dashboard
2. Go to **SQL Editor** → **New query**
3. Copy contents of `src/database/test-tenant-isolation.sql`
4. Paste and click **Run**
5. ✅ Look for "ALL TENANT ISOLATION TESTS PASSED"

**That's it!** 🎉

---

### Option 2: Node.js Runner (Quick Check)

```bash
node run-tenant-isolation-test.mjs
```

**Note**: This shows instructions and runs a simplified test.

---

## 📋 What the Test Does

The test verifies:

✅ **Tenant A** can only see its own 2 animals, 2 payables, 1 receivable  
✅ **Tenant B** can only see its own 3 animals, 1 payable, 2 receivables  
✅ **Cross-tenant access** is completely blocked  
✅ **Write/delete protection** prevents data tampering

---

## 🎯 Success Looks Like

```
✓ Animals table: Tenant A isolation PASSED
✓ Contas Pagar table: Tenant A isolation PASSED
✓ Contas Receber table: Tenant A isolation PASSED
✓ Animals table: Tenant B isolation PASSED
✓ Contas Pagar table: Tenant B isolation PASSED
✓ Contas Receber table: Tenant B isolation PASSED
✓ Write protection: Tenant B cannot update Tenant A data
✓ Delete protection: Tenant B cannot delete Tenant A data

✓✓✓ ALL TENANT ISOLATION TESTS PASSED ✓✓✓

RLS tenant isolation is working correctly! 🎉
```

---

## ❌ Failure Looks Like

```
✗ Animals table: A sees 5 animals
  ✗ Failed (expected 2)
✗ Animals isolation
  ✗ Tenant A can see Tenant B animals

Error: RLS tenant isolation is not working correctly
```

**What to do**:

1. Check if RLS is enabled on all tables
2. Run `verify-rls-status.sql` to check policy status
3. Review policies with `SELECT * FROM pg_policies;`

---

## 📚 Need More Info?

- **Full Documentation**: `TEST_TENANT_ISOLATION.md`
- **Task Summary**: `TASK_3.4_COMPLETION_SUMMARY.md`
- **RLS Status**: `verify-rls-status.sql`
- **RLS Policies**: `audit-rls.sql`

---

## 🆘 Troubleshooting

### Test data remains after test

```sql
-- Run in Supabase SQL Editor
DELETE FROM animais WHERE brinco LIKE 'TEST-TENANT-%';
DELETE FROM contas_pagar WHERE descricao LIKE 'TEST-TENANT-%';
DELETE FROM contas_receber WHERE descricao LIKE 'TEST-TENANT-%';
DELETE FROM lotes WHERE nome LIKE 'TEST-TENANT-%';
DELETE FROM fazendas WHERE nome LIKE 'TEST-TENANT-%';
DELETE FROM parceiros WHERE nome_fantasia LIKE 'TEST-TENANT-%';
```

### Can't connect to Supabase

- Check `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Verify credentials are correct in Supabase Dashboard

### Test fails with permission errors

- This is expected with anon key (RLS working!)
- Use SQL script in Supabase Dashboard for complete tests
- Or use service role key (bypasses RLS - not ideal for testing)

---

## ✨ Pro Tips

1. **Run SQL script first** - most reliable
2. **Save test output** for audit trail
3. **Run weekly** to ensure ongoing compliance
4. **Test after any schema changes**
5. **Integrate into CI/CD** for automated testing

---

**Ready?** Open Supabase Dashboard and run that SQL script! 🚀
