-- Migration: 20260608095000_create_audit_log_triggers.sql
-- Descrição: Criação do mecanismo automático de Log de Auditoria utilizando PostgreSQL Triggers.

-- 1. Criação da Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    user_email TEXT,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Habilitação de RLS para Segurança
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Apenas super_admin ou administradores do respectivo tenant podem ler os logs
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
);

-- 3. Função Genérica de Trigger para Captura Automática
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    target_tenant_id UUID;
BEGIN
    -- Obtém o ID e Email do Usuário Conectado via Supabase Auth
    current_user_id := auth.uid();
    current_user_email := auth.jwt() ->> 'email';

    -- Define o Tenant ID baseado nos dados inseridos, atualizados ou removidos
    IF TG_OP = 'DELETE' THEN
        target_tenant_id := OLD.tenant_id;
    ELSE
        target_tenant_id := NEW.tenant_id;
    END IF;

    -- Prevenção para garantir que sempre teremos um tenant associado
    IF target_tenant_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Inserção do Log de Auditoria
    INSERT INTO public.audit_logs (
        tenant_id,
        user_id,
        user_email,
        table_name,
        record_id,
        action,
        old_data,
        new_data
    ) VALUES (
        target_tenant_id,
        current_user_id,
        current_user_email,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criação dos Triggers nas Tabelas Críticas

-- Tabela: Lotes
DROP TRIGGER IF EXISTS trg_audit_lotes ON public.lotes;
CREATE TRIGGER trg_audit_lotes
AFTER INSERT OR UPDATE OR DELETE ON public.lotes
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Tabela: Contas a Pagar
DROP TRIGGER IF EXISTS trg_audit_contas_pagar ON public.contas_pagar;
CREATE TRIGGER trg_audit_contas_pagar
AFTER INSERT OR UPDATE OR DELETE ON public.contas_pagar
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Tabela: Contas a Receber
DROP TRIGGER IF EXISTS trg_audit_contas_receber ON public.contas_receber;
CREATE TRIGGER trg_audit_contas_receber
AFTER INSERT OR UPDATE OR DELETE ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Tabela: Movimentações de Estoque
DROP TRIGGER IF EXISTS trg_audit_movimentacoes_estoque ON public.movimentacoes_estoque;
CREATE TRIGGER trg_audit_movimentacoes_estoque
AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes_estoque
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
