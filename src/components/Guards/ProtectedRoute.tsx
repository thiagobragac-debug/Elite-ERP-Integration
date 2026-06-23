import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  module: string;
  action?: 'read' | 'write' | 'approve' | 'delete';
  redirectTo?: string;
}

/**
 * Guardião de rotas baseado na Matriz de Segurança (CRUD).
 * 
 * Envolva rotas sensíveis com este componente. Se o usuário não tiver permissão
 * para o módulo e ação especificados, ele será bloqueado, avisado e redirecionado.
 * 
 * Exemplo de uso no AppRoutes:
 * <Route element={<ProtectedRoute module="financeiro" action="read" />}>
 *   <Route path="/financeiro" element={<FinanceiroDashboard />} />
 * </Route>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  module, 
  action = 'read', 
  redirectTo = '/painel' 
}) => {
  const { can } = usePermissions();

  const isAllowed = can(module, action);

  if (!isAllowed) {
    // Timeout para evitar disparo no render cycle imediato do React Router (React <= 18)
    setTimeout(() => {
      toast.error('Acesso Negado: Seu Perfil não possui permissão para acessar esta área.');
    }, 0);
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
