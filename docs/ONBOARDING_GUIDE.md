# Onboarding Guide - Tauze ERP v5.0

Welcome to Tauze ERP! This guide will get you up and running in **under 10 minutes**.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.x or higher ([Download](https://nodejs.org/))
- **npm**: v10.x or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **Code Editor**: VS Code recommended ([Download](https://code.visualstudio.com/))

**Check your versions:**
```bash
node --version  # Should show v20.x or higher
npm --version   # Should show v10.x or higher
git --version   # Should show v2.x or higher
```

## Quick Start (< 10 minutes)

### 1. Clone the Repository (30 seconds)

```bash
git clone <repository-url>
cd Saas
```

### 2. Install Dependencies (2-3 minutes)

```bash
npm install
```

> **Note**: This will install all dependencies and set up Husky git hooks automatically.

### 3. Configure Environment Variables (2 minutes)

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and configure the **required** variables:

```env
# REQUIRED - Get these from Supabase Dashboard
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# OPTIONAL - For full features (can add later)
# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
# VITE_SENTRY_DSN=https://...
# VITE_POSTHOG_KEY=phc_...
```

**Where to get Supabase credentials:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (or create a new one)
3. Navigate to **Settings** → **API**
4. Copy **Project URL** → Paste as `VITE_SUPABASE_URL`
5. Copy **anon public** key → Paste as `VITE_SUPABASE_ANON_KEY`

### 4. Start Development Server (30 seconds)

```bash
npm run dev
```

The application will start at **http://localhost:5173**

### 5. Access the Application (30 seconds)

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the Tauze ERP login page. 🎉

**Default test credentials** (if configured in your Supabase project):
- Email: `test@example.com`
- Password: `test123456`

---

## Project Structure

Understanding the codebase layout:

```
Saas/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page components (routes)
│   │   ├── Pecuaria/    # Livestock management
│   │   ├── Finance/     # Financial module
│   │   ├── Inventory/   # Inventory management
│   │   ├── Fleet/       # Fleet management
│   │   ├── Purchasing/  # Purchase orders
│   │   ├── Sales/       # Sales orders
│   │   └── Market/      # Market indicators
│   ├── contexts/         # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and libraries
│   ├── types/            # TypeScript type definitions
│   └── __tests__/        # Test files
├── docs/                 # Documentation
├── public/               # Static assets
└── tests/                # E2E tests (Playwright)
```

## Database Setup (Supabase)

### Option A: Use Existing Project (Fastest)

If you have access to an existing Supabase project, just use the credentials from `.env` setup above.

### Option B: Create New Project (5-10 minutes)

1. **Create Supabase Project:**
   - Go to [Supabase Dashboard](https://app.supabase.com/)
   - Click **New Project**
   - Fill in project details (name, database password, region)
   - Wait for project to be created (~2 minutes)

2. **Set Up Database Schema:**
   - Navigate to **SQL Editor** in Supabase Dashboard
   - Run the migration scripts from `src/database/` (if available)
   - Or manually create tables using the Table Editor

3. **Enable Row Level Security (RLS):**
   - Navigate to **Authentication** → **Policies**
   - Enable RLS on all tables
   - Add tenant isolation policies

> **Note**: For full database setup instructions, see `src/database/README.md`

## Development Workflow

### Running the Development Server

```bash
npm run dev                # Standard development server
npm run dev:host           # Expose to network (test on mobile)
npm run dev:https          # Run with HTTPS
```

### Code Quality Commands

```bash
npm run lint               # Check for linting errors
npm run lint:fix           # Auto-fix linting errors
npm run format             # Format code with Prettier
npm run type-check         # Check TypeScript types
```

### Testing Commands

```bash
npm run test               # Run tests in watch mode
npm run test:run           # Run tests once
npm run test:coverage      # Run tests with coverage report
npm run test:ui            # Open Vitest UI
npm run test:e2e           # Run E2E tests with Playwright
```

### Build Commands

```bash
npm run build              # Production build
npm run build:analyze      # Build with bundle analysis
npm run preview            # Preview production build locally
```

## First Time Setup Checklist

- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Copy `.env.example` to `.env`
- [ ] Configure Supabase credentials in `.env`
- [ ] Start dev server (`npm run dev`)
- [ ] Access application at http://localhost:5173
- [ ] Test login functionality
- [ ] Run tests to verify setup (`npm run test:run`)
- [ ] Read project documentation in `docs/`

## Common Issues

### Issue: "Missing required environment variables"

**Symptoms:** Application fails to start with error message about missing env vars.

**Solution:**
1. Verify `.env` file exists in project root
2. Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Restart dev server after changing `.env`

### Issue: "Failed to connect to Supabase"

**Symptoms:** API calls fail, authentication doesn't work.

**Solution:**
1. Verify Supabase project is active (check dashboard)
2. Verify API credentials are correct in `.env`
3. Check that your IP is not blocked by Supabase
4. Ensure Supabase project URL includes `https://`

### Issue: "Port 5173 is already in use"

**Symptoms:** Dev server fails to start.

**Solution:**
```bash
# Option 1: Kill the process using port 5173
npx kill-port 5173

# Option 2: Use a different port
npm run dev -- --port 3000
```

### Issue: "Tests are failing"

**Symptoms:** Test suite fails when running `npm run test:run`.

**Solution:**
1. Ensure all dependencies are installed: `npm install`
2. Check that test environment variables are set
3. Clear test cache: `npm run test:run -- --clearCache`

### Issue: "Husky pre-commit hooks failing"

**Symptoms:** Git commit is blocked by linting errors.

**Solution:**
```bash
# Fix linting errors automatically
npm run lint:fix
npm run format

# Then try committing again
git commit -m "your message"
```

### Issue: "TypeScript errors in editor"

**Symptoms:** VS Code shows TypeScript errors.

**Solution:**
1. Restart TypeScript server: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"
2. Verify `tsconfig.json` exists
3. Run type check: `npm run type-check`

## Development Tips

### Hot Module Replacement (HMR)

The dev server supports HMR, so most changes will reflect instantly without a full page reload.

### Browser DevTools

- **React DevTools**: Install [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) extension
- **React Query DevTools**: Already included in dev mode (floating icon in bottom-left)

### VS Code Extensions (Recommended)

- **ESLint**: Real-time linting
- **Prettier**: Code formatting
- **TypeScript**: Better TypeScript support
- **Tailwind CSS IntelliSense**: Tailwind class autocomplete (if using Tailwind)

### Git Workflow

```bash
# Create a new feature branch
git checkout -b feature/your-feature-name

# Make changes and commit (pre-commit hooks will run)
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name
```

### Testing Strategy

- **Unit tests**: Test individual functions and components
- **Integration tests**: Test feature flows
- **E2E tests**: Test critical user paths

Run tests frequently to catch issues early!

## Next Steps

Now that you're set up, here's what to explore next:

### 1. Understand the Architecture
- Read `docs/ARQUITETURA_ATUAL.md` for system architecture overview
- Review `docs/UI_UX_GUIDELINES.md` for UI/UX patterns

### 2. Explore Key Features
- **Offline Support**: `docs/OFFLINE_SYNC_IMPLEMENTATION.md`
- **Error Tracking**: `docs/SENTRY_ERROR_TRACKING_GUIDE.md`
- **Analytics**: `docs/ANALYTICS_EVENT_TRACKING_GUIDE.md`
- **Performance**: `docs/LIGHTHOUSE_OPTIMIZATION_GUIDE.md`

### 3. Learn the Testing Setup
- **Testing Guide**: `src/__tests__/README.md`
- **E2E Testing**: `tests/e2e/README.md`

### 4. Review Development Workflows
- **Dependency Management**: `docs/DEPENDENCY_MANAGEMENT.md`
- **Bundle Analysis**: `docs/BUNDLE_ANALYZER_GUIDE.md`
- **Deployment**: `docs/PRODUCTION_DEPLOYMENT_GUIDE.md`

### 5. Contribute Code
- Pick an issue from the issue tracker
- Create a feature branch
- Write tests for your changes
- Submit a pull request

## Available Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code quality |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Check TypeScript types |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run all tests once |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:e2e` | Run E2E tests |
| `npm run build:analyze` | Build with bundle analysis |

## Tech Stack Overview

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| **React 19** | UI framework | [React Docs](https://react.dev/) |
| **TypeScript** | Type safety | [TypeScript Docs](https://www.typescriptlang.org/) |
| **Vite** | Build tool | [Vite Docs](https://vite.dev/) |
| **Supabase** | Backend (PostgreSQL + Auth + Storage) | [Supabase Docs](https://supabase.com/docs) |
| **React Query** | Server state management | [TanStack Query Docs](https://tanstack.com/query/) |
| **React Router** | Client-side routing | [React Router Docs](https://reactrouter.com/) |
| **Vitest** | Unit testing | [Vitest Docs](https://vitest.dev/) |
| **Playwright** | E2E testing | [Playwright Docs](https://playwright.dev/) |
| **Sentry** | Error tracking | [Sentry Docs](https://docs.sentry.io/) |
| **PostHog** | Analytics | [PostHog Docs](https://posthog.com/docs) |

## Getting Help

### Documentation
- Browse `docs/` directory for detailed guides
- Check `src/database/README.md` for database setup
- Review `tests/e2e/README.md` for E2E testing

### Troubleshooting
- Review **Common Issues** section above
- Check application logs in browser console
- Run `npm run healthcheck` to verify setup

### Team Communication
- **Issues**: Report bugs or request features via issue tracker
- **Pull Requests**: Submit code changes for review
- **Documentation**: Update docs when adding new features

## Keyboard Shortcuts

The application includes a command palette (press `Cmd+K` / `Ctrl+K`) for quick navigation:

- **Cmd/Ctrl + K**: Open command palette
- **Cmd/Ctrl + B**: Toggle sidebar
- **Cmd/Ctrl + /**: Search

## Security Notes

### Environment Variables
- **Never commit `.env` files** - they're in `.gitignore`
- Use `.env.example` as a template
- Store production secrets in hosting platform (Vercel, Netlify, etc.)

### API Keys
- Use **anon/public keys** for client-side code
- Never expose **service role keys** in frontend
- Rotate keys if accidentally committed (see `CREDENTIAL_ROTATION_CHECKLIST.md`)

### Authentication
- All API calls use JWT authentication via Supabase
- Row Level Security (RLS) enforces tenant isolation
- See `src/database/audit-rls.cjs` for RLS audit

## Performance Tips

### Development
- Use `npm run dev:host` to test on mobile devices
- Enable React Query DevTools for cache inspection
- Use browser DevTools Performance tab for profiling

### Production
- Run `npm run build:analyze` to check bundle size
- Monitor Core Web Vitals via Sentry/PostHog
- Review Lighthouse reports in `docs/lighthouse-reports/`

## Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Write** tests for your changes
4. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

## Resources

### Official Documentation
- [Project Architecture](docs/ARQUITETURA_ATUAL.md)
- [Deployment Guide](docs/PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Testing Guide](src/__tests__/README.md)

### External Resources
- [React 19 Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vite.dev/guide/)

---

## Success Checklist ✅

You're ready to start developing when you can:

- [ ] Run `npm run dev` successfully
- [ ] Access the application at http://localhost:5173
- [ ] Log in to the application
- [ ] Navigate between different modules
- [ ] Run tests with `npm run test:run`
- [ ] Run linting with `npm run lint`
- [ ] Build the project with `npm run build`

**Congratulations! You're all set up and ready to contribute to Tauze ERP!** 🚀

---

**Questions or issues?** Check the **Common Issues** section or reach out to the team.
