import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  permission,
  fallback 
}) => {
  const { isAuthenticated } = useAuth();
  const { userProfile, loading } = useTenant();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Verificando permissões...</span>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Admin bypass
  if (userProfile?.role === 'ADMIN' || userProfile?.role === 'Administrador') {
    return <>{children}</>;
  }

  // Check permissions
  const permissions = userProfile?.permissoes || userProfile?.permissions || [];
  
  // if 'all' is granted or the specific permission is granted
  const hasPermission = permissions.includes('all') || permissions.includes(permission);

  if (!hasPermission) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <div style={{
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%', 
        minHeight: '60vh',
        textAlign: 'center',
        padding: '24px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <ShieldAlert size={40} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
          Acesso Negado
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '32px', lineHeight: 1.5 }}>
          Você não possui permissão para acessar esta área. Contate o administrador do sistema para solicitar acesso.
        </p>
        <Link 
          to="/" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'var(--primary)',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'opacity 0.2s'
          }}
        >
          <ArrowLeft size={16} /> Voltar ao Início
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};