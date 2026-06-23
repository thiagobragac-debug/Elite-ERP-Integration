# Quick Start Guide - RLS Implementation

## 🚀 Quick Reference

This guide provides a fast path to enable RLS on tables in the Tauze ERP v5.0 database.

---

## ⚡ TL;DR - Apply RLS to user_drafts

```sql
-- Copy and run in Supabase SQL Editor:
-- File: src/database/migrations/001_enable_rls_missing_tables.sql
```

Then verify:

```sql
-- Copy and run in Supabase SQL Editor:
-- File: src/database/verify-rls-status.sql
```

---

## 📋 Current Status (Task 3.2 Completed)

### ✅ What's Done

- 11 tables already have RLS enabled and working
- Migration scripts created for `user_drafts`
- Verification scripts ready to use
- Documentation completed

### ⏳ What's Next

- Apply migration 001 in Supabase
- Verify RLS status
- Test user isolation

---

## 🎯 Apply RLS in 3 Steps

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click "SQL Editor" in sidebar
4. Click "New query"

### Step 2: Run Migration

```sql
-- Copy contents from:
-- c:\Saas\src\database\migrations\001_enable_rls_missing_tables.sql

-- Paste into SQL Editor and click "Run"

-- Expected output:
-- ✅ Table user_drafts exists
-- ✅ RLS enabled on user_drafts
-- ✅ Created SELECT policy for user_drafts
-- ✅ Created INSERT policy for user_drafts
-- ✅ Created UPDATE policy for user_drafts
-- ✅ Created DELETE policy for user_drafts
-- ✅ RLS is enabled on user_drafts
-- user_drafts has 4 policies configured
```

### Step 3: Verify Success

```sql
-- Copy contents from:
-- c:\Saas\src\database\verify-rls-status.sql

-- Paste into SQL Editor and click "Run"

-- Review all 7 verification checks
-- Ensure security_status shows: "🟢 GOOD - All tables secured"
```

---

## 🧪 Quick Test

Test that user isolation works:

```sql
-- This should return only policies for user_drafts
SELECT tablename, policyname
FROM pg_policies
WHERE tablename = 'user_drafts';

-- Expected: 4 rows (select, insert, update, delete policies)
```

---

## 📊 Current RLS Coverage

| Status         | Count | Tables                                |
| -------------- | ----- | ------------------------------------- |
| ✅ Protected   | 11    | animais, contas_pagar, fazendas, etc. |
| ⚠️ Needs RLS   | 1     | user_drafts (migration ready)         |
| ✅ Shared Data | 2     | market_quotes, market_import_logs     |

---

## 🆘 Quick Troubleshooting

### Problem: "permission denied for table user_drafts"

**Solution**: RLS is enabled but user not authenticated. Check auth token.

### Problem: "No rows returned from user_drafts"

**Solution**: Either no data exists OR policy is working (you can only see your own data).

### Problem: "Migration fails"

**Solution**: Check error message. Migration includes safety checks and will skip if table doesn't exist.

---

## 📚 Documentation Files

| File                                           | Purpose                    |
| ---------------------------------------------- | -------------------------- |
| `migrations/001_enable_rls_missing_tables.sql` | Apply RLS to user_drafts   |
| `migrations/002_enable_rls_template.sql`       | Template for future tables |
| `verify-rls-status.sql`                        | Check RLS coverage         |
| `migrations/README.md`                         | Complete guide             |
| `RLS_IMPLEMENTATION_SUMMARY.md`                | Task 3.2 summary           |

---

## ✅ Verification Checklist

After running migration:

- [ ] Migration completed without errors
- [ ] `user_drafts` shows RLS enabled
- [ ] 4 policies exist for `user_drafts`
- [ ] Verify script shows "🟢 GOOD" status
- [ ] Test with real user account
- [ ] Users can only see their own drafts

---

## 🔄 Rollback (If Needed)

If something goes wrong:

```sql
BEGIN;

DROP POLICY IF EXISTS "user_drafts_select_own" ON public.user_drafts;
DROP POLICY IF EXISTS "user_drafts_insert_own" ON public.user_drafts;
DROP POLICY IF EXISTS "user_drafts_update_own" ON public.user_drafts;
DROP POLICY IF EXISTS "user_drafts_delete_own" ON public.user_drafts;

ALTER TABLE IF EXISTS public.user_drafts DISABLE ROW LEVEL SECURITY;

COMMIT;
```

---

## 🎓 Learn More

- **Full Documentation**: `migrations/README.md`
- **Task Summary**: `RLS_IMPLEMENTATION_SUMMARY.md`
- **Audit Reports**: `audit-reports/FINDINGS-SUMMARY.md`
- **SQL Audit**: `audit-rls.sql`

---

## 📞 Need Help?

1. Check `migrations/README.md` troubleshooting section
2. Review audit reports in `audit-reports/`
3. Verify your Supabase connection and permissions
4. Check PostgreSQL/Supabase RLS documentation

---

**Last Updated**: 2026-06-16  
**Task**: 3.2 Enable RLS on all tables  
**Status**: ✅ Ready to deploy
