# CI/CD Setup Guide - Slicely

## 🎯 Overview

This is a **minimal, production-grade CI/CD setup** for solo developers. It provides:

- ✅ Automated code quality checks on every PR
- ✅ Automatic preview deployments for PRs (via Vercel)
- ✅ Automatic production deployments when merging to main
- ✅ No staging environment (local → production workflow)

---

## 📁 What Was Configured

### 1. GitHub Actions Workflow
**File:** `.github/workflows/pr-checks.yml`

**What it does:**
- Runs on every PR and push to main
- Checks: ESLint, Prettier, TypeScript, Build verification
- Prevents merging broken code

### 2. Vercel Configuration
**File:** `vercel.json`

**What it does:**
- Configures Next.js deployment settings
- Auto-deploys main branch to production
- Creates preview URLs for every PR

### 3. Environment Template
**File:** `.env.example`

**What it does:**
- Documents required environment variables
- Helps you set up local and production environments

---

## 🚀 Action Items - Do These Now

### ✅ Step 1: Set Up Supabase Production Instance

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing production project)
3. Go to **Project Settings → API**
4. Copy these values (you'll need them soon):
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### ✅ Step 2: Set Up Vercel Account & Connect GitHub

#### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account (recommended)
3. Authorize Vercel to access your repositories

#### 2.2 Import Your Project
1. Click **"Add New..." → Project**
2. Import `slicely` repository
3. Vercel will auto-detect Next.js

#### 2.3 Configure Environment Variables in Vercel
During import (or later in Project Settings → Environment Variables):

| Variable Name | Value | Where to Get It |
|---------------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Supabase Dashboard → API |
| `OPENAI_API_KEY` | Your OpenAI API key | [OpenAI API Keys](https://platform.openai.com/api-keys) |

**Important:**
- Set these for **Production** and **Preview** environments
- Check "Automatically expose System Environment Variables"

#### 2.4 Deploy
1. Click **Deploy**
2. Wait 2-3 minutes for first deployment
3. You'll get a production URL like `slicely.vercel.app`

### ✅ Step 3: Set Up GitHub Secrets (Optional but Recommended)

GitHub Actions workflow can work without secrets (uses placeholders), but for production builds in CI:

1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `OPENAI_API_KEY` | Your OpenAI API key |

### ✅ Step 4: Enable Branch Protection (Optional but Recommended)

1. Go to repo **Settings → Branches**
2. Click **Add branch protection rule**
3. Branch name pattern: `main`
4. Enable:
   - ☑️ **Require a pull request before merging**
   - ☑️ **Require status checks to pass before merging**
     - Add: `Code Quality & Build`
   - ☑️ **Require conversation resolution before merging**

This prevents you from accidentally pushing broken code to production.

### ✅ Step 5: Configure Supabase Production Database

#### 5.1 Run Migrations
```bash
# Link to your production project
npx supabase link --project-ref your-project-ref

# Push migrations to production
npx supabase db push

# Optional: Seed production data
# Review seed.sql first, then:
npx supabase db seed
```

#### 5.2 Get Project Ref
- Go to Supabase Dashboard → Project Settings → General
- Copy **Reference ID**

### ✅ Step 6: Test the Workflow

#### 6.1 Test PR Checks
```bash
# Create a test branch
git checkout -b test/ci-setup

# Make a small change (add a comment somewhere)
echo "// Test CI" >> src/app/page.tsx

# Commit and push
git add .
git commit -m "test: verify CI/CD pipeline"
git push -u origin test/ci-setup

# Open PR on GitHub
# Watch GitHub Actions run checks
# See Vercel create preview deployment
```

#### 6.2 Test Production Deployment
```bash
# After PR checks pass, merge to main
# Vercel will automatically deploy to production
# Visit your production URL to verify
```

---

## 🔄 Your New Development Workflow

### Daily Development Flow

```bash
# 1. Create feature branch (Claude Code does this automatically)
git checkout -b claude/new-feature-xyz

# 2. Make changes, commit
git add .
git commit -m "feat: add new feature"

# 3. Push to GitHub
git push -u origin claude/new-feature-xyz

# 4. Open PR
# → GitHub Actions runs checks automatically
# → Vercel creates preview deployment
# → Preview URL posted as comment on PR

# 5. Review preview deployment
# → Click Vercel preview link in PR
# → Test your changes in real environment

# 6. If checks pass, merge PR
# → Vercel automatically deploys to production
# → Production URL updated in ~2 minutes
```

### What Happens Automatically

**When you open a PR:**
- ✓ ESLint checks code quality
- ✓ Prettier checks formatting
- ✓ TypeScript checks types
- ✓ Build verification (ensures it compiles)
- ✓ Vercel creates preview deployment with unique URL

**When you merge to main:**
- ✓ Production deployment to Vercel
- ✓ Automatic cache invalidation
- ✓ Zero-downtime deployment

---

## 🔧 Configuration Files

### `.github/workflows/pr-checks.yml`
- Runs quality checks on every PR
- Uses Node.js 20
- Caches npm dependencies for speed

### `vercel.json`
- Configures Next.js deployment
- Auto-deploys main branch
- Enables preview deployments for PRs
- References environment variables

### `.env.example`
- Template for required environment variables
- Copy to `.env.local` for local development

---

## 🎯 Cost Breakdown (Free Tier)

| Service | Free Tier | Your Usage |
|---------|-----------|------------|
| **Vercel** | 100GB bandwidth, unlimited deployments | ✅ Plenty for side project |
| **GitHub Actions** | 2,000 minutes/month | ✅ ~5-10 min per PR = 200-400 PRs/month |
| **Supabase** | 500MB database, 1GB file storage | ✅ Good for MVP |

**Total: $0/month** for typical solo dev side project usage.

---

## 📊 Monitoring Your Deployments

### Vercel Dashboard
- Real-time deployment status
- Build logs
- Performance analytics
- Error tracking

### GitHub Actions
- Check the **Actions** tab in your repo
- See detailed logs for each check
- Re-run failed checks

---

## 🚨 Troubleshooting

### Build Fails in GitHub Actions

**Issue:** `npm run build` fails with environment variable errors

**Solution:**
1. Add GitHub Secrets (Step 3 above)
2. Or update `.github/workflows/pr-checks.yml` to use better placeholder values

### Vercel Build Fails

**Issue:** "Missing environment variables"

**Solution:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Ensure all 3 variables are set for both Production and Preview

### Preview Deployment Not Created

**Issue:** No Vercel comment on PR

**Solution:**
1. Check Vercel Dashboard → Integrations → GitHub
2. Ensure repository is connected
3. Check "Auto-deploy" is enabled in Project Settings

### Can't Push to Production

**Issue:** "Branch protection rule"

**Solution:**
- Create a PR instead of pushing directly to main
- Or temporarily disable branch protection (not recommended)

---

## 🎓 Best Practices

### 1. Always Work in Branches
```bash
# Good
git checkout -b feature/new-thing
# Do work, push, create PR

# Avoid
git checkout main
# Make changes directly on main
```

### 2. Use Descriptive Commit Messages
```bash
# Good
git commit -m "feat: add PDF export functionality"
git commit -m "fix: resolve login redirect issue"
git commit -m "docs: update README with setup instructions"

# Avoid
git commit -m "updates"
git commit -m "fix stuff"
```

### 3. Review Preview Deployments
- Always click the Vercel preview link
- Test your changes in a real environment
- Catch issues before production

### 4. Keep Dependencies Updated
```bash
# Periodically run
npm outdated
npm update

# Commit lockfile changes
git add package-lock.json
git commit -m "chore: update dependencies"
```

### 5. Monitor Production
- Set up Vercel alerts for deployment failures
- Check production after each merge
- Keep an eye on Supabase usage/quota

---

## 🔮 Future Enhancements (When You Need Them)

### When Your Project Grows

**Add Testing (Later):**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
# Add tests to critical paths
```

**Add Security Scanning:**
```bash
# Enable Dependabot in GitHub repo settings
# Add npm audit to CI workflow
```

**Add Performance Monitoring:**
```bash
# Enable Vercel Analytics (free tier)
# Add Lighthouse CI checks
```

**Add Error Tracking:**
```bash
npm install @sentry/nextjs
# Set up Sentry project
```

---

## 📞 Support

- **Vercel Issues:** [Vercel Docs](https://vercel.com/docs)
- **GitHub Actions:** [GitHub Actions Docs](https://docs.github.com/en/actions)
- **Supabase:** [Supabase Docs](https://supabase.com/docs)

---

## ✅ Success Checklist

After completing all steps, you should have:

- [ ] Vercel account connected to GitHub repo
- [ ] Environment variables configured in Vercel
- [ ] GitHub Secrets added (optional but recommended)
- [ ] Branch protection enabled on main
- [ ] Production Supabase project created and linked
- [ ] Database migrations pushed to production
- [ ] Test PR created and checks passing
- [ ] Preview deployment working
- [ ] Production deployment successful

**You're now set up for rapid, professional development!** 🚀
