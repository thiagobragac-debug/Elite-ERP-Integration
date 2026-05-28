import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Company {
  id: string;
  name: string;
  document: string;
  type: string;
  razao_social?: string;
}

interface Farm {
  id: string;
  companyId: string;
  tenantId: string;
  name: string;
  registrationNumber: string;
  totalArea: number;
  location: string;
}

interface TenantContextType {
  activeCompany: Company | null;
  activeFarm: Farm | null;
  companies: Company[];
  farms: Farm[];
  setActiveCompany: (company: Company) => void;
  setActiveFarm: (farm: Farm | null) => void;
  loading: boolean;
  refreshData: () => Promise<void>;
  tenant: any;
  userProfile: any;
  refreshProfile: () => Promise<void>;
  // ── Visão Global ──────────────────────────────────────────
  isGlobalMode: boolean;
  setGlobalMode: (global: boolean) => void;
  /** null when globalMode is active; use tenant_id filter instead */
  activeFarmId: string | null;
  /** always the tenant id — safe to use in any query */
  activeTenantId: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [activeFarm, setActiveFarmState] = useState<Farm | null>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGlobalMode, setIsGlobalMode] = useState<boolean>(() => {
    return localStorage.getItem('tauze_global_mode') === 'true';
  });

  const hasGlobalPermission = (profile: any = userProfile) => {
    if (!profile) return false;
    const perms = profile.permissoes || profile.permissions || [];
    return profile.role === 'ADMIN' || profile.role === 'Administrador' || perms.includes('all') || perms.includes('global_view');
  };

  const setGlobalMode = (global: boolean) => {
    setIsGlobalMode(global);
    localStorage.setItem('tauze_global_mode', String(global));
    if (global) {
      setActiveFarmState(null);
    }
  };

  const setActiveFarm = (farm: Farm | null) => {
    setActiveFarmState(farm);
    if (farm) {
      setGlobalMode(false);
    } else {
      setGlobalMode(true);
    }
  };

  // Computed helpers for query filtering
  const activeFarmId = isGlobalMode ? null : (activeFarm?.id ?? null);
  const activeTenantId = activeFarm?.tenantId ?? tenant?.id ?? null;

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    const impersonateId = localStorage.getItem('saas_impersonate_tenant_id');
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    let finalProfile = profileData;
    if (user.email === 'thiagobraga.c@gmail.com' || finalProfile?.role === 'SAAS_ADMIN') {
      finalProfile = finalProfile || { id: user.id };
      finalProfile.role = finalProfile.role === 'SAAS_ADMIN' ? 'SAAS_ADMIN' : 'ADMIN';
      finalProfile.permissoes = ['all'];
      finalProfile.permissions = ['all'];
    }
    
    if (finalProfile) {
      setUserProfile(finalProfile);
    }

    let tenantQuery = supabase.from('tenants').select('*');
    if (impersonateId) {
      tenantQuery = tenantQuery.eq('id', impersonateId);
    } else if (finalProfile?.tenant_id) {
      tenantQuery = tenantQuery.eq('id', finalProfile.tenant_id);
    } else {
      tenantQuery = tenantQuery.limit(1);
    }
    
    let { data: tenantData, error: tenantErr } = await tenantQuery.single();
    
    // Se a base simulada foi excluída e não existe mais no banco
    if (impersonateId && !tenantData) {
      console.warn('[TenantContext] O tenant simulado não existe mais no banco (foi excluído). Limpando simulação.');
      localStorage.removeItem('saas_impersonate_tenant_id');
      
      // Se for o administrador do SaaS, redireciona diretamente para a tela de gerenciamento de Tenants do SaaS
      if (finalProfile?.role === 'SAAS_ADMIN') {
        window.location.href = '/saas/tenants';
        return;
      }
      
      // Fallback para o tenant real padrão do usuário comum
      let fallbackQuery = supabase.from('tenants').select('*');
      if (finalProfile?.tenant_id) {
        fallbackQuery = fallbackQuery.eq('id', finalProfile.tenant_id);
      } else {
        fallbackQuery = fallbackQuery.limit(1);
      }
      const { data: fallbackData } = await fallbackQuery.single();
      tenantData = fallbackData;
    }

    console.log('[TenantContext Debug]', {
      userEmail: user?.email,
      impersonateId,
      profileRole: finalProfile?.role,
      tenantIdLoaded: tenantData?.id,
      tenantNomeLoaded: tenantData?.nome
    });

    if (tenantData) {
      // Se o tenant mudou, resetamos a empresa e fazenda antigas para evitar vazamento de contexto
      const isDifferentTenant = tenant?.id && tenant.id !== tenantData.id;
      
      setTenant(tenantData);

      const { data: unidadesData } = await supabase
        .from('unidades')
        .select('*')
        .eq('tenant_id', tenantData.id);

      if (unidadesData) {
        const mappedCompanies: Company[] = unidadesData.map(u => ({
          id: u.id,
          name: u.nome,
          document: u.documento,
          type: u.tipo?.toLowerCase() || 'matriz',
          razao_social: u.razao_social
        }));
        setCompanies(mappedCompanies);
        
        // Seleciona a primeira empresa do novo tenant
        if (mappedCompanies.length > 0) {
          setActiveCompany(mappedCompanies[0]);
        } else {
          setActiveCompany(null);
        }
      } else {
        setCompanies([]);
        setActiveCompany(null);
      }

      const { data: farmData } = await supabase
        .from('fazendas')
        .select('*')
        .eq('tenant_id', tenantData.id);

      if (farmData) {
        let mappedFarms: Farm[] = farmData.map(f => ({
          id: f.id,
          companyId: f.unidade_id,
          tenantId: f.tenant_id,
          name: f.nome,
          registrationNumber: f.ie_produtor || '',
          totalArea: f.area_total || f.area_ha || 0,
          location: f.localizacao || ''
        }));
        
        if (!hasGlobalPermission(profileData) && profileData.fazendas_permitidas && Array.isArray(profileData.fazendas_permitidas)) {
          mappedFarms = mappedFarms.filter(f => profileData.fazendas_permitidas.includes(f.id));
        }
        
        setFarms(mappedFarms);
        
        // Auto-seleciona a primeira fazenda do novo tenant (se não estiver em visão global)
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
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Sincroniza a simulação de inquilino entre abas em tempo real
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'saas_impersonate_tenant_id') {
        console.log('[TenantContext] Identificador de simulação de inquilino atualizado em outra aba. Sincronizando dados...');
        fetchData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // We no longer force global mode off. Users can use global mode to aggregate their allowed farms.

  return (
    <TenantContext.Provider value={{ 
      activeCompany, 
      activeFarm, 
      companies, 
      farms,
      setActiveCompany,
      setActiveFarm,
      loading,
      refreshData: fetchData,
      tenant,
      userProfile,
      refreshProfile: async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
        if (data) setUserProfile(data);
      },
      // Global mode
      isGlobalMode,
      setGlobalMode,
      activeFarmId,
      activeTenantId
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
