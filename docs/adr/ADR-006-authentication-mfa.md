# ADR-006: Authentication and MFA Approach

**Status**: Accepted  
**Date**: 2024  
**Decision Makers**: Security Team, Backend Team  
**Related Requirements**: Requirement 1 (Credential Security), Requirement 2 (Key Rotation), Requirement 3 (RLS Audit)

## Context

Tauze ERP handles sensitive financial and operational data for agricultural businesses. Authentication and authorization must:

- **Secure by Default**: Protect against common attacks (credential stuffing, session hijacking, CSRF)
- **Multi-Factor Authentication (MFA)**: Add second factor for admin users and financial operations
- **Session Management**: Automatic token refresh, secure session storage
- **Multi-Tenant Aware**: JWT tokens must carry tenant_id for RLS enforcement
- **Role-Based Access Control (RBAC)**: Different permissions for Admins, Managers, Operators
- **Audit Trail**: Log all authentication events for compliance

We needed a solution that balanced security with developer experience and user convenience.

## Decision

We chose **Supabase Auth with JWT tokens and TOTP-based MFA** for authentication and authorization.

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Authentication Flow                    │
└──────────────────────────────────────────────────────────┘

1. User Login
   ┌──────────┐
   │  Login   │
   │  Form    │
   └────┬─────┘
        │ email + password
        ▼
   ┌──────────────────┐
   │  Supabase Auth   │
   │  • Verify creds  │
   │  • Check MFA     │
   └────┬─────────────┘
        │
        ├─── No MFA ────► Issue JWT + Refresh Token
        │
        └─── MFA Required ──┐
                             │
                             ▼
                    ┌──────────────────┐
                    │  TOTP Challenge  │
                    │  (6-digit code)  │
                    └────┬─────────────┘
                         │ Verify TOTP
                         ▼
                    ┌──────────────────┐
                    │  Issue JWT Token │
                    │  + Refresh Token │
                    └────┬─────────────┘
                         │
                         ▼
                    ┌──────────────────┐
                    │  Store in Local  │
                    │  Storage (secure)│
                    └──────────────────┘

2. Authenticated Requests
   ┌──────────────────┐
   │  Supabase Client │
   │  Auto-attaches   │
   │  JWT to requests │
   └────┬─────────────┘
        │ Authorization: Bearer <jwt>
        ▼
   ┌──────────────────┐
   │  PostgreSQL RLS  │
   │  Extracts claims:│
   │  • user_id       │
   │  • tenant_id     │
   │  • role          │
   └──────────────────┘

3. Token Refresh (Automatic)
   ┌──────────────────┐
   │  Supabase Client │
   │  Monitors expiry │
   └────┬─────────────┘
        │ Token expires in 5min
        ▼
   ┌──────────────────┐
   │  Auto-refresh    │
   │  using Refresh   │
   │  Token (7 days)  │
   └──────────────────┘
```

### JWT Token Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "admin",
  "tenant_id": "tenant-uuid",
  "user_metadata": {
    "full_name": "João Silva",
    "phone": "+55..."
  },
  "iat": 1640000000,
  "exp": 1640003600,
  "iss": "https://xxx.supabase.co/auth/v1"
}
```

### Implementation

**1. Supabase Client Configuration**

```typescript
// src/lib/supabase.ts
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,        // Store in localStorage
      autoRefreshToken: true,      // Auto-refresh before expiry
      detectSessionInUrl: true,    // Handle magic link redirects
      flowType: 'pkce',            // PKCE for extra security
    },
  }
);
```

**2. Authentication Context**

```typescript
// src/contexts/AuthContext.tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**3. MFA Enrollment**

```typescript
// src/pages/Settings/Security.tsx
export function MFASetup() {
  const [totpSecret, setTotpSecret] = useState<string | null>(null);

  // Step 1: Generate TOTP secret
  const enrollMFA = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });
    
    if (data) {
      setTotpSecret(data.totp.qr_code); // Show QR code
    }
  };

  // Step 2: Verify TOTP code
  const verifyMFA = async (code: string) => {
    const { data, error } = await supabase.auth.mfa.verify({
      factorId: factorId,
      code: code,
    });
    
    if (data) {
      toast.success('MFA habilitado com sucesso!');
    }
  };

  return (
    <div>
      <h2>Autenticação de Dois Fatores</h2>
      {!totpSecret ? (
        <button onClick={enrollMFA}>Ativar MFA</button>
      ) : (
        <>
          <QRCode value={totpSecret} />
          <input 
            placeholder="Digite o código de 6 dígitos" 
            onChange={(e) => verifyMFA(e.target.value)}
          />
        </>
      )}
    </div>
  );
}
```

**4. Protected Routes**

```typescript
// src/components/Auth/ProtectedRoute.tsx
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSkeleton type="page" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// Usage in App.tsx
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/financeiro/*" element={<Finance />} />
</Route>
```

**5. Role-Based Access Control**

```typescript
// src/hooks/usePermissions.ts
export function usePermissions() {
  const { user } = useAuth();
  
  const role = user?.user_metadata?.role || 'operator';
  
  return {
    canCreatePayment: ['admin', 'manager'].includes(role),
    canDeleteAnimal: role === 'admin',
    canViewReports: ['admin', 'manager'].includes(role),
    canManageUsers: role === 'admin',
  };
}

// Usage in component
const { canCreatePayment } = usePermissions();
if (!canCreatePayment) {
  return <AccessDenied />;
}
```

## Consequences

### Benefits

✅ **Security by Default**: JWT tokens signed by Supabase; cannot be forged  
✅ **Automatic Token Refresh**: No manual expiry handling; seamless UX  
✅ **MFA Support**: TOTP-based (Google Authenticator, Authy) for high-security scenarios  
✅ **Multi-Tenant Isolation**: `tenant_id` in JWT enforces RLS automatically  
✅ **Session Persistence**: Users stay logged in across browser sessions  
✅ **Audit Trail**: Supabase logs all auth events (logins, MFA challenges, token refreshes)  
✅ **Zero Backend Code**: Supabase handles auth flows; no custom endpoints needed  

### Drawbacks

⚠️ **Vendor Lock-in**: Tightly coupled to Supabase Auth  
⚠️ **Limited Customization**: Cannot fully customize login flow UI (can only theme)  
⚠️ **Token Size**: JWT tokens can be large (~1KB) if many claims added  
⚠️ **Client-Side Storage**: Tokens in localStorage are vulnerable to XSS (mitigated by CSP)  

### Trade-offs

- **Convenience vs Security**: localStorage allows persistence but is XSS-vulnerable (acceptable with CSP)
- **Simplicity vs Flexibility**: Supabase Auth is simple but less customizable than Auth0
- **Performance vs Security**: Token refresh adds latency (~100ms) but ensures security

## Security Considerations

### 1. Token Storage

Tokens stored in `localStorage` (not `sessionStorage` or cookies):
- **Pros**: Persists across browser restarts, accessible to React app
- **Cons**: Vulnerable to XSS attacks
- **Mitigation**: Content Security Policy (CSP) headers prevent inline scripts

```html
<!-- public/index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co">
```

### 2. CSRF Protection

JWT tokens are not vulnerable to CSRF because:
- Sent via `Authorization` header (not cookies)
- Browser does not auto-attach headers in cross-origin requests

### 3. Token Expiry

- **Access Token**: 1 hour (configurable via Supabase dashboard)
- **Refresh Token**: 7 days (revoked on password change or logout)

### 4. MFA Enforcement

MFA required for:
- Admin users (always)
- Financial transactions above R$ 10,000
- Critical operations (user deletion, tenant settings changes)

```typescript
// Enforce MFA for financial operations
if (amount > 10000 && !user.mfa_enabled) {
  throw new Error('MFA necessário para operações acima de R$ 10.000');
}
```

## Alternatives Considered

### 1. Auth0 / Clerk

**Pros**: More customizable, better analytics, social logins  
**Cons**: Additional cost (~$240/year), extra dependency  
**Rejected**: Supabase Auth is free and sufficient for our needs

### 2. Custom JWT Implementation (Node.js + Passport)

**Pros**: Full control, no vendor lock-in  
**Cons**: Must implement token refresh, MFA, session management, audit logs  
**Rejected**: Too much effort; Supabase Auth handles this out-of-the-box

### 3. Firebase Auth

**Pros**: Google ecosystem, robust MFA, phone auth  
**Cons**: NoSQL backend (Firestore); we need PostgreSQL  
**Rejected**: Already using Supabase for database

### 4. Magic Links Only (Passwordless)

**Pros**: No password management, phishing-resistant  
**Cons**: Rural users may have email access issues  
**Rejected**: Passwords + optional MFA is more reliable for our user base

## Migration Path

If we need to move away from Supabase Auth:

1. **Export Users**: Supabase allows exporting user table as CSV
2. **Migrate to Auth.js**: Compatible with JWT tokens; can reuse user IDs
3. **Update RLS Policies**: Change JWT claim extraction to match new issuer

## Related Decisions

- **ADR-001**: Multi-tenant RLS (JWT `tenant_id` claim used in RLS policies)
- **ADR-003**: Supabase Backend (Supabase Auth is part of the platform)
- **ADR-008**: Error Monitoring (Auth failures tracked in Sentry)

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase MFA Guide](https://supabase.com/docs/guides/auth/auth-mfa)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- Requirement 1: Credential Security (requirements.md)
