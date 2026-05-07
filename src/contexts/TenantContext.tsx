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
  setActiveFarm: (farm: Farm) => void;
  loading: boolean;
  refreshData: () => Promise<void>;
  tenant: any;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [activeFarm, setActiveFarm] = useState<Farm | null>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    // 1. Fetch Tenant (Account)
    const impersonateId = localStorage.getItem('saas_impersonate_tenant_id');
    
    let tenantQuery = supabase.from('tenants').select('*');
    if (impersonateId) {
      tenantQuery = tenantQuery.eq('id', impersonateId);
    } else {
      tenantQuery = tenantQuery.limit(1);
    }
    
    const { data: tenantData } = await tenantQuery.single();

    if (tenantData) {
      setTenant(tenantData);

      // 2. Fetch Unidades (Companies/Branches)
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

      // 3. Fetch Farms for this tenant
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
        if (!activeFarm && mappedFarms.length > 0) setActiveFarm(mappedFarms[0]);
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
      setActiveFarm,
      loading,
      refreshData: fetchData,
      tenant
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
