-- 1. Tabela de Auditoria de Logins (Edge Function Rate Limiting)
CREATE TABLE IF NOT EXISTS public.failed_logins (
    email TEXT PRIMARY KEY,
    attempts INT NOT NULL DEFAULT 0,
    last_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_until TIMESTAMPTZ
);

-- Habilitar RLS para failed_logins (Acesso apenas por service_role)
ALTER TABLE public.failed_logins ENABLE ROW LEVEL SECURITY;
-- Sem políticas para anon/authenticated, o que significa que o frontend não pode ler nem escrever.
-- Somente a Edge Function com chave Service Role (ou banco local superuser) pode acessar.

-- 2. Função RPC para o Onboarding (Criação do Tenant e Fazenda Inicial)
-- Esta função recebe os dados e cria a hierarquia completa de forma segura.
CREATE OR REPLACE FUNCTION public.create_initial_tenant_and_farm(
  p_user_id UUID,
  p_cpf_cnpj TEXT,
  p_razao_social TEXT,
  p_nome_fantasia TEXT,
  p_telefone TEXT,
  p_farm_name TEXT,
  p_tamanho_hectares NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do criador da função (necessário para criar tenants)
AS $$
DECLARE
  v_tenant_id UUID;
  v_unidade_id UUID;
  v_farm_id UUID;
BEGIN
  -- Verificar se o usuário já possui um tenant
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário já está vinculado a uma empresa.';
  END IF;

  -- 1. Criar o Tenant (Empresa)
  INSERT INTO public.tenants (
    nome, 
    document, 
    telefone,
    created_at,
    updated_at
  ) VALUES (
    COALESCE(p_razao_social, p_nome_fantasia, 'Nova Empresa'),
    p_cpf_cnpj,
    
    NOW(),
    NOW()
  ) RETURNING id INTO v_tenant_id;

  -- 2. Vincular o usuário ao Tenant como 'ADMIN'
  INSERT INTO public.profiles (
    tenant_id,
    user_id,
    role
  ) VALUES (
    v_tenant_id,
    p_user_id,
    'ADMIN' -- O primeiro usuário é sempre o owner
  );

  -- 3. Criar a Unidade Matriz
  INSERT INTO public.unidades (
    tenant_id,
    nome,
    razao_social,
    documento,
    tipo,
    ativo,
    created_at
  ) VALUES (
    v_tenant_id,
    COALESCE(p_nome_fantasia, 'Matriz'),
    COALESCE(p_razao_social, 'Matriz'),
    p_cpf_cnpj,
    'MATRIZ',
    true,
    NOW()
  ) RETURNING id INTO v_unidade_id;

  -- 4. Criar a primeira Fazenda
  INSERT INTO public.fazendas (
    tenant_id,
    unidade_id,
    nome,
    area_total,
    area_ha,
    created_at
  ) VALUES (
    v_tenant_id,
    v_unidade_id,
    p_farm_name,
    COALESCE(p_tamanho_hectares, 0),
    COALESCE(p_tamanho_hectares, 0),
    NOW()
  ) RETURNING id INTO v_farm_id;

  -- Retornar sucesso com os IDs criados
  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'unidade_id', v_unidade_id,
    'farm_id', v_farm_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Falha ao processar o onboarding: %', SQLERRM;
END;
$$;

