import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenantCore } from '../../contexts/TenantContext';
import { usePermissions } from '../../hooks/usePermissions';
import { UpgradeRequired } from '../Feedback/UpgradeRequired';
import toast from 'react-hot-toast';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  fallback,
}) => {
  const { isAuthenticated } = useAuth();
  const { loading, tenant } = useTenantCore();
  const { can } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--brand)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
          Verificando permissões...
        </span>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // A "permission" props usually came as module_name (e.g., 'financeiro')
  // We can treat it as module, action='read'
  // Or handle specific legacy permissions mapping like 'pecuaria_animais' -> module='pecuaria', action='read'
  const moduleName = permission.split('_')[0]; // ex: 'pecuaria_animais' -> 'pecuaria'
  
  // Converte nome de permissão legado para o formato da Sidebar/SaasModules para validação no plano
  const planModuleMapping: Record<string, string> = {
    'admin': 'Administração',
    'compras': 'Compra & Cotação',
    'estoque': 'Estoque',
    'logistica': 'Estoque',
    'financeiro': 'Financeiro & Banco',
    'frota': 'Máquina & Frota',
    'mercado': 'Mercado',
    'pecuaria': 'Pecuária',
    'comercial': 'Venda & CRM',
    'vendas': 'Venda & CRM'
  };

  const planSubmoduleMapping: Record<string, string> = {
    'pecuaria_dashboard': 'Pecuária:Intelligence Hub',
    'pecuaria_animais': 'Pecuária:Animais',
    'pecuaria_saude': 'Pecuária:Sanidade',
    'frota_abastecimento': 'Máquina & Frota:Abastecimentos',
    'frota_manutencao': 'Máquina & Frota:Manutenções',
    'comercial_clientes': 'Venda & CRM:Clientes',
    'comercial_pedidos': 'Venda & CRM:Pedidos de Venda',
    'logistica_armazens': 'Estoque:Depósitos',
    'compras_fornecedores': 'Compra & Cotação:Fornecedores',
    'compras_pedidos': 'Compra & Cotação:Pedidos de Compra',
    'financeiro_dashboard': 'Financeiro & Banco:Intelligence Hub',
    'financeiro_bancos': 'Financeiro & Banco:Contas Bancárias',
    'financeiro_operacoes': 'Financeiro & Banco:Contas a Pagar',
  };

  const mappedMainModule = planModuleMapping[moduleName] || moduleName;
  const mappedSubModule = planSubmoduleMapping[permission];

  const hasRolePermission = can(moduleName, 'read');
  
  // Checks if the Tenant's Plan has access to this module
  let hasPlanPermission = true;
  const planModules = tenant?.plan_details?.modules;
  
  if (tenant && tenant.plano !== 'BETA_FREE' && Array.isArray(planModules)) {
    if (mappedSubModule) {
      hasPlanPermission = planModules.includes(mappedSubModule);
    } else {
      hasPlanPermission = planModules.includes(mappedMainModule);
    }
  }

  if (!hasRolePermission || !hasPlanPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!hasPlanPermission) {
      return <UpgradeRequired moduleName={mappedMainModule} isRoleRestriction={false} />;
    }

    if (!hasRolePermission) {
      return <UpgradeRequired moduleName={mappedMainModule} isRoleRestriction={true} />;
    }
  }

  return <>{children}</>;
};
