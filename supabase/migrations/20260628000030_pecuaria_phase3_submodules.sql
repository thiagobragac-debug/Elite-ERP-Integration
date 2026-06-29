-- Fase 3: Adicionando deleted_at nos submódulos de pecuária
ALTER TABLE public.confinamento ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.pastos ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.dietas ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.eventos_reprodutivos ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.pesagens ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Atualizar RLS Políticas para ocultar registros apagados
-- Confinamento
DROP POLICY IF EXISTS "confinamento_tenant" ON public.confinamento;
CREATE POLICY "confinamento_tenant" ON public.confinamento
    FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid AND deleted_at IS NULL);

-- Pastos
DROP POLICY IF EXISTS "pastos_tenant" ON public.pastos;
CREATE POLICY "pastos_tenant" ON public.pastos
    FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid AND deleted_at IS NULL);

-- Dietas
DROP POLICY IF EXISTS "dietas_tenant" ON public.dietas;
CREATE POLICY "dietas_tenant" ON public.dietas
    FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid AND deleted_at IS NULL);

-- Eventos Reprodutivos
DROP POLICY IF EXISTS "eventos_reprodutivos_tenant" ON public.eventos_reprodutivos;
CREATE POLICY "eventos_reprodutivos_tenant" ON public.eventos_reprodutivos
    FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid AND deleted_at IS NULL);

-- Pesagens
DROP POLICY IF EXISTS "pesagens_tenant" ON public.pesagens;
CREATE POLICY "pesagens_tenant" ON public.pesagens
    FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid AND deleted_at IS NULL);


-- Criar funções (RPCs) de deleção transacional segura
CREATE OR REPLACE FUNCTION public.rpc_soft_delete_confinamento(p_id uuid, p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.confinamento 
  SET status = 'INATIVO', deleted_at = NOW()
  WHERE id = p_id AND tenant_id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_soft_delete_pasto(p_id uuid, p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.pastos 
  SET status = 'INATIVO', deleted_at = NOW()
  WHERE id = p_id AND tenant_id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_soft_delete_dieta(p_id uuid, p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.dietas 
  SET deleted_at = NOW()
  WHERE id = p_id AND tenant_id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_soft_delete_evento_reprodutivo(p_id uuid, p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.eventos_reprodutivos 
  SET deleted_at = NOW()
  WHERE id = p_id AND tenant_id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_soft_delete_pesagem(p_id uuid, p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.pesagens 
  SET deleted_at = NOW()
  WHERE id = p_id AND tenant_id = p_tenant_id;
END;
$$;
