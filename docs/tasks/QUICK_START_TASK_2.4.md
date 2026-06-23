# ⚡ Quick Start: Task 2.4 - Deployment & Key Revocation

**Goal:** Deploy with new keys, monitor for 24-48 hours, then safely revoke old keys

---

## What You Need to Do

This is the final phase of credential rotation. By now you should have already generated new keys (Tasks 2.2 & 2.3).

---

## 🚀 Phase 1: Deploy to Production (30 min)

### 1️⃣ Update Production Environment (10 min)

**Vercel:**
```
1. Go to: https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Update:
   - VITE_SUPABASE_ANON_KEY = [new key]
   - VITE_STRIPE_PUBLISHABLE_KEY = [new key]
4. Environments: ☑ Production ☑ Preview
```

**Netlify:**
```
1. Go to: https://app.netlify.com
2. Site settings → Environment variables
3. Update same keys as above
```

### 2️⃣ Update GitHub Secrets (5 min)

```
1. Go to: GitHub repo → Settings → Secrets and variables → Actions
2. Update:
   - SUPABASE_ANON_KEY
   - STRIPE_PUBLISHABLE_KEY
```

### 3️⃣ Deploy (5 min)

**Vercel:** Deployments → Redeploy latest  
**Netlify:** Deploys → Trigger deploy → Clear cache and deploy

### 4️⃣ Verify Deployment (10 min)

```
✓ Open production URL
✓ Test login
✓ Test data loading
✓ Check browser console (no errors)
✓ Test critical operations
```

**If ANY issue: Stop and investigate before continuing!**

---

## ⏱️ Phase 2: Grace Period Monitoring (24-48 hours)

### Hour 1 - Critical Checks

```
✓ Test from multiple devices
✓ Test login with different accounts
✓ Create/update/delete a record
✓ Monitor error logs
```


### Hours 2-6 - Active Monitoring

**Supabase Dashboard:**
```
1. Go to: Settings → API → Usage
2. Check: API requests normal, error rate <1%
3. Look for: No authentication failures
```

**Stripe Dashboard (if applicable):**
```
1. Go to: Developers → Events
2. Check: No 401/403 errors
3. Verify: Payment events processing normally
```

**Application Logs:**
```
Check hosting platform logs for:
- Authentication errors
- API failures
- User-reported issues
```

### Day 1 (24h) - Comprehensive Review

```
✓ Review all monitoring data
✓ Check Supabase analytics (Reports tab)
✓ Verify CI/CD pipelines succeeded
✓ Test third-party integrations
✓ Check performance metrics unchanged

Decision: ☐ Proceed to revocation  ☐ Extend monitoring to 48h
```

### Day 2 (48h) - Optional Extended Monitoring

**Only if:**
- Minor issues detected in first 24h
- High-traffic system
- Extra caution needed
- Deployed on Friday (wait until Monday)

```
✓ Review hours 24-48 metrics
✓ Verify issues resolved
✓ Confirm stable error rates

Final Decision: ☐ Revoke keys  ☐ Extend more  ☐ Rollback
```

---

## ✅ Phase 3: Verify All Clients (15 min)

Before revoking, confirm ALL systems migrated:

```
✓ Supabase Dashboard → API Usage shows NEW key active
✓ OLD key shows zero activity
✓ All environments updated (prod, staging, CI/CD)
✓ No user-reported issues
✓ Team approved to proceed
```

**Pre-Revocation Checklist:**
```
☐ Grace period complete (24-48h)
☐ All monitoring checks passed
☐ No active issues
☐ All environments using new keys
☐ No old key usage detected
☐ Rollback plan ready
```

**If ANY box unchecked: DO NOT revoke!**

---


## 🔒 Phase 4: Revoke Old Keys (15 min)

### ⚠️ CRITICAL: This action is IRREVERSIBLE!

### Revoke Supabase Keys

```
1. Go to: https://app.supabase.com
2. Select project: nmirpozhgcoabcjwgvqk
3. Navigate to: Settings → API
4. Find OLD anon key
5. Click "Revoke" or "Delete"
6. Confirm action

Document: Old key revoked at [Date/Time] by [Name]
```

### Delete Stripe Keys (if applicable)

```
1. Go to: https://dashboard.stripe.com
2. Navigate to: Developers → API keys
3. Find OLD secret key
4. Click "⋮" menu → Delete
5. Confirm deletion

Note: Old publishable key auto-invalidated
Document: Old key deleted at [Date/Time] by [Name]
```

---

## 🧪 Phase 5: Post-Revocation Validation (Critical!)

### IMMEDIATE Checks (Within 5 minutes)

```
✓ Open production URL - app loads
✓ Test login - works
✓ Test data loading - works
✓ Check browser console - no 401/403 errors
✓ Test critical user flows (create/update/delete)
```

**If ANY issue: Emergency rollback required!**

### Hour 1 Post-Revocation

```
✓ Monitor active user sessions
✓ Check for login issues
✓ Verify no user reports
✓ System health normal
```

### Hours 2-6 Post-Revocation

```
✓ Supabase Dashboard - only NEW key active
✓ Application logs - no auth errors
✓ API success rates normal
```

### Hour 24 Post-Revocation

```
✓ Review all 24h metrics
✓ Confirm no issues
✓ System stable

Status: ☐ Success  ☐ Continue monitoring  ☐ Issues
```

---


## 📝 Phase 6: Update Audit Log (10 min)

### Update CREDENTIAL_ROTATION_CHECKLIST.md

```markdown
## 1. Supabase API Keys 🔑
**Status:** ✅ Completed

Key Rotation Details:
- New Key Generated: [Date/Time]
- Deployed to Production: [Date/Time]
- Grace Period: [Start] to [End]
- Old Key Revoked: [Date/Time]
- Validation: ✅ Passed

Completed By: [Name]
Verified By: [Name]
```

### Create Audit Log File

```bash
# Create permanent record
touch CREDENTIAL_ROTATION_AUDIT_2026-06-18.md

# Add summary, timeline, issues, lessons learned
# See DEPLOYMENT_AND_KEY_REVOCATION_GUIDE.md for template

# Commit to repository
git add CREDENTIAL_ROTATION_AUDIT_*.md
git commit -m "docs: Add credential rotation audit log"
git push origin main
```

---

## 🎉 Success Checklist

- [ ] ✅ Deployed to production with new keys
- [ ] ✅ Monitored for 24-48 hours
- [ ] ✅ Verified all clients using new keys
- [ ] ✅ Revoked old keys
- [ ] ✅ Post-revocation validation passed
- [ ] ✅ Monitored 24h after revocation
- [ ] ✅ Updated audit log
- [ ] ✅ Notified team
- [ ] ✅ Zero downtime achieved

**Completed By:** ___________  
**Date:** ___________

---

## 🚨 Emergency Rollback

**If production breaks after revocation:**

1. **Generate new temporary keys immediately:**
   - Supabase: Dashboard → Settings → API → Generate new
   - Stripe: Dashboard → Developers → API keys → Create
   
2. **Update production environment variables**

3. **Redeploy immediately**

4. **Investigate root cause**

5. **Plan re-rotation when ready**

**See full rollback procedure in:** `DEPLOYMENT_AND_KEY_REVOCATION_GUIDE.md`

---

## 📚 Full Documentation

For detailed instructions, monitoring procedures, and troubleshooting:

👉 **`DEPLOYMENT_AND_KEY_REVOCATION_GUIDE.md`**

For complete rotation checklist:

👉 **`CREDENTIAL_ROTATION_CHECKLIST.md`**

---

## Timeline Estimate

| Phase | Duration |
|-------|----------|
| Deploy to production | 30 min |
| Grace period monitoring | 24-48h |
| Verify all clients | 15 min |
| Revoke old keys | 15 min |
| Post-revocation validation | 24h |
| Update audit log | 10 min |

**Total:** 2-3 days (mostly monitoring)

---

**⚠️ IMPORTANT:** 
- Don't skip the grace period!
- Verify ALL checks before revoking
- Monitor closely after revocation
- Document everything

---

**End of Quick Start Guide**

