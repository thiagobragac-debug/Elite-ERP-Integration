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

> Se você está lendo isso para criar uma nova tela ou função, **pare, alinhe sua estratégia mentalmente com essas regras**, e só então comece a codificar.
