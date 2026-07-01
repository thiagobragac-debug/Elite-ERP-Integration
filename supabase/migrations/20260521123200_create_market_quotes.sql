-- Migration para armazenar o histórico de cotações do mercado (CEPEA)

CREATE TABLE IF NOT EXISTS public.market_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    indicator TEXT NOT NULL,          -- Ex: 'boi_gordo_cepea'
    date DATE NOT NULL,               -- Data da cotação
    value NUMERIC(10, 2) NOT NULL,    -- Valor em R$
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Garante que não teremos duas cotações para o mesmo indicador no mesmo dia
    UNIQUE(indicator, date)
);

-- Ativar RLS
ALTER TABLE public.market_quotes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
-- Apenas leitura para usuários autenticados
DROP POLICY IF EXISTS "Leitura permitida para usuários autenticados" ON public.market_quotes;
CREATE POLICY "Leitura permitida para usuários autenticados" 
    ON public.market_quotes 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- A inserção só poderá ser feita via Edge Function que não sofre restrição de RLS usando service_role,
-- mas podemos criar uma política temporária se a inserção for pelo app client-side. 
-- Como vamos usar Edge Function (Opção B), não precisamos permitir INSERT para roles autenticadas normais.

