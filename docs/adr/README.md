# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Tauze ERP v5.0 system. ADRs document significant architectural decisions, their context, and consequences to help current and future developers understand why certain choices were made.

## What is an ADR?

An Architecture Decision Record captures an important architectural decision along with its context and consequences. Each ADR describes:

- **Context**: The problem or situation that necessitated the decision
- **Decision**: The architectural choice that was made
- **Consequences**: The trade-offs, benefits, and potential drawbacks

## ADR Index

| ID | Title | Status | Date | Key Topics |
|----|-------|--------|------|------------|
| [ADR-001](./ADR-001-multi-tenant-rls.md) | Multi-tenant Architecture with RLS | Accepted | 2024 | PostgreSQL, Row Level Security, Tenant Isolation |
| [ADR-002](./ADR-002-react-typescript-vite-stack.md) | React + TypeScript + Vite Stack Choice | Accepted | 2024 | Frontend Stack, Build Tool, Type Safety |
| [ADR-003](./ADR-003-supabase-backend.md) | Supabase as Backend Platform | Accepted | 2024 | Backend, PostgreSQL, Auth, Storage |
| [ADR-004](./ADR-004-state-management-react-query.md) | State Management with React Query | Accepted | 2024 | Server State, Caching, Offline-First |
| [ADR-005](./ADR-005-code-splitting-lazy-loading.md) | Code Splitting and Lazy Loading Strategy | Accepted | 2024 | Performance, Bundle Size, User Experience |
| [ADR-006](./ADR-006-authentication-mfa.md) | Authentication and MFA Approach | Accepted | 2024 | Security, Auth, Multi-Factor Authentication |
| [ADR-007](./ADR-007-offline-first-pwa.md) | Offline-First PWA Capabilities | Accepted | 2024 | PWA, Service Workers, IndexedDB, Offline Sync |
| [ADR-008](./ADR-008-error-monitoring-sentry.md) | Error Monitoring with Sentry | Accepted | 2024 | Observability, Error Tracking, Performance |
| [ADR-009](./ADR-009-command-palette-navigation.md) | Command Palette Navigation Pattern | Accepted | 2024 | UX, Keyboard Navigation, Power Users |

## ADR Status

- **Accepted**: The decision is finalized and implemented
- **Proposed**: The decision is under consideration
- **Deprecated**: The decision is no longer valid but kept for historical context
- **Superseded**: Replaced by a newer decision (link to the replacement)

## How to Create a New ADR

When making a significant architectural decision:

1. Copy the template from `ADR-TEMPLATE.md`
2. Number it sequentially (e.g., `ADR-010-decision-title.md`)
3. Fill in all sections:
   - **Title**: Short, descriptive name
   - **Status**: Usually starts as "Proposed"
   - **Context**: Why this decision is needed
   - **Decision**: What we chose and why
   - **Consequences**: Trade-offs and implications
4. Add an entry to this README index
5. Link to related ADRs if applicable

## Contributing

When modifying the architecture:

- If changing an existing decision, create a new ADR that supersedes the old one
- Don't delete old ADRs - mark them as "Superseded" or "Deprecated"
- Keep ADRs concise but comprehensive
- Focus on the "why" more than the "how"
- Include relevant code examples or configuration snippets

## Additional Resources

- [Architecture Overview](../ARQUITETURA_ATUAL.md)
- [System Requirements](./../.kiro/specs/system-improvements/requirements.md)
- [System Design](./../.kiro/specs/system-improvements/design.md)
- [PWA Configuration](../PWA_CONFIGURATION.md)
- [Sentry Error Tracking](../SENTRY_ERROR_TRACKING_GUIDE.md)
