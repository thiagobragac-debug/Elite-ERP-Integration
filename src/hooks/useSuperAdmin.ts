import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UseSuperAdminReturn {
  isSuperAdmin: boolean | null;
  loading: boolean;
}

/**
 * Hook que verifica se o usuário atual é super admin consultando a tabela `profiles`.
 * Retorna { isSuperAdmin, loading }.
 */
export function useSuperAdmin(): UseSuperAdminReturn {
  const { user, loading: authLoading } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    const check = async (): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        const role = data?.role?.toLowerCase();
        setIsSuperAdmin(role === 'superadmin' || role === 'saas_admin');
      } catch {
        // Fallback para role local do contexto
        const localRole = (user as any)?.role?.toLowerCase();
        setIsSuperAdmin(
          localRole === 'superadmin' || localRole === 'saas_admin'
        );
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [user, authLoading]);

  return { isSuperAdmin, loading };
}
