import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ShieldAlert } from 'lucide-react';

export const SuperAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkSuperAdminStatus = async () => {
      if (!user) {
        setIsAuthorized(false);
        return;
      }

      try {
        // Busca a role real do usuário no banco para garantir acesso restrito ao painel SaaS global
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        // Apenas roles autorizadas ('admin' ou 'superadmin') podem gerenciar a infraestrutura global SaaS
        const isSuperAdmin = data?.role === 'admin' || data?.role === 'superadmin';
        setIsAuthorized(isSuperAdmin);
      } catch (error) {
        console.error('Erro ao verificar status de governança superadmin:', error);
        setIsAuthorized(false);
      }
    };

    if (!authLoading) {
      checkSuperAdminStatus();
    }
  }, [user, authLoading]);

  if (authLoading || isAuthorized === null) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: '#38bdf8' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Verificando credenciais de governança...</span>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    // If not authorized, redirect to the main app dashboard and clear impersonation if any
    localStorage.removeItem('saas_impersonate_tenant_id');
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // If authorized and entering SaaS Panel, ensure they are no longer impersonating anyone
  localStorage.removeItem('saas_impersonate_tenant_id');

  return <>{children}</>;
};
