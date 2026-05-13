const fs = require('fs');
const path = 'c:/Saas/src/pages/Admin/SaaSAdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update plansList initialization and add fetchPlans
if (content.includes('const [plansList, setPlansList] = useState([')) {
    content = content.replace(
        /const \[plansList, setPlansList\] = useState\(\[[\s\S]*?\]\);/,
        `const [plansList, setPlansList] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const { data, error } = await supabase
        .from('saas_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      
      const mappedData = data.map(p => ({
        ...p,
        price_formatted: typeof p.price === 'number' ? \`R$ \${p.price.toLocaleString('pt-BR')}\` : p.price,
        users: 0,
        rev: 'R$ 0'
      }));
      
      setPlansList(mappedData);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setPlansLoading(false);
    }
  };`
    );
}

// 2. Add fetchPlans call to the existing useEffect
// I'll be more careful with the regex
content = content.replace(
    /useEffect\(\(\) => \{\s*fetchTenants\(\);\s*\}, \[\]\);/,
    `useEffect(() => {
    fetchTenants();
    fetchPlans();
  }, []);`
);

// 3. Update handleSavePlan to use Supabase
content = content.replace(
    /const handleSavePlan = \(data: any\) => \{[\s\S]*?\};/,
    `const handleSavePlan = async (data: any) => {
    try {
      const planData = {
        name: data.name,
        price: parseFloat(data.price?.toString().replace(/[^0-9,]/g, '').replace(',', '.') || '0'),
        users_limit: parseInt(data.users_limit || '0'),
        storage_gb: parseInt(data.storage_gb || '0'),
        features: data.features || []
      };

      if (selectedPlan) {
        const { error } = await supabase
          .from('saas_plans')
          .update(planData)
          .eq('id', selectedPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saas_plans')
          .insert([planData]);
        if (error) throw error;
      }
      
      await fetchPlans();
      setIsPlanModalOpen(false);
      logAudit({
        action: selectedPlan ? 'Update Plan' : 'Create Plan',
        entity: 'Plans',
        details: \`Plan \${data.name} \${selectedPlan ? 'updated' : 'created'}\`,
        status: 'success'
      });
    } catch (err) {
      console.error('Error saving plan:', err);
      alert('Erro ao salvar plano.');
    }
  };`
);

// 4. Modernize columns
content = content.replace(
    /columns=\{\[\s*\{ header: 'Plano'[\s\S]*?\}\s*\]\}/,
    `columns={[
                    { 
                      header: 'Plano', 
                      accessor: (p: any) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Zap size={20} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '600', color: 'hsl(var(--foreground))', fontSize: '15px' }}>{p.name}</span>
                            <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>{p.features?.length || 0} recursos ativos</span>
                          </div>
                        </div>
                      ) 
                    },
                    { 
                      header: 'Preço', 
                      accessor: (p: any) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '140px', color: '#10b981' }}>
                          <DollarSign size={16} />
                          <span style={{ fontWeight: '600' }}>{p.price_formatted || p.price}</span>
                        </div>
                      ) 
                    },
                    { 
                      header: 'Limites', 
                      accessor: (p: any) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--muted-foreground))' }}>
                            <Users size={14} />
                            <span>{p.users_limit || '∞'} users</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--muted-foreground))' }}>
                            <HardDrive size={14} />
                            <span>{p.storage_gb || '0'} GB</span>
                          </div>
                        </div>
                      ) 
                    },
                    { 
                      header: 'Status', 
                      accessor: (p: any) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                          <span className="status-pill active" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #d1fae5' }}>Ativo</span>
                        </div>
                      ) 
                    }
                  ]}`
);

// 5. Update loading state
content = content.replace(
    /loading=\{false\}\s*hideHeader=\{true\}/,
    `loading={plansLoading}
                  hideHeader={true}`
);

fs.writeFileSync(path, content);
console.log('Successfully integrated real-time plans and updated visual patterns');
