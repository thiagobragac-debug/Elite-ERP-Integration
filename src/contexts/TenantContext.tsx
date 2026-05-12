import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
<<<<<<< HEAD
  // ── Visão Global ──────────────────────────────────────────
  isGlobalMode: boolean;
  setGlobalMode: (global: boolean) => void;
  /** null when globalMode is active; use tenant_id filter instead */
  activeFarmId: string | null;
  /** always the tenant id — safe to use in any query */
  activeTenantId: string | null;
=======
  isGlobalMode: boolean;
  activeFarmId: string | null;
  activeTenantId: string | null;
  setGlobalMode: (value: boolean) => void;
  setActiveFarm: (farm: Farm | null) => void;
>>>>>>> 1fbbc88 (Elite ERP: Diamond Precision 5.0 - Sincronizacao Consolidada)
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
  const [isGlobalMode, setGlobalMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGlobalMode, setIsGlobalMode] = useState<boolean>(() => {
    return localStorage.getItem('elite_global_mode') === 'true';
  });

  const setGlobalMode = (global: boolean) => {
    setIsGlobalMode(global);
    localStorage.setItem('elite_global_mode', String(global));
  };

  const setActiveFarm = (farm: Farm | null) => {
    setActiveFarmState(farm);
    if (farm) setGlobalMode(false); // selecting a specific farm exits global mode
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
    
    if (profileData) {
      setUserProfile(profileData);
    }

    let tenantQuery = supabase.from('tenants').select('*');
    if (impersonateId) {
      tenantQuery = tenantQuery.eq('id', impersonateId);
    } else {
      tenantQuery = tenantQuery.limit(1);
    }
    
    const { data: tenantData } = await tenantQuery.single();

    if (tenantData) {
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
        if (!activeCompany && mappedCompanies.length > 0) setActiveCompany(mappedCompanies[0]);
      }

      const { data: farmData } = await supabase
        .from('fazendas')
        .select('*')
        .eq('tenant_id', tenantData.id);

      if (farmData) {
        const mappedFarms: Farm[] = farmData.map(f => ({
          id: f.id,
          companyId: f.unidade_id,
          tenantId: f.tenant_id,
          name: f.nome,
          registrationNumber: f.ie_produtor || '',
          totalArea: f.area_total || f.area_ha || 0,
          location: f.localizacao || ''
        }));
        setFarms(mappedFarms);
        // Only auto-select if NOT in global mode
        if (!activeFarm && mappedFarms.length > 0 && !isGlobalMode) {
          setActiveFarmState(mappedFarms[0]);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return (
    <TenantContext.Provider value={{ 
      activeCompany, 
      activeFarm, 
      companies, 
      farms,
      setActiveCompany,
      loading,
      refreshData: fetchData,
      tenant,
      userProfile,
      refreshProfile: async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
        if (data) setUserProfile(data);
      },
<<<<<<< HEAD
      // Global mode
      isGlobalMode,
      setGlobalMode,
      activeFarmId,
      activeTenantId,
=======
      isGlobalMode,
      activeFarmId: isGlobalMode ? null : activeFarm?.id || null,
      activeTenantId: tenant?.id || null,
      setGlobalMode,
      setActiveFarm: (farm: Farm | null) => {
        setActiveFarm(farm);
        if (farm) {
          setGlobalMode(false);
        } else {
          setGlobalMode(true);
        }
      }
>>>>>>> 1fbbc88 (Elite ERP: Diamond Precision 5.0 - Sincronizacao Consolidada)
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
