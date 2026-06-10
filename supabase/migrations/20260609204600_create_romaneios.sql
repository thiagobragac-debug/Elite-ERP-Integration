-- ==============================================================================
-- Migration: Criação da Tabela de Romaneios e Relacionamento com Animais
-- ==============================================================================

-- 1. Sequence para geração do código automático do Romaneio
CREATE SEQUENCE IF NOT EXISTS public.romaneios_codigo_seq;

-- 2. Tabela de Romaneios
CREATE TABLE IF NOT EXISTS public.romaneios (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    fazenda_id      uuid NOT NULL REFERENCES public.fazendas(id) ON DELETE CASCADE,
    codigo          text NOT NULL UNIQUE DEFAULT ('RM-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('public.romaneios_codigo_seq')::text, 4, '0')),
    data            date NOT NULL DEFAULT CURRENT_DATE,
    comprador       text NOT NULL,
    destino         text NOT NULL,
    placa           text,
    motorista       text,
    animais_qtd     integer NOT NULL DEFAULT 0,
    valor_estimado  numeric NOT NULL DEFAULT 0,
    status          text NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Concluído', 'Em Trânsito', 'Pendente', 'Cancelado')),
    nfe             text,
    observacoes     text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.romaneios ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS
DROP POLICY IF EXISTS "romaneios_tenant" ON public.romaneios;
CREATE POLICY "romaneios_tenant" ON public.romaneios
    FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

-- 4. Adicionar relacionamento com animais
ALTER TABLE public.animais 
    ADD COLUMN IF NOT EXISTS romaneio_id uuid REFERENCES public.romaneios(id) ON DELETE SET NULL;
