import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Settings,
  Activity,
  Truck,
  ShoppingCart,
  TrendingUp,
  Package,
  Wallet,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
  Building2,
  ChevronLeft,
  BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useTenantFarm, useTenantProfile, useTenantCore } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { useSidebarAlerts } from '../../hooks/useSidebarAlerts';
import { usePermissions } from '../../hooks/usePermissions';
import { useSystemSettings } from '../../contexts/SystemSettingsContext';
import './Sidebar.css';

/** Preferências de alerta da sidebar — tipagem explícita */
interface AlertPrefs {
  enabled: boolean;
  lotes: boolean;
  financeiro: boolean;
  sanidade: boolean;
  configuracoes: boolean;
}

const DEFAULT_ALERT_PREFS: AlertPrefs = {
  enabled: true,
  lotes: true,
  financeiro: true,
  sanidade: true,
  configuracoes: true,
};

interface NavItem {
  title: string;
  icon: React.ElementType;
  href?: string;
  permission?: string;
  subItems?: { title: string; href: string; permission?: string }[];
}

const menuItems: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/painel' },
  {
    title: 'Administração',
    icon: Settings,
    permission: 'admin',
    subItems: [
      { title: 'Intelligence Hub', href: '/admin/intelligence' },
      { title: 'Aprovações', href: '/admin/aprovacoes' },
      { title: 'Usuários', href: '/admin/usuarios' },
      { title: 'Empresas & Fazendas', href: '/admin/config' },
      { title: 'Configurações', href: '/admin/configuracoes' },
      { title: 'Assinatura & Planos', href: '/admin/assinatura' },
      { title: 'Logs de Auditoria', href: '/admin/auditoria' },
    ],
  },
  {
    title: 'Mercado',
    icon: Globe,
    permission: 'mercado',
    subItems: [
      { title: 'Intelligence Hub', href: '/mercado/indicadores' },
      { title: 'Análise Avançada', href: '/mercado/analise' },
      { title: 'Sazonalidade', href: '/mercado/sazonalidade' },
      { title: 'Calculadora B3', href: '/mercado/b3' },
    ],
  },
  {
    title: 'Bovinocultura',
    icon: Activity,
    permission: 'bovinocultura',
    subItems: [
      { title: 'Intelligence Hub', href: '/bovinocultura/dashboard', permission: 'bovinocultura_dashboard' },
      { title: 'Animais', href: '/bovinocultura/animal', permission: 'bovinocultura_animais' },
      { title: 'Lotes', href: '/bovinocultura/lote', permission: 'bovinocultura_animais' },
      { title: 'Pastos', href: '/bovinocultura/pasto', permission: 'bovinocultura_animais' },
      { title: 'Pesagens & GMD', href: '/bovinocultura/pesagem', permission: 'bovinocultura_animais' },
      { title: 'Nutrição', href: '/bovinocultura/nutricao', permission: 'bovinocultura_saude' },
      { title: 'Sanidade', href: '/bovinocultura/sanidade', permission: 'bovinocultura_saude' },
      { title: 'Reprodução', href: '/bovinocultura/reproducao', permission: 'bovinocultura_saude' },
      { title: 'Confinamento', href: '/bovinocultura/confinamento', permission: 'bovinocultura_animais' },
      {
        title: 'Embarques & Romaneios',
        href: '/bovinocultura/romaneios',
        permission: 'bovinocultura_animais',
      },
    ],
  },
  {
    title: 'Máquina & Frota',
    icon: Truck,
    permission: 'frota',
    subItems: [
      { title: 'Intelligence Hub', href: '/frota/dashboard' },
      { title: 'Máquinas & Equipamentos', href: '/frota/maquina' },
      { title: 'Abastecimentos', href: '/frota/abastecimento', permission: 'frota_abastecimento' },
      { title: 'Manutenções', href: '/frota/manutencao', permission: 'frota_manutencao' },
    ],
  },
  {
    title: 'Compra & Cotação',
    icon: ShoppingCart,
    permission: 'compras',
    subItems: [
      { title: 'Intelligence Hub', href: '/compras/dashboard' },
      { title: 'Fornecedores', href: '/compras/fornecedores', permission: 'compras_fornecedores' },
      {
        title: 'Solicitações de Compra',
        href: '/compras/solicitacao',
        permission: 'compras_pedidos',
      },
      { title: 'Mapas de Cotação', href: '/compras/cotacao', permission: 'compras_pedidos' },
      { title: 'Pedidos de Compra', href: '/compras/pedido', permission: 'compras_pedidos' },
      { title: 'Notas Fiscais de Entrada', href: '/compras/nota' },
    ],
  },
  {
    title: 'Venda & CRM',
    icon: TrendingUp,
    permission: 'comercial',
    subItems: [
      { title: 'Intelligence Hub', href: '/vendas/dashboard' },
      { title: 'Clientes', href: '/vendas/parceiros', permission: 'comercial_clientes' },
      { title: 'Pedidos de Venda', href: '/vendas/pedido', permission: 'comercial_pedidos' },
      { title: 'Contratos & Hedge', href: '/vendas/contrato', permission: 'comercial_pedidos' },
      { title: 'Notas Fiscais de Saída', href: '/vendas/notas' },
    ],
  },
  {
    title: 'Estoque',
    icon: Package,
    permission: 'logistica',
    subItems: [
      { title: 'Intelligence Hub', href: '/estoque/dashboard' },
      { title: 'Insumos e Serviços', href: '/estoque/insumo', permission: 'logistica_armazens' },
      { title: 'Depósitos', href: '/estoque/deposito', permission: 'logistica_armazens' },
      { title: 'Movimentações', href: '/estoque/movimentacao' },
      { title: 'Inventário', href: '/estoque/inventario' },
    ],
  },
  {
    title: 'Financeiro & Banco',
    icon: Wallet,
    permission: 'financeiro',
    subItems: [
      {
        title: 'Intelligence Hub',
        href: '/financeiro/intelligence',
        permission: 'financeiro_dashboard',
      },
      { title: 'Fluxo de Caixa', href: '/financeiro/fluxo' },
      { title: 'Contas Bancária', href: '/financeiro/contas', permission: 'financeiro_bancos' },
      { title: 'Contas a Pagar', href: '/financeiro/pagar', permission: 'financeiro_operacoes' },
      {
        title: 'Contas a Receber',
        href: '/financeiro/receber',
        permission: 'financeiro_operacoes',
      },
      {
        title: 'Conciliações Bancária',
        href: '/financeiro/conciliacao',
        permission: 'financeiro_bancos',
      },
      { title: 'LCDPR', href: '/financeiro/lcdpr' },
    ],
  },
  { title: 'Relatórios', icon: FileText, href: '/relatorios' },
];

/** Maps URL prefix → sidebar module title */
const routeToModule: Record<string, string> = {
  '/admin': 'Administração',
  '/bovinocultura': 'Bovinocultura',
  '/frota': 'Máquina & Frota',
  '/compras': 'Compra & Cotação',
  '/vendas': 'Venda & CRM',
  '/estoque': 'Estoque',
  '/financeiro': 'Financeiro & Banco',
};

/** Returns the module title that matches the current pathname, or empty string */
const getModuleFromPath = (pathname: string): string => {
  const match = Object.entries(routeToModule).find(([prefix]) => pathname.startsWith(prefix));
  return match ? match[1] : '';
};

// ─── AlertBadge ─────────────────────────────────────────────────────────────
// Componente memoizado para badges de alerta na sidebar
interface AlertBadgeProps {
  count: number;
  color?: string;
  textColor?: string;
}
const AlertBadge = React.memo<AlertBadgeProps>(({ count, color = '#ef4444', textColor = 'white' }) => (
  <span
    style={{
      background: color,
      color: textColor,
      padding: '1px 5px',
      borderRadius: '4px',
      fontSize: '9px',
      fontWeight: 900,
      minWidth: '16px',
      textAlign: 'center',
    }}
  >
    {count}
  </span>
));
AlertBadge.displayName = 'AlertBadge';

export const Sidebar: React.FC<{ isCollapsed?: boolean; onToggleCollapse?: () => void }> = React.memo(({
  isCollapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const { settings } = useSystemSettings();
  const baseSystemName = settings.system_name || 'Tauze';

  // On first render, open only the module that matches the current URL.
  // This makes F5 / direct navigation behave correctly.
  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    const active = getModuleFromPath(location.pathname);
    return active ? [active] : [];
  });

  const [isFarmSelectorOpen, setIsFarmSelectorOpen] = useState(false);
  const {
    activeFarm,
    farms,
    setActiveFarm,
    isGlobalMode,
    setGlobalMode,
    activeTenantId,
  } = useTenantFarm();
  const { tenant } = useTenantCore();
  const { userProfile } = useTenantProfile();
  // tenant.settings é necessário para alertPrefs — lemos via useTenantFarm não expõe tenant,
  // mas userProfile.settings contém sidebar_alerts quando definido pelo admin
  const tenantSidebarAlerts = (userProfile?.settings as Record<string, unknown> | null)
    ?.sidebar_alerts as Record<string, unknown> | undefined;
  const [pendingApprovals, setPendingApprovals] = useState(0);

  const { alerts } = useSidebarAlerts();
  const alertPrefs = useMemo<AlertPrefs>(() => {
    const raw =
      (userProfile?.settings?.sidebar_alerts as Partial<AlertPrefs> | undefined) ??
      (tenantSidebarAlerts as Partial<AlertPrefs> | undefined);
    if (!raw) return DEFAULT_ALERT_PREFS;
    return { ...DEFAULT_ALERT_PREFS, ...raw };
  }, [userProfile?.settings, tenantSidebarAlerts]);

  useEffect(() => {
    if (!activeTenantId) {
      return;
    }
    const fetchPending = async () => {
      const { count } = await supabase
        .from('approval_queue')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', activeTenantId)
        .eq('status', 'pending');

      setPendingApprovals(count || 0);
    };
    fetchPending();

    const subscription = supabase
      .channel('approval-queue-sidebar')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approval_queue',
          filter: `tenant_id=eq.${activeTenantId}`,
        },
        fetchPending
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeTenantId]);

  const auditEnabled = useMemo(
    () => (userProfile?.settings as Record<string, unknown> | null)
      ? ((userProfile?.settings as Record<string, Record<string, unknown>>)?.security?.auditLogsEnabled ?? true)
      : true,
    [userProfile?.settings]
  );

  // Helper para checar permissão (agora utiliza a Matriz de CRUD)
  const { can } = usePermissions();
  const checkPermission = useCallback((modulePermission?: string): boolean => {
    if (!modulePermission) return true;
    return can(modulePermission, 'read'); // Para o menu lateral, apenas 'read' é exigido
  }, [can]);

  // Dynamically compute the menu items the user has access to
  const filteredMenuItems = useMemo(() => {
    const planModules = tenant?.plan_details?.modules;
    // BETA_FREE gets all features. If planModules is null, it means unrestricted/legacy plan.
    const hasPlanRestriction = tenant && tenant.plano !== 'BETA_FREE' && Array.isArray(planModules);

    const checkPlanModule = (moduleName: string, subModuleName?: string) => {
      if (!hasPlanRestriction) return true;
      if (subModuleName) {
        return planModules.includes(`${moduleName}:${subModuleName}`);
      }
      return planModules.includes(moduleName);
    };

    return menuItems
      .filter((item) => checkPermission(item.permission) && checkPlanModule(item.title))
      .map((item) => {
        if (!item.subItems) return item;
        return {
          ...item,
          subItems: item.subItems.filter((sub) => {
            if (!checkPermission(sub.permission)) return false;
            if (!checkPlanModule(item.title, sub.title)) return false;
            if (sub.title === 'Logs de Auditoria' && !auditEnabled) return false;
            return true;
          }),
        };
      })
      .filter((item) => !item.subItems || item.subItems.length > 0 || item.href);
  }, [checkPermission, auditEnabled, tenant]);

  // When the user navigates to a new module section, automatically open it
  // (but don't close others — let the user manage that with clicks).
  useEffect(() => {
    const active = getModuleFromPath(location.pathname);
    if (active) {
      setOpenMenus((prev) => (prev.includes(active) ? prev : [...prev, active]));
    }
  }, [location.pathname]);

  // Derive module name and icon from current route
  const { moduleName, ModuleIcon, moduleBg } = React.useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/frota'))      return { moduleName: 'Frota',      ModuleIcon: Truck,       moduleBg: '#0f172a' };
    if (path.startsWith('/compras'))   return { moduleName: 'Compras',    ModuleIcon: ShoppingCart, moduleBg: '#4f46e5' };
    if (path.startsWith('/vendas'))    return { moduleName: 'Vendas',     ModuleIcon: TrendingUp,  moduleBg: '#0891b2' };
    if (path.startsWith('/financeiro'))return { moduleName: 'Financeiro', ModuleIcon: Wallet,       moduleBg: '#059669' };
    if (path.startsWith('/estoque'))   return { moduleName: 'Estoque',    ModuleIcon: Package,      moduleBg: '#7c3aed' };
    if (path.startsWith('/mercado'))   return { moduleName: 'Mercado',    ModuleIcon: BarChart3,    moduleBg: '#b45309' };
    if (path.startsWith('/admin'))     return { moduleName: 'Admin',      ModuleIcon: Settings,     moduleBg: '#475569' };
    if (path.startsWith('/relatorios'))return { moduleName: 'Relatórios', ModuleIcon: FileText,     moduleBg: '#374151' };
    return { moduleName: 'Bovinocultura', ModuleIcon: Activity, moduleBg: 'hsl(var(--brand))' };
  }, [location.pathname]);

  const toggleMenu = useCallback((title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  }, []);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          {settings.logo_base64 ? (
            <div
              className="logo-icon"
              style={{ background: 'transparent', padding: 0 }}
            >
              <img src={settings.logo_base64} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          ) : (
            <div
              className="logo-icon"
              style={{ background: moduleBg }}
            >
              <ModuleIcon size={24} color="white" />
            </div>
          )}
          <span className="system-name">{baseSystemName}</span>
        </div>
        {onToggleCollapse && (
          <button className="sidebar-collapse-btn" onClick={onToggleCollapse}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => (
          <div key={item.title} className="menu-group">
            {item.subItems ? (
              <>
                <button
                  className={`menu-button ${openMenus.includes(item.title) ? 'open' : ''}`}
                  onClick={() => toggleMenu(item.title)}
                >
                  <div className="menu-button-content">
                    <item.icon size={20} className="menu-icon" />
                    <span>{item.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.title === 'Financeiro & Banco' &&
                      alertPrefs.enabled &&
                      alertPrefs.financeiro &&
                      alerts.financeiro > 0 && (
                        <AlertBadge count={alerts.financeiro} />
                      )}
                    {item.title === 'Bovinocultura' &&
                      alertPrefs.enabled &&
                      ((alertPrefs.lotes && alerts.lotes > 0) ||
                        (alertPrefs.sanidade && alerts.sanidade > 0)) && (
                        <AlertBadge
                          count={(alertPrefs.lotes ? alerts.lotes : 0) + (alertPrefs.sanidade ? alerts.sanidade : 0)}
                          color="hsl(var(--warning))"
                          textColor="#000"
                        />
                      )}
                    {item.title === 'Administração' &&
                      alertPrefs.enabled &&
                      alertPrefs.configuracoes &&
                      alerts.configuracoes > 0 && (
                        <AlertBadge count={alerts.configuracoes} />
                      )}
                    {openMenus.includes(item.title) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                </button>
                <AnimatePresence>
                  {openMenus.includes(item.title) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="submenu"
                    >
                      {item.subItems.map((sub) => (
                        <Link
                          key={sub.title}
                          to={sub.href}
                          className={`submenu-item ${location.pathname === sub.href ? 'active' : ''}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{sub.title}</span>
                          {sub.title === 'Aprovações' && pendingApprovals > 0 && (
                            <AlertBadge count={pendingApprovals} />
                          )}
                          {sub.title === 'Lotes' &&
                            alertPrefs.enabled &&
                            alertPrefs.lotes &&
                            alerts.lotes > 0 && (
                              <AlertBadge count={alerts.lotes} color="hsl(var(--warning))" textColor="#000" />
                            )}
                          {sub.title === 'Sanidade' &&
                            alertPrefs.enabled &&
                            alertPrefs.sanidade &&
                            alerts.sanidade > 0 && (
                              <AlertBadge count={alerts.sanidade} />
                            )}
                          {sub.title === 'Contas a Pagar' &&
                            alertPrefs.enabled &&
                            alertPrefs.financeiro &&
                            alerts.financeiroPagar > 0 && (
                              <AlertBadge count={alerts.financeiroPagar} />
                            )}
                          {sub.title === 'Contas a Receber' &&
                            alertPrefs.enabled &&
                            alertPrefs.financeiro &&
                            alerts.financeiroReceber > 0 && (
                              <AlertBadge count={alerts.financeiroReceber} color="#f59e0b" textColor="#000" />
                            )}
                          {sub.title === 'Assinatura & Planos' &&
                            alertPrefs.enabled &&
                            alertPrefs.configuracoes &&
                            alerts.configuracoes > 0 && (
                              <AlertBadge count={alerts.configuracoes} />
                            )}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link
                to={item.href || '#'}
                className={`menu-button standalone ${location.pathname === item.href ? 'active' : ''}`}
              >
                <div className="menu-button-content">
                  <item.icon size={20} className="menu-icon" />
                  <span>{item.title}</span>
                </div>
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="farm-selector-wrapper">
          <button
            className={`tenant-badge ${isFarmSelectorOpen ? 'active' : ''} ${isGlobalMode ? 'global' : ''}`}
            onClick={() => setIsFarmSelectorOpen(!isFarmSelectorOpen)}
          >
            {isGlobalMode ? (
              <Globe size={14} style={{ color: '#38bdf8', flexShrink: 0 }} />
            ) : (
              <div className="tenant-dot" />
            )}
            <span
              style={{
                flex: 1,
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {isGlobalMode ? 'Visão Global' : activeFarm?.name || 'Selecionar Fazenda'}
            </span>
            <ChevronDown size={14} className={`selector-arrow ${isFarmSelectorOpen ? 'up' : ''}`} />
          </button>

          <AnimatePresence>
            {isFarmSelectorOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="farm-dropdown"
              >
                <div className="dropdown-header">Mudar Unidade Ativa</div>
                <div className="farm-list">
                  {/* ── Global Mode Option ── */}
                  <button
                    className={`farm-option global-option ${isGlobalMode ? 'active' : ''}`}
                    onClick={() => {
                      setGlobalMode(true);
                      setIsFarmSelectorOpen(false);
                    }}
                  >
                    <Globe size={14} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>Visão Global</span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        opacity: 0.7,
                        letterSpacing: '0.05em',
                      }}
                    >
                      TODAS
                    </span>
                  </button>

                  {/* ── Divider ── */}
                  <div
                    style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }}
                  />
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      color: 'rgba(255,255,255,0.4)',
                      padding: '4px 12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Building2 size={10} /> Unidades
                  </div>

                  {/* ── Individual Farms ── */}
                  {farms.map((farm) => (
                    <button
                      key={farm.id}
                      className={`farm-option ${!isGlobalMode && activeFarm?.id === farm.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveFarm(farm);
                        setIsFarmSelectorOpen(false);
                      }}
                    >
                      <div className="option-dot" />
                      <span>{farm.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';
