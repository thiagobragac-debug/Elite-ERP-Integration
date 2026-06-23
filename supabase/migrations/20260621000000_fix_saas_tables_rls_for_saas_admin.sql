-- ==============================================================================
-- Migration: Fix SAAS_ADMIN RLS for global SaaS tables
-- Date: 2026-06-21
-- Description: The SAAS_ADMIN role lacked UPDATE/INSERT policies for global saas 
-- tables because they don't have tenant_id columns and were skipped by the initial loop.
-- ==============================================================================

-- Fix RLS for saas_plans for SAAS_ADMIN
DROP POLICY IF EXISTS "saas_admin_all_saas_plans" ON public.saas_plans;
CREATE POLICY "saas_admin_all_saas_plans" ON public.saas_plans FOR ALL USING (auth_helpers.is_saas_admin());

-- Fix RLS for saas_audit_logs for SAAS_ADMIN
DROP POLICY IF EXISTS "saas_audit_logs_saas_admin" ON public.saas_audit_logs;
CREATE POLICY "saas_audit_logs_saas_admin" ON public.saas_audit_logs FOR SELECT USING (auth_helpers.is_saas_admin());

-- Fix RLS for saas_gateway_settings for SAAS_ADMIN
DROP POLICY IF EXISTS "saas_gateway_settings_saas_admin" ON public.saas_gateway_settings;
CREATE POLICY "saas_gateway_settings_saas_admin" ON public.saas_gateway_settings FOR ALL USING (auth_helpers.is_saas_admin());

-- Fix RLS for saas_payment_settings for SAAS_ADMIN
DROP POLICY IF EXISTS "saas_payment_settings_saas_admin" ON public.saas_payment_settings;
CREATE POLICY "saas_payment_settings_saas_admin" ON public.saas_payment_settings FOR ALL USING (auth_helpers.is_saas_admin());
