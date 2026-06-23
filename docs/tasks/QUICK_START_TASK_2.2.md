# ⚡ Quick Start: Task 2.2 - Supabase Key Rotation

## What You Need to Do

Rotate the Supabase API keys that were exposed in git history.

## ⏱️ Time Required: ~2 hours + 24-48h monitoring

---

## 🚀 Quick Steps

### 1️⃣ Generate New Keys (10 min)
```
1. Go to: https://app.supabase.com
2. Select project: nmirpozhgcoabcjwgvqk
3. Settings → API
4. Rotate/Regenerate the anon key
5. Copy and save the new key securely
```

### 2️⃣ Update Local Environment (5 min)
```bash
# Edit .env file
nano .env

# Update this line:
VITE_SUPABASE_ANON_KEY=<your_new_key_here>

# Test it works
npm run dev
```

### 3️⃣ Update GitHub Secrets (5 min)
```
1. Go to: Your GitHub repo → Settings → Secrets and variables → Actions
2. Find: VITE_SUPABASE_ANON_KEY
3. Edit and paste new key
4. Save
```

### 4️⃣ Update Production (20 min)
```
Vercel:
  1. Dashboard → Project → Settings → Environment Variables
  2. Edit VITE_SUPABASE_ANON_KEY
  3. Save and Redeploy

Netlify:
  1. Site settings → Environment variables
  2. Edit VITE_SUPABASE_ANON_KEY
  3. Save and Trigger deploy
```

### 5️⃣ Monitor for 24-48 Hours
```
- Check production for errors
- Verify users can log in
- Watch Supabase dashboard for issues
```

### 6️⃣ Revoke Old Keys (5 min)
```
After 24-48 hours:
1. Back to Supabase Dashboard → Settings → API
2. Revoke the old key
3. Test production one final time
```

---

## 📋 Where to Update Keys

| Location | Variable Name | Action |
|----------|---------------|--------|
| Local `.env` | `VITE_SUPABASE_ANON_KEY` | Edit file |
| GitHub Secrets | `VITE_SUPABASE_ANON_KEY` | Update in repo settings |
| Vercel/Netlify | `VITE_SUPABASE_ANON_KEY` | Update in dashboard |

---

## 🔑 Current Key Info (for reference)

- **Old Key (last 8 chars):** ...60ocdak
- **Project URL:** https://nmirpozhgcoabcjwgvqk.supabase.co
- **Project Ref:** nmirpozhgcoabcjwgvqk

---

## ✅ Checklist

- [ ] New key generated in Supabase
- [ ] Local .env updated
- [ ] Local testing passed ✓
- [ ] GitHub Secrets updated
- [ ] Production environment updated
- [ ] Production redeployed
- [ ] Production tested ✓
- [ ] 24-48h grace period complete
- [ ] Old key revoked
- [ ] Final testing passed ✓

---

## 📚 Full Documentation

For detailed instructions, see: `TASK_2.2_SUPABASE_KEY_ROTATION_GUIDE.md`

For complete rotation checklist, see: `CREDENTIAL_ROTATION_CHECKLIST.md`

---

## 🆘 Common Issues

**Problem:** Can't find rotate option in Supabase  
**Fix:** Look for "Reset API key" or "Regenerate" in Settings → API

**Problem:** Production shows auth errors  
**Fix:** Verify key was copied completely (it's 200+ characters long)

**Problem:** CI/CD builds failing  
**Fix:** Check the secret name matches in your workflow files

---

**⚠️ IMPORTANT:** Don't skip the 24-48 hour grace period! This ensures zero downtime.
