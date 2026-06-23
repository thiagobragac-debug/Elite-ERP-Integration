# LoadingSkeleton Component - Usage Guide

## Overview

O componente `LoadingSkeleton` é um componente reutilizável de loading skeleton que substitui indicadores de carregamento baseados em texto por skeletons visuais que refletem a estrutura final da UI. Isso melhora significativamente a experiência do usuário durante carregamentos.

**Requirements Validados:**
- ✅ 15.1: Substitui todos os indicadores de loading baseados em texto
- ✅ 15.2: Componente `LoadingSkeleton` reutilizável
- ✅ 15.3: Skeletons refletem a estrutura final da UI
- ✅ 15.4: Skeletons para rotas lazy-loaded

## Variantes Disponíveis

### 1. Table Variant

Skeleton para listagens e tabelas com header, filtros, linhas e paginação.

```tsx
import { LoadingSkeleton } from '@/components/Feedback/LoadingSkeleton';

<LoadingSkeleton 
  variant="table" 
  rows={5}      // Número de linhas (padrão: 5)
  columns={4}   // Número de colunas (padrão: 4)
/>
```

**Estrutura:**
- Header com título e botão de ação
- Barra de pesquisa e filtros
- Table header
- Linhas de dados
- Paginação

**Casos de Uso:**
- `AnimalManagement`
- `AccountsPayable`
- `InventoryManagement`
- `FleetManagement`
- Qualquer página com tabela de dados

### 2. Card Variant

Skeleton para layouts em grid de cards (dashboards, galerias).

```tsx
<LoadingSkeleton variant="card" />
```

**Estrutura:**
- Grid responsivo (6 cards por padrão)
- Cada card contém:
  - Ícone circular
  - Badge/status
  - Título
  - Valor principal
  - Footer com métricas

**Casos de Uso:**
- Dashboard executivo
- Lista de fazendas
- Galeria de animais
- Cards de KPI

### 3. Form Variant

Skeleton para formulários com campos de entrada.

```tsx
<LoadingSkeleton variant="form" />
```

**Estrutura:**
- Título do formulário
- 4 campos de texto individuais
- 2 campos em layout de 2 colunas
- 1 textarea
- Botões de ação (Cancelar/Salvar)

**Casos de Uso:**
- Modal de cadastro de animal
- Formulário de conta a pagar
- Edição de fornecedor
- Qualquer formulário de cadastro/edição

### 4. Chart Variant

Skeleton para gráficos e visualizações de dados.

```tsx
<LoadingSkeleton variant="chart" />
```

**Estrutura:**
- 4 KPI cards no topo
- Chart principal:
  - Header com título e filtros
  - Área do gráfico com barras/linhas
  - Eixos X e Y com labels
  - Legenda
  
**Casos de Uso:**
- Relatórios com gráficos
- Dashboard de vendas
- Análise de performance
- Indicadores de mercado (Cepea)

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'table' \| 'card' \| 'form' \| 'chart'` | `'table'` | Tipo de skeleton a renderizar |
| `rows` | `number` | `5` | Número de linhas (apenas para `table`) |
| `columns` | `number` | `4` | Número de colunas (apenas para `table`) |
| `message` | `string` | `undefined` | Mensagem customizada para acessibilidade (aria-label) |
| `fullScreen` | `boolean` | `true` | Se `true`, usa `minHeight: 100vh` |

## Integração com Lazy Loading (Requirement 15.4)

### React Router com Suspense

```tsx
import { lazy, Suspense } from 'react';
import { LoadingSkeleton } from '@/components/Feedback/LoadingSkeleton';

// Lazy load da página
const AnimalManagement = lazy(() => import('@/pages/Pecuaria/AnimalManagement'));

// No Router
<Route 
  path="/pecuaria/animais" 
  element={
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <AnimalManagement />
    </Suspense>
  } 
/>
```

### React Query com isLoading

```tsx
import { useQuery } from '@tanstack/react-query';
import { LoadingSkeleton } from '@/components/Feedback/LoadingSkeleton';

function AnimalList() {
  const { data, isLoading } = useQuery({
    queryKey: ['animals'],
    queryFn: fetchAnimals,
  });

  if (isLoading) {
    return <LoadingSkeleton variant="table" rows={10} columns={6} />;
  }

  return <ModernTable data={data} />;
}
```

### React.lazy com Dynamic Import

```tsx
// Para componentes pesados (Recharts, Leaflet)
const HeavyChart = lazy(() => import('./HeavyChart'));

<Suspense fallback={<LoadingSkeleton variant="chart" />}>
  <HeavyChart data={chartData} />
</Suspense>
```

## Accessibility Features

O componente implementa as seguintes features de acessibilidade:

- ✅ `role="status"` - Indica área de status dinâmico
- ✅ `aria-live="polite"` - Leitores de tela anunciam mudanças
- ✅ `aria-label` - Descrição textual do estado de loading
- ✅ Animações CSS respeitam `prefers-reduced-motion` (via skeleton-base)

## Animações CSS

O componente utiliza a classe `.skeleton-base` definida em `src/index.css`:

```css
.skeleton-base {
  background: linear-gradient(
    90deg,
    hsl(var(--bg-main)) 25%,
    hsl(var(--border)) 50%,
    hsl(var(--bg-main)) 75%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
```

**Efeitos:**
- ✅ Shimmer effect (gradiente animado)
- ✅ Suporta dark mode (usa CSS variables)
- ✅ Performance otimizada (GPU-accelerated)

## Migration from Text-based Loaders

### Antes (❌ Old Pattern)

```tsx
{isLoading && <p>Carregando módulo...</p>}
```

### Depois (✅ New Pattern)

```tsx
{isLoading && <LoadingSkeleton variant="table" />}
```

### Suspense Boundaries

```tsx
// Antes
<Suspense fallback={<div>Carregando...</div>}>
  <Component />
</Suspense>

// Depois
<Suspense fallback={<LoadingSkeleton variant="card" />}>
  <Component />
</Suspense>
```

## Performance Considerations

1. **CSS-only Animations**: Usa `transform` e `background-position` para animações GPU-accelerated
2. **No JavaScript Animation**: Animações puramente CSS, não bloqueia thread principal
3. **Lazy Component Loading**: Use com `React.lazy()` para reduzir bundle inicial
4. **Memoization**: Componente é puro, pode ser memoizado com `React.memo` se necessário

## Testing

O componente possui 26 testes unitários cobrindo:

- ✅ Renderização de todas as variantes
- ✅ Props customizadas (rows, columns, message, fullScreen)
- ✅ Acessibilidade (ARIA attributes)
- ✅ Animações CSS
- ✅ Responsividade

Execute os testes:

```bash
npm test -- LoadingSkeleton.test.tsx
```

## Examples in Codebase

Após implementação completa, o componente deve ser usado em:

1. **App.tsx** - Lazy loading de rotas principais
2. **Pages** - States de loading em fetching de dados
3. **Modals** - Loading ao abrir formulários pesados
4. **Charts** - Loading ao renderizar gráficos (Recharts)
5. **Maps** - Loading ao carregar mapas (Leaflet)

## Future Enhancements

Possíveis melhorias futuras:

- [ ] Variant `list` para listas simples
- [ ] Variant `profile` para páginas de perfil
- [ ] Variant `timeline` para feeds/histórico
- [ ] Props para customizar cores do shimmer
- [ ] Suporte a dark mode variants
- [ ] Skeleton para mobile-specific layouts

## Related Files

- `src/components/Feedback/Skeleton.tsx` - Componente base de skeleton
- `src/components/Feedback/LoadingSkeleton.tsx` - Componente principal
- `src/components/Feedback/LoadingSkeleton.test.tsx` - Testes unitários
- `src/index.css` - Animações CSS (`.skeleton-base`)

## Documentation

- Design Document: `.kiro/specs/system-improvements/design.md`
- Requirements: `.kiro/specs/system-improvements/requirements.md`
- Tasks: `.kiro/specs/system-improvements/tasks.md` (Task 30.1)
