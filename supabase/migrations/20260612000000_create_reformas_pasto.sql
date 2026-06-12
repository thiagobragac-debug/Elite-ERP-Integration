-- Migration for Pasture Renovation (Reforma de Pasto)

-- Update pastos status constraint to allow 'em_reforma'
ALTER TABLE public.pastos 
DROP CONSTRAINT IF EXISTS pastos_status_check;

ALTER TABLE public.pastos 
ADD CONSTRAINT pastos_status_check 
CHECK (status IN ('resting', 'grazing', 'degraded', 'em_reforma'));

-- Create reformas_pasto table
CREATE TABLE IF NOT EXISTS public.reformas_pasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenant_master(id),
    fazenda_id UUID NOT NULL REFERENCES public.fazendas(id),
    pasto_id UUID NOT NULL REFERENCES public.pastos(id),
    
    data_inicio DATE NOT NULL,
    data_fim DATE,
    objetivo VARCHAR(100), -- 'Recuperação', 'Reforma Total'
    status VARCHAR(50) DEFAULT 'em_andamento', -- 'em_andamento', 'concluida', 'cancelada'
    
    -- Soil Analysis Results
    analise_v_percent DECIMAL(5,2),
    analise_p_mgdm3 DECIMAL(5,2),
    analise_ca_cmolc DECIMAL(5,2),
    
    -- Costs
    custo_insumos DECIMAL(12,2) DEFAULT 0,
    custo_maquinario DECIMAL(12,2) DEFAULT 0,
    custo_total DECIMAL(12,2) DEFAULT 0,
    
    -- Photographic evidence
    foto_antes_url TEXT,
    foto_depois_url TEXT,
    
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reforma_etapas table
CREATE TABLE IF NOT EXISTS public.reforma_etapas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenant_master(id),
    reforma_id UUID NOT NULL REFERENCES public.reformas_pasto(id) ON DELETE CASCADE,
    
    tipo_etapa VARCHAR(50) NOT NULL, -- 'correcao', 'preparo', 'plantio', 'controle', 'estabelecimento'
    data_registro DATE NOT NULL,
    
    -- Machinery metrics
    maquina_id UUID REFERENCES public.maquinas(id),
    horas_trabalhadas DECIMAL(8,2) DEFAULT 0,
    custo_hora DECIMAL(10,2) DEFAULT 0,
    
    itens_consumidos JSONB DEFAULT '[]'::jsonb, -- Array of { produto_id, quantidade, valor_unitario }
    custo_etapa DECIMAL(12,2) DEFAULT 0,
    
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.reformas_pasto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reforma_etapas ENABLE ROW LEVEL SECURITY;

-- Policies for reformas_pasto
CREATE POLICY "Tenant isolation for reformas_pasto" 
ON public.reformas_pasto 
FOR ALL 
USING (tenant_id = (SELECT auth.jwt() ->> 'user_tenant_id')::uuid);

-- Policies for reforma_etapas
CREATE POLICY "Tenant isolation for reforma_etapas" 
ON public.reforma_etapas 
FOR ALL 
USING (tenant_id = (SELECT auth.jwt() ->> 'user_tenant_id')::uuid);

-- Trigger for updated_at
CREATE TRIGGER set_reformas_pasto_updated_at
BEFORE UPDATE ON public.reformas_pasto
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
