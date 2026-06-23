# 🚀 Dependabot Quick Start Guide

## What is Dependabot?

Dependabot is GitHub's native tool that automatically checks for dependency updates and creates pull requests to keep your project secure and up-to-date.

---

## ✨ What's Configured

### 📦 NPM Dependencies
- **Schedule:** Every Monday at 09:00 (Brasília time)
- **Grouping:** 
  - Development dependencies (minor + patch) → Single PR
  - Production dependencies (minor + patch) → Single PR
  - Major updates → Separate PRs (require careful review)
- **PR Limit:** Maximum 5 open PRs at once

### ⚙️ GitHub Actions
- **Schedule:** Every Monday at 09:00 (Brasília time)
- **Updates:** Workflow dependencies (e.g., `actions/checkout@v4`)
- **PR Limit:** Maximum 3 open PRs at once

---

## 📋 How to Handle Dependabot PRs

### 1️⃣ Patch Updates (1.2.3 → 1.2.4)
```
✅ Low Risk | Quick Review
```

**Action:**
1. Wait for CI to pass ✅
2. Quick changelog review
3. Merge if CI is green

**Time:** ~5 minutes

---

### 2️⃣ Minor Updates (1.2.x → 1.3.0)
```
⚠️ Medium Risk | Standard Review
```

**Action:**
1. Wait for CI to pass ✅
2. Review changelog for new features and deprecations
3. Pull branch locally: `git checkout <branch-name>`
4. Run: `npm run dev` and smoke test
5. Merge if everything works

**Time:** ~15-30 minutes

---

### 3️⃣ Major Updates (1.x.x → 2.0.0)
```
🔴 High Risk | Full Review Required
```

**Action:**
1. Wait for CI to pass ✅
2. Read full migration guide
3. Review breaking changes
4. Pull branch locally
5. Run full test suite: `npm run test:coverage`
6. Manual testing in all affected areas
7. Deploy to staging first
8. Get tech lead approval
9. Merge after 24h monitoring period

**Time:** 2-4 hours

---

## 🎯 Quick Commands

### Review PRs
```bash
# List all Dependabot PRs
gh pr list --label "dependencies"

# View specific PR
gh pr view <PR-number>

# Checkout PR locally
gh pr checkout <PR-number>
```

### Test Locally
```bash
# After checking out PR
npm install
npm run type-check
npm run lint
npm run test:run
npm run build
npm run dev
```

### Merge PR
```bash
# Via GitHub CLI (after approval)
gh pr merge <PR-number> --squash

# Or via GitHub UI
# Click "Squash and merge" button
```

---

## 🚦 CI/CD Gates

Dependabot PRs must pass:
- ✅ ESLint (no errors)
- ✅ TypeScript type-check (no errors)
- ✅ Prettier format check
- ✅ Unit tests (60%+ coverage maintained)
- ✅ Build successful

**If CI fails:**
1. Check CI logs for errors
2. If it's a breaking change, update code in the PR branch
3. Re-run CI

---

## ⚠️ Common Scenarios

### Scenario: Multiple PRs for Same Dependency

**What happened:** Two PRs update the same transitive dependency

**Solution:**
1. Merge the most critical PR first (usually patch > minor > major)
2. Close the other PR (Dependabot will auto-create a new one)

---

### Scenario: CI Fails on Dependabot PR

**Possible causes:**
- Breaking changes in minor/patch (rare but happens)
- Type errors after TypeScript update
- Test failures due to API changes

**Solution:**
1. Review CI logs
2. Checkout PR branch locally
3. Fix the code/tests
4. Commit fix to the PR branch: `git push`
5. CI will re-run automatically

---

### Scenario: Too Many Open PRs

**What happened:** Hit the 5 PR limit, new PRs not being created

**Solution:**
1. Review and merge safe updates (patches)
2. Close PRs you don't want to merge (e.g., very old major updates)
3. Dependabot will create new PRs in the next scheduled run

---

## 🔒 Security Updates

**Priority:** Security PRs are marked with `security` label

**Action:**
- 🔴 **Critical/High:** Merge within 24-48 hours
- 🟠 **Medium:** Merge within 7 days  
- 🟢 **Low:** Include in next update cycle

```bash
# List security PRs
gh pr list --label "dependencies,security"
```

---

## 🎨 PR Labels

All Dependabot PRs are tagged with:
- `dependencies` - All dependency updates
- `automated` - Automated PRs
- `github-actions` - For workflow updates
- `security` - Security vulnerability fixes (when applicable)

---

## 📊 Weekly Routine

### Every Monday (After 09:00)

1. **Check for new PRs:**
   ```bash
   gh pr list --label "dependencies"
   ```

2. **Priority order:**
   - 🔴 Security updates first
   - ✅ Patch updates (quick wins)
   - ⚠️ Minor updates
   - 🔴 Major updates (schedule separately)

3. **Target:** Clear all patch/minor updates by end of week

---

## 🛠️ Configuration Location

- **File:** `.github/dependabot.yml`
- **Documentation:** `docs/DEPENDENCY_MANAGEMENT.md`

**To modify:**
1. Edit `.github/dependabot.yml`
2. Commit changes
3. Dependabot will use new config on next run

---

## 📞 Need Help?

- **Full Guide:** See `docs/DEPENDENCY_MANAGEMENT.md`
- **Tech Lead:** @your-tech-lead
- **GitHub Docs:** https://docs.github.com/en/code-security/dependabot

---

## ✅ Checklist for Your First Dependabot PR

- [ ] PR appeared on Monday morning
- [ ] CI pipeline passed (all checks green)
- [ ] Reviewed changelog for the dependency
- [ ] Identified update type (patch/minor/major)
- [ ] Tested locally if needed (minor/major)
- [ ] Merged PR using "Squash and merge"
- [ ] Monitored for errors in Sentry (24h for major updates)

---

**Remember:** Dependabot is here to help! Don't ignore PRs for more than 1 week.

**Last Updated:** Janeiro 2025
