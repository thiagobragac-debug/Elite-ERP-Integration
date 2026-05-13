const fs = require('fs');
const path = 'c:/Saas/src/pages/Admin/SaaSAdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update tenantsList state and add loading/refetch logic
content = content.replace(
    /const \[tenantsList, setTenantsList\] = useState\(\[[\s\S]*?\]\);/,
    `const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);

  const fetchTenants = async () => {
    try {
      setTenantsLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database fields to UI fields if necessary
      const mappedData = data.map(t => ({
        ...t,
        plan: t.settings?.plan || 'Starter', // Fallback
        users: t.settings?.users_count || 0,
        storage: t.settings?.storage_usage || '0 GB'
      }));
      
      setTenantsList(mappedData);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setTenantsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);`
);

// 2. Update handleSaveTenant to use Supabase
content = content.replace(
    /const handleSaveTenant = \(data: any\) => \{[\s\S]*?\};/,
    `const handleSaveTenant = async (data: any) => {
    try {
      const tenantData = {
        name: data.name,
        status: data.status,
        // settings: { ...selectedTenant?.settings, plan: data.plan }
      };

      if (selectedTenant) {
        const { error } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('id', selectedTenant.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenants')
          .insert([tenantData]);
        if (error) throw error;
      }
      
      await fetchTenants();
      setIsTenantModalOpen(false);
      logAudit({
        action: selectedTenant ? 'Update Tenant' : 'Create Tenant',
        entity: 'Tenants',
        details: \`Tenant \${data.name} \${selectedTenant ? 'updated' : 'created'}\`,
        status: 'success'
      });
    } catch (err) {
      console.error('Error saving tenant:', err);
      alert('Erro ao salvar inquilino.');
    }
  };`
);

// 3. Update the ModernTable in 'tenants' tab to use tenantsLoading
content = content.replace(
    /<ModernTable[\s\S]*?data=\{tenantsList\.filter[\s\S]*?\}[\s\S]*?columns=\{tenantColumns\}[\s\S]*?\/>/,
    `<ModernTable 
                      data={tenantsList.filter(t => 
                        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        t.id.toLowerCase().includes(searchQuery.toLowerCase())
                      )}
                      columns={tenantColumns}
                      loading={tenantsLoading}
                      onRowClick={(item) => {
                        setSelectedTenant(item);
                        setIsTenantModalOpen(true);
                      }}
                    />`
);

// 4. Update the ModernTable in 'billing' monitor tab to use real tenantsList
// We find the monitor global table
content = content.replace(
    /\{billingSubTab === 'monitor' && \([\s\S]*?<ModernTable[\s\S]*?data=\{\[[\s\S]*?\]\.filter[\s\S]*?\}[\s\S]*?columns=\{billingColumns\}[\s\S]*?\/>/,
    `{billingSubTab === 'monitor' && (
                  <>
                    <ModernTable 
                      data={tenantsList.filter(item => 
                        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.id.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map(t => ({
                        ...t,
                        id_str: t.id.substring(0, 8).toUpperCase(),
                        price: t.settings?.billing_price || 'R$ 0',
                        gateway: t.settings?.gateway || 'N/A',
                        due: t.settings?.due_date || 'N/A'
                      }))}
                      columns={billingColumns}
                      loading={tenantsLoading}
                      hideHeader={true}
                    />`
);

fs.writeFileSync(path, content);
console.log('Successfully integrated database and updated UI patterns');
