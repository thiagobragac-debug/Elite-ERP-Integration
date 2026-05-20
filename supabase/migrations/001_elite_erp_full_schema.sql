-- ==========================================================
-- ELITE ERP - SCHEMA COMPLETO - Diamond Precision 5.0
-- Execute no Supabase Dashboard > SQL Editor
-- ==========================================================

-- ── 1. SCHEMA AUTH_HELPERS ──────────────────────────────
CREATE SCHEMA IF NOT EXISTS auth_helpers;

-- ── 2. TENANTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  documento   text,
  email       text,
  plano       text DEFAULT 'starter',
  ativo       boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- ── 3. PROFILES ─────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id   uuid REFERENCES public.tenants(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name   text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role        text DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url  text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now();
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ── 4. UNIDADES ─────────────────────────────────────────
ALTER TABLE public.unidades ADD COLUMN IF NOT EXISTS tenant_id   uuid REFERENCES public.tenants(id);
ALTER TABLE public.unidades ADD COLUMN IF NOT EXISTS nome        text;
ALTER TABLE public.unidades ADD COLUMN IF NOT EXISTS documento   text;
ALTER TABLE public.unidades ADD COLUMN IF NOT EXISTS tipo        text DEFAULT 'MATRIZ';
ALTER TABLE public.unidades ADD COLUMN IF NOT EXISTS razao_social text;
ALTER TABLE public.unidades ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now();
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;

-- ── 5. FAZENDAS ─────────────────────────────────────────
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS tenant_id   uuid REFERENCES public.tenants(id);
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS unidade_id  uuid REFERENCES public.unidades(id);
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS nome        text;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS ie_produtor text;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS area_total  numeric DEFAULT 0;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS area_ha     numeric DEFAULT 0;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS localizacao text;
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now();
ALTER TABLE public.fazendas ENABLE ROW LEVEL SECURITY;

-- ── 6. LOTES ────────────────────────────────────────────
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS tenant_id  uuid REFERENCES public.tenants(id);
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS fazenda_id uuid REFERENCES public.fazendas(id);
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS nome       text;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS status     text DEFAULT 'ATIVO';
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;

-- ── 7. ANIMAIS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.animais (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid REFERENCES public.tenants(id),
  fazenda_id      uuid REFERENCES public.fazendas(id),
  lote_id         uuid REFERENCES public.lotes(id),
  brinco          text NOT NULL,
  nome            text,
  sexo            text CHECK (sexo IN ('M','F')),
  raca            text,
  data_nascimento date,
  peso_entrada    numeric,
  status          text DEFAULT 'ATIVO',
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.animais ENABLE ROW LEVEL SECURITY;

-- ── 8. PESAGENS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pesagens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid REFERENCES public.tenants(id),
  fazenda_id   uuid REFERENCES public.fazendas(id),
  animal_id    uuid REFERENCES public.animais(id),
  peso         numeric NOT NULL,
  data_pesagem date DEFAULT CURRENT_DATE,
  observacao   text,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE public.pesagens ENABLE ROW LEVEL SECURITY;

-- ── 9. SANIDADE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sanidade (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES public.tenants(id),
  fazenda_id    uuid REFERENCES public.fazendas(id),
  lote_id       uuid REFERENCES public.lotes(id),
  titulo        text,
  produto       text,
  tipo          text DEFAULT 'VACINACAO',
  data_manejo   date DEFAULT CURRENT_DATE,
  carencia_dias integer DEFAULT 0,
  status        text DEFAULT 'REALIZADO',
  custo         numeric DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE public.sanidade ENABLE ROW LEVEL SECURITY;

-- ── 10. PASTOS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pastos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid REFERENCES public.tenants(id),
  fazenda_id uuid REFERENCES public.fazendas(id),
  nome       text NOT NULL,
  area       numeric DEFAULT 0,
  forrageira text,
  status     text DEFAULT 'ATIVO',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.pastos ENABLE ROW LEVEL SECURITY;

-- ── 11. CONFINAMENTO ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.confinamento (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES public.tenants(id),
  fazenda_id  uuid REFERENCES public.fazendas(id),
  lote_id     uuid REFERENCES public.lotes(id),
  nome_curral text NOT NULL,
  data_inicio date DEFAULT CURRENT_DATE,
  dof_alvo    integer DEFAULT 90,
  status      text DEFAULT 'ATIVO',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.confinamento ENABLE ROW LEVEL SECURITY;

-- ── 12. EVENTOS REPRODUTIVOS ────────────────────────────
CREATE TABLE IF NOT EXISTS public.eventos_reprodutivos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES public.tenants(id),
  fazenda_id  uuid REFERENCES public.fazendas(id),
  animal_id   uuid REFERENCES public.animais(id),
  tipo_evento text NOT NULL,
  data_evento date DEFAULT CURRENT_DATE,
  resultado   text,
  observacao  text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.eventos_reprodutivos ENABLE ROW LEVEL SECURITY;

-- ── 13. FORNECEDORES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid REFERENCES public.tenants(id),
  nome       text NOT NULL,
  documento  text,
  email      text,
  telefone   text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- ── 14. CLIENTES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clientes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid REFERENCES public.tenants(id),
  nome       text NOT NULL,
  documento  text,
  email      text,
  telefone   text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- ── 15. CONTAS A PAGAR ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid REFERENCES public.tenants(id),
  fazenda_id     uuid REFERENCES public.fazendas(id),
  fornecedor_id  uuid REFERENCES public.fornecedores(id),
  descricao      text NOT NULL,
  categoria      text,
  valor_total    numeric NOT NULL DEFAULT 0,
  data_vencimento date,
  status         text DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE','PAGO','CANCELADO')),
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

-- ── 16. CONTAS A RECEBER ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contas_receber (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid REFERENCES public.tenants(id),
  fazenda_id     uuid REFERENCES public.fazendas(id),
  cliente_id     uuid REFERENCES public.clientes(id),
  descricao      text NOT NULL,
  categoria      text,
  valor_total    numeric NOT NULL DEFAULT 0,
  data_vencimento date,
  status         text DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE','PAGO','CANCELADO')),
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

-- ── 17. CONTAS BANCÁRIAS ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contas_bancarias (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES public.tenants(id),
  fazenda_id  uuid REFERENCES public.fazendas(id),
  banco       text NOT NULL,
  conta       text NOT NULL,
  tipo        text DEFAULT 'Corrente',
  saldo_atual numeric DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

-- ── 18. MÁQUINAS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.maquinas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid REFERENCES public.tenants(id),
  fazenda_id uuid REFERENCES public.fazendas(id),
  nome       text NOT NULL,
  tipo       text,
  placa      text,
  ano        integer,
  status     text DEFAULT 'ATIVO',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.maquinas ENABLE ROW LEVEL SECURITY;

-- ── 19. ABASTECIMENTOS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abastecimentos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES public.tenants(id),
  fazenda_id  uuid REFERENCES public.fazendas(id),
  maquina_id  uuid REFERENCES public.maquinas(id),
  litros      numeric NOT NULL DEFAULT 0,
  valor_total numeric NOT NULL DEFAULT 0,
  data        date DEFAULT CURRENT_DATE,
  observacao  text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.abastecimentos ENABLE ROW LEVEL SECURITY;

-- ── 20. MANUTENÇÃO FROTA ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.manutencao_frota (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES public.tenants(id),
  fazenda_id  uuid REFERENCES public.fazendas(id),
  maquina_id  uuid REFERENCES public.maquinas(id),
  tipo        text DEFAULT 'Preventiva',
  custo       numeric DEFAULT 0,
  data_inicio date DEFAULT CURRENT_DATE,
  descricao   text,
  status      text DEFAULT 'CONCLUIDO',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.manutencao_frota ENABLE ROW LEVEL SECURITY;

-- ── 21. PRODUTOS (estoque) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.produtos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid REFERENCES public.tenants(id),
  fazenda_id      uuid REFERENCES public.fazendas(id),
  nome            text NOT NULL,
  categoria       text,
  unidade_medida  text DEFAULT 'UN',
  estoque_atual   numeric DEFAULT 0,
  estoque_minimo  numeric DEFAULT 0,
  custo_medio     numeric DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- ── 22. PEDIDOS DE COMPRA ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.pedidos_compra (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES public.tenants(id),
  fazenda_id    uuid REFERENCES public.fazendas(id),
  fornecedor_id uuid REFERENCES public.fornecedores(id),
  valor_total   numeric DEFAULT 0,
  status        text DEFAULT 'PENDENTE',
  observacao    text,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
