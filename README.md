# 🌾 Tauze ERP v5.0 - Sistema de Gestão Agropecuária

ERP multi-tenant completo para gestão de fazendas com módulos de pecuária, financeiro, estoque, compras, vendas e frota.

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- npm 9+
- Conta Supabase (gratuita para desenvolvimento)

### Instalação (< 5 minutos)

1. **Clone o repositório:**
```bash
git clone <repo-url>
cd Saas
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite `.env` e preencha as variáveis obrigatórias:
- `VITE_SUPABASE_URL` - URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY` - Chave pública do Supabase

4. **Inicie o servidor:**
```bash
npm run dev
```

Acesse: http://localhost:5173

---

## 📚 Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
│   ├── Cards/      # TauzeStatCard, métricas
│   ├── DataTable/  # ModernTable (listagens)
│   ├── Feedback/   # EmptyState, ErrorBoundary, LoadingSkeleton
│   ├── Forms/      # FormModal, SearchableSelect
│   ├── Guards/     # PermissionGuard, MFAGuard
│   ├── Layout/     # Layout principal, SidePanel
│   └── Navigation/ # Breadcrumb, CommandPalette
│
├── contexts/       # React Context (Auth, Tenant, Theme, OfflineSync)
├── hooks/          # Custom hooks
├── pages/          # Páginas/rotas do app
│   ├── Admin/      # Gestão de usuários, configurações
│   ├── Dashboard/  # Dashboard executivo
│   ├── Finance/    # Contas a pagar/receber, fluxo de caixa
│   ├── Fleet/      # Frota, manutenções, abastecimentos
│   ├── Inventory/  # Estoque, armazéns, movimentações
│   ├── Market/     # Indicadores de mercado (Cepea)
│   ├── Pecuaria/   # Animais, lotes, sanidade, reprodução
│   ├── Purchasing/ # Compras, cotações, fornecedores
│   └── Sales/      # Vendas, clientes, contratos
│
├── types/          # TypeScript types
├── utils/          # Funções auxiliares
└── lib/            # Bibliotecas (Supabase client)
```

---

## 🛠️ Scripts Disponíveis

### Desenvolvimento
```bash
npm run dev              # Servidor de desenvolvimento
npm run dev:host         # Acessível na rede local (testar mobile)
npm run dev:https        # Com HTTPS (testar PWA)
```

### Build e Deploy
```bash
npm run build            # Build para produção
npm run build:staging    # Build para staging
npm run preview          # Preview do build
```

### Qualidade de Código
```bash
npm run lint             # Validar código (ESLint)
npm run lint:fix         # Corrigir erros automaticamente
npm run format           # Formatar código (Prettier)
npm run format:check     # Verificar formatação
npm run type-check       # Validar TypeScript
```

### Testes
```bash
npm test                 # Executar testes (modo watch)
npm run test:run         # Executar testes uma vez
npm run test:coverage    # Cobertura de testes
npm run test:ui          # UI interativa (Vitest UI)
```

### Utilitários
```bash
npm run clean            # Limpar arquivos gerados
```

---

## 🧪 Testes

### Executar Testes
```bash
# Modo watch (desenvolvimento)
npm test

# Executar uma vez (CI/CD)
npm run test:run

# Com relatório de cobertura
npm run test:coverage

# Interface visual
npm run test:ui
```

### Estrutura de Testes
- **Unit Tests:** `src/**/*.test.ts(x)` - Testes de funções e hooks
- **Integration Tests:** `src/**/*.test.tsx` - Testes de componentes
- **Coverage:** Meta de 60%+ (atual: 12.5%)

---

## 🏗️ Stack Tecnológica

### Frontend
- **Framework:** React 19 com TypeScript
- **Build Tool:** Vite 8
- **Roteamento:** React Router v7
- **Estado:** React Query + Context API
- **UI:** CSS Modules, Lucide Icons
- **Gráficos:** Recharts
- **Mapas:** Leaflet

### Backend
- **BaaS:** Supabase (PostgreSQL + Auth + Storage)
- **ORM:** Supabase Client (REST API)
- **Autenticação:** JWT + MFA (2FA)
- **Autorização:** Row Level Security (RLS)

### DevOps
- **CI/CD:** GitHub Actions (recomendado)
- **Testes:** Vitest + Testing Library
- **Lint:** ESLint + Prettier
- **PWA:** Vite PWA Plugin + Workbox

---

## 🔐 Segurança

### Multi-Tenancy
- Isolamento de dados por `tenant_id`
- Row Level Security (RLS) no PostgreSQL
- Validação em todas as queries

### Autenticação
- JWT tokens (Supabase Auth)
- MFA/2FA obrigatório (configurável)
- Roles e permissões granulares

### Audit Log
- Registro de todas as ações críticas
- Histórico de alterações (before/after)
- Compliance LGPD

---

## 🌐 Módulos

### ✅ Implementados

- **🐮 Pecuária:** Gestão de rebanho, lotes, sanidade, reprodução, pesagens
- **💰 Financeiro:** Contas a pagar/receber, fluxo de caixa, conciliação bancária
- **📦 Estoque:** Inventário, movimentações, auditorias, armazéns
- **🚜 Frota:** Máquinas, manutenções preventivas/corretivas, abastecimentos
- **🛒 Compras:** Solicitações, cotações, pedidos, fornecedores
- **💼 Vendas:** Clientes, pedidos, contratos, notas fiscais
- **📊 Mercado:** Indicadores Cepea, análise de preços, B3
- **👤 Admin:** Usuários, permissões, configurações, billing

---

## 📖 Documentação

### Guias Principais
- [📐 Arquitetura Atual](./docs/ARQUITETURA_ATUAL.md) - Diagramas e fluxos
- [🎨 UI/UX Guidelines](./docs/UI_UX_GUIDELINES.md) - Design System
- [💡 Sugestões de Melhorias](./docs/SUGESTOES_MELHORIAS.md) - Roadmap técnico
- [⚡ Quick Wins](./docs/QUICK_WINS.md) - Melhorias rápidas
- [📋 Plano de Ação](./docs/PLANO_ACAO_EXECUTIVO.md) - Cronograma 8 semanas

### Conceitos Importantes

#### Side Panel vs Modal
- **Side Panel:** Edições de 6-15 campos (mantém contexto da lista)
- **Modal:** Ações rápidas <5 campos (confirmações, alertas)
- **Página Dedicada:** Formulários complexos >15 campos

#### Command Palette (Cmd+K)
Atalhos rápidos para ações comuns:
- Registrar novo animal
- Lançar pagamento
- Alternar fazenda
- Buscar em qualquer módulo

---

## 🔄 Workflow de Desenvolvimento

### Branch Strategy
```
main (produção)
  └── develop (staging)
       └── feature/nome-da-feature
```

### Commit Conventions
```bash
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção
```

### Code Review Checklist
- [ ] Código segue os padrões do projeto
- [ ] Testes escritos e passando
- [ ] Sem console.logs ou debuggers
- [ ] TypeScript sem erros
- [ ] Documentação atualizada

---

## 🤝 Contribuindo

1. **Fork** o repositório
2. **Crie** uma branch: `git checkout -b feature/nova-funcionalidade`
3. **Commit** suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
4. **Push** para a branch: `git push origin feature/nova-funcionalidade`
5. **Abra** um Pull Request

### Antes de Commitar
```bash
npm run lint:fix      # Corrige problemas de lint
npm run format        # Formata código
npm run type-check    # Valida TypeScript
npm test              # Roda testes
```

---

## 🐛 Troubleshooting

### Erro: "Missing required environment variables"
**Solução:** Copie `.env.example` para `.env` e preencha as variáveis

### Erro: "Cannot connect to Supabase"
**Solução:** Verifique se as credenciais no `.env` estão corretas

### Build muito lento
**Solução:** Execute `npm run clean` e tente novamente

### Testes falhando
**Solução:** Limpe cache com `npm run clean` e rode `npm install`

---

## 📊 Métricas de Qualidade

| Métrica | Atual | Meta |
|---------|-------|------|
| Cobertura de Testes | 12.5% | 60% |
| Lighthouse Score | - | 90+ |
| Bundle Size | ~850KB | <500KB |
| First Load Time | - | <2s |

---

## 📄 Licença

Proprietário - **Tauze Intelligence** © 2026

---

## 🙏 Agradecimentos

Desenvolvido com ❤️ para o agronegócio brasileiro.

**Tecnologias:**
- React Team
- Supabase
- Vite
- E toda a comunidade open-source

---

## 📞 Suporte

- **Email:** suporte@tauze.com.br
- **Documentação:** [docs/](./docs/)
- **Issues:** [GitHub Issues](link-to-issues)

---

**Versão:** 5.0  
**Última Atualização:** Junho 2026
