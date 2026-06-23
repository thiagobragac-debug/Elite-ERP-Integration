-- Migration: Add asaas_plan_id to saas_plans table
-- Executar no SQL Editor do Supabase se a coluna ainda não existir

ALTER TABLE public.saas_plans
ADD COLUMN IF NOT EXISTS asaas_plan_id TEXT DEFAULT NULL;

COMMENT ON COLUMN public.saas_plans.asaas_plan_id IS 'ID do plano no Asaas para cobrança de assinaturas recorrentes';
