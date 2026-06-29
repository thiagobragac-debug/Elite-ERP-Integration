/**
 * Tipos centrais do domínio de Tenant e Usuário.
 * Refletem exatamente as colunas existentes no banco de dados Supabase.
 */

// ─── Perfil do usuário (tabela: profiles) ───────────────────────────────────

export type UserRole =
  | 'SAAS_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'OPERATOR'
  | 'USER'
  | 'Administrador'
  | 'Gerente'
  | 'Operador';

export interface UserProfile {
  id: string;
  role: UserRole;
  tenant_id: string | null;
  full_name: string | null;
  email: string | null;
  settings: Record<string, unknown> | null;
  avatar_url: string | null;
  perfil_id: string | null;
  perfis_usuario?: {
    permissoes: Record<string, string[]> | string[] | null;
  } | null;
}

// ─── Tenant (tabela: tenants) ────────────────────────────────────────────────

export type TenantStatus = 'ativo' | 'suspenso' | 'bloqueado' | string;

export interface Tenant {
  id: string;
  nome: string;
  status: TenantStatus;
  plano_vencimento: string | null;
  plano: string | null;
  settings: Record<string, unknown> | null;
  plan_details?: any; // detalhes completos do plano carregados do saas_plans
  [key: string]: unknown; // permite campos extras vindos do banco sem quebrar o tipo
}

// ─── Empresa/Unidade (tabela: unidades) ──────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  document: string;
  type: string;
  razao_social?: string;
}

// ─── Fazenda (tabela: fazendas) ──────────────────────────────────────────────

export interface Farm {
  id: string;
  companyId: string;
  tenantId: string;
  name: string;
  registrationNumber: string;
  totalArea: number;
  location: string;
  pesoAbateKg: number;
}

// ─── Helpers de role ─────────────────────────────────────────────────────────

export const ADMIN_ROLES: UserRole[] = ['SAAS_ADMIN', 'ADMIN', 'Administrador'];

export function isAdminRole(role: UserRole | null | undefined | string): boolean {
  if (!role) return false;
  const normalized = role.toUpperCase();
  return ADMIN_ROLES.includes(normalized as UserRole) || normalized === 'ADMINISTRADOR';
}

export function getRoleLabel(role: UserRole | null | undefined | string): string {
  if (!role) return 'Usuário';
  const normalized = role.toUpperCase();
  switch (normalized) {
    case 'SAAS_ADMIN':
      return 'Super Admin';
    case 'ADMIN':
    case 'ADMINISTRADOR':
      return 'Administrador';
    case 'GERENTE':
      return 'Gerente';
    case 'OPERADOR':
      return 'Operador';
    case 'VETERINARIO':
      return 'Veterinário';
    case 'ZOOTECNISTA':
      return 'Zootecnista';
    case 'COMPRADOR':
      return 'Comprador';
    case 'VENDEDOR':
      return 'Vendedor';
    case 'FINANCEIRO':
      return 'Financeiro';
    default:
      return 'Usuário';
  }
}
