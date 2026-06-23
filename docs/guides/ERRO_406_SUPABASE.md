# 🔧 Solução: Erro 406 Not Acceptable - Supabase

## ❌ Erro Detectado

```
GET https://nmirpozhgcoabcjwgvqk.supabase.co/rest/v1/market_quotes?select=*&indicator=eq.boi_gordo_cepea&order=date.desc&limit=1 
406 (Not Acceptable)
```

## 🔍 Causa

O erro **406 Not Acceptable** no Supabase geralmente indica:

1. **Tabela não existe** no banco de dados
2. **Row Level Security (RLS)** bloqueando acesso
3. **Permissões insuficientes** para a role `anon`
4. **Headers incorretos** na requisição

## ✅ Correções Aplicadas

### 1. Headers Adicionados ao Cliente Supabase

**Arquivo:** `src/lib/supabase.ts`

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Accept': 'application/json',      // ✅ Adicionado
      'Content-Type': 'application/json', // ✅ Adicionado
    }
  },
  db: {
    schema: 'public' // ✅ Adicionado
  }
});
```

### 2. Arquivo .env.example Atualizado

Agora tem documentação clara sobre variáveis obrigatórias vs opcionais.

## 🛠️ Passos para Resolver Definitivamente

### Opção 1: Criar Tabela `market_quotes` (Recomendado)

Execute este SQL no Supabase SQL Editor:

```sql
-- 1. Criar tabela market_quotes
CREATE TABLE IF NOT EXISTS public.market_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator TEXT NOT NULL,
  value NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  unit TEXT DEFAULT 'BRL',
  source TEXT DEFAULT 'CEPEA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX idx_market_quotes_indicator ON market_quotes(indicator);
CREATE INDEX idx_market_quotes_date ON market_quotes(date DESC);
CREATE INDEX idx_market_quotes_indicator_date ON market_quotes(indicator, date DESC);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE market_quotes ENABLE ROW LEVEL SECURITY;

-- 4. Criar policy para leitura pública (anon pode ler)
CREATE POLICY "Allow public read access to market_quotes"
  ON market_quotes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. Criar policy para insert/update (apenas authenticated)
CREATE POLICY "Allow authenticated users to insert market_quotes"
  ON market_quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update market_quotes"
  ON market_quotes
  FOR UPDATE
  TO authenticated
  USING (true);

-- 6. Inserir dados de exemplo (opcional)
INSERT INTO market_quotes (indicator, value, date, unit, source) VALUES
  ('boi_gordo_cepea', 285.50, CURRENT_DATE, 'BRL/@', 'CEPEA'),
  ('boi_gordo_cepea', 284.20, CURRENT_DATE - INTERVAL '1 day', 'BRL/@', 'CEPEA'),
  ('boi_gordo_cepea', 286.10, CURRENT_DATE - INTERVAL '2 days', 'BRL/@', 'CEPEA');

-- 7. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_market_quotes_updated_at
  BEFORE UPDATE ON market_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Opção 2: Desabilitar Módulo de Mercado Temporariamente

Se você não precisa do módulo de mercado agora, pode desabilitá-lo via Feature Flags:

**Arquivo:** `src/lib/featureFlags.ts`

```typescript
export const featureFlags: FeatureFlags = {
  // ... outras flags
  marketAnalysis: false, // ← Mudar para false
};
```

### Opção 3: Adicionar Tratamento de Erro

Vou adicionar um error boundary específico para queries que falharem.

## 📊 Tabelas que Precisam Existir

O Tauze ERP espera estas tabelas no Supabase:

### Mercado (market_*)
- ✅ `market_quotes` - Cotações de mercado
- ✅ `market_alerts` - Alertas de preço
- ✅ `market_history` - Histórico

### Core do Sistema
- `profiles` - Perfis de usuário
- `tenants` - Multi-tenancy
- `companies` - Empresas/fazendas
- `permissions` - Controle de acesso

### Módulos
- `animals` - Pecuária
- `lots` - Lotes
- `pastures` - Pastos
- `vehicles` - Frota
- `maintenance` - Manutenções
- `inventory` - Estoque
- `financial_transactions` - Financeiro
- E muitas outras...

## 🔍 Como Verificar o Problema

### 1. Verificar se tabela existe

No Supabase Dashboard:
1. Vá em **Database** → **Tables**
2. Procure por `market_quotes`
3. Se não existir → Execute o SQL da Opção 1

### 2. Verificar RLS Policies

No Supabase Dashboard:
1. Vá em **Database** → **Tables** → `market_quotes`
2. Clique na aba **Policies**
3. Deve ter pelo menos uma policy de SELECT para `anon`

### 3. Testar Query Manualmente

No Supabase SQL Editor:
```sql
-- Testar como usuário anônimo
SET ROLE anon;
SELECT * FROM market_quotes LIMIT 1;
```

Se retornar erro → problema está nas policies RLS.

## 🎯 Solução Rápida (Sem Criar Tabelas)

Se você quer apenas testar o sistema sem dados de mercado:

### 1. Comentar queries problemáticas

**Arquivo:** `src/contexts/CepeaContext.tsx`

```typescript
export function CepeaProvider({ children }: { children: React.ReactNode }) {
  const [latestQuote, setLatestQuote] = React.useState<CepeaQuote | null>(null);

  React.useEffect(() => {
    async function fetchLatestQuote() {
      try {
        // TEMPORÁRIO: Desabilitado até configurar banco
        console.warn('[CEPEA] market_quotes table not configured');
        return;
        
        /* 
        const { data, error } = await supabase
          .from('market_quotes')
          .select('*')
          .eq('indicator', INDICATOR)
          .order('date', { ascending: false })
          .limit(1)
          .single();
        */
      } catch (err) {
        console.error('Error fetching CEPEA quote:', err);
      }
    }
    fetchLatestQuote();
  }, []);

  return (
    <CepeaContext.Provider value={{ latestQuote, loading: false, error: null }}>
      {children}
    </CepeaContext.Provider>
  );
}
```

### 2. Usar dados mock

Criar `src/lib/mockData.ts`:

```typescript
export const mockMarketData = {
  boi_gordo_cepea: {
    value: 285.50,
    date: new Date().toISOString(),
    indicator: 'boi_gordo_cepea',
    unit: 'BRL/@',
    source: 'MOCK'
  }
};
```

## ✅ Status Após Correções

```
✅ Headers adicionados ao cliente Supabase
✅ .env.example documentado corretamente
⚠️ Tabela market_quotes precisa ser criada (SQL fornecido acima)
⚠️ Ou módulo de mercado pode ser desabilitado temporariamente
```

## 🚀 Próximos Passos

1. **Escolher uma opção acima** (criar tabela, desabilitar módulo, ou usar mock)
2. **Recarregar a página** (Ctrl+R)
3. **Verificar console** (F12) - erro 406 deve sumir

## 📞 Suporte

Se o erro persistir após criar a tabela:

1. Verifique se RLS está habilitado
2. Verifique se policies permitem acesso anon
3. Teste query manualmente no SQL Editor
4. Me envie o resultado do teste

---

**Documentação criada em:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Erro:** 406 Not Acceptable  
**Causa:** Tabela market_quotes não configurada  
**Solução:** SQL fornecido acima
