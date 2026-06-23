# Tauze ERP v5.0

> Modern multi-tenant SaaS platform for agricultural management

A comprehensive Enterprise Resource Planning system designed for agricultural operations, featuring livestock management, financial control, inventory tracking, fleet management, and more.

## 🌟 Features

- **🐮 Livestock Management**: Track animals, breeding, health records, and performance metrics
- **💰 Financial Control**: Accounts payable/receivable, cash flow, and bank reconciliation
- **📦 Inventory Management**: Track feed, medicines, supplies with automatic reorder alerts
- **🚜 Fleet Management**: Monitor vehicles, equipment, maintenance, and fuel consumption
- **🛒 Purchase & Sales**: Complete purchase and sales order management
- **📊 Market Indicators**: Real-time market prices integration (Cepea)
- **👥 Multi-tenant Architecture**: Isolated data per organization with role-based access
- **📱 PWA Support**: Works offline with automatic sync when reconnected
- **🔐 Enterprise Security**: JWT authentication, MFA support, Row Level Security (RLS)
- **📈 Analytics & Monitoring**: Error tracking, performance monitoring, business analytics

## 🏗️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript 6.0** - Type safety
- **Vite 8** - Build tool and dev server
- **React Router 7** - Client-side routing
- **React Query** - Server state management
- **Lucide React** - Icon library
- **Recharts** - Data visualization
- **Leaflet** - Maps integration

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL 14 - Database
  - Supabase Auth - Authentication
  - Supabase Storage - File storage
  - Row Level Security - Multi-tenant isolation

### Testing
- **Vitest 4.1** - Unit testing
- **Playwright 1.61** - E2E testing
- **Testing Library** - Component testing
- **MSW 2.14** - API mocking

### Developer Experience
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **TypeScript Strict Mode** - Enhanced type checking

### Monitoring & Analytics
- **Sentry** - Error tracking and performance monitoring
- **PostHog** - Product analytics
- **Web Vitals** - Performance metrics

## 🚀 Quick Start

### Prerequisites

- Node.js v20.x or higher
- npm v10.x or higher
- Git
- Supabase account ([sign up free](https://supabase.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   Get credentials from [Supabase Dashboard](https://app.supabase.com/) → Settings → API

4. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser

**Setup time: ~5 minutes** ⚡

For detailed setup instructions, see [Onboarding Guide](docs/ONBOARDING_GUIDE.md)

## 📁 Project Structure

```
Saas/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Cards/          # Stat cards, metric displays
│   │   ├── DataTable/      # Table components
│   │   ├── Feedback/       # Loading, errors, empty states
│   │   ├── Forms/          # Form components and modals
│   │   ├── Guards/         # Permission guards
│   │   ├── Layout/         # Layout structure
│   │   └── Navigation/     # Navigation components
│   │
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext     # Authentication state
│   │   ├── TenantContext   # Multi-tenancy
│   │   ├── ThemeContext    # Dark/light mode
│   │   └── OfflineSyncContext # Offline support
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useFarmFilter.ts
│   │   └── useViewMode.ts
│   │
│   ├── pages/               # Page components (routes)
│   │   ├── Dashboard/      # Executive dashboard
│   │   ├── Admin/          # User & role management
│   │   ├── Pecuaria/       # Livestock management
│   │   ├── Finance/        # Financial control
│   │   ├── Inventory/      # Inventory tracking
│   │   ├── Fleet/          # Fleet management
│   │   ├── Purchasing/     # Purchase orders
│   │   ├── Sales/          # Sales orders
│   │   ├── Market/         # Market indicators
│   │   └── Reports/        # Reports & analytics
│   │
│   ├── lib/                 # External libraries setup
│   │   └── supabase.ts     # Supabase client
│   │
│   ├── types/               # TypeScript definitions
│   │   └── database.types.ts # Supabase types
│   │
│   ├── utils/               # Utility functions
│   │   ├── format.ts       # Formatting helpers
│   │   ├── validation.ts   # Form validation
│   │   └── export.ts       # Excel/PDF export
│   │
│   ├── __tests__/          # Test files
│   │   ├── unit/           # Unit tests
│   │   ├── integration/    # Integration tests
│   │   └── setup.ts        # Test configuration
│   │
│   ├── App.tsx              # Root component & routes
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
│
├── docs/                    # Documentation
│   ├── adr/                # Architecture Decision Records
│   ├── ONBOARDING_GUIDE.md
│   ├── ARQUITETURA_ATUAL.md
│   ├── PRODUCTION_DEPLOYMENT_GUIDE.md
│   └── ...
│
├── tests/                   # E2E tests
│   └── e2e/                # Playwright tests
│
├── .github/
│   └── workflows/          # CI/CD pipelines
│       └── ci.yml
│
├── .husky/                  # Git hooks
├── package.json             # Dependencies & scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── eslint.config.js        # ESLint configuration
└── .prettierrc             # Prettier configuration
```

## 🎯 Architecture Overview

### Frontend Architecture
- **Component-Based**: Modular, reusable components
- **Context + React Query**: Global state + server state management
- **Code Splitting**: Lazy-loaded routes for optimal performance
- **Offline-First**: PWA with IndexedDB queue for offline operations

### Backend Architecture
- **Multi-Tenant**: Complete data isolation using Row Level Security
- **RESTful API**: Supabase auto-generated REST API
- **Real-time**: Supabase Realtime for live updates
- **Storage**: Supabase Storage for file uploads (photos, documents)

### Security
- **JWT Authentication**: Token-based auth with Supabase
- **Row Level Security (RLS)**: Database-level tenant isolation
- **MFA Support**: Two-factor authentication
- **Role-Based Access Control**: Granular permissions system

For detailed architecture documentation, see [Architecture Guide](docs/ARQUITETURA_ATUAL.md)

## 📜 Available Scripts

### Development
```bash
npm run dev              # Start development server
npm run dev:host         # Expose to network (mobile testing)
npm run dev:https        # Run with HTTPS
```

### Build
```bash
npm run build            # Production build
npm run build:analyze    # Build with bundle analysis
npm run build:staging    # Build for staging environment
npm run preview          # Preview production build
```

### Code Quality
```bash
npm run lint             # Check for linting errors
npm run lint:fix         # Auto-fix linting errors
npm run format           # Format code with Prettier
npm run format:check     # Check formatting
npm run type-check       # TypeScript type checking
```

### Testing
```bash
npm run test             # Run tests in watch mode
npm run test:run         # Run all tests once
npm run test:coverage    # Generate coverage report
npm run test:ui          # Open Vitest UI
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:debug   # Debug E2E tests
```

### Utilities
```bash
npm run clean            # Clean build artifacts
npm run audit:rls        # Audit RLS policies
npm run optimize:images  # Optimize images
npm run lighthouse       # Run Lighthouse audit
npm run healthcheck      # System health check
```

## 🧪 Testing

### Test Coverage

Current: **32 tests** (12.5% coverage)  
Target: **60%+ coverage**

### Testing Strategy
- **Unit Tests (60%)**: Utils, hooks, business logic
- **Integration Tests (30%)**: Component interactions, flows
- **E2E Tests (10%)**: Critical user paths

### Running Tests
```bash
# Unit tests
npm run test

# With coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

See [Testing Guide](src/__tests__/README.md) for detailed testing documentation.

## 🚀 Deployment

### Staging
Automatically deployed to staging when code is merged to `develop` branch via GitHub Actions.

### Production
Automatically deployed to production when code is merged to `main` branch via GitHub Actions.

### Manual Deployment
```bash
# Build production bundle
npm run build

# Deploy to hosting platform (Vercel, Netlify, etc.)
# Upload contents of dist/ folder
```

For detailed deployment instructions, see [Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT_GUIDE.md)

## 🔧 Configuration

### Environment Variables

Required variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

Optional variables:
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe payment integration
- `VITE_SENTRY_DSN` - Sentry error tracking
- `VITE_POSTHOG_KEY` - PostHog analytics

See [.env.example](.env.example) for complete list with descriptions.

### TypeScript Configuration
- Strict mode enabled
- Path aliases: `@/*` → `src/*`
- React 19 JSX transform

### Vite Configuration
- Code splitting by route
- Bundle size optimization
- PWA support
- Source maps for development

## 📊 Performance

### Bundle Size
- Target: **<500KB gzipped**
- Initial load: **<200KB**
- Lazy-loaded routes: **~60-90KB each**

### Web Vitals Targets
- **LCP**: <2.5s (Largest Contentful Paint)
- **FID**: <100ms (First Input Delay)
- **CLS**: <0.1 (Cumulative Layout Shift)

### Optimization Techniques
- Code splitting by route
- Lazy loading heavy libraries (Recharts, Leaflet)
- Tree-shaking (especially lucide-react icons)
- Image optimization
- React Query caching

Run bundle analysis:
```bash
npm run build:analyze
```

See [Lighthouse Optimization Guide](docs/LIGHTHOUSE_OPTIMIZATION_GUIDE.md) for performance tuning.

## 📱 PWA & Offline Support

### Offline Capabilities
- Queue operations when offline (create, update, delete)
- Automatic sync when connection restored
- Background sync for photo uploads
- Offline indicator banner

### Service Worker Strategy
- **Network First**: API calls (with cache fallback)
- **Cache First**: Static assets (JS, CSS, fonts)
- **Offline Queue**: IndexedDB for pending operations

See [Offline Sync Implementation](docs/OFFLINE_SYNC_IMPLEMENTATION.md) for details.

## 🔐 Security

### Credential Management
- Never commit `.env` files (gitignored)
- Use `.env.example` as template
- Store production secrets in hosting platform
- Rotate keys if accidentally exposed

See [Credential Rotation Checklist](CREDENTIAL_ROTATION_CHECKLIST.md) for key rotation procedures.

### Database Security
- Row Level Security (RLS) enabled on all tables
- Tenant isolation enforced at database level
- JWT-based authentication
- Audit logs for all critical operations

Audit RLS policies:
```bash
npm run audit:rls
```

## 🐛 Error Tracking & Monitoring

### Sentry Integration
- Error tracking with stack traces
- Performance monitoring (10% sample rate)
- Session replay (100% of errors)
- User context (tenant_id, user_id, role)

### Analytics Integration
- PostHog for product analytics
- Custom business events tracking
- Core Web Vitals monitoring
- User behavior analysis

See [Sentry Error Tracking Guide](docs/SENTRY_ERROR_TRACKING_GUIDE.md) and [Analytics Event Tracking Guide](docs/ANALYTICS_EVENT_TRACKING_GUIDE.md)

## 🛠️ Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Develop
```bash
npm run dev
# Make changes, test locally
```

### 3. Run Quality Checks
```bash
npm run lint:fix
npm run format
npm run type-check
npm run test:run
```

### 4. Commit (Pre-commit hooks run automatically)
```bash
git add .
git commit -m "feat: add new feature"
```

### 5. Push & Create PR
```bash
git push origin feature/your-feature-name
# Create pull request on GitHub
```

### 6. CI/CD Pipeline Runs
- Linting
- Type checking
- Tests
- Build
- Deploy to staging (if merged to develop)

## 🤝 Contributing

### Code Style
- Follow existing patterns and conventions
- Use TypeScript strict mode
- Write tests for new features
- Update documentation

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

### Pull Request Process
1. Create feature branch from `develop`
2. Make changes with tests
3. Ensure all checks pass
4. Request review from team
5. Address feedback
6. Merge after approval

## 📚 Documentation

### Key Documents
- [Onboarding Guide](docs/ONBOARDING_GUIDE.md) - Get started in <10 minutes
- [Architecture Guide](docs/ARQUITETURA_ATUAL.md) - System architecture overview
- [Production Deployment](docs/PRODUCTION_DEPLOYMENT_GUIDE.md) - Deploy to production
- [Testing Guide](src/__tests__/README.md) - Testing strategy and examples
- [ADRs](docs/adr/README.md) - Architecture Decision Records

### API Integration Guides
- [API Integrations](docs/API_INTEGRATIONS.md) - External API integration guide
- [Offline Sync](docs/OFFLINE_SYNC_IMPLEMENTATION.md) - PWA offline implementation
- [Sentry Setup](docs/SENTRY_ERROR_TRACKING_GUIDE.md) - Error tracking setup
- [Analytics Setup](docs/ANALYTICS_EVENT_TRACKING_GUIDE.md) - Analytics integration

### Operational Guides
- [Dependency Management](docs/DEPENDENCY_MANAGEMENT.md) - Managing dependencies
- [Bundle Analyzer](docs/BUNDLE_ANALYZER_GUIDE.md) - Analyzing bundle size
- [Lighthouse Guide](docs/LIGHTHOUSE_OPTIMIZATION_GUIDE.md) - Performance optimization
- [Database Performance](src/database/PERFORMANCE_INDEXES_README.md) - Database optimization

## 🗺️ Roadmap

### Phase 1: Foundation (Completed)
- ✅ Multi-tenant architecture
- ✅ Core modules (Livestock, Finance, Inventory)
- ✅ Authentication & authorization
- ✅ Basic reporting

### Phase 2: Enhancement (In Progress)
- 🔄 Increase test coverage to 60%
- 🔄 Bundle size optimization (<500KB)
- 🔄 Component refactoring
- 🔄 TypeScript strict mode
- 🔄 CI/CD pipeline

### Phase 3: Advanced Features (Planned)
- 📋 Advanced analytics dashboard
- 📋 Mobile app (React Native)
- 📋 NF-e integration
- 📋 AI-powered insights
- 📋 Advanced offline support

### Phase 4: Enterprise (Future)
- 📋 Multi-language support
- 📋 Advanced audit trails
- 📋 API marketplace
- 📋 White-label solutions

## 🔍 Troubleshooting

### Common Issues

**Issue: "Missing required environment variables"**
- Solution: Verify `.env` file exists and has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**Issue: "Failed to connect to Supabase"**
- Solution: Check credentials in `.env`, verify Supabase project is active

**Issue: "Port 5173 is already in use"**
- Solution: `npx kill-port 5173` or use different port: `npm run dev -- --port 3000`

**Issue: "Tests are failing"**
- Solution: Run `npm install` and `npm run test:run -- --clearCache`

For more troubleshooting, see [Onboarding Guide](docs/ONBOARDING_GUIDE.md#common-issues)

## 📊 Project Stats

- **Lines of Code**: ~50,000+
- **Components**: 100+
- **Tests**: 32 (growing to 60%+ coverage)
- **Dependencies**: 20 production, 40+ dev
- **Bundle Size**: ~850KB (~280KB gzipped)
- **Modules**: 8 main business modules

## 🔗 Links

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vite.dev/guide/)
- [React Query Docs](https://tanstack.com/query/)

## 📄 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

Built with:
- React team for React 19
- Supabase for amazing BaaS platform
- TanStack team for React Query
- Vite team for blazing fast build tool
- Open source community

---

**Made with ❤️ for the agricultural community**

For questions or support, refer to the documentation in the `docs/` directory or contact the development team.
