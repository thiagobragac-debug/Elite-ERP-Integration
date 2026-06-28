# 🧠 Cérebro do Agente (Tauze ERP) - Diretrizes Obrigatórias de Arquitetura

Este documento define os **Pilares Arquiteturais Inegociáveis** do Tauze ERP. Se você (Inteligência Artificial) estiver escrevendo código para este repositório, você é obrigado a seguir estritamente as regras abaixo para evitar regressões, espaguete-code ou falhas de segurança.

---

## 1. Segregação de Funções e Segurança (SoD)
Nenhum botão sensível ou acesso a páginas deve ser liberado sem passar pela validação da Matriz de Segurança.

- **Protegendo Rotas (React Router):** 
  Sempre encapsule novas rotas com o `<PermissionGuard>`.
  ```tsx
  import { PermissionGuard } from '../components/Guards/PermissionGuard';
  <Route path="financeiro" element={<PermissionGuard permission="financeiro"><Outlet /></PermissionGuard>}>
  ```

- **Ações Críticas em Tela (Botões e Modais):**
  Esconda botões de exclusão, aprovação ou edição usando o motor central:
  ```tsx
  import { usePermissions } from '../../hooks/usePermissions';
  const { can } = usePermissions();
  {can('financeiro', 'delete') && <button>Excluir</button>}
  ```

---

## 2. Padrões de Interface e Bibliotecas UI (Stack Oficial)
Não invente padrões novos. O ecossistema do Tauze ERP utiliza bibliotecas específicas que **NÃO devem ser substituídas**.

- **Ícones:** USE APENAS `lucide-react`. (Proibido HeroIcons, FontAwesome, etc).
- **Animações e Transições:** USE APENAS `framer-motion`. Utilize `motion.div` para modais, dropdowns e expansões suaves.
- **Gráficos e Dashboards:** USE APENAS `recharts` (`ResponsiveContainer`, `LineChart`, `BarChart`, etc). Gráficos e Dashboards devem sempre vir com Skeletons e tooltips personalizadas.
- **Notificações ao Usuário:** USE APENAS `react-hot-toast`. 
  - *Proibido:* `alert()`, `window.confirm()`. 
  - *Uso correto:* `toast.success("Registro salvo com sucesso.")` ou `toast.error("Acesso negado.")`. Use textos em Português-BR para o usuário.

---

## 3. Padrão de Estrutura de Telas e Dashboards
Toda tela principal no Tauze ERP deve seguir o padrão "Glassmorphism / Dashboard Dark".

- **Loading States:** Nunca use textos puros ("Carregando..."). SEMPRE importe o `<LoadingSkeleton />` (ex: `variant="table"`, `variant="card"`).
- **Filtros Avançados:** Ao desenhar módulos de listagem (Tabelas, Grids), inclua sempre uma barra de busca interativa (usando o ícone `Search` do Lucide) e botões de filtro avançado estilizados.
- **Layout de Dashboard:** Os Dashboards devem ser organizados em CSS Grid (ex: `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))`), utilizando `gap: 24px`. Os "Cards" de estatísticas devem possuir background semi-transparente (`background: var(--bg-card)`) com bordas suaves (`border: 1px solid var(--border)`).

---

## 4. Multi-Tenant (Segurança de Dados)
O sistema é Multi-empresa (SaaS). **O vazamento de dados entre empresas é a falha mais crítica possível.**

- **Consultas ao Supabase:** TODA E QUALQUER consulta ao banco de dados (Select, Insert, Update, Delete) no Frontend deve obrigatoriamente buscar o `activeTenantId` e filtrar a tabela.
  ```tsx
  import { useTenantFarm } from '../../contexts/TenantContext';
  const { activeTenantId } = useTenantFarm();
  
  // Exemplo Obrigatório:
  const { data } = await supabase.from('tabela').select('*').eq('tenant_id', activeTenantId);
  ```

---

## 5. Roteamento e Performance
- **Code Splitting:** Todas as novas páginas do sistema devem ser carregadas via `React.lazy()` no topo do arquivo de rotas, protegidas por um `<React.Suspense fallback={<LoadingSkeleton />}>`. Não importe telas diretamente (Eager Load) a menos que seja a tela de Login ou o App Shell principal.

---

## 6. Padrão de Formulários e Fluxos de Criação/Edição

O Tauze ERP possui **um único padrão oficial** para formulários de criação e edição:

> ### ✅ PADRÃO OFICIAL: `SidePanel` (drawer lateral)
> Componente: `import { SidePanel } from '../components/Layout/SidePanel';`

**NUNCA invente um novo padrão de formulário sem seguir o critério abaixo.**

---

### 6.1 Regra de Decisão — Árvore de escolha obrigatória

Antes de criar qualquer formulário, percorra esta árvore:

```
O formulário tem 3 ou mais etapas sequenciais COM dependência entre elas?
│
├── NÃO → Use SidePanel. Fim.
│
└── SIM → O formulário contém subtabelas de itens com CRUD inline
           (ex: lista de produtos, lista de parcelas)?
           │
           ├── NÃO → Use SidePanel com abas internas. Fim.
           │
           └── SIM → A operação é de baixa frequência
                      (o usuário faz menos de 5x por dia)?
                      │
                      ├── NÃO → Use SidePanel. Operações repetitivas
                      │         devem ser rápidas. Fim.
                      │
                      └── SIM → ✅ Autorizado a usar Página Full-Page
                                 com Stepper Lateral. Documente aqui.
```

---

### 6.2 Quando usar `SidePanel` (padrão para ~95% dos casos)

Use `SidePanel` sempre que:

- O formulário tem **até 2 seções** ou **até ~12 campos** no total
- O usuário precisa **ver a listagem** por trás enquanto preenche (contexto)
- A operação é **repetitiva** (pesagem, lançamento financeiro, movimentação)
- O formulário tem **uma única etapa** lógica, mesmo que longa
- É uma **edição** de registro existente (o usuário já está na lista)

**Exemplos no sistema que DEVEM usar SidePanel:**
`AnimalForm`, `LotForm`, `WeightForm`, `ReproductionForm`, `NutritionManagement`,
`TransactionForm`, `FuelForm`, `MaintenanceForm`, `MovementForm`, `PurchaseRequestForm`

---

### 6.3 Quando usar Página Full-Page com Stepper Lateral (exceção)

Use tela full-page **somente** quando os **três critérios abaixo forem verdadeiros simultaneamente**:

| Critério | Descrição |
|---|---|
| **3+ etapas com dependência** | A etapa 2 depende do que foi preenchido na etapa 1 (ex: fármacos dependem do alvo selecionado) |
| **Subtabela de itens inline** | O formulário contém uma tabela com linhas adicionáveis/editáveis/removíveis dentro de uma das etapas |
| **Operação de baixa frequência** | O usuário realiza esse fluxo poucas vezes por dia — é um processo deliberado, não uma entrada rápida |

**Exemplos no sistema que PODEM usar Full-Page (se aprovado pelo responsável):**
`EntryInvoiceForm` (Nota Fiscal de Entrada — 71KB, múltiplas etapas e itens),
`ConfinementForm` (se evoluir para fluxo multi-etapa com animais e dietas)

> ⚠️ **ATENÇÃO:** A decisão de usar Full-Page Stepper deve ser explicitamente aprovada.
> Não implemente este padrão por iniciativa própria. Se você acha que um formulário
> se enquadra nos critérios acima, **pergunte ao usuário antes de codificar**.

---

### 6.4 Consistência visual dentro do SidePanel

Quando usar `SidePanel`, siga estas regras internas:

- Para forms com **2 grupos lógicos**: use `<div className="form-section">` com título de seção, **não** use abas horizontais (`tauze-tab-group` é exclusivo de listagens)
- Para forms com **muitos campos**: organize em grids de 2 ou 3 colunas usando as classes `form-grid-2` / `form-grid-3`
- **Nunca** use scroll horizontal dentro de um SidePanel
- O botão de ação principal fica sempre no rodapé do SidePanel, alinhado à direita

---

### 6.5 O que fazer se o SidePanel "não couber" o formulário

Se você perceber que um formulário está ficando grande demais para o SidePanel, a solução correta **não é mudar o padrão para Full-Page**. A solução correta é:

1. **Dividir em dois formulários menores** acessados em sequência
2. **Usar seções colapsáveis** dentro do SidePanel (accordion)
3. **Remover campos opcionais** para uma tela de detalhes pós-criação
4. **Perguntar ao usuário** se o escopo do formulário está correto antes de qualquer mudança estrutural

---

## 7. Padrão de Dashboards, Listagens e Filtros

Esta seção descreve a anatomia obrigatória de **toda tela de listagem** no Tauze ERP.
Cada módulo (Animais, Sanidade, Financeiro, Frota, etc.) deve seguir **exatamente** esta estrutura.

---

### 7.1 Anatomia obrigatória de uma tela de listagem

Toda tela de listagem é composta por **6 blocos obrigatórios** nesta ordem:

```
┌─────────────────────────────────────────────────────┐
│  1. PAGE HEADER  (Breadcrumb + Título + Ações)       │
├─────────────────────────────────────────────────────┤
│  2. KPI GRID     (Cards de estatísticas)             │
├─────────────────────────────────────────────────────┤
│  3. CONTROLS ROW (Tabs + Busca + Filtros + Export)   │
├─────────────────────────────────────────────────────┤
│  4. FILTER PANEL (drawer lateral, se aberto)         │
├─────────────────────────────────────────────────────┤
│  5. DATA TABLE   (<ModernTable> + EmptyState)        │
├─────────────────────────────────────────────────────┤
│  6. MODAIS       (SidePanel + FilterModal + etc.)    │
└─────────────────────────────────────────────────────┘
```

---

### 7.2 Bloco 1 — Page Header

**Classe do container:** `page-header`
**Classe do grupo de texto:** `header-brand-group`
**Classe das ações:** `page-actions`

```tsx
<header className="page-header">
  <div className="header-brand-group">
    <Breadcrumb
      paths={[
        { label: 'Pecuária', href: '/pecuaria/dashboard' },
        { label: 'Sanidade' },
      ]}
    />
    <h1 className="page-title">Sanidade</h1>
    <p className="page-subtitle">
      Rastreabilidade de vacinas, tratamentos e controle de carência.
    </p>
  </div>
  <div className="page-actions">
    {/* Ação secundária (opcional) */}
    <button className="glass-btn secondary">
      <ShieldCheck size={18} />
      PROTOCOLOS
    </button>
    {/* Ação primária (obrigatória) */}
    <button className="primary-btn" onClick={handleOpenCreate}>
      <Plus size={18} />
      NOVO REGISTRO
    </button>
  </div>
</header>
```

**Regras:**
- `<h1>` com `className="page-title"` — um por página, sem exceção
- `<p>` com `className="page-subtitle"` — descrição curta, máx. 2 linhas
- `<Breadcrumb>` sempre acima do título
- Botão primário sempre à direita, com ícone `lucide-react`
- Botões secundários usam `className="glass-btn secondary"`
- Ações adicionais podem ser incluídas conforme necessidade, mas mantenha o bom senso visual.

---

### 7.3 Bloco 2 — KPI Grid (Cards de Estatísticas)

**Classe do container:** `next-gen-kpi-grid`
**Componente dos cards:** `<TauzeStatCard>`
**Skeleton de carregamento:** `<KPISkeleton>`

```tsx
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';

<div className="next-gen-kpi-grid">
  {loading
    ? Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
    : stats?.map((stat, idx) => <TauzeStatCard key={idx} {...stat} />)
  }
</div>
```

**Props do `<TauzeStatCard>`:**

| Prop | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `label` | `string` | ✅ | Nome do indicador |
| `value` | `string \| number` | ✅ | Valor principal exibido |
| `icon` | `LucideIcon` | ✅ | Ícone do lucide-react |
| `color` | `string` | ✅ | Cor hex ou hsl do card |
| `subtitle` | `string` | ❌ | Informação complementar |
| `change` | `string` | ❌ | Ex: `"+12%"` |
| `trend` | `'up' \| 'down'` | ❌ | Direção da seta de variação |
| `progress` | `number` | ❌ | 0-100, preenche o anel SVG |
| `sparkline` | `{ value, label? }[]` | ❌ | Array de dados do mini-gráfico |
| `periodLabel` | `string` | ❌ | Label do período (ex: `"Últimos 30 dias"`) |
| `loading` | `boolean` | ❌ | Exibe skeleton interno |

**Regras:**
- **NUNCA** exiba texto puro `"Carregando..."` — use `<KPISkeleton>` enquanto `loading === true`
- O grid usa CSS (`next-gen-kpi-grid`) — não recrie com `display: flex` inline
- Cor do card deve ser consistente por módulo (ex: verde para sanidade, azul para financeiro)
- `sparkline` deve ter entre 6 e 30 pontos para boa visualização

---

### 7.4 Bloco 3 — Controls Row (Barra de Controles)

**Classe do container:** `tauze-controls-row`

A barra de controles tem **3 zonas fixas** da esquerda para a direita:

```
[ TABS (esquerda) ]  [ BUSCA (centro) ]  [ FILTROS + EXPORT (direita) ]
```

```tsx
<div className="tauze-controls-row">

  {/* ZONA 1 — Tabs de visualização (opcional, apenas se o módulo tem sub-views) */}
  <div className="tauze-tab-group">
    <button
      className={`tauze-tab-item ${activeTab === 'LISTA' ? 'active' : ''}`}
      onClick={() => setActiveTab('LISTA')}
    >
      Lista
    </button>
    <button
      className={`tauze-tab-item ${activeTab === 'GRID' ? 'active' : ''}`}
      onClick={() => setActiveTab('GRID')}
    >
      Grid
    </button>
  </div>

  {/* ZONA 2 — Campo de busca rápida (obrigatório) */}
  <div className="tauze-search-wrapper">
    <Search size={18} className="s-icon" />
    <input
      type="text"
      className="tauze-search-input"
      placeholder="Filtrar por nome, código..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  {/* ZONA 3 — Botões de filtro avançado e exportação (obrigatório) */}
  <div className="tauze-filter-group">
    {/* Botão filtro avançado */}
    <button
      className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
      title="Filtros Avançados"
      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
    >
      <Filter size={20} />
    </button>

    {/* Dropdown de exportação */}
    <div className="export-dropdown-container">
      <button
        className="icon-btn-secondary"
        title="Exportar"
        onClick={() => document.getElementById('export-menu-ID')?.classList.toggle('active')}
      >
        <FileText size={20} />
      </button>
      <div id="export-menu-ID" className="export-menu">
        <button onClick={() => handleExport('csv')}>Excel (.CSV)</button>
        <button onClick={() => handleExport('excel')}>Excel (.xlsx)</button>
        <button onClick={() => handleExport('pdf')}>PDF</button>
      </div>
    </div>
  </div>

</div>
```

**Regras:**
- `tauze-tab-group` é **exclusivo da Controls Row** — NUNCA use dentro de SidePanel ou formulários
- O ícone da busca usa `className="s-icon"` — não use `position: absolute` manual
- O ID do `export-menu` deve ser único por página (ex: `export-menu-saude`, `export-menu-animais`)
- `icon-btn-secondary` recebe classe `active` quando o filtro está aberto — isso muda a cor visualmente
- Busca deve ser **sempre client-side** via `useState(searchTerm)`. Filtragem aplicada no `useMemo`

---

### 7.5 Bloco 4 — Filtros Avançados (Filter Panel)

O painel de filtros avançados é um **drawer lateral** implementado com `createPortal` e `framer-motion`.

**Classes do drawer:** `tauze-sidebar-overlay` → `tauze-sidebar-modal`
**Localização do arquivo:** `src/pages/<Modulo>/components/<Modulo>FilterModal.tsx`

**Estrutura obrigatória do FilterModal:**

```tsx
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

export const MeuFilterModal = ({ isOpen, onClose, filters, setFilters }) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="tauze-sidebar-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="tauze-sidebar-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="tauze-sidebar-header">
          <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-wrapper primary">
              <IconDoModulo size={20} />
            </div>
            <div>
              <h3>Filtros</h3>
              <p>Descrição curta do contexto.</p>
            </div>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {/* Corpo — seções de filtros */}
        <div className="tauze-sidebar-body">
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Nome do Filtro <IconDoFiltro size={14} />
            </label>
            {/* Controles do filtro */}
          </div>
        </div>

        {/* Rodapé */}
        <div className="tauze-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>
            LIMPAR
          </button>
          <button className="primary-btn" style={{ flex: 1 }} onClick={onClose}>
            APLICAR
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
```

**Tipos de controles usados dentro do `tauze-sidebar-body`:**

| Tipo de filtro | Componente/Elemento | Classe CSS |
|---|---|---|
| Seleção por categoria (botões) | `<button>` em grid 2 colunas | estilo inline com `borderColor` condicional |
| Seleção de status (chips) | `<button>` com `tauze-tag-chip active` | `tauze-tag-chip` |
| Toggle booleano | `<input type="checkbox">` nativo | `accentColor` da cor do módulo |
| Intervalo de datas | `<DateInput>` do `Form/DateInput` | `className="tauze-input"` |
| Slider numérico | `<input type="range">` | `accentColor`, dentro de `integrity-slider-container` |

**Regras:**
- **Um `FilterModal` por módulo**, localizado em `src/pages/<Modulo>/components/`
- O estado do filtro (`filterValues`) fica no componente pai (a página de listagem)
- O botão LIMPAR restaura todos os valores para o estado inicial via `setFilters(defaultValues)`
- `usePersistentState` deve ser usado para `showAdvancedFilters` — o painel deve lembrar se estava aberto

---

### 7.6 Bloco 5 — Tabela de Dados (`<ModernTable>`)

**Componente:** `import { ModernTable } from '../../components/DataTable/ModernTable'`

```tsx
<div className="management-content">
  <ModernTable
    data={filteredEvents}
    columns={tableColumns}
    loading={loading}
    hideHeader={true}
    totalCount={totalCount}
    currentPage={page}
    onPageChange={setPage}
    itemsPerPage={pageSize}
    searchPlaceholder="Filtrar por nome..."
    emptyState={
      <EmptyState
        title="Nenhum registro encontrado"
        description="Descrição do que o usuário deve fazer para começar."
        actionLabel="Novo Registro"
        onAction={handleOpenCreate}
        icon={IconDoModulo}
      />
    }
    actions={(item) => (
      <div className="modern-actions">
        <button className="action-dot info"    onClick={() => handleViewDetails(item)} title="Detalhes"><History size={18} /></button>
        <button className="action-dot edit"    onClick={() => handleOpenEdit(item)}    title="Editar">  <Edit3   size={18} /></button>
        <button className="action-dot delete"  onClick={() => handleDelete(item.id)}   title="Excluir"> <Trash2  size={18} /></button>
      </div>
    )}
  />
</div>
```

**Props do `<ModernTable>`:**

| Prop | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `data` | `T[]` | ✅ | Array de dados filtrados |
| `columns` | `Column<T>[]` | ✅ | Definição das colunas |
| `loading` | `boolean` | ✅ | Exibe skeleton de tabela |
| `hideHeader` | `boolean` | ❌ | Oculta o header interno da tabela (use `true` — o header da página já existe) |
| `emptyState` | `ReactNode` | ✅ | Componente exibido quando `data` está vazio |
| `totalCount` | `number` | ✅ | Total de registros (server-side) |
| `currentPage` | `number` | ✅ | Página atual |
| `onPageChange` | `(page) => void` | ✅ | Callback de paginação |
| `itemsPerPage` | `number` | ❌ | Padrão: `10`. ERP usa `12` |
| `actions` | `(item) => ReactNode` | ✅ | Botões de ação por linha |
| `selectable` | `boolean` | ❌ | Ativa checkboxes de seleção múltipla |

**Definição de colunas:**

```tsx
const tableColumns = [
  {
    header: 'Nome da Coluna',
    accessor: (item: MeuTipo) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span className="main-text" style={{ fontWeight: 800 }}>{item.nome}</span>
        <span className="sub-meta">{item.subtitulo}</span>
      </div>
    ),
    align: 'left' as const,
  },
];
```

**Classes CSS das células:**

| Classe | Uso |
|---|---|
| `main-text` | Texto principal da célula (negrito, cor forte) |
| `sub-meta` | Metadado secundário (menor, `text-muted`) |
| `status-pill success` | Badge verde — status positivo |
| `status-pill pending` | Badge amarelo — status pendente |
| `status-pill active` | Badge verde — ativo |
| `status-pill stopped` | Badge vermelho — parado/bloqueado |
| `modern-actions` | Container dos botões de ação da linha |
| `action-dot info` | Botão circular azul — detalhes/visualizar |
| `action-dot edit` | Botão circular verde — editar |
| `action-dot delete` | Botão circular vermelho — excluir |

**Regras:**
- **Nunca** recrie uma tabela com `<table>` HTML puro — sempre use `<ModernTable>`
- `hideHeader={true}` é o padrão — o cabeçalho da página (`page-header`) já identifica o módulo
- `emptyState` é **obrigatório** — nunca deixe a tabela sem estado vazio tratado
- Paginação é **sempre server-side** (`onPageChange` + `totalCount`) com `pageSize = 12`
- A filtragem client-side (`searchTerm`) é aplicada antes de passar `data` para a tabela, via `useMemo`

---

### 7.7 Bloco 6 — Modais e Painéis Associados

Toda tela de listagem pode ter modais associados, renderizados **ao final do JSX**, fora do fluxo de layout:

```tsx
{/* 1. Formulário de criação/edição */}
<MeuForm
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSubmit={handleSubmit}
  initialData={selectedItem}
  loading={saveMutation.isPending}
/>

{/* 2. Painel de filtros avançados */}
<MeuFilterModal
  isOpen={showAdvancedFilters}
  onClose={() => setShowAdvancedFilters(false)}
  filters={filterValues}
  setFilters={setFilterValues}
/>

{/* 3. Modal de detalhes/histórico (opcional) */}
<HistoryModal
  isOpen={isHistoryModalOpen}
  onClose={() => setIsHistoryModalOpen(false)}
  title="Dossiê"
  items={historyItems}
  loading={false}
/>
```

**Regras:**
- Modais ficam **sempre no final do retorno JSX** — nunca no meio do layout
- `isOpen` e `onClose` são as props padrão de todo modal do sistema
- O estado de abertura dos modais usa `usePersistentState` (não `useState`) para sobreviver a re-renders

---

### 7.8 Estado de Loading — Regras Definitivas

| Contexto | Componente correto | ❌ Proibido |
|---|---|---|
| KPI cards carregando | `<KPISkeleton>` (1 por card) | Texto "Carregando..." |
| Tabela carregando | `loading={true}` no `<ModernTable>` | Spinner solto |
| Rota lazy carregando | `<LoadingSkeleton variant="table">` no Suspense | Tela em branco |
| Botão de submit | `loading={mutation.isPending}` no `<SidePanel>` | Desabilitar botão sem feedback |
| Dados ausentes | `<EmptyState>` com título + descrição + ação | `null` ou `<div>` vazio |

---

### 7.9 Padrão de Estado Local — Checklist para novas telas

Ao criar uma nova tela de listagem, declare estes estados nesta ordem:

```tsx
// 1. Contexto de tenant/fazenda (obrigatório — segurança multi-tenant)
const { activeFarmId, activeTenantId, canCreate, insertPayload } = useFarmFilter();

// 2. QueryClient para invalidação de cache
const queryClient = useQueryClient();

// 3. Estado de busca e paginação
const [searchTerm, setSearchTerm] = useState('');
const [page, setPage] = useState(1);
const pageSize = 12;

// 4. Estado das tabs (se o módulo tiver sub-views)
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') || 'LISTA';

// 5. Estado dos modais (usar usePersistentState para sobreviver a re-renders)
const [isModalOpen, setIsModalOpen] = usePersistentState('NomeModulo_isModalOpen', false);
const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState('NomeModulo_showFilters', false);
const [selectedItem, setSelectedItem] = useState<any>(null);

// 6. Valores dos filtros avançados
const [filterValues, setFilterValues] = useState({ status: 'all', ... });

// 7. Dados via useReportData (hook central de dados)
const { data, stats, loading, totalCount, refresh } = useReportData('nome-do-report', { page, pageSize });
```

---

> Se você está lendo isso para criar uma nova tela ou função, **pare, alinhe sua estratégia mentalmente com essas regras**, e só então comece a codificar.
