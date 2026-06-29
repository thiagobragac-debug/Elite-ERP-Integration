-- ==============================================================================
-- MIGRATION: 20260628000040_fix_rpc_security_definer.sql
-- PURPOSE: Fix SECURITY DEFINER vulnerability across all Pecuária RPCs
-- ==============================================================================

-- Em vez de reescrever o corpo das funções, alteramos a política de execução 
-- para SECURITY INVOKER. Isso força o PostgreSQL a aplicar o RLS (Row Level Security) 
-- do usuário logado (Sessão do Supabase) em cada linha tocada pela RPC.
-- Assim, qualquer tentativa de alterar um p_tenant_id que não pertence ao usuário
-- resultará em 0 linhas afetadas, blindando o sistema contra IDOR (Cross-tenant breach).

ALTER FUNCTION public.rpc_soft_delete_animal(UUID, UUID) SECURITY INVOKER;
ALTER FUNCTION public.rpc_soft_delete_confinamento(UUID, UUID) SECURITY INVOKER;
ALTER FUNCTION public.rpc_soft_delete_pasto(UUID, UUID) SECURITY INVOKER;
ALTER FUNCTION public.rpc_soft_delete_dieta(UUID, UUID) SECURITY INVOKER;
ALTER FUNCTION public.rpc_soft_delete_evento_reprodutivo(UUID, UUID) SECURITY INVOKER;
ALTER FUNCTION public.rpc_soft_delete_pesagem(UUID, UUID) SECURITY INVOKER;
ALTER FUNCTION public.rpc_delete_health_event(UUID, UUID) SECURITY INVOKER;
ALTER FUNCTION public.rpc_delete_reproduction_event(UUID, UUID) SECURITY INVOKER;
ALTER FUNCTION public.apply_health_protocol(JSON) SECURITY INVOKER;
ALTER FUNCTION public.register_reproduction_event(JSONB, UUID, TEXT, JSONB, JSONB, UUID) SECURITY INVOKER;

-- Observação: apply_health_protocol já possuía trava de segurança no código,
-- mas alterá-la para INVOKER adiciona uma camada de segurança Defense-in-Depth via RLS.
