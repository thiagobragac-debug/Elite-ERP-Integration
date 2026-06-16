# 🏗️ Arquitetura Atual - Tauze ERP v5.0

## 📐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUÁRIO FINAL                           │
│                    (Fazendeiro/Gestor)                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   NAVEGADOR    │
                    │   (PWA Ready)  │
                    └───────┬────────┘
                            │
        ┏━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━┓
        ┃         FRONTEND - React 19           ┃
        ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
        ┃                                       ┃
        ┃  ┌────────────┐  ┌─────────────┐     ┃
        ┃  │  Vite      │  │ TypeScript  │     ┃
        ┃  │  (Bundler) │  │  (Type Safe)│     ┃
        ┃  └────────────┘  └─────────────┘     ┃
        ┃                                       ┃
        ┃  ┌──────────────────────────────┐    ┃
        ┃  │   React Router v7            │    ┃
        ┃  │   (Roteamento Client-Side)   │    ┃
        ┃  └──────────────────────────────┘    ┃
        ┃                                       ┃
        ┃  ┌──────────────────────────────┐    ┃
        ┃  │   React Query (TanStack)     │    ┃
        ┃  │   (Cache + Sync + Mutations) │    ┃
        ┃  └──────────────────────────────┘    ┃
        ┃                                       ┃
        ┃  ┌──────────────────────────────┐    ┃
        ┃  │   Context API                │    ┃
        ┃  │   - Auth                     │    ┃
        ┃  │   - Tenant (Multi-tenancy)   │    ┃
        ┃  │   - Theme                    │    ┃
        ┃  │   - OfflineSync              │    ┃
        ┃  └──────────────────────────────┘    ┃
        ┃                                       ┃
        ┗━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━┛
                            │
                            │ (REST API)
                            │
        ┏━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━┓
        ┃      BACKEND - Supabase               ┃
        ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
        ┃                                       ┃
        ┃  ┌──────────────────────────────┐    ┃
        ┃  │   PostgreSQL 14              │    ┃
        ┃  │   - Multi-tenant             │    ┃
        ┃  │   - RLS (Row Level Security) │    ┃
        ┃  │   - 40+ Tabelas              │    ┃
        ┃  └──────────────────────────────┘    ┃
        ┃                                       ┃
        ┃  ┌──────────────────────────────┐    ┃
        ┃  │   Auth (Supabase Auth)       │    ┃
        ┃  │   - JWT                      │    ┃
        ┃  │   - MFA/2FA                  │    ┃
        ┃  │   - Roles/Permissions        │    ┃
        ┃  └──────────────────────────────┘    ┃
        ┃                                       ┃
        ┃  ┌──────────────────────────────┐    ┃
        ┃  │   Storage (Supabase Storage) │    ┃
        ┃  │   - Fotos de animais         │    ┃
        ┃  │   - Notas fiscais            │    ┃
        ┃  │   - Relatórios PDF           │    ┃
        ┃  └──────────────────────────────┘    ┃
        ┃                                       ┃
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                            │
                            │
        ┏━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━┓
        ┃     INTEGRAÇÕES EXTERNAS              ┃
        ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
        ┃                                       ┃
        ┃  • Stripe (Pagamentos SaaS)           ┃
        ┃  • Cepea (Preços de Mercado)          ┃
        ┃  • Leaflet/OSM (Mapas)                ┃
        ┃  • Recharts (Gráficos)                ┃
        ┃                                       ┃
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 🗂️ Estrutura de Diretórios

### Frontend (`/src`)

```
src/
├── 📁 components/          # 🔧 Componentes Reutilizáveis
│   ├── Cards/              # - TauzeStatCard (métricas)
│   ├── DataTable/          # - ModernTable (listagens)
│   ├── Feedback/           # - EmptyState, ErrorBoundary
│   ├── Forms/              # - FormModal, SearchableSelect
│   ├── Guards/             # - PermissionGuard, MFAGuard
│   ├── Layout/             # - Layout principal, SidePanel
│   ├── Modals/             # - HistoryModal
│   └── Navigation/         # - Breadcrumb, CommandPalette
│
├── 📁 contexts/            # 🌐 Estado Global
│   ├── AuthContext.tsx     # - Autenticação (user, login, logout)
│   ├── TenantContext.tsx   # - Multi-tenancy (tenant_id)
│   ├── ThemeContext.tsx    # - Tema claro/escuro
│   ├── CepeaContext.tsx    # - Dados de mercado (preços)
│   ├── OfflineSyncContext  # - Sincronização offline
│   └── QueryProvider.tsx   # - React Query setup
│
├── 📁 hooks/               # 🎣 Custom Hooks
│   ├── useAuth.ts          # - Auth helpers
│   ├── useFarmFilter.ts    # - Filtro de fazenda
│   ├── useFormReset.ts     # - Reset de formulários
│   ├── useSuperAdmin.ts    # - Validação super admin
│   └── useViewMode.ts      # - Toggle grid/list
│
├── 📁 pages/               # 📄 Páginas/Rotas
│   ├── 🏠 Dashboard/       # - ExecutiveDashboard (visão geral)
│   ├── 👤 Admin/           # - Users, Roles, Audit, Billing
│   ├── 🐮 Pecuaria/        # - Animais, Lotes, Sanidade
│   ├── 💰 Finance/         # - Contas, FluxoCaixa, Conciliação
│   ├── 🚜 Fleet/           # - Máquinas, Manutenções
│   ├── 📦 Inventory/       # - Estoque, Armazéns
│   ├── 🛒 Purchasing/      # - Compras, Fornecedores
│   ├── 💼 Sales/           # - Vendas, Clientes
│   ├── 📊 Market/          # - Indicadores Cepea
│   └── 📈 Reports/         # - Relatórios gerenciais
│
├── 📁 types/               # 📝 TypeScript Definitions
│   ├── database.types.ts   # - Types do Supabase (gerado)
│   └── reports.ts          # - Types de relatórios
│
├── 📁 utils/               # 🛠️ Utilitários
│   ├── export.ts           # - Exportar Excel/PDF
│   ├── format.ts           # - Formatação (moeda, data)
│   └── validation.ts       # - Validações de formulário
│
├── 📁 lib/                 # 📚 Bibliotecas/SDKs
│   └── supabase.ts         # - Cliente Supabase configurado
│
├── 📁 assets/              # 🎨 Imagens/Ícones estáticos
│
├── App.tsx                 # 🏁 Componente raiz + rotas
├── main.tsx                # 🚀 Entry point (ReactDOM)
└── index.css               # 🎨 Estilos globais + Design System
```

---

## 🎨 Design System

### Variáveis CSS (CSS Custom Properties)

```css
:root {
  /* Cores Principais */
  --brand: 142 71% 45%;         /* Verde Tauze #27a376 */
  --brand-hover: 142 71% 35%;   /* Hover */
  
  /* Backgrounds */
  --bg-main: 222 47% 11%;       /* #0f172a (escuro) */
  --bg-card: 217 33% 17%;       /* #1e293b (cards) */
  --bg-elevated: 215 28% 23%;   /* Modais/Dropdowns */
  
  /* Textos */
  --text-main: 210 40% 98%;     /* Branco suave */
  --text-muted: 215 20% 65%;    /* Cinza médio */
  
  /* Estados */
  --success: 142 71% 45%;       /* Verde */
  --error: 0 84% 60%;           /* Vermelho */
  --warning: 38 92% 50%;        /* Amarelo */
  --info: 221 83% 53%;          /* Azul */
  
  /* Bordas */
  --border: 217 33% 25%;        /* Bordas sutis */
  --radius: 12px;               /* Border radius padrão */
  
  /* Sombras */
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.15);
  --shadow-lg: 0 10px 40px rgba(0,0,0,0.25);
}
```

### Componentes Base

```tsx
// Hierarquia de Componentes
┌────────────────────────────────┐
│        Layout (Wrapper)        │
├────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │     Header (Topo)        │  │
│  │  - Logo                  │  │
│  │  - Breadcrumb            │  │
│  │  - User Menu             │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────┐ ┌─────────────────┐  │
│  │ Side │ │   Main Content  │  │
│  │ Nav  │ │                 │  │
│  │      │ │  ┌───────────┐  │  │
│  │ • 🏠 │ │  │   Card    │  │  │
│  │ • 🐮 │ │  │           │  │  │
│  │ • 💰 │ │  └───────────┘  │  │
│  │ • 📦 │ │                 │  │
│  │ • 🚜 │ │  ModernTable    │  │
│  │      │ │  ┌───┬───┬───┐  │  │
│  └──────┘ │  │ ■ │ ■ │ ■ │  │  │
│           │  ├───┼───┼───┤  │  │
│           │  │   │   │   │  │  │
│           │  └───┴───┴───┘  │  │
│           └─────────────────┘  │
└────────────────────────────────┘
```

---

## 🔐 Autenticação e Autorização

### Fluxo de Autenticação

```
┌──────────┐
│  Login   │
│  Page    │
└────┬─────┘
     │
     │ supabase.auth.signInWithPassword()
     ▼
┌────────────────┐
│  Supabase Auth │
│  (JWT Token)   │
└────┬───────────┘
     │
     ▼
┌────────────────┐       ┌─────────────┐
│  MFA Enabled?  │──Yes─▶│  MFA Verify │
└────┬───────────┘       └─────┬───────┘
     No                         │
     │                          │
     ▼                          ▼
┌──────────────────────────────────┐
│      AuthContext (Global)        │
│  - user                          │
│  - session                       │
│  - tenant_id                     │
└──────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│     PermissionGuard Check        │
│  - Has permission X?             │
│  - Is super admin?               │
└────┬─────────────────────────────┘
     │
     ├──Yes─▶ Render Page
     │
     └──No──▶ Redirect to /
```

### Hierarquia de Permissões

```
Super Admin (plataforma)
    └── Tenant Admin (empresa)
        ├── Manager (gerente)
        │   ├── Veterinário
        │   ├── Comprador
        │   └── Vendedor
        └── User (operacional)
            └── Viewer (somente leitura)
```

**Permissões Granulares:**
- `admin` - Gestão de usuários e config
- `pecuaria` → `pecuaria_animais`, `pecuaria_saude`
- `financeiro` → `financeiro_operacoes`, `financeiro_bancos`
- `logistica` → `logistica_armazens`
- `compras` → `compras_pedidos`, `compras_fornecedores`
- `comercial` → `comercial_clientes`, `comercial_pedidos`
- `frota` → `frota_manutencao`, `frota_abastecimento`
- `mercado` - Indicadores e análises

---

## 🗄️ Modelo de Dados (Simplificado)

### Entidades Core

```
┌─────────────┐
│   tenants   │  (Multi-tenancy)
│─────────────│
│ • id (PK)   │
│ • nome      │
│ • plano     │
└──────┬──────┘
       │
       │ (1:N)
       ▼
┌─────────────────┐      ┌──────────────┐
│    fazendas     │◀────▶│   usuarios   │
│─────────────────│ (N:M)│──────────────│
│ • id (PK)       │      │ • id (PK)    │
│ • tenant_id (FK)│      │ • email      │
│ • nome          │      │ • role       │
│ • area_total    │      │ • tenant_id  │
└────────┬────────┘      └──────────────┘
         │
         │ (1:N)
         ▼
    ┌─────────────────┐
    │     animais     │
    │─────────────────│
    │ • id (PK)       │
    │ • tenant_id (FK)│
    │ • fazenda_id(FK)│
    │ • brinco        │
    │ • raca          │
    │ • peso_atual    │
    │ • lote_id (FK)  │
    │ • pasto_id (FK) │
    └─────────────────┘
         │
         ▼
    ┌──────────────────┐
    │    pesagens      │ (Histórico)
    │──────────────────│
    │ • id             │
    │ • animal_id (FK) │
    │ • data           │
    │ • peso           │
    └──────────────────┘

┌──────────────────┐      ┌─────────────────┐
│ contas_pagar     │      │ contas_receber  │
│──────────────────│      │─────────────────│
│ • id             │      │ • id            │
│ • tenant_id (FK) │      │ • tenant_id (FK)│
│ • fornecedor_id  │      │ • cliente_id    │
│ • valor_total    │      │ • valor_total   │
│ • status         │      │ • status        │
│ • data_vencimento│      │ • data_vencimento│
└──────────────────┘      └─────────────────┘

┌──────────────────┐      ┌─────────────────┐
│    maquinas      │      │  abastecimentos │
│──────────────────│      │─────────────────│
│ • id             │◀────▶│ • maquina_id(FK)│
│ • tipo           │ (1:N)│ • data          │
│ • placa          │      │ • litros        │
└──────────────────┘      │ • valor_total   │
                          └─────────────────┘

┌──────────────────┐      ┌─────────────────┐
│     insumos      │      │  movimentacoes  │
│──────────────────│      │─────────────────│
│ • id             │◀────▶│ • insumo_id(FK) │
│ • categoria      │ (1:N)│ • tipo          │
│ • estoque_minimo │      │ • quantidade    │
│ • saldo_atual    │      │ • data          │
└──────────────────┘      └─────────────────┘
```

### RLS (Row Level Security) - Exemplo

```sql
-- Política de acesso por tenant
CREATE POLICY "Users can only see their tenant data"
ON animais
FOR SELECT
USING (tenant_id = auth.jwt() -> 'tenant_id');

-- Política de escrita
CREATE POLICY "Users can insert animals in their tenant"
ON animais
FOR INSERT
WITH CHECK (tenant_id = auth.jwt() -> 'tenant_id');
```

---

## 🔄 Fluxo de Dados

### Exemplo: Registrar Novo Animal

```
[Usuário]
    │
    │ 1. Clica "Novo Animal"
    ▼
[AnimalManagement.tsx]
    │
    │ 2. Abre SidePanel com formulário
    ▼
[FormModal/SidePanel]
    │
    │ 3. Preenche: brinco, raça, peso, fazenda
    │ 4. Clica "Salvar"
    ▼
[React Query Mutation]
    │
    │ 5. useMutation({ mutationFn: createAnimal })
    ▼
[Supabase Client]
    │
    │ 6. POST /rest/v1/animais
    │    Headers: { Authorization: "Bearer JWT" }
    │    Body: { brinco, raca, peso, tenant_id, fazenda_id }
    ▼
[Supabase Backend]
    │
    │ 7. Valida JWT
    │ 8. Aplica RLS (tenant_id)
    │ 9. Insere no PostgreSQL
    ▼
[PostgreSQL]
    │
    │ 10. Trigger: atualiza 'updated_at'
    │ 11. Retorna animal criado
    ▼
[React Query]
    │
    │ 12. Invalida cache: ['animais']
    │ 13. Refetch automático
    ▼
[UI Atualizada]
    │
    │ 14. Toast: "Animal cadastrado com sucesso!"
    │ 15. Fecha SidePanel
    │ 16. Tabela atualizada com novo animal
    ▼
[Usuário vê resultado]
```

---

## 🌐 Offline-First (PWA)

### Estratégia de Cache

```
┌────────────────────────────────────────┐
│          Service Worker                │
├────────────────────────────────────────┤
│                                        │
│  Network First (Dados Críticos)        │
│  • /rest/v1/animais                    │
│  • /rest/v1/contas_pagar               │
│  ├─ Tenta rede                         │
│  └─ Fallback: cache (5min)             │
│                                        │
│  Cache First (Assets Estáticos)        │
│  • *.js, *.css, *.woff2                │
│  • Ícones SVG                          │
│  ├─ Serve do cache                     │
│  └─ Update em background               │
│                                        │
│  Offline Queue (IndexedDB)             │
│  • Pesagens offline                    │
│  • Abastecimentos                      │
│  └─ Sync quando online                 │
│                                        │
└────────────────────────────────────────┘
```

### Estado Offline

```typescript
// OfflineSyncContext
{
  isOnline: boolean,
  queue: {
    id: string,
    action: 'create' | 'update' | 'delete',
    table: string,
    data: any,
    timestamp: Date
  }[],
  sync: () => Promise<void>
}
```

---

## 📊 Performance

### Bundle Analysis (Estimado)

```
Total Bundle Size: ~850KB (gzipped: ~280KB)

Vendor Chunks:
├── react.js                     40KB
├── react-dom.js                 120KB
├── react-router-dom.js          25KB
├── @tanstack/react-query.js     30KB
├── @supabase/supabase-js.js     45KB
├── recharts.js                  80KB  ⚠️ Lazy load
└── leaflet.js                   60KB  ⚠️ Lazy load

App Chunks:
├── pages-pecuaria.js            90KB  ✅ Lazy loaded
├── pages-finance.js             85KB  ✅ Lazy loaded
├── pages-inventory.js           70KB  ✅ Lazy loaded
├── pages-purchasing.js          65KB  ✅ Lazy loaded
└── main.js                      240KB ⚠️ Pode melhorar
```

**Oportunidades de Otimização:**
- Separar `main.js` em chunks menores
- Tree-shaking de lucide-react (importar apenas ícones usados)
- Lazy load de Recharts e Leaflet

---

## 🧪 Estratégia de Testes

### Pirâmide de Testes (Ideal)

```
        ╱╲
       ╱E2E╲          10% - Cypress/Playwright
      ╱────╲          (Fluxos críticos)
     ╱ Integ╲         30% - React Testing Library
    ╱────────╲        (Componentes + Hooks)
   ╱  Unit    ╲       60% - Vitest
  ╱────────────╲      (Utils, validações)
```

### Cobertura Atual vs Meta

```
Atual:  ████░░░░░░░░░░░░░░░░ 12.5%
Meta:   ████████████░░░░░░░░ 60%
Ideal:  ████████████████░░░░ 80%
```

**Prioridades:**
1. ✅ Utils (format, validation) - 90%+
2. 🟡 Hooks (custom hooks) - 70%+
3. 🟡 Components (ModernTable, Forms) - 60%+
4. 🔴 Pages (Financeiro, Pecuária) - 40%+

---

## 🚀 Deploy e CI/CD (Futuro)

### Pipeline Sugerido

```
[Git Push]
    │
    ▼
┌─────────────────┐
│  GitHub Actions │
└────────┬────────┘
         │
    ┌────┴────┐
    │  Lint   │ (ESLint)
    └────┬────┘
         │
    ┌────┴────┐
    │  Type   │ (tsc --noEmit)
    └────┬────┘
         │
    ┌────┴────┐
    │  Test   │ (Vitest)
    └────┬────┘
         │
    ┌────┴────┐
    │  Build  │ (Vite)
    └────┬────┘
         │
    ┌────┴────────┐
    │  Deploy     │
    │  - Staging  │ (branch: develop)
    │  - Prod     │ (branch: main)
    └─────────────┘
```

---

## 🔮 Próximas Evoluções

### Arquitetura Futura (6-12 meses)

1. **Microserviços:**
   - Edge Functions para lógica pesada
   - Webhooks para integrações (NF-e, B3)

2. **Analytics:**
   - PostHog self-hosted
   - Dashboards de uso por tenant

3. **Mobile:**
   - React Native (ou PWA otimizado)
   - Registro offline de pesagens no campo

4. **IA/ML:**
   - Predição de peso de gado
   - Recomendação de compras (estoque)
   - Detecção de anomalias financeiras

---

**Documento gerado em:** 16/06/2026  
**Versão:** 1.0  
**Próxima Revisão:** Após refactors principais
