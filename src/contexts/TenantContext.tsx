/**
 * TenantContext.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Context split em 3 domínios para minimizar re-renders:
 *
 *  ① TenantCoreContext   — tenant + tenantId + loading  (muda ao fazer login)
 *  ② TenantFarmContext   — fazenda/empresa ativa        (muda ao trocar fazenda)
 *  ③ TenantProfileContext — userProfile + actions       (muda raramente)
 *
 * RETROCOMPATIBILIDADE 100%:
 *   O hook `useTenant()` permanece idêntico — merge dos 3 contextos.
 *   Novos hooks focados disponíveis: useTenantCore, useTenantFarm, useTenantProfile.
 *   Zero mudanças necessárias nos consumidores existentes.
 *
 * @module TenantContext
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  useEffect,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { setUserContext, setTenantContext } from '../lib/sentry';
import { identifyUser } from '../lib/analytics';
import {
  type UserProfile,
  type Tenant,
  type Company,
  type Farm,
} from '../types/tenant';

// ─── Context Types ────────────────────────────────────────────────────────────

interface TenantCoreContextType {
  tenant: Tenant | null;
  activeTenantId: string | null;
  loading: boolean;
  isTrialExpired: boolean;
  trialDaysLeft: number | null;
}

/** Fazenda/empresa ativa — muda ao usuário trocar de fazenda */
interface TenantFarmContextType {
  activeFarm: Farm | null;
  activeFarmId: string | null;
  activeTenantId: string | null; // deriva de activeFarm?.tenantId ?? tenant?.id
  farms: Farm[];
  activeCompany: Company | null;
  companies: Company[];
  isGlobalMode: boolean;
  setActiveFarm: (farm: Farm | null) => void;
  setActiveCompany: (company: Company) => void;
  setGlobalMode: (global: boolean) => void;
}

/** Perfil do usuário e ações de refresh — muda raramente */
interface TenantProfileContextType {
  userProfile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  refreshData: () => Promise<void>;
}

/** Tipo completo retrocompatível — union dos 3 contextos */
export interface TenantContextType
  extends TenantCoreContextType,
    TenantFarmContextType,
    TenantProfileContextType {}

// ─── Contexts ─────────────────────────────────────────────────────────────────

const TenantCoreContext = createContext<TenantCoreContextType | undefined>(undefined);
const TenantFarmContext = createContext<TenantFarmContextType | undefined>(undefined);
const TenantProfileContext = createContext<TenantProfileContextType | undefined>(undefined);

// Contexto legado mantido para retrocompatibilidade com useTenant()
const TenantContext = createContext<TenantContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [companies, setCompanies] = useState<Company[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [activeFarm, setActiveFarmState] = useState<Farm | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGlobalMode, setIsGlobalMode] = useState<boolean>(() => {
    return localStorage.getItem('tauze_global_mode') === 'true';
  });

  // ── Computed (memoized para evitar referências novas a cada render) ─────────
  const activeFarmId = useMemo(
    () => (isGlobalMode ? null : (activeFarm?.id ?? null)),
    [isGlobalMode, activeFarm]
  );
  const activeTenantId = useMemo(
    () => activeFarm?.tenantId ?? tenant?.id ?? null,
    [activeFarm, tenant]
  );

  const { isTrialExpired, trialDaysLeft } = useMemo(() => {
    if (!tenant || !tenant.created_at || !tenant.plan) {
      return { isTrialExpired: false, trialDaysLeft: null };
    }
    
    // Verifica se o plano é o Trial (Porteira Aberta)
    const isTrial = (tenant.plano as string)?.toLowerCase().includes('trial') || (tenant.plano as string)?.toLowerCase().includes('porteira');
    if (!isTrial) {
      return { isTrialExpired: false, trialDaysLeft: null };
    }

    const createdDate = new Date(tenant.created_at as string);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - createdDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const daysLeft = Math.max(0, 14 - diffDays);
    const isExpired = diffDays >= 14;

    return { isTrialExpired: isExpired, trialDaysLeft: daysLeft };
  }, [tenant]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const setGlobalMode = useCallback((global: boolean) => {
    setIsGlobalMode(global);
    localStorage.setItem('tauze_global_mode', String(global));
    if (global) {
      setActiveFarmState(null);
    }
  }, []);

  const setActiveFarm = useCallback(
    (farm: Farm | null) => {
      setActiveFarmState(farm);
      if (farm) {
        setIsGlobalMode(false);
        localStorage.setItem('tauze_global_mode', 'false');
      } else {
        setGlobalMode(true);
      }
    },
    [setGlobalMode]
  );

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      if (!user) return;
      setLoading(true);

      const impersonateId = localStorage.getItem('saas_impersonate_tenant_id');

      if (signal?.aborted) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, role, tenant_id, full_name, email, settings, avatar_url, perfil_id, perfis_usuario(permissoes)')
        .eq('id', user.id)
        .single();

      if (signal?.aborted) return;

      const finalProfile = profileData as unknown as UserProfile | null;

      if (finalProfile) {
        setUserProfile(finalProfile);

        setUserContext(
          { id: user.id, email: user.email, role: finalProfile.role || 'user' },
          finalProfile.tenant_id || null
        );

        if (finalProfile.tenant_id) {
          identifyUser({ id: user.id, email: user.email, tenant_id: finalProfile.tenant_id });
        }
      }

      let tenantQuery = supabase.from('tenants').select('*');
      if (impersonateId) {
        tenantQuery = tenantQuery.eq('id', impersonateId);
      } else if (finalProfile?.tenant_id) {
        tenantQuery = tenantQuery.eq('id', finalProfile.tenant_id);
      } else {
        tenantQuery = tenantQuery.limit(1);
      }

      let { data: tenantData } = await tenantQuery.single();

      if (signal?.aborted) return;

      if (impersonateId && !tenantData) {
        console.warn(
          '[TenantContext] O tenant simulado não existe mais no banco (foi excluído). Limpando simulação.'
        );
        localStorage.removeItem('saas_impersonate_tenant_id');

        if (finalProfile?.role === 'SAAS_ADMIN') {
          window.location.href = '/saas/tenants';
          return;
        }

        let fallbackQuery = supabase.from('tenants').select('*');
        if (finalProfile?.tenant_id) {
          fallbackQuery = fallbackQuery.eq('id', finalProfile.tenant_id);
        } else {
          fallbackQuery = fallbackQuery.limit(1);
        }
        const { data: fallbackData } = await fallbackQuery.single();
        tenantData = fallbackData;
      }

      if (import.meta.env.DEV) {
        console.debug('[TenantContext Debug]', {
          userEmail: user?.email,
          impersonateId,
          profileRole: finalProfile?.role,
          tenantIdLoaded: tenantData?.id,
          tenantNomeLoaded: tenantData?.nome,
        });
      }

      if (tenantData) {
        if (signal?.aborted) return;
        
        // Fetch plan details to enforce limits
        if (tenantData.plano) {
          const { data: planData } = await supabase
            .from('saas_plans')
            .select('*')
            .eq('name', tenantData.plano)
            .single();

          const safePlanData = planData || {
            name: tenantData.plano || 'Free',
            users_limit: 1,
            animals_limit: 0,
            storage_limit: 1,
            modules: null // Null signifies an unrestricted/legacy plan
          };

          // Fetch active addons to aggregate limits
          const { data: activeAddons } = await supabase
            .from('saas_tenant_addons')
            .select(`
              addon_id,
              saas_addons (
                metadata,
                type,
                name
              )
            `)
            .eq('tenant_id', tenantData.id)
            .eq('status', 'active');

          let extraUsers = 0;
          let extraAnimals = 0;
          let extraStorage = 0;
          
          const activatedAddonModules: string[] = [];

          if (activeAddons) {
            activeAddons.forEach((item: any) => {
              const metadata = item.saas_addons?.metadata || {};

              if (metadata.users) extraUsers += Number(metadata.users);
              if (metadata.animals) extraAnimals += Number(metadata.animals);
              if (metadata.storage_gb) extraStorage += Number(metadata.storage_gb);
              
              if (metadata.module_id) {
                activatedAddonModules.push(metadata.module_id);
                // Se for um submódulo (ex: "Pecuária:Animais"), garantimos que o pai ("Pecuária") também seja injetado
                if (metadata.module_id.includes(':')) {
                  const parent = metadata.module_id.split(':')[0];
                  if (!activatedAddonModules.includes(parent)) {
                    activatedAddonModules.push(parent);
                  }
                }
              }
            });
          }
        const baseModules = Array.isArray(safePlanData.modules) ? safePlanData.modules : (safePlanData.modules === null ? null : []);
        const consolidatedModules = baseModules === null ? null : Array.from(new Set([...baseModules, ...activatedAddonModules]));

        tenantData.plan_details = {
          ...safePlanData,
          base_users_limit: safePlanData.users_limit || 0,
          base_animals_limit: safePlanData.animals_limit || 0,
          base_storage_limit: safePlanData.storage_limit || 0,
          // Consolidated limits
          users_limit: (safePlanData.users_limit || 0) + extraUsers,
          animals_limit: (safePlanData.animals_limit || 0) + extraAnimals,
          storage_limit: (safePlanData.storage_limit || 0) + extraStorage,
          modules: consolidatedModules,
        };
        } // END of if(tenantData.plano)

        setTenant(tenantData as Tenant);
        setTenantContext(tenantData.id, tenantData.nome);

        // Queries paralelas: unidades + fazendas em simultâneo (economiza ~200-400ms no boot)
        const [unidadesResult, farmResult] = await Promise.all([
          supabase
              .from('unidades')
              .select('id, nome, documento, tipo, razao_social')
              .eq('tenant_id', tenantData.id),
          supabase
              .from('fazendas')
              .select(
                  'id, unidade_id, tenant_id, nome, ie_produtor, area_total, area_ha, localizacao, peso_abate_kg'
              )
              .eq('tenant_id', tenantData.id),
        ]);

        if (signal?.aborted) return;

        if (unidadesResult.error) {
          console.error('[TenantContext] Erro ao buscar unidades:', unidadesResult.error);
        }
        if (farmResult.error) {
          console.error('[TenantContext] Erro ao buscar fazendas:', farmResult.error);
        }

        const unidadesData = unidadesResult.data;
        const farmData = farmResult.data;

        if (unidadesData) {
          const mappedCompanies: Company[] = unidadesData.map((u) => ({
            id: u.id,
            name: u.nome,
            document: u.documento,
            type: u.tipo?.toLowerCase() || 'matriz',
            razao_social: u.razao_social,
          }));
          setCompanies(mappedCompanies);
          setActiveCompany(mappedCompanies.length > 0 ? mappedCompanies[0] : null);
        } else {
          setCompanies([]);
          setActiveCompany(null);
        }

        if (farmData) {
          const mappedFarms: Farm[] = farmData.map((f) => ({
            id: f.id,
            companyId: f.unidade_id,
            tenantId: f.tenant_id,
            name: f.nome,
            registrationNumber: f.ie_produtor || '',
            totalArea: f.area_total || f.area_ha || 0,
            location: f.localizacao || '',
            pesoAbateKg: f.peso_abate_kg || 450,
          }));

          // Filtragem de permissão por fazenda é gerenciada pelas RLS policies do Supabase
          setFarms(mappedFarms);

          // Auto-seleciona a primeira fazenda do tenant (se não estiver em visão global)
          if (mappedFarms.length > 0 && !isGlobalMode) {
            setActiveFarmState(mappedFarms[0]);
          } else {
            setActiveFarmState(null);
          }
        } else {
          setFarms([]);
          setActiveFarmState(null);
        }
      }
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user]
  );

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, role, tenant_id, full_name, email, settings, avatar_url, perfil_id, perfis_usuario(permissoes)')
      .eq('id', user?.id)
      .single();
    if (data) {
      setUserProfile(data as unknown as UserProfile);
    }
  }, [user?.id]);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        fetchData(controller.signal);
      }
    });
    return () => controller.abort();
  }, [fetchData]);

  // Sincroniza a simulação de inquilino entre abas em tempo real
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'saas_impersonate_tenant_id') {
        if (import.meta.env.DEV) {
          console.debug('[TenantContext] Sincronizando simulação entre abas...');
        }
        fetchData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchData]);

  // ── Context values (memoized por domínio) ──────────────────────────────────

  const coreValue = useMemo<TenantCoreContextType>(
    () => ({ tenant, activeTenantId, loading, isTrialExpired, trialDaysLeft }),
    [tenant, activeTenantId, loading, isTrialExpired, trialDaysLeft]
  );

  const farmValue = useMemo<TenantFarmContextType>(
    () => ({
      activeFarm,
      activeFarmId,
      activeTenantId,
      farms,
      activeCompany,
      companies,
      isGlobalMode,
      setActiveFarm,
      setActiveCompany,
      setGlobalMode,
    }),
    [activeFarm, activeFarmId, activeTenantId, farms, activeCompany, companies, isGlobalMode, setActiveFarm, setActiveCompany, setGlobalMode]
  );

  const profileValue = useMemo<TenantProfileContextType>(
    () => ({
      userProfile,
      refreshProfile,
      refreshData: fetchData,
    }),
    [userProfile, refreshProfile, fetchData]
  );

  // Valor legado — merge dos 3 para retrocompatibilidade do useTenant()
  const legacyValue = useMemo<TenantContextType>(
    () => ({ ...coreValue, ...farmValue, ...profileValue }),
    [coreValue, farmValue, profileValue]
  );

  return (
    <TenantCoreContext.Provider value={coreValue}>
      <TenantFarmContext.Provider value={farmValue}>
        <TenantProfileContext.Provider value={profileValue}>
          <TenantContext.Provider value={legacyValue}>
            {children}
          </TenantContext.Provider>
        </TenantProfileContext.Provider>
      </TenantFarmContext.Provider>
    </TenantCoreContext.Provider>
  );
};

// ─── Hooks públicos ───────────────────────────────────────────────────────────

/**
 * Hook retrocompatível — mantém a interface original.
 * Todos os 80+ consumidores existentes funcionam sem nenhuma mudança.
 */
export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

/**
 * Hook focado — apenas tenant + tenantId + loading.
 * Use em componentes que NÃO precisam saber da fazenda ativa (Layout, Header...).
 * Re-renderiza só quando o tenant mudar (não por troca de fazenda).
 */
export const useTenantCore = (): TenantCoreContextType => {
  const context = useContext(TenantCoreContext);
  if (context === undefined) {
    throw new Error('useTenantCore must be used within a TenantProvider');
  }
  return context;
};

/**
 * Hook focado — fazenda/empresa ativa + ações de seleção.
 * Use em formulários e filtros que mudam por seleção de fazenda.
 */
export const useTenantFarm = (): TenantFarmContextType => {
  const context = useContext(TenantFarmContext);
  if (context === undefined) {
    throw new Error('useTenantFarm must be used within a TenantProvider');
  }
  return context;
};

/**
 * Hook focado — perfil do usuário + refreshes.
 * Use em guards, profile pages e settings.
 */
export const useTenantProfile = (): TenantProfileContextType => {
  const context = useContext(TenantProfileContext);
  if (context === undefined) {
    throw new Error('useTenantProfile must be used within a TenantProvider');
  }
  return context;
};
