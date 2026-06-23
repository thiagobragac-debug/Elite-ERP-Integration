-- Migration: Rotinas automáticas de cobrança e bloqueio gradual

-- 1. Garante que a coluna status existe na tabela tenants (caso tenha sido criada por alteração manual sem script)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS status text DEFAULT 'Ativo';

-- 2. Função principal para processar o motor de cobrança
CREATE OR REPLACE FUNCTION public.process_billing_status()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- A. Atualizar faturas pendentes vencidas para 'atrasado'
    UPDATE public.saas_invoices
    SET status = 'atrasado'
    WHERE status = 'pendente' 
      AND due_date < CURRENT_DATE;

    -- B. Soft Block (Read-only): Faturas com 5 dias de atraso
    UPDATE public.tenants
    SET status = 'Bloqueio Parcial'
    WHERE id IN (
        SELECT tenant_id 
        FROM public.saas_invoices 
        WHERE status = 'atrasado' 
          AND due_date <= CURRENT_DATE - INTERVAL '5 days'
    ) AND status = 'Ativo';

    -- C. Hard Block (Suspenso): Faturas com 10 dias de atraso
    UPDATE public.tenants
    SET status = 'Suspenso'
    WHERE id IN (
        SELECT tenant_id 
        FROM public.saas_invoices 
        WHERE status = 'atrasado' 
          AND due_date <= CURRENT_DATE - INTERVAL '10 days'
    ) AND status IN ('Ativo', 'Bloqueio Parcial');

END;
$$;

-- 3. Agendamento do Cron (Roda todo dia à meia-noite)
-- Certifique-se que a extensão pg_cron está habilitada no Supabase
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Remove se já existir para recriar
        PERFORM cron.unschedule('process_billing_status');
        -- Agendar para as 00:00 (Meia-noite)
        PERFORM cron.schedule('process_billing_status', '0 0 * * *', 'SELECT public.process_billing_status()');
    END IF;
END $$;
