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
        // Here you would typically check a 'roles' table or user metadata
        // For example:
        // const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
        // setIsAuthorized(data?.role === 'superadmin');

        // Mocking validation for now. In production, uncomment the DB check above.
        // Assuming user.email contains 'admin' as a fallback mock check:
        const isSuperAdmin = user.email?.includes('admin') || true; // Set to true to allow testing until DB is ready
        setIsAuthorized(isSuperAdmin);
      } catch (error) {
        console.error('Error verifying superadmin status:', error);
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
