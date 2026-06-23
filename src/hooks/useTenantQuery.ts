/**
 * useTenantQuery — Helper centralizado para queries Supabase com isolamento multi-tenant.
 *
 * Fornece dois utilitários:
 *
 *   withTenant(query)      → aplica .eq('tenant_id', tenantId) em SELECT/UPDATE/DELETE
 *   injectTenant(payload)  → injeta { tenant_id } em payloads de INSERT/UPDATE
 *
 * ⚠️ IMPORTANTE: Este hook NÃO importa TenantContext para evitar dependência circular.
 *    O tenant_id é lido diretamente do JWT do Supabase (app_metadata.tenant_id)
 *    ou do localStorage como fallback.
 *
 * Uso:
 *   const { withTenant, injectTenant } = useTenantQuery();
 *
 *   // SELECT
 *   const { data } = await withTenant(supabase.from('tabela').select('*'));
 *
 *   // INSERT
 *   await supabase.from('tabela').insert(injectTenant([{ nome: 'x' }]));
 *
 *   // UPDATE (objeto único)
 *   await supabase.from('tabela').update(injectTenant({ status: 'ativo' })).eq('id', id);
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Lê o tenant_id sincronamente da sessão em cache do Supabase (sem await).
 * Retorna null se ainda não disponível.
 */
function getTenantIdSync(): string | null {
  try {
    // Tenta ler o tenant_id do cache local do Supabase (storage)
    // O Supabase armazena a sessão no localStorage com a chave 'sb-*-auth-token'
    const keys = Object.keys(localStorage);
    const authKey = keys.find(k => k.includes('-auth-token') && k.startsWith('sb-'));
    if (authKey) {
      const raw = localStorage.getItem(authKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const tenantId =
          parsed?.user?.app_metadata?.tenant_id ||
          parsed?.user?.user_metadata?.tenant_id;
        if (tenantId) return tenantId;
      }
    }
  } catch {
    // Ignora erros de parsing
  }
  return null;
}

export function useTenantQuery() {
  const [tenantId, setTenantId] = useState<string | null>(getTenantIdSync);

  useEffect(() => {
    // Subscreve mudanças de sessão para atualizar o tenantId
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const id =
        session?.user?.app_metadata?.tenant_id ||
        session?.user?.user_metadata?.tenant_id ||
        null;
      setTenantId(id);
    });

    // Também lê a sessão atual na montagem
    supabase.auth.getSession().then(({ data: { session } }) => {
      const id =
        session?.user?.app_metadata?.tenant_id ||
        session?.user?.user_metadata?.tenant_id ||
        null;
      setTenantId(id);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Aplica filtro de tenant em qualquer query Supabase.
   * Se tenantId não estiver disponível, aplica filtro seguro que não retorna dados.
   */
  const withTenant = useMemo(() => {
    return (query: any): any => {
      if (!tenantId) {
        // Fail-safe: sem tenant, não vaza dados entre tenants
        return query.is('tenant_id', null);
      }
      return query.eq('tenant_id', tenantId);
    };
  }, [tenantId]);

  /**
   * Injeta tenant_id em payloads de INSERT/UPDATE.
   * Aceita um objeto único ou um array de objetos.
   */
  const injectTenant = useMemo(() => {
    return <T extends Record<string, any>>(payload: T | T[]): T | T[] => {
      if (!tenantId) return payload;

      if (Array.isArray(payload)) {
        return payload.map((item) => ({ ...item, tenant_id: tenantId }));
      }

      return { ...payload, tenant_id: tenantId };
    };
  }, [tenantId]);

  return { withTenant, injectTenant, tenantId };
}
